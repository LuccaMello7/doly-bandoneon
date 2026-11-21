# 0001. Site estático, sem build

- **Situação:** Aceita
- **Data:** 2026-11-21 (registro de uma decisão tomada no começo do projeto)

## Contexto
O projeto é mantido por uma pessoa, com ajuda de IA, e precisa abrir de um arquivo local, rodar testes num
navegador invisível e ser publicado sem esteira de CI. O ambiente tem Node 14 e npm 6, antigos para as
ferramentas de hoje.

## Decisão
HTML, CSS e JavaScript clássicos com `defer`, num escopo global compartilhado, na ordem do `index.html`. O que
está no repositório é o que vai para o site. Os únicos passos de "geração" são os scripts Python de
`ferramentas/`, cujo resultado também é versionado.

## Alternativas consideradas
- **Vite/React ou outro framework com build:** organização por módulos, mas exige build em cada publicação,
  dependências para atualizar e quebra o "abrir o arquivo e funcionar".
- **Módulos ES nativos (`type="module"`):** sem build, mas mudaria todos os arquivos e o `file://` dos testes.

## Consequências
- Publicar e testar é simples, e o site abre rápido (nada de bundle grande).
- A ordem dos scripts importa e os nomes globais podem colidir: por isso a ordem está no ARCHITECTURE.md e é
  conferida pelos testes.
- Se o código crescer muito além de ~40 arquivos, rever com módulos ES nativos antes de pensar em build.
