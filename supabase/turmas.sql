-- BanDoly: turmas de professores (Supabase, projeto venbupxwqgofwjkhixhc).
-- Rode DEPOIS do banco.sql: cole tudo no SQL Editor do painel e clique em Run. Pode rodar de novo sem estragar nada.
--
-- Um professor com conta cria uma turma e manda o link de convite. O aluno, também com conta, aceita o convite
-- escolhendo o nome que o professor vai ver. O professor vê só esse nome e o "resumo" que o app do aluno envia
-- (dias de prática e resultados da tarefa da turma). As regras de acesso (RLS) garantem:
--   - o professor lê e altera só as turmas dele, e lê só os alunos das turmas dele;
--   - o aluno lê só as turmas em que entrou, e lê e altera só a própria linha em cada turma;
--   - um aluno não enxerga os outros alunos;
--   - entrar numa turma e criar turma só pelas funções abaixo, que conferem os limites.

create table if not exists public.turmas (
  id             uuid primary key default gen_random_uuid(),
  professor_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome           text not null check (char_length(nome) between 1 and 60),
  professor_nome text not null default '' check (char_length(professor_nome) <= 40),
  codigo         text not null unique,          -- vai no link de convite
  tarefa         jsonb,                         -- a tarefa atual da turma (o mesmo conteúdo do link de tarefa)
  tarefa_em      timestamptz,
  criada         timestamptz not null default now(),
  constraint tarefa_tamanho check (tarefa is null or pg_column_size(tarefa) < 200000)
);
create index if not exists turmas_professor on public.turmas (professor_id);

create table if not exists public.turma_alunos (
  turma_id   uuid not null references public.turmas (id) on delete cascade,
  aluno_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null check (char_length(nome) between 1 and 40),   -- o nome que o aluno escolheu mostrar
  resumo     jsonb not null default '{}'::jsonb,                         -- dias de prática e resultados da tarefa
  entrou_em  timestamptz not null default now(),
  atualizado timestamptz not null default now(),
  primary key (turma_id, aluno_id),
  constraint resumo_tamanho check (pg_column_size(resumo) < 60000)
);
create index if not exists turma_alunos_aluno on public.turma_alunos (aluno_id);

alter table public.turmas enable row level security;
alter table public.turma_alunos enable row level security;

-- ninguém sem login enxerga as tabelas; quem entrou só faz o que está liberado abaixo (inserir, só pelas funções)
revoke all on public.turmas from anon, authenticated;
revoke all on public.turma_alunos from anon, authenticated;
grant select, delete on public.turmas to authenticated;
grant update (nome, professor_nome, tarefa, tarefa_em) on public.turmas to authenticated;
grant select, delete on public.turma_alunos to authenticated;
grant update (nome, resumo, atualizado) on public.turma_alunos to authenticated;

-- "sou o professor desta turma?" e "sou aluno desta turma?": usadas nas regras, sem uma tabela consultar a outra em círculo
create or replace function public.sou_professor_da_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.turmas where id = p_turma and professor_id = (select auth.uid()));
$$;
create or replace function public.sou_aluno_da_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.turma_alunos where turma_id = p_turma and aluno_id = (select auth.uid()));
$$;
revoke all on function public.sou_professor_da_turma(uuid) from public, anon;
revoke all on function public.sou_aluno_da_turma(uuid) from public, anon;
grant execute on function public.sou_professor_da_turma(uuid) to authenticated;
grant execute on function public.sou_aluno_da_turma(uuid) to authenticated;

drop policy if exists "turmas: ler as minhas e as em que entrei" on public.turmas;
drop policy if exists "turmas: o professor altera" on public.turmas;
drop policy if exists "turmas: o professor exclui" on public.turmas;
drop policy if exists "turma_alunos: ler a minha linha ou os meus alunos" on public.turma_alunos;
drop policy if exists "turma_alunos: o aluno atualiza a propria linha" on public.turma_alunos;
drop policy if exists "turma_alunos: o aluno sai ou o professor remove" on public.turma_alunos;

