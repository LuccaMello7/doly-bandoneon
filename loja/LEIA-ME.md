# BanDoly na Play Store

Material para publicar o BanDoly na Google Play como app Android (TWA: o app abre o bandoly.app em tela cheia,
e cada atualização do site chega a quem instalou). Esta pasta não vai para o site (`_config.yml` → `exclude`).

## Arquivos
- `capturas/` — 6 capturas de celular, 1080×1920 (Início, Teclado, Academia, Lições, Ritmo, Professores).
- `destaque-1024x500.png` — imagem de destaque (obrigatória).
- Ícone 512×512: `../icones/icone-512.png`.

## Passo a passo (dono)
1. **Conta de desenvolvedor:** play.google.com/console → criar conta **pessoal** (US$ 25, uma vez) e verificar a identidade.
2. **Gerar o pacote:** pwabuilder.com → digite `https://bandoly.app` → *Package for stores* → **Android** → *Generate*.
   - Package ID: `app.bandoly.twa` · App name: `BanDoly` · Launcher name: `BanDoly`.
   - Deixe o PWABuilder **criar a chave de assinatura** e **guarde o arquivo .zip inteiro** (a chave e as senhas):
     sem ela não dá para publicar atualizações do app.
3. **Play Console → Criar app:** nome `BanDoly - Aprenda Bandoneon`, idioma padrão português (Brasil), App, Gratuito.
4. **Teste → Teste fechado → Criar versão:** envie o arquivo `.aab` do PWABuilder.
5. **Configuração → Integridade do app → Assinatura de apps:** copie a **impressão digital SHA-256 do certificado de
   assinatura do app** e mande para o Claude: ele publica em `bandoly.app/.well-known/assetlinks.json`
   (sem isso, aparece uma barra de endereço no topo do app).
6. **Testadores:** crie uma lista com **pelo menos 12 e-mails** (Gmail) e mantenha o teste fechado por **14 dias seguidos**.
   Depois disso a Play Console libera o pedido de acesso à produção.
7. Preencha a ficha da loja e os formulários abaixo.

## Ficha da loja

### pt-BR

**Nome (até 30):** BanDoly - Aprenda Bandoneon

**Descrição curta (até 80):** Aprenda bandoneon com teclado de som real, lições, exercícios e ritmos de tango.

**Descrição completa:**

```
O BanDoly é um app para aprender bandoneon, o instrumento do tango, um botão de cada vez.

TECLADO DE VERDADE
Os 71 botões do bandoneon Rheinische 142, com o som gravado de um instrumento de 1930. Troque o fole e veja como cada botão muda de nota abrindo e fechando.

APRENDA NO SEU RITMO
• Lições curtas sobre o instrumento, o fole, a leitura e os ritmos do tango, com perguntas no fim.
• Teoria musical: pauta, claves, figuras, compasso, escalas e acordes.
• Academia: exercícios em níveis, do primeiro botão até músicas com as duas mãos. O instrutor mostra a nota, o botão e a direção do fole, e no fim diz o que você acertou e o que revisar.

PRATIQUE
• Melodias e escalas guiadas, com a partitura acompanhando.
• Ritmos do tango com metrônomo e o modo Toque junto.
• Desafios, treino de ouvido e o RepeTCHÊ: o bandoneon toca e você repete.
• Bandoneon real: ligue o microfone e o app mostra a nota que você tocou no seu instrumento, com afinador.

PARA PROFESSORES
Mande uma tarefa ao aluno por um link (WhatsApp, e-mail). Ele abre o exercício pronto, com a sua mensagem, e manda o relatório de volta.

SEU PROGRESSO
Funciona sem cadastro: o progresso fica no seu aparelho. Se quiser, crie uma conta (para maiores de 18 anos) com o Google ou com um link no e-mail e continue em qualquer aparelho.

Também funciona com teclado MIDI e com o teclado do computador. Em português, espanhol e inglês.

O BanDoly é um apoio ao estudo e não substitui as aulas de um professor de bandoneon. Hoje ele é gratuito.

Criado em homenagem a Doly Costa, bandoneonista de Caçapava do Sul (RS).
```

### es-419

**Nome (até 30):** BanDoly - Aprende bandoneón

**Descrição curta (até 80):** Aprende bandoneón con teclado de sonido real, lecciones, ejercicios y ritmos.

**Descrição completa:**

