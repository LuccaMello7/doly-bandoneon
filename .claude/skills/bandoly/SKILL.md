---
name: bandoly
description: Guia completo do projeto BanDoly (app para aprender bandoneon, bandoly.app, repositório doly-bandoneon). Use sempre que for mexer neste repositório — código do app, testes, traduções, páginas estáticas (lições, teoria, perguntas, Doly Costa), design e movimento, desempenho, SEO ou publicação — e antes de responder perguntas sobre como o app funciona. Traz a arquitetura, as convenções, o fluxo obrigatório antes de cada commit, as armadilhas já encontradas e as regras de conteúdo (direitos autorais, dedilhado, privacidade).
---

# BanDoly — guia do projeto

BanDoly ("bandoneon + Doly") é um app gratuito para aprender bandoneon, em homenagem a Doly Carlos
da Costa, bandoneonista de Caçapava do Sul (RS). Site: **https://bandoly.app** (GitHub Pages, arquivo
`CNAME`). Repositório: `github.com/LuccaMello7/doly-bandoneon`, branch **main**. O dono do projeto
fala **português do Brasil**: responda e escreva tudo em pt-BR.

## 1. Fluxo obrigatório antes de cada commit

1. `python tests/rodar_testes.py` → precisa dar **N/N testes passaram**. Ele também confere:
   - que todo `src`/`href` do `index.html` está em `ARQUIVOS` no `sw.js`;
   - que as páginas geradas estão atualizadas (`gerar_idiomas.py`, `gerar_licoes.py`, `gerar_teoria.py` com `--verificar`).
2. Mexeu no `index.html`, em `doly-costa/`, em `perguntas-frequentes/` ou no dicionário → `python ferramentas/gerar_idiomas.py`.
3. Mexeu nas lições (`js/licoes.js`, `js/licoes-traducao.js`) → `python ferramentas/gerar_licoes.py`.
4. Mexeu na teoria (`js/teoria.js`, `js/teoria-textos.js`) → `python ferramentas/gerar_teoria.py`.
5. `python ferramentas/extrair_textos.py` → precisa terminar em **0 sem tradução**.
6. Mudou qualquer arquivo servido → suba o número em `const CACHE = 'bandoly-vNN'` no `sw.js`. Arquivo novo
   → acrescente em `ARQUIVOS`.
7. `git fetch` antes de publicar: o dono também trabalha pelo Claude Code na web (ramos `claude/*`, PRs).
   Se o remoto andou, faça merge (`--ff-only` quando der) e rode os testes de novo.
8. Commit em português, explicando o que mudou para quem usa, terminando com:
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
9. Publique direto na main: `GIT_TERMINAL_PROMPT=0 git push`. Não precisa de PR; o GitHub Pages
   publica em 1–2 minutos. Se o dono não vir as mudanças, é cache: Ctrl+Shift+R.

Depois de mudanças visuais, **confira por captura de tela** (seção 9) antes de dizer que ficou pronto.
Seja honesto sobre o que não foi testado (celular real, MIDI real, microfone real).

## 2. Arquitetura (sem build)

- `index.html` (todas as abas) + `css/app.css` + `js/*.js` em **scripts clássicos com `defer`**, que
  compartilham o escopo global e rodam **nesta ordem**:
  `base, i18n-textos, i18n, licoes-traducao, audio, teclado, movimento, navegacao, fole, desafios, ritmo,
  atalhos, controles, melodias, musicxml, escalas, microfone, acordes, maos, academia, partituras, rotina,
  licoes, ajustes, ouvido, eco, cascata, trilha, professor, teoria-textos, teoria, contato, init`.
  Código que roda no carregamento só pode usar o que veio antes; dentro de funções, tudo já existe.
  `init.js` é sempre o último.
- PWA: `manifest.webmanifest` + `sw.js` (rede primeiro; o cache guarda tudo de `ARQUIVOS`).
- Estado: `state` (base.js). Tudo é salvo no `localStorage` com prefixo `bandoneon.` via
  `store.get/set`. O backup em Ajustes exporta essas chaves. Chaves principais:
  - `progress`, que inclui `lessons`, `find`, `staff`, `rhythm`, `chords`, `ouvido`, `pautabot`,
    `melodies`, `btnStats`, `days`, `academia`, `marcos`, `insignias`, `tarefas` e `teoria`;
  - de preferências e do app: `perfilAluno`, `ultimaAba`, `layout`, `mapaPc`, `pcLigado`, `midiBotoes`,
    `midiCC`, `pressaoFole`, `digitacoes`, `tarefa`, `profHist`, `movimento`, `vibracao`, `names`, `sound`,
    `tuning`, `volume`.
