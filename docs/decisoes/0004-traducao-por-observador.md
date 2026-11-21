# 0004. Tradução por observador da tela

- **Situação:** Aceita
- **Data:** 2026-11-21 (registro)

## Contexto
O app é escrito e pensado em português, e precisa de espanhol (rio-platense) e inglês sem duplicar o HTML nem
espalhar chaves de tradução por todo o código.

## Decisão
`i18n.js` observa a tela (MutationObserver) e troca cada texto pelo par em `i18n-textos.js`
(`'pt': ['es', 'en']`, com `{}` para valores). No código, `t()` para o que não passa pela tela (alertas, canvas).
Texto rico fica inteiro por idioma em arquivo próprio, com `translate="no"`. As páginas `es/` e `en/` são geradas.
`extrair_textos.py` tem de terminar com 0 sem tradução, e um teste percorre o app procurando português.

## Alternativas consideradas
- **Chaves (`t('academia.titulo')`) em todo lugar:** padrão do mercado, mas tornaria o código ilegível em
  português e cada texto novo custaria três edições.

## Consequências
- Escrever uma tela nova é escrever em português; a tradução vem depois, num lugar só.
- Frases montadas em pedaços se perdem: monte a frase inteira ou use `{}`.
