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
  licoes, ajustes, ouvido, eco, cascata, trilha, inicio, professor, teoria-textos, teoria, contato, conta, init`.
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
  - **treinar:** desafios, eco (o jogo RepeTCHÊ: o bandoneon toca, você repete; js/eco.js e o gaúcho em imagens/repetche/. Tem música do dia com sequência, "Suas músicas" com as melodias e partituras do aluno e modo microfone), ritmo;
  - **perfil:** perfil, professor, ajustes.
- Cada aba é `<section id="v-nome">`. O botão dela fica em `#subnav`, com `data-area` e `data-v`.
- `go(v)` troca de aba. Para agir ao entrar ou sair de uma aba: `ganchosAba.push((nova, anterior)=>…)`.
- Links internos: `data-go="aba"`. Endereços: `#aba`, `#licao-N`, `#teoria-N` e `#tarefa=…` (link do professor).
- A **Teoria** é a 2ª trilha da aba Lições: não tem botão no `#subnav`, e `go('teoria')` acende o botão Lições.

### RepeTCHÊ em fases (eco.js)
- Cada música é dividida em fases de 8 notas (`ECO_FASE`, `ecoFases(id)`); um jogo é uma fase. Completar uma libera a
  seguinte, e todas liberam o desafio final, a música inteira (`ecoComecar('tudo')`). `ecoComecar(n)` joga a fase n;
  sem argumento, a próxima a fazer (`ecoProximaFase`).
- Progresso: `progress.eco[id] = {pts, estrelas, fases:{0:{pts,estrelas}}}`; `pts`/`estrelas` são da música inteira.
- `ecoMapa()` desenha o mapa de fases (`.eco-mapa`) no jogo e na tela do fim. A música do dia vale com uma fase.
- Partitura das Melodias: `staffCursor(g)` move a bolinha `#staffBola`, que pula em arco de nota em nota.

### Tela Início (js/inicio.js)
- O Início é o próprio instrumento: as duas mãos (o mapa de `state.layout`) e o fole no meio, tocáveis
  (`startVoice`/`stopVoice`). Espaço ou a chave trocam o fole, e os nomes trocam em cascata. Com o teclado do
  computador ligado, `tecladoVisivel()` (controles.js) devolve `iniKb` quando o Início está aberto.
- Dois estados na mesma seção: apresentação (`.ini-so-novo`) e quem volta (`.ini-so-volta`, classe `volta` em
  `#v-inicio`). `renderInicio(es, n, atual)`, chamada por `renderTrilha`, preenche o caminho em quatro partes
  (`INI_PARTES`), a próxima etapa, a semana, a Academia, o RepeTCHÊ do dia e a rotina.
- O botão verde do topo (`#topoCta`) leva à próxima etapa, de qualquer aba.
- O texto "O que você encontra", as notas técnicas e o crédito do som ficam em `<details class="ini-sobre">` no rodapé
  (fechado, mas no HTML para a busca). O aviso do professor fica no rodapé.
- Desenho e direção: `.impeccable/surfaces/index-html.md`; produto: `PRODUCT.md`.

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
  - **Conta opcional** (conta.js, aba `conta` em Perfil; banco em `supabase/banco.sql`):
    - Supabase, projeto `venbupxwqgofwjkhixhc` (São Paulo). No site vai só a chave **publicável** (`sb_publishable_…`); a secreta nunca.
    - Só maiores de 18 anos: a caixa de aceite libera "Entrar com Google" e o link por e-mail (PKCE, volta com `?code=`). O aceite vai para a tabela `progresso`.
    - A biblioteca (`js/vendor/supabase.js`, 2.118.0) só carrega para quem entra ou já tem login; não está em `ARQUIVOS`.
    - Sincronização: uma linha por pessoa com as chaves `bandoneon.*`, menos as do aparelho (`NAO_SINCRONIZA`). Sempre junta antes de gravar: `progress` fica com o maior número, o verdadeiro e a soma de listas e objetos (`juntarProgresso`); listas de melodias se somam por id.
    - `CONTA_LIGADA = false` esconde a aba do menu até o envio de e-mail e o Google estarem configurados; ela abre por `#conta` para testar.
    - Excluir conta: função `excluir_minha_conta()` no banco (apaga o login e, em cascata, o progresso).
    - Páginas: `termos/` (Termos de Uso) e `privacidade/` falam da conta; mudou o que a conta guarda → atualize as duas.

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

