# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Principal: o iniciante sem instrumento.** Uma pessoa curiosa pelo bandoneon, pelo tango ou pela música gaúcha, que ainda não tem o instrumento e quer descobrir se consegue tocar. Chega pelo celular ou pelo computador, muitas vezes por uma busca ou por um link compartilhado, sem saber nada do sistema bisonoro. As telas são pensadas primeiro para ela.

Outros públicos confirmados, que o app também atende:

- **Professores de bandoneon**, que mandam tarefas por link (pelo WhatsApp, por exemplo) e recebem o relatório do aluno.
- **Quem já tem um bandoneon** e toca no instrumento real, com o app ouvindo pelo microfone.
- **Falantes de espanhol e de inglês**, pelas versões `/es/` e `/en/`.

## Product Purpose

O BanDoly é um app gratuito e interativo para aprender bandoneon no navegador. Ele põe na tela o teclado de um bandoneon de verdade, com o som gravado do instrumento, e guia a pessoa do primeiro botão ao primeiro tango.

O nome é uma homenagem a Doly Carlos da Costa, bandoneonista de Caçapava do Sul (RS).

Sucesso, segundo o dono:

- muita gente começando a tocar bandoneon;
- professores adotando o app com os alunos;
- a memória do Doly e do bandoneon gaúcho preservada e divulgada.

## Positioning

Quatro argumentos que o BanDoly sustenta e que devem aparecer sempre:

1. **O teclado real na tela.** O mapa do Rheinische 142 (38 botões na direita, 33 na esquerda), com as duas notas de cada botão (abrindo e fechando o fole) e o som gravado de um bandoneon de 1930. Dá para aprender sem ter o instrumento.
2. **Gratuito e sem cadastro.** Abre no navegador, pode ser instalado e funciona sem internet. Não pede conta nem e-mail.
3. **A ponte com professores.** O professor manda uma tarefa por link, e o aluno devolve o relatório. Não há servidor nem cadastro no caminho.
4. **A raiz gaúcha e o Doly.** A homenagem a um bandoneonista real e vivo, e a ligação com o tango e a música do Rio Grande do Sul.

## Operating Context

- **Onde:** no navegador do celular e do computador, ou instalado na tela inicial (PWA), inclusive sem internet. O app recomenda fones de ouvido.
- **Como se toca:**
  - toque na tela;
  - teclado do computador (fileiras mapeadas aos botões; setas para o fole);
  - controlador MIDI;
  - o bandoneon real, ouvido pelo microfone.
- **Progresso:** fica salvo no próprio navegador. Em Ajustes dá para exportar e importar um backup.
- **Professores:** criam a tarefa na aba "Para professores" e mandam o link. O aluno abre o exercício pronto e envia o relatório de volta.
- **Idiomas:**
  - português (principal);
  - espanhol neutro, com toque rio-platense;
  - inglês britânico.

## Capabilities and Constraints

**O que existe hoje:**

- **Início e caminho de estudo:** um caminho de 18 etapas, personalizado por três perguntas na primeira visita.
- **Aprender:**
  - Meu estudo: rotina diária, sequência de dias e recordes;
  - Academia: 6 níveis com instrutor (Agora e Próximo), modos aprender, praticar e desafio, e o nível 7 com as partituras do próprio aluno (MusicXML ou MIDI);
  - 11 lições com quiz;
  - teoria musical com páginas próprias.
- **Tocar:**
  - teclado livre;
  - Melodias e escalas guiadas, com partitura, em que a nota tocada aparece em verde;
  - acordes;
  - Bandoneon real: afinador e calibragem.
- **Treinar:**
  - desafios: encontre a nota, leitura na pauta e treino de ouvido;
  - RepeTCHÊ, em que o bandoneon toca, a pessoa repete e cada música é dividida em fases de 8 notas;
  - ritmo.
- **Perfil:** conquistas, Para professores e Ajustes.
- **Páginas estáticas:**
  - a história do Doly (`doly-costa/`);
  - perguntas frequentes;
  - lições e teoria abertas para o Google.

**Restrições técnicas:**

- Site estático, sem build: HTML, CSS e JS clássico, publicado no GitHub Pages em bandoly.app.
- PWA com service worker; o app funciona offline.
- As páginas em espanhol e inglês são geradas a partir do português.
- Há testes automáticos no navegador (`tests/`).

