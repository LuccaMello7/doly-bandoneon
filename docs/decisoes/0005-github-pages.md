# 0005. Publicação no GitHub Pages

- **Situação:** Aceita
- **Data:** 2026-11-21 (registro)

## Contexto
Hospedagem gratuita, com domínio próprio (bandoly.app) e HTTPS, para um site estático.

## Decisão
GitHub Pages a partir da branch `main` (Jekyll só copia; `_config.yml` exclui o que não é do site).
Publicar é dar push na `main`.

## Alternativas consideradas
- **Cloudflare Pages:** cabeçalhos próprios (CSP e `frame-ancestors` de verdade, cache melhor) e repositório
  privado. É a candidata se esses pontos pesarem; a migração é pequena.
- **Netlify/Vercel:** semelhantes, sem vantagem clara.

## Consequências
- Sem cabeçalhos HTTP próprios: a CSP vai numa `<meta>` e a proteção contra quadros é feita em `moldura.js`.
- O repositório é público (com licença de todos os direitos reservados).