- Mundo do Doppler (desde 2026-11-10, aprovado pelo dono): fundo ameixa quase preto `--bg #1c1624`, painéis
  `--panel #2d2734` com bordas finíssimas (`--borda`), lavanda `--lavanda #b997ff` para a voz da marca (o token
  `--gold` agora É a lavanda), verde `--verde-vai #00f575` só no botão de "ir" (`.btn-vai`), fonte **Onest** local
  (`fontes/`), barra do topo em vidro fosco no computador (o desfoque fica em `header::before`: no próprio header
  ele prenderia a barra fixa de baixo do celular). Ícones em sprite SVG (`<svg aria-hidden="true"><use href="#i-nome"/></svg>`;
  a regra geral de `svg[aria-hidden]` encolhe qualquer desenho que use esse atributo).
- O Início já está no mundo novo; as outras abas receberam só os tokens e ainda têm cores fixas antigas
  (azul-marinho em gradientes, moldura dourada do teclado, brilhos). Revisar uma área por vez.
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
- **Direitos autorais:** música só entra pronta se estiver em domínio público (no Brasil e na Argentina,
  70 anos após a morte do autor). Recusadas por estarem protegidas: Nada (Dames), Adiós Nonino (Piazzolla),
  El sueño del pibe (Puey), Hino do Grêmio (Lupicínio Rodrigues, livre só em 2045). O usuário pode
  importá-las para uso pessoal.
- **Já transcritas de partitura** (fonte na descrição de cada uma): La Cumparsita, parte A (edição Tony
  Wilkinson, IMSLP, CC BY 3.0) e Tico-tico no fubá, parte A (Musica Brasilis, CC BY-SA). Uma voz só: onde a
  mão direita tem duas vozes, fica a que conduz a melodia.
- Fotos do Doly: só com autorização da família. Áudio e vídeo dele também: vídeo do YouTube "não
  listado", com fachada que só carrega no clique e `youtube-nocookie`, ou áudio próprio com o vinil girando.
- Não publique o e-mail pessoal do dono sem ele pedir.
- **Política de segurança (CSP)** num `<meta>` do `index.html`: o app só carrega código do próprio site, do
  GoatCounter e só conversa com o Supabase. Serviço externo novo (script, imagem, conexão, vídeo) precisa entrar
  nela, senão é bloqueado. O teste registra como erro qualquer bloqueio (`securitypolicyviolation`).
- O responsável pelos dados (controlador, LGPD) é **Lucca Costa**, citado na Privacidade e nos Termos.
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

### Transcrever partituras e tratar mídia
- PDF → imagem: `pip install pymupdf`, renderize a 300–400 dpi e recorte cada sistema.
- `ferramentas/medir_notas.py` (precisa de numpy, pillow e scipy) acha as 5 linhas da pauta e a posição de
  cada cabeça de nota (0 = linha de baixo, 1 = 1º espaço…). Use para confirmar a leitura nota a nota;
  posições "x,5" na impressão antiga = ilegível, não adivinhe.
- Depois de escrever no formato de texto, confira que cada compasso soma a fórmula de compasso e compare a
  pauta desenhada nas Melodias com a partitura.
- Áudio e vídeo: `pip install imageio-ffmpeg` traz o ffmpeg. Corte, normalize (`loudnorm`) e grave MP4 H.264
  com `-movflags +faststart`. Vídeo não entra em `ARQUIVOS` do `sw.js` (o service worker deixa passar os
  pedidos com Range).

## 10. Como o dono gosta de trabalhar

- Pede melhorias amplas ("faça todas"). Implemente, teste, publique e então relate em pt-BR, de forma
  curta: o que mudou, o que precisa da parte dele e o que não deu para testar.
- Para mudanças grandes de visual, ele gosta de ver uma **maquete** antes (em `scratchpad/maquetes/`).
- Quer opinião honesta, inclusive para discordar ("não recomendo… porque…").
- Gosta de movimento e de visual forte, mas com propósito e sem poluir a tela inicial.

## 11. Pendências conhecidas

- Testes com aprendizes e professores reais, num celular real e com o bandoneon no microfone.
- Músicas:
  - **Prenda Minha:** a edição de Mário de Andrade (1928, IMSLP #865527) é ilegível demais. Transcrever da
    versão para piano de Ernani Braga (IMSLP #731321, Ricordi 1947, domínio público) quando o dono baixar.
  - **Hino Rio-Grandense:** melodia de Mendanha (1838) é livre, mas a versão cantada hoje tem revisão de
    Antônio Corte Real (1934), com data de morte não confirmada. Precisa de partitura (não há no site do
    Estado, só MP3) e de confirmar os direitos dessa versão. Alternativa livre: a partitura de 1887 (jornal
    *A Federação*, Hemeroteca Digital).
  - Sugeridas, com partitura em domínio público no IMSLP: Gaúcho (O Corta-jaca), de Chiquinha Gonzaga, e
    Odeon, de Ernesto Nazareth.
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
