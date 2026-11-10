---
name: BanDoly
description: O teclado de um bandoneon de verdade no navegador, sob uma luz violeta à meia-noite.
colors:
  ameixa: "#1c1624"
  ameixa-2: "#2d2734"
  ameixa-3: "#362f3f"
  ferro: "#55505b"
  cinza: "#a5a2a5"
  cinza-2: "#d0c9c4"
  osso: "#f1f0ec"
  borda: "rgba(229,231,235,.12)"
  borda-2: "rgba(229,231,235,.22)"
  lavanda: "#b997ff"
  lavanda-clara: "#cdb6ff"
  verde-vai: "#00f575"
  verde-vai-hover: "#3dff95"
  abrindo: "#4f9cf0"
  fechando: "#f08a4b"
  erro: "#d0524c"
  madreperola: "#ece5d6"
  placa: "#1a1512"
typography:
  display:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5vw, 4.4rem)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 550
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  numeral:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  body:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  body-lead:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Onest, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  xs: "6px"
  sm: "10px"
  botao: "12px"
  md: "14px"
  painel: "20px"
  pilula: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  painel: "32px"
  cabeca: "48px"
  largo: "64px"
  secao: "110px"
components:
  button-primary:
    backgroundColor: "{colors.verde-vai}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.botao}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.verde-vai-hover}"
  button-primary-small:
    backgroundColor: "{colors.verde-vai}"
    textColor: "#000000"
    rounded: "{rounded.botao}"
    padding: "8px 16px"
    height: "38px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.osso}"
    rounded: "{rounded.botao}"
    padding: "12px 24px"
    height: "48px"
  panel:
    backgroundColor: "{colors.ameixa-2}"
    textColor: "{colors.osso}"
    rounded: "{rounded.painel}"
    padding: "{spacing.painel}"
  chave-fole:
    backgroundColor: "{colors.ameixa-2}"
    textColor: "{colors.cinza-2}"
    rounded: "{rounded.md}"
    padding: "4px"
  chave-fole-abrindo:
    backgroundColor: "{colors.abrindo}"
    textColor: "#06213f"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    height: "36px"
  chave-fole-fechando:
    backgroundColor: "{colors.fechando}"
    textColor: "#3b1500"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    height: "36px"
  pill-abrindo:
    backgroundColor: "rgba(79,156,240,.18)"
    textColor: "#8fc2ff"
    rounded: "{rounded.pilula}"
    padding: "3px 10px"
  pill-fechando:
    backgroundColor: "rgba(240,138,75,.16)"
    textColor: "#ffb487"
    rounded: "{rounded.pilula}"
    padding: "3px 10px"
  nav-top:
    backgroundColor: "rgba(28,22,36,.82)"
    textColor: "{colors.cinza-2}"
    height: "64px"
---

# Design System: BanDoly

<!-- Registrado em 2026-11-10 a partir do que foi publicado. O Início foi o primeiro; no mesmo dia todas as abas do app e as páginas abertas (Doly, perguntas, lições, teoria, privacidade) passaram para este mundo, com revisão de acabamento do app inteiro. O que ainda destoa está em "Dívida conhecida". -->

## Overview

**Creative North Star: "O cofre violeta à meia-noite"**

O BanDoly mora num quarto escuro cor de ameixa, iluminado por uma única luz violeta que vem de trás do instrumento. O bandoneon é o objeto principal da tela: um teclado de botões de madrepérola sobre uma placa quase preta, com o fole no meio. Tudo o mais (painéis, textos, navegação) recua para um degrau tonal acima do fundo, com bordas finíssimas e claras, e deixa o instrumento brilhar. A referência fixada pelo dono é o estilo Doppler ("violet-lit vault at midnight"); a composição é própria: o palco do instrumento.

A densidade é baixa e o ritmo é largo: seções separadas por muito ar (110px), títulos grandes e apertados numa única sans geométrica (Onest), texto em osso e cinzas quentes. A cor carrega significado, não decoração: lavanda é a voz da marca, verde vivo é o único "ir", azul e laranja dizem a direção do fole. A profundidade vem do tom e da luz (aurora radial, vidro fosco), não de sombras empilhadas.

O sistema rejeita, por decisão do dono, o dourado e o azul-marinho do visual anterior, a barra lateral no computador e o esquema de título com print ao lado e fileira de cartões iguais.

