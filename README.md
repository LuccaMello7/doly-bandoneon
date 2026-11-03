# Escola de Bandoneon

App web interativo para aprender bandoneon (sistema Rheinische 142 vozes). Não precisa de instalação nem de build: basta abrir o `index.html` no navegador.

## O que tem

- **Lições** sobre o instrumento, o sistema bisonoro, o fole, a leitura nas duas claves e os ritmos de tango, com mini-quizzes.
- **Teclado virtual** com os 71 botões nas posições reais, som de bandoneon real, troca de direção do fole (Espaço), fole simulado e válvula de ar para abrir (A) ou fechar (F) o fole sem som.
- **Desafios**: "Encontre a nota" e leitura na pauta.
- **Melodias** com os modos Ouvir, Espera e No tempo, sugestão automática da direção do fole, editor em texto e importação de MusicXML (`.mxl` / `.musicxml`, por exemplo exportado do MuseScore).
- **Ritmo**: marcato, síncopa, 3-3-2 e arrastre, com o modo "toque junto".

O progresso, as melodias criadas e as alterações no mapa de botões ficam salvos no `localStorage` do navegador.

## Som

Usa amostras reais do SoundFont **Bandoneon V2.5**, de Jörg Bleymehl (2016), gravado num bandoneon ELA de 1930, com edição GM de Mike77154. A licença do autor permite o uso livre, inclusive em projetos de software. As amostras ficam em `sons/bandoneon.js`, gerado com:

```
python ferramentas/sf2_para_js.py caminho/para/Bandoneon_V2.5.sf2 sons/bandoneon.js
```

O instrumento gravado está afinado em Lá = 443 Hz. Em **Ajustes** dá para voltar ao som sintetizado e escolher a afinação (440, 442 ou 443 Hz).

## Mapa de botões

Transcrito dos diagramas de Omar Caccia (mão direita abrindo, mão esquerda fechando) e Matías Gobbo (mão direita fechando, mão esquerda abrindo). Ele pode ser ajustado em **Teclado → Editar layout** e exportado ou importado em JSON.

## Estrutura

- `index.html`: a página e as abas.
- `css/app.css`: o visual.
- `js/`: um arquivo por parte do app (`audio.js`, `teclado.js`, `melodias.js`, `escalas.js`…), carregados em ordem pelo `index.html`. A inicialização fica em `js/init.js`.
- `sons/bandoneon.js`: as amostras de som.
- `ferramentas/`: scripts auxiliares.
- `tests/`: testes automáticos.

## Testes

```
python tests/rodar_testes.py
```

O script abre o app no Edge ou Chrome em modo invisível, roda `tests/testes.js` e mostra o resultado.
