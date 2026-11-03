# Escola de Bandoneon

App web interativo para aprender bandoneon (sistema Rheinische 142 vozes). É um único arquivo `index.html`: basta abrir no navegador, sem instalar nada.

## O que tem

- **Lições** sobre o instrumento, o sistema bisonoro, o fole, a leitura nas duas claves e os ritmos de tango, com mini-quizzes.
- **Teclado virtual** com os 71 botões nas posições reais, som sintetizado, troca de direção do fole (Espaço), fole simulado e válvula de ar (A).
- **Desafios**: "Encontre a nota" e leitura na pauta.
- **Melodias** com os modos Ouvir, Espera e No tempo, sugestão automática da direção do fole, editor em texto e importação de MusicXML (`.mxl` / `.musicxml`, por exemplo exportado do MuseScore).
- **Ritmo**: marcato, síncopa, 3-3-2 e arrastre, com o modo "toque junto".

O progresso, as melodias criadas e as alterações no mapa de botões ficam salvos no `localStorage` do navegador.

## Som

Usa amostras reais do SoundFont **Bandoneon V2.5**, de Jörg Bleymehl (2016), gravado num bandoneon ELA de 1930, com edição GM de Mike77154. A licença do autor permite o uso livre, inclusive em projetos de software. As amostras ficam em `sons/bandoneon.js`, gerado com:

```
python ferramentas/sf2_para_js.py caminho/para/Bandoneon_V2.5.sf2 sons/bandoneon.js
```

O instrumento gravado está afinado em Lá = 443 Hz. No seletor "Som", no topo do app, dá para voltar ao som sintetizado.

## Mapa de botões

Transcrito dos diagramas de Omar Caccia (mão direita abrindo, mão esquerda fechando) e Matías Gobbo (mão direita fechando, mão esquerda abrindo). Ele pode ser ajustado em **Teclado → Editar layout** e exportado ou importado em JSON.