**Key Characteristics:**
- Fundo ameixa quase preto, painéis um degrau acima com borda de 1px a 12% de branco.
- Uma só família, Onest self-hosted, com tracking negativo nos títulos.
- Lavanda como voz da marca; verde só no botão de ir.
- Azul = fole abrindo, laranja = fole fechando, vermelho só para erro, em todo o app.
- O instrumento é real e tocável: madrepérola sobre placa escura, aceso na cor do fole.
- Movimento com uma curva de saída longa e suave; sem elásticos.

## Colors

Uma paleta escura e quente, de um único acento de marca, onde cada cor viva tem um trabalho fixo.

### Primary
- **Lavanda da Meia-Noite** (lavanda): a voz da marca. Segunda frase dos títulos grandes, etapas concluídas do caminho, valores "próximo", ícones de apoio, anel de foco, estados de hover de links e títulos clicáveis. Nunca como fundo de área grande; o maior uso de superfície é a faixa "Suavez" e as bolinhas da semana.
- **Lavanda Clara** (lavanda-clara): cor de links de texto corrido.

### Secondary
- **Verde de Ir** (verde-vai): só o botão principal de ação ("Começar", "Continuar", "Começar a etapa 1") e a nota atual na partitura de demonstração, que replica o verde da partitura real do app. Hover em Verde de Ir Aceso (verde-vai-hover). Texto do botão em preto puro.

### Tertiary (semântica do fole, fixada pelo dono para o app inteiro)
- **Azul Abrindo** (abrindo): o fole abrindo. Botão aceso, chave "Abrindo", nota abrindo no visor, pílula de direção.
- **Laranja Fechando** (fechando): o fole fechando. Mesmos papéis do azul, no sentido oposto; também o ícone de chama da sequência de dias.
- **Vermelho de Erro** (erro): só erro. Nunca decoração, nunca destaque.

### Neutral
- **Ameixa** (ameixa): fundo de tudo; também a cor do texto sobre superfícies claras (osso, lavanda).
- **Ameixa Degrau** (ameixa-2): painéis, a chave do fole, quadrados de ícone.
- **Ameixa Funda** (ameixa-3): trilhos de progresso vazios e círculos de fase inativos.
- **Ferro** (ferro): linhas de trilho, contornos de círculos vazios, barra de rolagem.
- **Cinza Fumo** (cinza): rótulos, legendas, metadados, rodapé.
- **Cinza Quente** (cinza-2): texto de apoio e corpo de parágrafo sobre o fundo.
- **Osso** (osso): títulos e texto principal.
- **Borda Fina** (borda) e **Borda Média** (borda-2): divisórias e contornos de 1px; a média nos botões fantasma e nas teclas kbd.
- **Madrepérola** (madreperola) e **Placa** (placa): os materiais do instrumento, só no teclado.

### Named Rules
**A Regra do Fole.** Azul é abrindo e laranja é fechando, sempre e em qualquer tela. Nenhuma das duas cores aparece com outro significado.

**A Regra do Único Verde.** O verde vivo aparece em um tipo de coisa só: a ação de ir adiante. Se há dois verdes competindo num viewport, um deles está errado.

**A Regra da Voz Lavanda.** A lavanda fala pela marca em títulos e marcas de progresso; não vira fundo de painel nem gradiente de cartão.

## Typography

**Display Font:** Onest (com Segoe UI, system-ui, sans-serif)
**Body Font:** Onest (com Segoe UI, system-ui, sans-serif)

**Character:** Uma só sans geométrica, self-hosted em `fontes/` (latin e latin-ext, pesos 400 a 900 variáveis). Os títulos ganham peso médio e tracking negativo e ficam compactos; o corpo respira em altura de linha 1.55.

### Hierarchy
- **Display** (650, clamp 2.6rem a 4.4rem, 1.04, -0.035em): o título do primeiro viewport, centralizado, em duas frases; a segunda em lavanda, na linha de baixo. 2.25rem no celular.
- **Headline** (550, clamp 2rem a 3.25rem, 1.06, -0.03em): títulos de seção e o fecho (este até 4.2rem, limitado a 15ch). Sempre com `text-wrap: balance`.
- **Title** (550, 24px, 1.2, -0.02em): títulos dentro de painéis; 20px nas colunas do caminho e nos atalhos. O título do painel "continuar" sobe para 30px.
- **Numeral** (600, 40px, 1.05, -0.03em, algarismos tabulares): números de destaque (aprendidos, próximo). A nota no visor do instrumento usa 600 a 30px.
- **Body** (400, 16px, 1.55): parágrafos, com medida entre 32rem e 44rem. O apoio do título e as aberturas de seção usam 18px (body-lead).
- **Label** (500, 13px): rótulos, legendas, metadados, botões compactos. Os botões principais usam 500 a 15px.