- Notas são números MIDI (60 = Dó4). Fole = `'open'` | `'close'`. Botão = `{id, x, y, open, close}`.
  O mapa padrão é o **Rheinische 142** (38 botões na direita, 33 na esquerda), dos diagramas de
  Omar Caccia e Matías Gobbo.

### Navegação
- Início + 4 áreas, em `AREAS` (navegacao.js):
  - **aprender:** estudo, academia, licoes, teoria;
  - **tocar:** teclado, melodias, acordes, microfone;
  - **treinar:** desafios, eco (o jogo RepeTCHÊ: o bandoneon toca, você repete; js/eco.js e o gaúcho em imagens/repetche/), ritmo;
  - **perfil:** perfil, professor, ajustes.
- Cada aba é `<section id="v-nome">`. O botão dela fica em `#subnav`, com `data-area` e `data-v`.
- `go(v)` troca de aba. Para agir ao entrar ou sair de uma aba: `ganchosAba.push((nova, anterior)=>…)`.
- Links internos: `data-go="aba"`. Endereços: `#aba`, `#licao-N`, `#teoria-N` e `#tarefa=…` (link do professor).
- A **Teoria** é a 2ª trilha da aba Lições: não tem botão no `#subnav`, e `go('teoria')` acende o botão Lições.

### Peças principais
- **Teclado** (`kb(el, mão, opções)`, teclado.js):
  - opções: `getDir`, `showLabels`, `onPress(b, midi, dir, api)`, `perRow`, `largura()`, `editable`, `canSound`;
  - api: `mark(id, 'ok'|'bad'|'hint'|'guia'|'chord', ms)` (ok/bad também vibram), `tocar(id, vel)`,
    `soltar(id)`, `tecla(id, rótulo)`, `dedo(id, n)`, `tint`, `setDim`, `refresh`, `build`;
  - teclados em aba escondida ficam **pendentes** e são desenhados por `construirPendentes()`, chamada
    em `go()` e ao mostrar painéis.
- **Áudio** (audio.js):
  - `startVoice`/`stopVoice`/`playNote`, com o som gravado (`SF`) ou o sintetizado;
  - `sons/bandoneon.js` (3,3 MB) só é baixado no primeiro gesto (`carregarSons()`);
  - o que se toca passa pelo `foleBus`, cujo ganho é a pressão do fole (`setPressao`).
- **Formato de texto das melodias** (melodias.js):
  - cabeçalho `título:` / `mão:` / `bpm:` / `descrição:`;
  - notas `Dó4:4`: 1, 2, 4, 8 e 16 são as figuras, `.` é o ponto e `t` a tercina;
  - `~` liga à próxima nota, `p:4` é pausa;
  - `/a` e `/f` forçam a direção do fole, `@3,2` dá o dedo e os alternativos;
  - `direita:` e `esquerda:` abrem as linhas de cada mão.
  - Fluxo: `parseMelody` → `buildTimeline` → `fingerMelody`, que escolhe o fole por programação
    dinâmica, com um fole só para as duas mãos.
- **Academia** (academia.js):
  - 7 níveis (o 7 são as partituras do usuário: MusicXML ou MIDI, em partituras.js);
  - modos aprender, praticar e desafio;
  - a avaliação separa nota, botão, mão, fole, ritmo e dedo; tocar o botão que brilha começa o exercício;
  - a tela segue a ordem escolher (recolhe ao tocar) → barra de controle → teclado (só a mão usada, ou as
    duas lado a lado com o fole no meio) → instrutor.
- **Caminho e conquistas** (trilha.js):
  - três perguntas na primeira visita (`perfilAluno`) definem `ETAPAS`;
  - `ETAPAS` e `INSIGNIAS` têm `feito()` calculado a partir do progresso; só a data da insígnia é salva;
  - cartão de compartilhar em canvas de 1080 px.
- **Professores** (professor.js): `#tarefa=` + base64url de JSON `{v, ex, modo, vel, prof, msg, titulo?,
  texto?, dedos?}`; relatório "Enviar ao professor"; editor de digitação, salvo em `digitacoes[exId][eventoId]`.
- **Controles** (controles.js):
  - teclado do computador por `event.code`, ligado por padrão onde há mouse; o mapa padrão segue as
    fileiras de botões e é editável;
  - setas: ← e → seguram a válvula, ↑ e ↓ mudam a pressão;
  - MIDI: a nota acha o botão na direção do fole; botões ensinados; CC aprendidos para pressão e direção.
- **Outras abas:**
  - Bandoneon real: afinador e calibragem (microfone.js, YIN);
  - Treino de ouvido (ouvido.js) e notas caindo (cascata.js);
  - Teoria (teoria.js, com `pautaSVG`, posição diatônica d = oitava×7 + letra, e textos em teoria-textos.js);
  - Sugestões (contato.js): abre uma issue preenchida no GitHub. `CONTATO_EMAIL` fica vazio até o dono indicar um endereço.

