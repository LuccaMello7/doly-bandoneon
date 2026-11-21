# 0007. Tarefas e relatórios dentro do link

- **Situação:** Aceita
- **Data:** 2026-11-21 (registro)

## Contexto
Professores precisavam mandar exercícios e receber resultados antes de existir conta, e sem pedir dado pessoal.

## Decisão
A tarefa (`#tarefa=`) e o relatório (`#relatorio=`) são JSON em base64url dentro do próprio endereço. Quem
recebe abre e vê; nada passa por servidor. O que vem no link é tratado como dado de fora e limpo
(`limparRel` e afins). As turmas (decisão 0003) são o caminho com conta para o mesmo fluxo.

## Consequências
- Funciona sem conta, por WhatsApp ou e-mail, e não guarda nada em lugar nenhum além dos aparelhos.
- Links longos e sem histórico central; mudar o formato exige manter a leitura das versões antigas (campo `v`).