### Named Rules
**A Regra do Meio-Peso.** Títulos ficam entre 550 e 650. Nada de 800 e 900 no mundo novo; o peso pesado é do visual antigo.

**A Regra da Família Única.** Onest em tudo, inclusive botões e kbd. A única exceção é a clave de sol da partitura de demonstração, que é notação musical.

## Layout

Coluna central de até 1150px, com margem lateral de 28px no computador; o palco do instrumento sangra até as bordas (a aurora ultrapassa a coluna). O primeiro viewport é centralizado: título, apoio, ações e, abaixo, a grade de três colunas do instrumento (mão esquerda, fole, mão direita), dimensionada por container query para caber na largura.

O ritmo vertical é largo: 110px entre seções (80px abaixo de 1000px), 48px entre a cabeça da seção e o conteúdo, 16px entre painéis irmãos, 32px de respiro dentro de painéis (24px no celular), 64px entre colunas de texto e imagem. Listas e grupos de números se separam por divisórias de 1px em vez de caixas.

Pontos de quebra observados: 1000px (barra no topo e grade de três colunas do instrumento acima; abaixo, o instrumento empilha com a mão direita em cima e o fole vira uma faixa com chave e visor lado a lado), 600px (celular: o botão verde ocupa a largura inteira, a barra do topo mostra só marca, idiomas e o botão verde) e telas baixas de computador (altura até 880px), em que o palco encolhe para o instrumento caber no primeiro viewport.

## Elevation & Depth

A profundidade é tonal e luminosa, não por sombras. Painéis sobem um degrau de cor (ameixa para ameixa-2) e se contornam com uma borda interna de 1px; o vidro fosco separa a barra do topo do conteúdo; a aurora radial (violeta, rosa e brasa, desfocada) dá a sensação de luz vindo de trás do instrumento. Sombras existem só onde há objeto físico: as placas do teclado, os botões de madrepérola e a foto do Doly.