## 3. Traduções (pt → es, en)

- O app é escrito em português. `js/i18n.js` traduz a tela com um MutationObserver, usando
  `js/i18n-textos.js`, no formato `'texto pt': ['es', 'en']`; `{}` marca valores, como em `'Rodada {}/10 · Acertos: {}'`.
- No código, para alert, confirm, prompt e para canvas, use `t('texto', valores)`. Nos textos montados em
  HTML, escreva em português e deixe o observer traduzir.
- Texto rico (com `<b>`, links) fica inteiro por idioma em arquivo próprio: `licoes-traducao.js` e
  `teoria-textos.js`. O container leva `translate="no"`. Senão o observer picota a frase.
- Nomes próprios e coisas que não se traduzem: `translate="no"` ou a lista `IGUAIS`/`NAO_E_TEXTO` em
  `ferramentas/extrair_textos.py`.
- As páginas `es/` e `en/` são **geradas**: nunca edite à mão. O espanhol é neutro e rio-platense; o inglês é britânico
  (crotchet, quaver, practise).
- Ao criar uma tela, acrescente-a em `percorrerApp()` (tests/testes.js). O teste de tradução percorre o
  app em es e en procurando texto em português (`PARECE_PT`).

## 4. Páginas estáticas (SEO)

- `doly-costa/`: a história do Doly, contada pela rolagem.
- `perguntas-frequentes/`: busca, categorias e FAQPage montada pelo script.
- `licoes/` e `teoria/`: geradas por `ferramentas/gerar_licoes.py` e `ferramentas/gerar_teoria.py`, nos três idiomas.
- Links com `data-local` não ganham `../` no gerador. O bloco `<!--bandeiras-->` é refeito por idioma.
- `sitemap.xml` tem blocos `<!--licoes-->` e `<!--teoria-->`, mantidos pelos geradores. Depois de criar
  páginas, lembre o dono de reenviar o sitemap no Search Console e pedir a indexação das principais.
- O CSS global esconde `section` que não é aba ativa. Em páginas estáticas, use `.pagina>section{display:block}`.

## 5. Design e movimento

- Visual "B" (app moderno): azul-marinho `--bg #0d1b2e`, painéis `--panel`, dourado `--gold #e6b450`,
  fonte Nunito local (`fontes/`), ícones em sprite SVG (`<svg aria-hidden="true"><use href="#i-nome"/></svg>`)
  e ornamento de fileteado (`#i-filete`, `--filete`).
- A marca é sempre **BanDoly**, junta, nunca "Ban Doly".
- Teclado com caixa escura e botões de madrepérola. Azul = abrindo, laranja = fechando, e para texto em
  cima use `--open-texto`/`--close-texto` (contraste ≥ 4,5). Vermelho só para erro.
- Movimento (movimento.js):
  - `cascata(sec)` ao abrir uma aba;
  - `data-revela` (e `="cascata"` ou `="aneis"`) ao rolar;
  - `comemorar()` (confete + vibração), `vibrar()`, `avisar(html)` (toast).
  - Tudo respeita `movReduzido()`, que vem do sistema ou de Ajustes → Animações; a classe `sem-mov` desliga tudo.
- Armadilhas:
  - animação de entrada com `both` prende o `transform` e mata o hover: use `backwards`;
  - não leia `offsetWidth`/`clientWidth` de coisas escondidas durante o carregamento, porque isso força o
    layout da página inteira.

## 6. Testes

- `tests/testes.js` roda dentro do `index.html` no Edge invisível (`tests/rodar_testes.py`).
- Escreva com `teste('nome', () => {...})`, `ok(cond, msg)`, `igual(a, b)`, e use `async` quando precisar
  de `await esperar()` ou `await carregarSons()`.
- Testes de interface chamam as funções do app diretamente (`go`, `acadToque`, `earPress`, `midiNota`…)
  e devolvem o estado ao normal no fim.
- Toda função nova relevante merece um teste. Toda tela nova entra em `percorrerApp()`.

## 7. Ambiente (Windows) e armadilhas já encontradas

- **Python 3.9:** `write_text(newline=)` não existe. Use `write_bytes(texto.encode('utf-8'))`.
- **Node 14** só serve para `node --check`: não use `||=` nem `??=`. **npm 6**: `npx` sem `-y`.
- **Git Bash:** um heredoc com acentos pode corromper o texto, e um com aspas pode quebrar o comando.
  Para editar arquivos, escreva um script Python com a ferramenta Write no scratchpad e rode-o, com
  substituições exatas que confirmam `count == 1`. Depois, `node --check js/*.js`.
