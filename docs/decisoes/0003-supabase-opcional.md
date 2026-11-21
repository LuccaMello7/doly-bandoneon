# 0003. Conta e turmas opcionais no Supabase

- **Situação:** Aceita
- **Data:** 2026-11-10

## Contexto
Pedidos de usar o progresso em mais de um aparelho e de professores acompanharem alunos.

## Decisão
Conta opcional no Supabase (região de São Paulo), com login por e-mail ou Google (PKCE). A tabela `progresso`
guarda uma cópia do que o app salva, menos o que é do aparelho (`NAO_SINCRONIZA`). As turmas (`turmas`,
`turma_alunos`) mostram ao professor só o nome escolhido pelo aluno, os dias de prática e o resultado da tarefa.
Todas as tabelas têm RLS; operações sensíveis são funções do banco (`criar_turma`, `entrar_na_turma`,
`excluir_minha_conta`). Só a chave publicável vai para o site. Contas só para maiores de 18 anos.
A biblioteca é uma cópia local (`js/vendor/supabase.js`) baixada só por quem usa a conta.

## Alternativas consideradas
- **Firebase:** equivalente, mas sem SQL e com regras de acesso menos legíveis.
- **Servidor próprio:** mais controle e muito mais manutenção para uma pessoa.

## Consequências
- O esquema está em `supabase/*.sql`, que precisa ser aplicado à mão no painel; mudar o banco é mudar esses arquivos.
- O plano gratuito tem limites; acompanhar o uso antes de abrir para muita gente.
- Sem a conta, nada muda: a decisão 0002 continua valendo.