```
BanDoly es una app para aprender bandoneón, el instrumento del tango, un botón a la vez.

UN TECLADO DE VERDAD
Los 71 botones del bandoneón Rheinische 142, con el sonido grabado de un instrumento de 1930. Cambia el fuelle y mira cómo cada botón cambia de nota abriendo y cerrando.

APRENDE A TU RITMO
• Lecciones cortas sobre el instrumento, el fuelle, la lectura y los ritmos del tango, con preguntas al final.
• Teoría musical: pentagrama, claves, figuras, compás, escalas y acordes.
• Academia: ejercicios por niveles, del primer botón hasta músicas con las dos manos. El instructor muestra la nota, el botón y la dirección del fuelle, y al final te dice qué acertaste y qué repasar.

PRACTICA
• Melodías y escalas guiadas, con la partitura acompañando.
• Ritmos del tango con metrónomo y el modo Toca junto.
• Desafíos, entrenamiento del oído y RepeTCHÊ: el bandoneón toca y tú repites.
• Bandoneón real: activa el micrófono y la app muestra la nota que tocaste en tu instrumento, con afinador.

PARA PROFESORES
Envía una tarea a tu alumno con un enlace (WhatsApp, correo). Abre el ejercicio listo, con tu mensaje, y te devuelve el informe.

TU PROGRESO
Funciona sin registro: el progreso queda en tu dispositivo. Si quieres, crea una cuenta (para mayores de 18 años) con Google o con un enlace en tu correo y sigue en cualquier dispositivo.

También funciona con teclado MIDI y con el teclado de la computadora. En portugués, español e inglés.

BanDoly es un apoyo al estudio y no reemplaza las clases de un profesor de bandoneón. Hoy es gratuito.

Creado en homenaje a Doly Costa, bandoneonista de Caçapava do Sul (Brasil).
```

### en-GB

**Nome (até 30):** BanDoly - Learn the Bandoneon

**Descrição curta (até 80):** Learn the bandoneon: real-sound keyboard, lessons, exercises and tango rhythms.

**Descrição completa:**

```
BanDoly is an app for learning the bandoneon, the instrument of tango, one button at a time.

A REAL KEYBOARD
All 71 buttons of the Rheinische 142 bandoneon, with the recorded sound of an instrument from 1930. Switch the bellows and see how each button changes note when opening and closing.

LEARN AT YOUR OWN PACE
• Short lessons on the instrument, the bellows, reading music and tango rhythms, with questions at the end.
• Music theory: the stave, clefs, note values, time signatures, scales and chords.
• Academy: exercises in levels, from the first button to two-handed pieces. The instructor shows the note, the button and the bellows direction, and at the end tells you what you got right and what to revise.

PRACTISE
• Guided melodies and scales, with the score following along.
• Tango rhythms with a metronome and Play-along mode.
• Challenges, ear training and RepeTCHÊ: the bandoneon plays and you repeat.
• Real bandoneon: switch on the microphone and the app shows the note you played on your instrument, with a tuner.

FOR TEACHERS
Send your student an assignment by link (WhatsApp, email). They open the exercise ready to go, with your message, and send the report back.

YOUR PROGRESS
Works without signing up: your progress stays on your device. If you like, create an account (18 and over) with Google or an email link and carry on from any device.

Also works with a MIDI keyboard and a computer keyboard. In Portuguese, Spanish and English.

BanDoly supports your study and does not replace lessons with a bandoneon teacher. It is currently free.

Created in honour of Doly Costa, a bandoneon player from Caçapava do Sul, Brazil.
```

- **Categoria:** Educação. **Tags:** música, educação.
- **E-mail de contato:** contato@bandoly.app · **Site:** https://bandoly.app
- **Política de privacidade:** https://bandoly.app/privacidade/

## Formulários (respostas sugeridas — confira cada uma ao preencher)

**Acesso ao app:** todas as funções estão disponíveis sem login. A conta é opcional e só guarda o progresso na nuvem.

**Anúncios:** não, o app não tem anúncios.

**Classificação do conteúdo:** categoria *Referência, educação ou notícias* (ou Educação); responda "não" para violência,
sexo, linguagem imprópria, drogas, apostas e compras. Interação entre usuários: não (a tarefa do professor é um link
que a pessoa manda por fora do app). Resultado esperado: Livre.

**Público-alvo:** 13 anos ou mais. Não marque faixas abaixo de 13: elas colocam o app nas regras de Famílias.
O app não é feito especialmente para crianças.

**Segurança dos dados:**
- O app coleta ou compartilha dados? **Sim** (só de quem cria a conta, e a contagem de uso agregada).
- Criptografia em trânsito: **sim** (HTTPS). Exclusão: **sim** — no app (Conta → Excluir conta) e pelo
  e-mail contato@bandoly.app (link para a Play: https://bandoly.app/privacidade/).
- **Compartilhamento:** não há (Supabase, o serviço de e-mail e o GoatCounter são prestadores de serviço, não "compartilhamento").
- Tipos de dados **coletados**:
  - *Informações pessoais → Endereço de e-mail*: opcional; finalidade **Gerenciamento da conta** e **Funcionalidade do app**.
  - *Informações pessoais → Nome*: opcional (só com Google); finalidade **Funcionalidade do app** (saudação).
  - *Atividade no app → Outras ações do usuário / Outro conteúdo gerado pelo usuário* (progresso, melodias criadas,
    ajustes guardados na nuvem): opcional; **Funcionalidade do app**.
  - *Atividade no app → Interações com o app* (contagem agregada do GoatCounter, sem identificar a pessoa): **Análise**.
- **Microfone:** o som é analisado no próprio aparelho e não é enviado; não entra como dado coletado.

**Exclusão de conta (obrigatório para apps com conta):** URL https://bandoly.app/privacidade/ (seção "Seus direitos").
