-- BanDoly: banco da conta opcional (Supabase, projeto venbupxwqgofwjkhixhc, região São Paulo).
-- Cole tudo no SQL Editor do painel e clique em Run. Pode rodar de novo sem estragar nada.
--
-- Uma linha por pessoa, com uma cópia do que o app guarda no aparelho (progresso, melodias criadas,
-- ajustes). As regras de acesso (RLS) garantem que cada pessoa só lê, grava e apaga a própria linha:
-- a chave publicável que vai no site, sozinha, não dá acesso a nada.

create table if not exists public.progresso (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  dados          jsonb       not null default '{}'::jsonb,
  atualizado     timestamptz not null default now(),
  -- registro do aceite feito antes de entrar: versão dos Termos, a declaração de ter 18 anos ou mais e quando
  aceite_versao  text,
  declarou_maior boolean     not null default false,
  aceito_em      timestamptz,
  constraint dados_tamanho check (pg_column_size(dados) < 2000000)
);

alter table public.progresso enable row level security;

-- ninguém sem login enxerga a tabela; quem entrou só mexe na própria linha
revoke all on public.progresso from anon;
grant select, insert, update, delete on public.progresso to authenticated;

drop policy if exists "progresso: ler o proprio" on public.progresso;
drop policy if exists "progresso: criar o proprio" on public.progresso;
drop policy if exists "progresso: atualizar o proprio" on public.progresso;
drop policy if exists "progresso: apagar o proprio" on public.progresso;

create policy "progresso: ler o proprio" on public.progresso
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "progresso: criar o proprio" on public.progresso
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progresso: atualizar o proprio" on public.progresso
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progresso: apagar o proprio" on public.progresso
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Excluir a conta pelo próprio app (Conta → Excluir conta): apaga o login e, em cascata, a linha de progresso.
-- Roda com os direitos do dono do banco, mas só apaga quem chamou (auth.uid()); quem não entrou não pode chamar.
create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem login';
  end if;
  delete from public.progresso where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