### Shadow Vocabulary
- **Placa do instrumento** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), 0 30px 60px -28px rgba(0,0,0,.8)`): a placa de cada mão, pousada no palco.
- **Botão de madrepérola** (`box-shadow: 0 .05em 0 rgba(0,0,0,.55), inset 0 -.04em .06em rgba(0,0,0,.18)`): a borda física do botão; ao apertar, desce para `0 .01em 0` com sombra interna, e o botão afunda .04em.
- **Retrato** (`box-shadow: 0 40px 70px -30px rgba(0,0,0,.9), inset 0 0 0 1px rgba(229,231,235,.12)`): a foto do Doly.
- **Borda de painel** (`box-shadow: inset 0 0 0 1px rgba(229,231,235,.12)`): o contorno padrão de painéis, chave e visor.

### Named Rules
**A Regra da Luz por Trás.** O que destaca o instrumento é a aurora atrás dele, não uma sombra sob os painéis. Painéis são planos.

**A Regra do Objeto Físico.** Sombra projetada só em coisas que existem no mundo: o instrumento e a foto. Interface não projeta sombra.

## Shapes

Cantos generosos e consistentes: painéis e a foto a 20px, botões a 12px, a chave do fole, o visor e as miniaturas de vídeo a 14px, os botões internos da chave a 10px, kbd e pregas do fole a 6px. Pílulas, bolinhas de progresso e botões de fase são círculos ou cápsulas (999px); a fase final do RepeTCHÊ é um quadrado arredondado (11px) para se distinguir. As placas do teclado arredondam em proporção ao tamanho do botão (.42em). Bordas são sempre 1px, quase sempre internas (box-shadow inset), para não alterar o tamanho da caixa.

## Components

### Buttons
Diretos e calmos: uma cor chapada, sem gradiente, sem brilho.
- **Shape:** cantos de 12px, altura mínima de 48px (38px na versão compacta).
- **Primary (botão de ir):** Verde de Ir com texto preto, Onest 500 a 15px, 12px 24px, com seta à direita.
- **Hover / Focus:** o verde clareia para o Verde de Ir Aceso e a seta anda 3px para a direita; ao apertar, o botão desce 1px. Transições de .2s com a curva de saída.
- **Ghost (fantasma):** transparente, texto osso, contorno interno de 1px em borda-2 que sobe para 45% de branco no hover. Para a ação secundária ao lado do botão verde.
- **Link de ação (ir):** texto osso 500 com seta; no hover vira lavanda e a seta anda 4px. Para o fim de painéis.

### Peças das ferramentas (todas as abas, desde 2026-11-10)
- **Botão claro** (`.btn`): osso com texto ameixa, Onest 500, cantos de 12px, 40px de altura (36px nos grupos de ferramentas). A ação principal de uma ferramenta que não é "começar" (Trocar direção, Exportar backup).
- **Fantasma** (`.btn.sec`): transparente, contorno interno em borda-2. Ligado (`.btn.sec.on`, um interruptor): lavanda a 16% com contorno lavanda.
- **Começar** (`.btn-grande`): o verde de ir, só no começo de cada ferramenta (Academia, Melodias, Desafios, Ritmo). O botão verde do topo aparece só no Início, para não haver dois verdes na mesma tela.
- **Segmentado** (`.segmento`): painel ameixa-2 com o item ativo em branco a 10%.
- **Abas da área** (`.subnav`): texto cinza-2; a ativa em ameixa-2 com contorno e ícone lavanda.
- **Cabeçalho de tela** (`.pg-topo`): título 600 com tracking -0.03em, apoio em cinza-2, ícone lavanda num quadrado ameixa-2 de 48px. Sem degradê e sem ornamento.
- **Pílula do fole** (`.dirpill`): a chave do Início em versão única: bolinha e "Abrindo"/"Fechando" em 500, fundo azul ou laranja com texto escuro. Sem setas e sem caixa alta.
- **Teclado** (`.kbd`, `.key`): a placa e a madrepérola do instrumento do Início em todas as abas. O botão apertado acende na cor do fole (a placa leva `data-fole`); a pista de "toque aqui" é um contorno lavanda que pulsa, não um brilho.
- **Grupos de ajustes** (`.grupo`): o nome em cima, 13px cinza, sem caixa alta.
- **Página de texto** (`privacidade/`): coluna de 760px, título display, seções separadas por divisória de 1px.
- **Botão de tocar** (`.btn-play`): o triângulo é desenhado no próprio botão (`::before`) e vira um quadrado enquanto toca (`.rodando`). Nada de caracteres ▶ e ■ nem de emoji no texto.
- **Janelas** (`.boas`, `.boas.janela`): primeira visita, Sugestões, Controles de tocar e Compartilhar. Painel ameixa-2 com contorno borda-2, fundo de trás ameixa com desfoque; as opções são linhas com contorno fino, lavanda quando marcadas.
- **Avisos flutuantes** (`.toast`, `.som-carregando`): a mesma pílula ameixa-2 com contorno, texto em 500.
- **Mapa do teclado do computador** (`.pc-tecla`): mão esquerda em lilás, direita em osso. Azul e laranja nunca marcam mão, só a direção do fole.
- **Perguntas das lições** (`.q`) e **Perguntas frequentes** (`.faq-item`): linhas separadas por divisória de 1px, sem caixa dentro do painel; a pergunta aberta fica em lavanda.

### Chips
- **Pílula de direção:** cápsula de 12px de texto, azul ou laranja translúcido, com o texto num tom claro da mesma cor.
- **Círculos de fase:** 38px, ameixa-3 com texto cinza quando inativos, lavanda translúcida quando feitos, osso com texto ameixa no atual.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** ameixa-2.
- **Shadow Strategy:** nenhuma; só o contorno interno (ver Elevation & Depth).
- **Border:** 1px interno a 12% de branco; no hover de painéis clicáveis, o contorno vira lavanda a 50%.
- **Internal Padding:** 32px (24px no celular); 28px nos painéis de "Praticar hoje".
- **Listas sem caixa:** caminho, perguntas, fatos e atalhos são linhas separadas por divisórias de 1px, não cartões.

### Navigation
- **Barra do topo, em vidro:** sticky, 64px no computador, fundo ameixa a 82% com `backdrop-filter: blur(16px) saturate(140%)` e borda inferior a 8%. Marca à esquerda (logo de 32px, BanDoly em 650), áreas em texto cinza-2 500 a .92rem, sem ícones; a área ativa fica em osso sobre um indicador translúcido que desliza até ela. Idiomas (PT ES EN) em 13px cinza, o ativo em osso. Botão verde compacto à direita.
- **Celular e tablet (até 999px):** a barra do topo mostra marca, idiomas, a conta e o botão verde; as cinco áreas descem para uma barra flutuante embaixo, com ícones sobre rótulos de .7rem.
- **Áreas (desde 2026-11-10):** Início, Aprender, Tocar, Treinar e Professores. Conquistas, Ajustes e Conta formam a área da conta, sem botão no menu: no canto direito do topo fica "Entrar" (fantasma; só o ícone no celular) ou o círculo com a inicial (ameixa-3, contorno lavanda, pontinho lavanda quando está tudo salvo), que abre um menu em painel ameixa-2.
- **Entrar:** um cartão de 440px centralizado sob um brilho violeta, um passo por vez (escolher Google ou e-mail → "Confira o seu e-mail"); campo com rótulo que sobe; a caixa dos 18 anos acende em vermelho de erro só quando falta marcar.

### O instrumento (componente de assinatura)
O teclado Rheinische 142 inteiro, tocável. Cada mão é uma placa quase preta (placa) com os botões em madrepérola, com degradê radial de luz no canto superior esquerdo e o nome da nota em 600 a .205em. Aceso, o botão ganha a cor do fole (azul abrindo, laranja fechando) e afunda. No centro, o fole: pregas em listras ameixa e vinho que estreitam ao fechar (.5s, curva de saída), a chave Abrindo/Fechando (painel de 14px com dois botões; o pressionado toma a cor do fole) e o visor, que mostra a nota tocada em 30px e as duas notas do botão em azul e laranja. Ao trocar o fole, os nomes dos 71 botões trocam em cascata da esquerda para a direita (34ms por coluna, 140ms por troca). O foco de teclado é um anel lavanda de 2px.

### Aurora
Três gradientes radiais (rosa `rgba(255,158,250,.34)`, violeta `rgba(107,19,245,.5)`, brasa `rgba(255,86,50,.3)`) desfocados em 28px, atrás do instrumento e só dele.

## Do's and Don'ts

### Do:
- **Do** usar azul (abrindo) e laranja (fechando) para a direção do fole em qualquer tela, e vermelho só para erro.
- **Do** escrever a marca sempre junta: BanDoly.
- **Do** pôr o verde vivo só no botão de ir, com texto preto.
- **Do** usar a lavanda na segunda frase dos títulos grandes e nas marcas de progresso.
- **Do** contornar painéis com 1px interno a 12% de branco sobre ameixa-2, cantos de 20px, sem sombra.
- **Do** separar listas com divisórias de 1px em vez de caixas.
- **Do** animar com a curva de saída `cubic-bezier(.16,1,.3,1)` e respeitar o modo sem movimento (classe `sem-mov`).
- **Do** desenhar o teclado com botões de madrepérola sobre placa escura.

### Don't:
- **Don't** usar o dourado nem os gradientes azul-marinho do visual anterior.
- **Don't** usar o verde para outra coisa que não seja ir adiante.
- **Don't** usar azul ou laranja como decoração ou destaque sem relação com o fole.
- **Don't** voltar à barra lateral no computador; a navegação é a barra de vidro no topo.
- **Don't** usar easings elásticos (overshoot) nem pesos 800 e 900 em superfícies do mundo novo.
- **Don't** montar o primeiro viewport como título com print ao lado e fileira de cartões iguais.

### Dívida conhecida (não é regra do sistema)
Todas as abas e as páginas abertas seguem o sistema desde 2026-11-10. O que ainda destoa:
- **CSS em camadas:** as regras antigas continuam no começo do `css/app.css` e os blocos do mundo novo, no fim, as sobrescrevem. Os aliases `--gold`, `--gold2`, `--navy` e `--cream` existem por causa delas. Ao mexer numa peça, reescreva a regra de origem em vez de empilhar mais uma sobrescrita; superfícies novas usam só os nomes do mundo novo.
- **Resolvido em 2026-11-10:** o afinador não usa mais vermelho nem verde (a zona afinada e a nota ficam em lavanda); "certo" e "feito" em todo o app são lavanda (`--green` virou lavanda); Anterior/Próxima usam o ícone de seta; Ritmo ganhou palco próprio (o compasso grande e o andamento em numeral) e Ajustes virou listas de linhas em duas colunas.