- **Comentários "engolem" código:** ao inserir `// comentário` numa linha que continua depois, o resto da
  linha vira comentário. Já quebrou `teclado.js` e `atalhos.js`. Sempre rode `node --check`.
- **Edge invisível pelo Git Bash** às vezes não grava nada (nem testes, nem capturas), sobretudo com o Edge
  do dono aberto. Rode `python tests\rodar_testes.py` e as capturas pelo **PowerShell**
  (`Start-Process ... -Wait`, com `--user-data-dir` próprio).
- O Doly está vivo: em 2026 tem **97 anos e ainda toca**. Escreva sobre ele no presente ("Quem é Doly Costa?").
- Em laço no bash, use `"$W/$h.png"`. Com `"$W\\$h.png"` o `$h` não é expandido.
- **Lighthouse:** a página do PageSpeed só mostra resultados com JavaScript, a API grátis tem cota diária e
  o `lighthouse@9` local trava com o Edge. Peça ao dono a lista de itens que falharam.

## 8. Regras de conteúdo e privacidade

- **Nunca invente** dedilhado, posição de notas nem melodias de memória. O dedilhado só entra com uma
  fonte real (método, professor). Sem ela, o instrutor dá dicas de posição tiradas do mapa
  (`dicasPosicao`). O app **nunca afirma ter conferido o dedo**.
- Transcreva só de partitura legível. Se a imagem não deixa ler com segurança, diga isso e peça uma
  melhor ou um MusicXML. Foi assim com o "Canto" de El Choclo: só a introdução entrou.
- **Direitos autorais:** música só entra pronta se estiver em domínio público (na Argentina, 70 anos após
  a morte do autor). Recusadas por estarem protegidas: Nada (Dames), Adiós Nonino (Piazzolla), El sueño
  del pibe (Puey). O usuário pode importá-las para uso pessoal.
- Fotos do Doly: só com autorização da família. Áudio e vídeo dele também: vídeo do YouTube "não
  listado", com fachada que só carrega no clique e `youtube-nocookie`, ou áudio próprio com o vinil girando.
- Não publique o e-mail pessoal do dono sem ele pedir.
- O repositório é público, com `LICENSE` de **todos os direitos reservados**.
- Mantenha "sem cadastro". Login (por exemplo, Supabase) só se opcional, com RLS em todas as tabelas,
  LGPD (menores!), região de São Paulo e nunca a chave secreta no site.

## 9. Conferir por captura de tela

```bash
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"; W=$(cygpath -w "$PWD")
"$E" --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
  --virtual-time-budget=5000 --window-size=1400,1000 --screenshot="$W/tela.png" "file:///C:/.../index.html#aba"
```
- `--force-prefers-reduced-motion` mostra o estado final. Sem ele, as animações aparecem pela metade;
  para ver o movimento terminado, use `--run-all-compositor-stages-before-draw`.
- Para um estado específico: copie o `index.html` para o scratchpad com
  `<base href="file:///C:/Users/lucca/bandoneon-app/">` e um `<script>setTimeout(()=>{…},400)</script>`
  no fim. Para pular a pergunta inicial, defina antes `localStorage['bandoneon.perfilAluno']`.
- Celular: uma página com `<iframe style="width:390px">` e `--allow-file-access-from-files`.
- Desempenho: injete `performance.now()` entre os scripts e compare antes e depois.

## 10. Como o dono gosta de trabalhar

- Pede melhorias amplas ("faça todas"). Implemente, teste, publique e então relate em pt-BR, de forma
  curta: o que mudou, o que precisa da parte dele e o que não deu para testar.
- Para mudanças grandes de visual, ele gosta de ver uma **maquete** antes (em `scratchpad/maquetes/`).
- Quer opinião honesta, inclusive para discordar ("não recomendo… porque…").
- Gosta de movimento e de visual forte, mas com propósito e sem poluir a tela inicial.

## 11. Pendências conhecidas

- Testes com aprendizes e professores reais, num celular real e com o bandoneon no microfone.
- Do dono:
  - foto nítida do Canto de El Choclo;
  - páginas de um método de digitação (ex.: Pedro Maffia), como referência e não como regra;
  - áudio ou vídeo do Doly com autorização;
  - e-mail para as sugestões;
  - conta no GoatCounter (e então uma nota de privacidade);
  - revisão do es/en por nativos;
  - lista do PageSpeed.
- Ideias:
  - Cloudflare Pages com repositório privado, que também melhora o cache;
  - Supabase opcional para sincronizar o progresso e criar turmas de professores;
  - 4º Encontro de Bandoneón em Caçapava do Sul (homenagem ao Doly) como lançamento.
