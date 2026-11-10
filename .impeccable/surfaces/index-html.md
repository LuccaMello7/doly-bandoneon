---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Início (index.html, #v-inicio)

## Scope and mode

Tela Início do app. Modo **Persuade** para a primeira visita (a pessoa decide começar); o estado de quem volta é **Operate** (retomar o estudo). Primeira superfície do novo mundo visual, que depois vai para o app inteiro, uma área por vez.

## Audience, job, action

- Quem: o iniciante sem instrumento (PRODUCT.md), à noite, no celular ou no computador, muitas vezes com fones, depois de ver um vídeo de tango.
- O que precisa acreditar: que dá para começar agora, sem bandoneon, de graça e sem cadastro, e que o teclado da tela é o de verdade.
- Ação: começar a primeira etapa do caminho (botão verde). Secundária: tocar o teclado.
- Quem volta: retomar a próxima etapa em um toque.
- Provas reais: o teclado Rheinische 142 tocável, o som gravado de 1930, as mecânicas do app (instrutor, fases do RepeTCHÊ, partitura com a nota em verde), o caminho de 18 etapas, Doly Costa e os vídeos dele. Nada de depoimentos, números ou "grátis para sempre".

## Decisions confirmed by the user (2026-11-10)

- Referência fixada: o estilo Doppler (styles.refero.design, "violet-lit vault at midnight").
- Alcance: o app inteiro, Início primeiro.
- Cores fiéis ao Doppler: lavanda para a voz da marca, verde vivo só no botão principal; o dourado sai. Continuam: azul = abrindo, laranja = fechando, vermelho só para erro.
- Menu no topo, em vidro fosco; a barra lateral sai no computador.
- Maquete primeiro; aplicar no site depois da aprovação.

## Direction contract

THESIS: O Início é o próprio instrumento. O primeiro viewport põe o bandoneon inteiro (as duas mãos e o fole) para tocar, sob uma luz violeta, em vez do esquema de título com print ao lado e fileira de cartões iguais.

OWN-WORLD: Cofre violeta à meia-noite. Fundo ameixa quase preto (#1c1624), painéis um degrau acima (#2d2734) com bordas finíssimas claras, raio de 20px. Uma única sans geométrica (Onest, self-hosted em fontes/), peso 450, apertada nos títulos. Texto osso (#f1f0ec), lavanda (#b997ff) para a voz da marca, verde (#00f575) só no "ir". Aurora radial violeta, rosa e brasa atrás do instrumento. Botões do bandoneon em madrepérola; aceso abrindo em azul, fechando em laranja.

STORY: A pessoa aperta um botão e ouve; vira o fole e vê o mesmo botão mudar de nota. Entende o bisonoro sem ler nada. Depois vê o caminho de 18 etapas, o app em ação e o Doly, e começa a etapa 1.

FIRST VIEWPORT: Barra de vidro no topo (marca, áreas, idiomas, "Começar" verde). Título grande centralizado em duas frases, a segunda em lavanda, uma linha de apoio e o botão verde. Abaixo, ocupando a largura, o palco do instrumento: mão esquerda, fole com a chave Abrindo/Fechando no meio, mão direita, e um visor com a nota tocada.

FORM: Mundo fixado pelo usuário (referência Doppler), composição própria: palco do instrumento. A direção foi fixada pelo usuário, então não houve rolagem de conceitos (new-work: "a user- or brief-pinned direction beats the roll"). seed: none (pinned)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Approval and recorded deviations

- Sem rolagem de conceitos: o dono aprovou a composição da maquete por escrito, nas palavras dele: "Aprovo, mas a foto do Doly ficou muito irregular - essa é uma correção que precisaremos fazer". O revisor de acabamento registrou o seed como pendente; fica decidido pela aprovação do dono, não por rolagem.
- 2026-11-10: o dono aprovou a maquete (`.impeccable/mocks/inicio-doppler/index.html`, capturas em `cap/`) com uma correção: a foto do Doly (scan torto da capa do disco) virou `imagens/doly/estudio-retrato.jpg`, recorte 4:5 da foto de estúdio.
- Fonte: Geist trocada por Onest porque o detector acusou Geist como fonte batida; o dono não fixou fonte.
- Desvios mantidos de propósito, com motivo:
  - a barra do topo é a do app inteiro: no computador ela mostra também "Sugestões" e o indicador da área ativa;
  - no celular a barra mostra marca, idiomas (PT ES EN) e o botão verde; "Sugestões" fica em Ajustes e no rodapé do Início;
  - o rodapé tem a linha "Sobre o BanDoly" (fechada) com o texto de apresentação, para a busca do Google;
  - "Ver todas as perguntas" leva à página própria de perguntas frequentes;
  - o aviso do professor aparece inteiro na primeira visita e depois em uma linha (regra do produto), sem caixa de alerta.
- Revisão de acabamento: primeira passada "fix" (rodapé, nota encenada no visor, primeira tela em telas baixas, sobretítulo, cartão da sequência, barra do topo, persistência); corrigido no mesmo dia.

## Signature interaction

O palco abre com Fá#4 aceso e o visor mostrando as duas notas do botão; trocar o fole mostra a outra nota, e o primeiro toque num botão desfaz a encenação. Tocar o teclado do topo, por toque, mouse ou teclado do computador. Ao trocar o fole, os nomes dos 71 botões trocam em cascata, da esquerda para a direita, e o visor mostra as duas notas do último botão.

## Unresolved

- Som na maquete: sintetizado; no site, o som gravado (sons/bandoneon.js), carregado no primeiro toque.
- 2026-11-10: as outras abas e as páginas abertas passaram para este mundo (commits 39739cd a 772719c e a correção seguinte), com revisão de acabamento do app inteiro: primeira rodada pediu capturas novas, a segunda deu "fix" com seis correções pequenas, aplicadas.