**Regras de conteúdo:**

- **Nunca inventar** dedilhado, posição de notas ou melodias. Dedilhado só com fonte real (método, professor), e o app nunca afirma ter conferido o dedo.
- **Partituras:** transcrever só de partitura legível; se não der para ler com segurança, pedir uma melhor.
- **Músicas prontas:** só as de domínio público. Já foram recusadas, por estarem protegidas:
  - Nada (Dames);
  - Adiós Nonino (Piazzolla);
  - El sueño del pibe (Puey);
  - o Hino do Grêmio.

  O usuário pode importá-las por conta própria, para uso pessoal.
- **Fotos, áudio e vídeo do Doly:** só com autorização da família.
- **Professor:** o app não substitui um professor de bandoneon, e diz isso de forma honesta.

**Privacidade:**

- Sem cadastro. Login só se for opcional, e então com RLS, LGPD, servidor em São Paulo e nunca a chave secreta no site.
- Não publicar o e-mail pessoal do dono.

**Custo:** gratuito hoje, com o futuro em aberto. Os textos não prometem "grátis para sempre" nem "sem anúncios".

**Decisões em aberto:**

- se o público inclui menores de idade (relevante para a LGPD, caso venha login);
- o modelo de sustentação no futuro;
- o endereço de contato para as sugestões.

## Brand Commitments

- **Nome:** sempre **BanDoly**, junto, nunca "Ban Doly". Domínio: bandoly.app.
- **Homenagem:** Doly Carlos da Costa, de Caçapava do Sul (RS), que aos 97 anos ainda toca.
  - Tocou nas orquestras de tango das rádios Farroupilha e Gaúcha, em Porto Alegre.
  - Fundou o grupo Os Posteiros (1977).
  - Recebeu a Medalha Simões Lopes Neto (2001) e o Prêmio Vitor Mateus Teixeira (2011).
- **Mascote:** o gauchinho do RepeTCHÊ diz "Muy bueno!", com a voz gravada pelo dono.
  - O nome RepeTCHÊ é igual nos três idiomas.
- **Voz:**
  - português do Brasil, direto e caloroso, com toques gaúchos ("Buenas", "Muy bueno");
  - honesto sobre o que o app faz e não faz.
- **Convenções da interface que o dono fixou:**
  - a direção do fole tem cor própria: azul para abrindo, laranja para fechando;
  - vermelho só para erro.

## Evidence on Hand

**Disponível:**

- **Doly:**
  - foto e capa do disco "Recital de Tangos" (`imagens/doly/`);
  - certificado da Medalha Simões Lopes Neto;
  - dez vídeos no YouTube com Doly, listados em `doly-costa/`;
  - linha do tempo da carreira.
- **Som:** SoundFont *Bandoneon V2.5*, de Jörg Bleymehl, gravado num bandoneon ELA de 1930, de uso livre (`sons/`).
- **Mapa dos botões:** transcrito dos diagramas de Omar Caccia e Matías Gobbo.
- **Mascote:** avatar e vídeos do gauchinho (`imagens/repetche/`).
- **Conteúdo do app:**
  - 11 lições;
  - as páginas de teoria;
  - as perguntas frequentes;
  - melodias em domínio público já transcritas, como La Cumparsita, a introdução de El Choclo, Tico-tico no fubá e a Ode à Alegria.

**Não existe e não deve ser inventado:**

- depoimentos de alunos ou de professores;
- números de usuários;
- cobertura de imprensa;
- parcerias;
- prêmios do app.

## Product Principles

1. **Tocar antes de explicar.** A primeira coisa que a pessoa faz é apertar um botão e ouvir o bandoneon. A teoria vem quando ela já quer saber por quê.
2. **Nenhuma barreira para começar.** Grátis, sem cadastro, no navegador e no celular, até offline. Cada passo a mais antes do primeiro som custa um aluno.
3. **Verdade do instrumento.** Mapa, som, partituras e dedilhado vêm de fontes reais. Na dúvida, o app não afirma.
4. **O app apoia, o professor ensina.** O BanDoly abre caminho até um professor e trabalha junto com ele, sem fingir que o substitui.
5. **Memória viva.** O Doly e a raiz gaúcha são o motivo do projeto, não um enfeite.