create policy "turmas: ler as minhas e as em que entrei" on public.turmas
  for select to authenticated using (professor_id = (select auth.uid()) or public.sou_aluno_da_turma(id));
create policy "turmas: o professor altera" on public.turmas
  for update to authenticated using (professor_id = (select auth.uid())) with check (professor_id = (select auth.uid()));
create policy "turmas: o professor exclui" on public.turmas
  for delete to authenticated using (professor_id = (select auth.uid()));

create policy "turma_alunos: ler a minha linha ou os meus alunos" on public.turma_alunos
  for select to authenticated using (aluno_id = (select auth.uid()) or public.sou_professor_da_turma(turma_id));
create policy "turma_alunos: o aluno atualiza a propria linha" on public.turma_alunos
  for update to authenticated using (aluno_id = (select auth.uid())) with check (aluno_id = (select auth.uid()));
create policy "turma_alunos: o aluno sai ou o professor remove" on public.turma_alunos
  for delete to authenticated using (aluno_id = (select auth.uid()) or public.sou_professor_da_turma(turma_id));

-- Criar turma: até 20 por professor. O código do convite sai de um sorteio seguro (gen_random_uuid).
create or replace function public.criar_turma(p_nome text, p_professor text)
returns public.turmas language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := auth.uid();
  nova public.turmas;
begin
  if eu is null then raise exception 'sem login'; end if;
  if (select count(*) from public.turmas where professor_id = eu) >= 20 then raise exception 'limite de turmas'; end if;
  insert into public.turmas (professor_id, nome, professor_nome, codigo)
    values (eu, left(btrim(p_nome), 60), left(coalesce(btrim(p_professor), ''), 40),
            upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)))
    returning * into nova;
  return nova;
end;
$$;

-- Ver o nome da turma e do professor antes de aceitar o convite (só para quem está logado e tem o código)
create or replace function public.ver_turma(p_codigo text)
returns table (nome text, professor_nome text) language sql stable security definer set search_path = '' as $$
  select t.nome, t.professor_nome from public.turmas t
  where t.codigo = upper(btrim(p_codigo)) and (select auth.uid()) is not null;
$$;

-- Entrar numa turma pelo código: até 60 alunos por turma e 10 turmas por aluno. Entrar de novo só troca o nome.
create or replace function public.entrar_na_turma(p_codigo text, p_nome text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := auth.uid();
  alvo public.turmas;
begin
  if eu is null then raise exception 'sem login'; end if;
  select * into alvo from public.turmas where codigo = upper(btrim(p_codigo));
  if not found then raise exception 'turma nao encontrada'; end if;
  if alvo.professor_id = eu then raise exception 'professor da turma'; end if;
  if not exists (select 1 from public.turma_alunos where turma_id = alvo.id and aluno_id = eu) then
    if (select count(*) from public.turma_alunos where turma_id = alvo.id) >= 60 then raise exception 'turma cheia'; end if;
    if (select count(*) from public.turma_alunos where aluno_id = eu) >= 10 then raise exception 'limite de turmas'; end if;
  end if;
  insert into public.turma_alunos (turma_id, aluno_id, nome) values (alvo.id, eu, left(btrim(p_nome), 40))
    on conflict (turma_id, aluno_id) do update set nome = excluded.nome;
  return alvo.id;
end;
$$;

revoke all on function public.criar_turma(text, text) from public, anon;
revoke all on function public.ver_turma(text) from public, anon;
revoke all on function public.entrar_na_turma(text, text) from public, anon;
grant execute on function public.criar_turma(text, text) to authenticated;
grant execute on function public.ver_turma(text) to authenticated;
grant execute on function public.entrar_na_turma(text, text) to authenticated;

-- Excluir a conta (função excluir_minha_conta, no banco.sql) já apaga, em cascata, as turmas que a pessoa criou
-- e as participações dela em outras turmas.
