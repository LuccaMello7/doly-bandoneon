"""Gera as páginas de referência do teclado: o mapa de notas do bandoneon e uma página por acorde.

Páginas: notas-do-bandoneon/index.html   o mapa dos 71 botões, abrindo e fechando, e onde fica cada nota
         acordes/index.html              índice dos acordes
         acordes/<acorde>/index.html     maiores, menores e com sétima, nas 12 tônicas (36 páginas)
         escalas/index.html              índice das escalas
         escalas/<escala>/index.html     maiores, menores naturais e menores harmônicas, nas 12 tônicas (36 páginas)
         es/... e en/...                 o mesmo em espanhol e inglês

Uso:  python ferramentas/gerar_referencia.py              (gera as páginas e atualiza o sitemap.xml)
      python ferramentas/gerar_referencia.py --verificar  (só confere se estão atualizadas)

Por quê: o mapa do teclado e os acordes moram dentro do app (JavaScript); com páginas próprias, aparecem no
Google para quem procura "notas do bandoneon", "acorde de Dó maior no bandoneon", "bandoneón teclado notas"...

De onde vem: o mapa de botões do app (DEFAULT_LAYOUT em js/base.js) e as posições dos acordes calculadas
pela MESMA função do app (chordVoicings em js/acordes.js, rodada no Node): a página mostra o mesmo que o app
mostra no painel Relembre do treino de acordes. As notas dos acordes são grafadas pela regra das terças
(Fá♯ maior = Fá♯ · Lá♯ · Dó♯), não pelo nome da tecla.
"""
import hashlib, html, json, re, subprocess, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gerar_licoes as gl

RAIZ, LANGS, SITE = gl.RAIZ, gl.LANGS, gl.SITE
gl.CABECALHO = '<!-- Gerado por ferramentas/gerar_referencia.py a partir de js/base.js, js/acordes.js, js/escalas.js e js/melodias.js. Não edite à mão. -->\n'
NOTAS_PASTA, ACORDES_PASTA = 'notas-do-bandoneon', 'acordes'
TIPOS = ['maior', 'menor', 'dom7']
e = html.escape

# ---------- dados do app (rodando a função dos acordes do próprio app) ----------
NODE = r"""
const fs = require('fs'), vm = require('vm');
const base = fs.readFileSync('js/base.js', 'utf8'), ac = fs.readFileSync('js/acordes.js', 'utf8');
const esc = fs.readFileSync('js/escalas.js', 'utf8'), mel = fs.readFileSync('js/melodias.js', 'utf8');
const LAYOUT = JSON.parse(base.match(/const DEFAULT_LAYOUT = (\{.*?\});/s)[1]);
const corte = (txt, ini, fim) => { const i = txt.indexOf(ini); return txt.slice(i, txt.indexOf(fim, i) + fim.length); };
const codigo = corte(ac, 'const CHORD_TYPES = {', '\n};') + '\n' + ac.match(/const MAX_SPREAD = [\d.]+;/)[0] + '\n'
  + corte(ac, 'const ROOT_PT', '\n}\n') + '\n' + corte(ac, 'function chordVoicings(', '\n}\n') + '\n'
  + base.match(/const DIA_SEMI = \[[^\]]*\];/)[0] + '\n' + esc.slice(esc.indexOf('const SCALE_TYPES'), esc.indexOf('function fillScaleTonics'))
  + mel.slice(mel.indexOf('const EPS = 1e-6;'), mel.indexOf('const mkOpts')) + `
  const saida = {};
  for(let pc = 0; pc < 12; pc++) for(const tipo of ['maior','menor','dom7']) for(const mao of ['left','right']) for(const dir of ['open','close'])
    saida[[pc, tipo, mao, dir].join('|')] = chordVoicings(mao, dir, pc, tipo).map(v=>({ids:v.btns.map(b=>b.id), raiz:v.rootBass, sem5:v.omit5}));
  const nomes = {}; for(let pc = 0; pc < 12; pc++) for(const tipo of ['maior','menor','dom7']) nomes[pc + '|' + tipo] = notasDoAcorde(pc, tipo).map(n=>n.nome);

  // escalas: as mesmas funções do app (js/escalas.js e o fole de js/melodias.js), subindo uma oitava, uma vez
  // preferindo abrir e outra preferindo fechar (force, como o /a e /f das melodias: só nas notas que existem nessa
  // direção). Andamento 120: a oitava cabe em menos de 6 s, então o fole só troca onde a nota não existe.
  const escalas = {};
  for(let pc = 0; pc < 12; pc++) for(const tipo of ['maior','menor','harmonica']){
    const T = SCALE_TYPES[tipo], tt = TONIC_SPELL[T.spell][pc];
    const item = {tonica:['CDEFGAB'.indexOf(tt[0]), tt[1]==='#' ? 1 : tt[1]==='b' ? -1 : 0], passos:T.steps, maos:{}};
    for(const mao of ['left','right']){
      const st = validStarts(tipo, pc, mao, 1);
      if(!st.length){ item.maos[mao] = null; continue; }
      item.maos[mao] = {};
      for(const dir of ['open','close']){
        const notes = scaleNotes(tipo, pc, st[0], 1, 'up');
        notes.forEach((n, i)=>{ n.beats = i===notes.length-1 ? 2 : 1; if(state.layout[mao].some(b=>b[dir]===n.midi)) n.force = dir; });
        const m = {notes, hand:mao, bpm:120}; fingerMelody(m);
        item.maos[mao][dir] = m.notes.map(n=>({midi:n.midi, grau:n.degree, letra:n.spell.letter, acid:n.spell.acc, dir:n.dir, btn:n.btn ? n.btn.id : null, erro:!!n.error}));
      }
    }
    escalas[pc + '|' + tipo] = item;
  }
  resultado = {escalas, nomes, layout: state.layout, vozes: saida, iv: Object.fromEntries(Object.entries(CHORD_TYPES).map(([k, T])=>[k, T.iv]))};`;
const ctx = {state:{layout:LAYOUT}, resultado:null}; vm.runInNewContext(codigo, ctx);
process.stdout.write(JSON.stringify(ctx.resultado));
"""


def dados_do_app():
    r = subprocess.run(['node', '-e', NODE], cwd=RAIZ, capture_output=True, text=True, encoding='utf-8')
    if r.returncode: sys.exit('Não consegui rodar js/acordes.js no Node: ' + r.stderr.strip()[:400])
    return json.loads(r.stdout)


# ---------- nomes das notas ----------
LETRAS = {'pt': ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'], 'es': ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'], 'en': ['C', 'D', 'E', 'F', 'G', 'A', 'B']}
NATURAL = [0, 2, 4, 5, 7, 9, 11]
ACID = {-2: '𝄫', -1: '♭', 0: '', 1: '♯', 2: '𝄪'}
# tônicas como no app (Dó♯, Mi♭, Fá♯, Lá♭, Si♭) e o outro nome de cada tecla preta
RAIZES = {0: (0, 0), 1: (0, 1), 2: (1, 0), 3: (2, -1), 4: (2, 0), 5: (3, 0), 6: (3, 1), 7: (4, 0), 8: (5, -1), 9: (5, 0), 10: (6, -1), 11: (6, 0)}
OUTRO_NOME = {1: (1, -1), 3: (1, 1), 6: (4, -1), 8: (4, 1), 10: (5, 1)}
SUSTENIDOS = {'pt': ["Dó", "Dó♯", "Ré", "Ré♯", "Mi", "Fá", "Fá♯", "Sol", "Sol♯", "Lá", "Lá♯", "Si"],
              'es': ["Do", "Do♯", "Re", "Re♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si"],
              'en': ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]}  # como no teclado do app
GRAUS = {'maior': [(0, 0), (4, 2), (7, 4)], 'menor': [(0, 0), (3, 2), (7, 4)], 'dom7': [(0, 0), (4, 2), (7, 4), (10, 6)]}
FORMULA = {'maior': '1 · 3 · 5', 'menor': '1 · ♭3 · 5', 'dom7': '1 · 3 · 5 · ♭7'}
pc12 = lambda n: n % 12


def nome_letra(letra, acid, cod): return LETRAS[cod][letra] + ACID[acid]


def nome_tecla(midi, cod): return SUSTENIDOS[cod][pc12(midi)] + str(midi // 12 - 1)


def grafia(pc, tipo, cod):
    """As notas do acorde grafadas por terças: {classe de altura: (nome, acidente)}."""
    letra0, _ = RAIZES[pc]; out = {}
    for semi, passos in GRAUS[tipo]:
        letra, alvo = (letra0 + passos) % 7, (pc + semi) % 12
        acid = (alvo - NATURAL[letra] + 6) % 12 - 6
        out[alvo] = (nome_letra(letra, acid, cod), acid)
    return out


def nome_com_oitava(midi, nome, acid): return nome + str((midi - acid) // 12 - 1)  # Dó♭4 é o Si3 da tecla


RAIZ_SLUG = {'pt': ['do', 'do-sustenido', 're', 'mi-bemol', 'mi', 'fa', 'fa-sustenido', 'sol', 'la-bemol', 'la', 'si-bemol', 'si'],
             'es': ['do', 'do-sostenido', 're', 'mi-bemol', 'mi', 'fa', 'fa-sostenido', 'sol', 'la-bemol', 'la', 'si-bemol', 'si'],
             'en': ['c', 'c-sharp', 'd', 'e-flat', 'e', 'f', 'f-sharp', 'g', 'a-flat', 'a', 'b-flat', 'b']}
TIPO_SLUG = {'pt': {'maior': '-maior', 'menor': '-menor', 'dom7': '7'}, 'es': {'maior': '-mayor', 'menor': '-menor', 'dom7': '7'},
             'en': {'maior': '-major', 'menor': '-minor', 'dom7': '7'}}
TIPO_NOME = {'pt': {'maior': '{r} maior', 'menor': '{r} menor', 'dom7': '{r}7'}, 'es': {'maior': '{r} mayor', 'menor': '{r} menor', 'dom7': '{r}7'},
             'en': {'maior': '{r} major', 'menor': '{r} minor', 'dom7': '{r}7'}}


def raiz_nome(pc, cod, outro=False):
    letra, acid = (OUTRO_NOME if outro else RAIZES)[pc]
    return nome_letra(letra, acid, cod)


def acorde_nome(pc, tipo, cod, outro=False): return TIPO_NOME[cod][tipo].format(r=raiz_nome(pc, cod, outro))
def acorde_slug(pc, tipo, cod): return RAIZ_SLUG[cod][pc] + TIPO_SLUG[cod][tipo]


# ---------- textos ----------
TEXTOS = {
'pt': dict(
    notas_h1='Notas do bandoneon: o mapa dos 71 botões', notas_titulo='Notas do bandoneon abrindo e fechando', notas_migalha='Notas do bandoneon',
    notas_desc='O mapa de notas do bandoneon Rheinische de 142 vozes: os 71 botões das duas mãos, com a nota de cada um abrindo e fechando o fole.',
    notas_intro='O bandoneon é bisonoro: cada botão toca uma nota ao abrir o fole e outra ao fechar. Por isso o mapa tem duas notas por botão.',
    notas_ler='Como ler: cada círculo é um botão, na posição em que fica no instrumento (como no teclado do app). Em cima, em azul, a nota abrindo o fole; embaixo, em laranja, a nota fechando.',
    notas_origem='Mapa do sistema Rheinische de 142 vozes, o mais comum no tango, transcrito dos diagramas de Omar Caccia e Matías Gobbo. Alguns instrumentos têm pequenas diferenças: no app, o mapa pode ser editado.',
    mao_esq='Mão esquerda (graves)', mao_dir='Mão direita (agudos)', legenda_ab='abrindo', legenda_fe='fechando',
    tabela_tit='Onde fica cada nota', tabela_intro='A mesma nota pode estar em mais de um botão e nas duas direções do fole. A tabela mostra, para cada nota, em que mão e em que direção ela aparece.',
    col_nota='Nota', col_esq='Mão esquerda', col_dir='Mão direita', ab='abrindo', fe='fechando',
    notas_cta='No app, o teclado toca com som real de bandoneon, e o Afinador acende o botão da nota que você tocar no seu instrumento.',
    abrir_teclado='Abrir o teclado', abrir_afinador='Abrir o afinador', ver_acordes='Ver os acordes no bandoneon', ver_notas='Ver o mapa de notas do bandoneon',
    acordes_h1='Acordes no bandoneon', acordes_titulo='Acordes no bandoneon: maiores, menores e com sétima',
    acordes_desc='Onde ficam os acordes no bandoneon: maiores, menores e com sétima em todas as tonalidades, com o mapa dos botões nas duas mãos, abrindo e fechando.',
    acordes_intro='No bandoneon cada acorde precisa ser aprendido duas vezes, abrindo e fechando, porque o mesmo botão dá notas diferentes em cada direção. Escolha um acorde para ver os botões nas duas mãos.',
    tipos={'maior': 'Maiores', 'menor': 'Menores', 'dom7': 'Com sétima'},
    acorde_h1='Acorde de {n} no bandoneon', acorde_titulo='Acorde de {n} no bandoneon',
    acorde_desc='Onde fica o acorde de {n} ({notas}) no bandoneon: os botões das duas mãos, abrindo e fechando o fole, com o mapa do teclado.',
    notas_lbl='Notas', explic={'maior': 'O acorde maior junta a fundamental, a terça maior e a quinta.',
                               'menor': 'O acorde menor junta a fundamental, a terça menor e a quinta.',
                               'dom7': 'O acorde com sétima (dominante) junta a fundamental, a terça maior, a quinta e a sétima menor. Quando as quatro notas não cabem na mão, a forma sem a quinta também vale.'},
    outro_nome='Também é escrito {a}.',
    acorde_ler='Cada mapa mostra um lado do bandoneon, com os botões na posição em que ficam no instrumento. Os botões acesos formam o acorde na direção do fole indicada: azul abrindo, laranja fechando.',
    fig={('left', 'open'): 'Mão esquerda · abrindo', ('left', 'close'): 'Mão esquerda · fechando', ('right', 'open'): 'Mão direita · abrindo', ('right', 'close'): 'Mão direita · fechando'},
    botoes='Botões: {l}', sem_forma='Não há uma forma confortável deste acorde nesta direção: use a outra direção do fole ou a outra mão.', sem_quinta='sem a quinta',
    posicao='Mostramos a forma mais compacta, com a fundamental no baixo quando possível. No app há outras posições e o treino de acordes.',
    outros='Outros acordes', mesma_tonica='Com a mesma tônica', outros_tons='{tipo} em outras tonalidades', todos_acordes='Todos os acordes',
    acorde_cta='Treine este e os outros acordes no app: ele pede um acorde, você marca os botões e ouve o resultado.', treinar='Treinar acordes no app',
    mapa_aria='Mapa da {m}: {d}'),
'es': dict(
    notas_h1='Notas del bandoneón: el mapa de los 71 botones', notas_titulo='Notas del bandoneón abriendo y cerrando', notas_migalha='Notas del bandoneón',
    notas_desc='El mapa de notas del bandoneón Rheinische de 142 voces: los 71 botones de las dos manos, con la nota de cada uno abriendo y cerrando el fuelle.',
    notas_intro='El bandoneón es bisonoro: cada botón toca una nota al abrir el fuelle y otra al cerrarlo. Por eso el mapa tiene dos notas por botón.',
    notas_ler='Cómo leerlo: cada círculo es un botón, en la posición que tiene en el instrumento (como en el teclado de la app). Arriba, en azul, la nota abriendo el fuelle; abajo, en naranja, la nota cerrando.',
    notas_origem='Mapa del sistema Rheinische de 142 voces, el más común en el tango, transcripto de los diagramas de Omar Caccia y Matías Gobbo. Algunos instrumentos tienen pequeñas diferencias: en la app podés editar el mapa.',
    mao_esq='Mano izquierda (graves)', mao_dir='Mano derecha (agudos)', legenda_ab='abriendo', legenda_fe='cerrando',
    tabela_tit='Dónde está cada nota', tabela_intro='La misma nota puede estar en más de un botón y en las dos direcciones del fuelle. La tabla muestra, para cada nota, en qué mano y en qué dirección aparece.',
    col_nota='Nota', col_esq='Mano izquierda', col_dir='Mano derecha', ab='abriendo', fe='cerrando',
    notas_cta='En la app, el teclado suena con sonido real de bandoneón, y el Afinador enciende el botón de la nota que toques en tu instrumento.',
    abrir_teclado='Abrir el teclado', abrir_afinador='Abrir el afinador', ver_acordes='Ver los acordes en el bandoneón', ver_notas='Ver el mapa de notas del bandoneón',
    acordes_h1='Acordes en el bandoneón', acordes_titulo='Acordes en el bandoneón: mayores, menores y con séptima',
    acordes_desc='Los acordes en el bandoneón: mayores, menores y con séptima en todos los tonos, con el mapa de botones de las dos manos, abriendo y cerrando.',
    acordes_intro='En el bandoneón cada acorde se aprende dos veces, abriendo y cerrando, porque el mismo botón da notas distintas en cada dirección. Elegí un acorde para ver los botones en las dos manos.',
    tipos={'maior': 'Mayores', 'menor': 'Menores', 'dom7': 'Con séptima'},
    acorde_h1='Acorde de {n} en el bandoneón', acorde_titulo='Acorde de {n} en el bandoneón',
    acorde_desc='Dónde está el acorde de {n} ({notas}) en el bandoneón: los botones de las dos manos, abriendo y cerrando el fuelle, con el mapa del teclado.',
    notas_lbl='Notas', explic={'maior': 'El acorde mayor junta la fundamental, la tercera mayor y la quinta.',
                               'menor': 'El acorde menor junta la fundamental, la tercera menor y la quinta.',
                               'dom7': 'El acorde con séptima (dominante) junta la fundamental, la tercera mayor, la quinta y la séptima menor. Cuando las cuatro notas no entran en la mano, también vale la forma sin la quinta.'},
    outro_nome='También se escribe {a}.',
    acorde_ler='Cada mapa muestra un lado del bandoneón, con los botones en la posición que tienen en el instrumento. Los botones encendidos forman el acorde en la dirección del fuelle indicada: azul abriendo, naranja cerrando.',
    fig={('left', 'open'): 'Mano izquierda · abriendo', ('left', 'close'): 'Mano izquierda · cerrando', ('right', 'open'): 'Mano derecha · abriendo', ('right', 'close'): 'Mano derecha · cerrando'},
    botoes='Botones: {l}', sem_forma='No hay una forma cómoda de este acorde en esta dirección: usá la otra dirección del fuelle o la otra mano.', sem_quinta='sin la quinta',
    posicao='Mostramos la forma más compacta, con la fundamental en el bajo cuando se puede. En la app hay otras posiciones y la práctica de acordes.',
    outros='Otros acordes', mesma_tonica='Con la misma tónica', outros_tons='{tipo} en otros tonos', todos_acordes='Todos los acordes',
    acorde_cta='Practicá este y los otros acordes en la app: te pide un acorde, marcás los botones y escuchás el resultado.', treinar='Practicar acordes en la app',
    mapa_aria='Mapa de la {m}: {d}'),
'en': dict(
    notas_h1='Bandoneon notes: a map of all 71 buttons', notas_titulo='Bandoneon notes, opening and closing', notas_migalha='Bandoneon notes',
    notas_desc='The note map of the 142-voice Rheinische bandoneon: all 71 buttons on both hands, with the note each one plays when opening and closing the bellows.',
    notas_intro='The bandoneon is bisonoric: each button plays one note when the bellows open and another when they close. That is why the map shows two notes per button.',
    notas_ler='How to read it: each circle is a button, in the position it has on the instrument (as on the app keyboard). On top, in blue, the note when opening the bellows; below, in orange, the note when closing.',
    notas_origem='Map of the 142-voice Rheinische system, the most common in tango, transcribed from the diagrams by Omar Caccia and Matías Gobbo. Some instruments differ slightly: in the app, you can edit the map.',
    mao_esq='Left hand (bass)', mao_dir='Right hand (treble)', legenda_ab='opening', legenda_fe='closing',
    tabela_tit='Where each note is', tabela_intro='The same note can be on more than one button and in both bellows directions. The table shows, for each note, which hand and which direction it is in.',
    col_nota='Note', col_esq='Left hand', col_dir='Right hand', ab='opening', fe='closing',
    notas_cta='In the app, the keyboard plays with a real bandoneon sound, and the Tuner lights up the button for the note you play on your instrument.',
    abrir_teclado='Open the keyboard', abrir_afinador='Open the tuner', ver_acordes='See the chords on the bandoneon', ver_notas='See the bandoneon note map',
    acordes_h1='Chords on the bandoneon', acordes_titulo='Chords on the bandoneon: major, minor and seventh',
    acordes_desc='Where the chords are on the bandoneon: major, minor and seventh chords in every key, with a button map for both hands, opening and closing the bellows.',
    acordes_intro='On the bandoneon each chord has to be learnt twice, opening and closing, because the same button plays different notes in each direction. Pick a chord to see the buttons on both hands.',
    tipos={'maior': 'Major', 'menor': 'Minor', 'dom7': 'Seventh'},
    acorde_h1='{n} chord on the bandoneon', acorde_titulo='{n} chord on the bandoneon',
    acorde_desc='Where the {n} chord ({notas}) is on the bandoneon: the buttons for both hands, opening and closing the bellows, with a keyboard map.',
    notas_lbl='Notes', explic={'maior': 'A major chord combines the root, the major third and the fifth.',
                               'menor': 'A minor chord combines the root, the minor third and the fifth.',
                               'dom7': 'A dominant seventh chord combines the root, the major third, the fifth and the minor seventh. When all four notes do not fit the hand, the shape without the fifth also works.'},
    outro_nome='Also written {a}.',
    acorde_ler='Each map shows one side of the bandoneon, with the buttons where they sit on the instrument. The lit buttons form the chord in the bellows direction shown: blue for opening, orange for closing.',
    fig={('left', 'open'): 'Left hand · opening', ('left', 'close'): 'Left hand · closing', ('right', 'open'): 'Right hand · opening', ('right', 'close'): 'Right hand · closing'},
    botoes='Buttons: {l}', sem_forma='There is no comfortable shape for this chord in this direction: use the other bellows direction or the other hand.', sem_quinta='without the fifth',
    posicao='We show the most compact shape, with the root in the bass where possible. The app has other positions and a chord practice mode.',
    outros='Other chords', mesma_tonica='Same root', outros_tons='{tipo} chords in other keys', todos_acordes='All chords',
    acorde_cta='Practise this and the other chords in the app: it asks for a chord, you mark the buttons and hear the result.', treinar='Practise chords in the app',
    mapa_aria='Map of the {m}: {d}'),
}
TEXTOS_ESC = {'pt': {'escalas_h1': 'Escalas no bandoneon', 'escalas_titulo': 'Escalas no bandoneon: maiores e menores', 'escalas_desc': 'Escalas maiores, menores naturais e menores harmônicas em todos os tons, com o caminho dos botões e do fole nas duas mãos do bandoneon.', 'escalas_intro': 'Escolha uma escala para ver o caminho dos botões nas duas mãos, nota por nota, com o fole de cada uma. No app, cada escala toca no tempo e tem uma explicação passo a passo.', 'tipos_esc': {'maior': 'Maiores', 'menor': 'Menores naturais', 'harmonica': 'Menores harmônicas'}, 'escala_h1': 'Escala de {n} no bandoneon', 'escala_titulo': 'Escala de {n} no bandoneon', 'escala_desc': 'A escala de {n} ({notas}) no bandoneon: o caminho dos botões nas duas mãos, nota por nota, com o fole abrindo e fechando.', 'explic_esc': {'maior': 'A escala maior segue a fórmula tom, tom, semitom, tom, tom, tom, semitom. É a base da maioria das melodias e dos acordes maiores.', 'menor': 'A escala menor natural segue a fórmula tom, semitom, tom, tom, semitom, tom, tom. Tem as mesmas notas da sua relativa maior.', 'harmonica': 'A menor harmônica é a menor natural com o 7º grau elevado (a sensível). Entre o 6º e o 7º graus fica um intervalo de tom e meio, um som muito presente no tango.'}, 'relativa': {'maior': 'A relativa menor é {l}.', 'menor': 'A relativa maior é {l}.', 'harmonica': 'A versão natural (sem o 7º grau elevado) é {l}.'}, 'formula_leg': 'T = tom, S = semitom, 1½ = tom e meio', 'escala_ler': 'Cada mapa mostra a escala subindo uma oitava numa direção do fole: os números dão a ordem das notas e a cor diz o fole (azul abrindo, laranja fechando). Quando uma nota não existe na direção do mapa, o fole troca só nela. Cada nota usa o botão mais perto do anterior, como o app sugere. Não é um dedilhado: os dedos, combine com seu professor ou siga o seu método.', 'fig_mao': {'left': 'Mão esquerda', 'right': 'Mão direita'}, 'a_partir': 'a partir de {n}', 'fole_resumo': ('Fole: tudo {d}, sem trocar.', 'Fole: começa {d} e troca uma vez.', 'Fole: começa {d} e troca {n} vezes.'), 'sem_mao': 'Esta escala não cabe numa oitava inteira nesta mão.', 'outras_escalas': 'Outras escalas', 'outros_tons_esc': '{tipo} em outros tons', 'todas_escalas': 'Todas as escalas', 'ver_escalas': 'Ver as escalas no bandoneon', 'acorde_link': 'Acorde de {n}', 'escala_link': 'Escala de {n}', 'escala_cta': 'Toque esta escala no app: ela soa no tempo, o teclado mostra o próximo botão e cada passo vem explicado.', 'abrir_escalas': 'Abrir as escalas no app'}, 'es': {'escalas_h1': 'Escalas en el bandoneón', 'escalas_titulo': 'Escalas en el bandoneón: mayores y menores', 'escalas_desc': 'Escalas mayores, menores naturales y menores armónicas en todos los tonos, con el camino de botones y fuelle en las dos manos del bandoneón.', 'escalas_intro': 'Elegí una escala para ver el camino de los botones en las dos manos, nota por nota, con el fuelle de cada una. En la app, cada escala suena a tiempo y tiene una explicación paso a paso.', 'tipos_esc': {'maior': 'Mayores', 'menor': 'Menores naturales', 'harmonica': 'Menores armónicas'}, 'escala_h1': 'Escala de {n} en el bandoneón', 'escala_titulo': 'Escala de {n} en el bandoneón', 'escala_desc': 'La escala de {n} ({notas}) en el bandoneón: el camino de los botones en las dos manos, nota por nota, con el fuelle abriendo y cerrando.', 'explic_esc': {'maior': 'La escala mayor sigue la fórmula tono, tono, semitono, tono, tono, tono, semitono. Es la base de la mayoría de las melodías y de los acordes mayores.', 'menor': 'La escala menor natural sigue la fórmula tono, semitono, tono, tono, semitono, tono, tono. Tiene las mismas notas que su relativa mayor.', 'harmonica': 'La menor armónica es la menor natural con el 7.º grado elevado (la sensible). Entre el 6.º y el 7.º grado queda un intervalo de tono y medio, un sonido muy presente en el tango.'}, 'relativa': {'maior': 'La relativa menor es {l}.', 'menor': 'La relativa mayor es {l}.', 'harmonica': 'La versión natural (sin el 7.º grado elevado) es {l}.'}, 'formula_leg': 'T = tono, S = semitono, 1½ = tono y medio', 'escala_ler': 'Cada mapa muestra la escala subiendo una octava en una dirección del fuelle: los números dan el orden de las notas y el color indica el fuelle (azul abriendo, naranja cerrando). Cuando una nota no existe en la dirección del mapa, el fuelle cambia solo en ella. Cada nota usa el botón más cercano al anterior, como sugiere la app. No es una digitación: los dedos, acordalos con tu profesor o seguí tu método.', 'fig_mao': {'left': 'Mano izquierda', 'right': 'Mano derecha'}, 'a_partir': 'desde {n}', 'fole_resumo': ('Fuelle: todo {d}, sin cambiar.', 'Fuelle: empieza {d} y cambia una vez.', 'Fuelle: empieza {d} y cambia {n} veces.'), 'sem_mao': 'Esta escala no entra en una octava entera en esta mano.', 'outras_escalas': 'Otras escalas', 'outros_tons_esc': '{tipo} en otros tonos', 'todas_escalas': 'Todas las escalas', 'ver_escalas': 'Ver las escalas en el bandoneón', 'acorde_link': 'Acorde de {n}', 'escala_link': 'Escala de {n}', 'escala_cta': 'Tocá esta escala en la app: suena a tiempo, el teclado muestra el próximo botón y cada paso viene explicado.', 'abrir_escalas': 'Abrir las escalas en la app'}, 'en': {'escalas_h1': 'Scales on the bandoneon', 'escalas_titulo': 'Scales on the bandoneon: major and minor', 'escalas_desc': 'Major, natural minor and harmonic minor scales in every key, with the path of buttons and bellows on both hands of the bandoneon.', 'escalas_intro': 'Pick a scale to see the path of the buttons on both hands, note by note, with the bellows for each one. In the app, every scale plays in time and comes with a step-by-step guide.', 'tipos_esc': {'maior': 'Major', 'menor': 'Natural minor', 'harmonica': 'Harmonic minor'}, 'escala_h1': '{n} scale on the bandoneon', 'escala_titulo': '{n} scale on the bandoneon', 'escala_desc': 'The {n} scale ({notas}) on the bandoneon: the path of the buttons on both hands, note by note, with the bellows opening and closing.', 'explic_esc': {'maior': 'The major scale follows the pattern tone, tone, semitone, tone, tone, tone, semitone. It is the basis of most melodies and of major chords.', 'menor': 'The natural minor scale follows the pattern tone, semitone, tone, tone, semitone, tone, tone. It has the same notes as its relative major.', 'harmonica': 'The harmonic minor is the natural minor with a raised 7th degree (the leading note). Between the 6th and 7th degrees there is a tone and a half, a sound you hear a lot in tango.'}, 'relativa': {'maior': 'Its relative minor is {l}.', 'menor': 'Its relative major is {l}.', 'harmonica': 'The natural version (without the raised 7th) is {l}.'}, 'formula_leg': 'T = tone, S = semitone, 1½ = tone and a half', 'escala_ler': "Each map shows the scale going up one octave in one bellows direction: the numbers give the order of the notes and the colour shows the bellows (blue opening, orange closing). When a note does not exist in the map's direction, the bellows change just for that note. Each note uses the button nearest the previous one, as the app suggests. It is not a fingering: agree the fingers with your teacher or follow your method.", 'fig_mao': {'left': 'Left hand', 'right': 'Right hand'}, 'a_partir': 'from {n}', 'fole_resumo': ('Bellows: all {d}, no change.', 'Bellows: starts {d} and changes once.', 'Bellows: starts {d} and changes {n} times.'), 'sem_mao': 'This scale does not fit a whole octave on this hand.', 'outras_escalas': 'Other scales', 'outros_tons_esc': '{tipo} scales in other keys', 'todas_escalas': 'All scales', 'ver_escalas': 'See the scales on the bandoneon', 'acorde_link': '{n} chord', 'escala_link': '{n} scale', 'escala_cta': 'Play this scale in the app: it sounds in time, the keyboard shows the next button and every step is explained.', 'abrir_escalas': 'Open the scales in the app'}}
for cod, T in TEXTOS.items():
    T.update(TEXTOS_ESC[cod])
    T.update({k: v for k, v in gl.TEXTOS[cod].items() if k not in T})


# ---------- desenhos ----------
def limites(L): return max(b['x'] for b in L), max(b['y'] for b in L)


def svg_notas(L, cod, aria):
    """O mapa de uma mão com as duas notas de cada botão: abrindo em cima, fechando embaixo."""
    W, H = limites(L)
    partes = [f'<svg class="ref-teclado" viewBox="0.1 0.1 {W + .8:.2f} {H + .8:.2f}" role="img" aria-label="{e(aria)}">']
    for b in L:
        x, y = b['x'] + .5, b['y'] + .5
        partes.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r=".34"/><text class="ab" x="{x:.2f}" y="{y - .1:.2f}">{e(nome_tecla(b["open"], cod))}</text>'
                      f'<text class="fe" x="{x:.2f}" y="{y + .11:.2f}">{e(nome_tecla(b["close"], cod))}</text>')
    partes.append('</svg>')
    return ''.join(partes)


def svg_acorde(L, ids, dir_, nomes, aria):
    """Como o painel Relembre do app: os botões da mão, com os do acorde acesos na cor do fole e o nome da nota."""
    W, H = limites(L); acesos = set(ids)
    partes = [f'<svg class="ch-rel-mapa" viewBox="0.1 0.1 {W + .8:.2f} {H + .8:.2f}" role="img" aria-label="{e(aria)}">']
    for b in L:
        x, y = b['x'] + .5, b['y'] + .5
        if b['id'] in acesos:
            partes.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r=".35" class="on {dir_}"/><text x="{x:.2f}" y="{y:.2f}">{e(nomes[pc12(b[dir_])][0])}</text>')
        else:
            partes.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r=".35"/>')
    partes.append('</svg>')
    return ''.join(partes)


# ---------- páginas ----------
def pagina_notas(cod, dados, urls):
    T, layout = TEXTOS[cod], dados['layout']
    mapas = ''.join(f'''    <figure class="ref-mapa">
      <figcaption><b>{e(T[chave])}</b></figcaption>
      {svg_notas(layout[mao], cod, T[chave])}
    </figure>
''' for mao, chave in (('left', 'mao_esq'), ('right', 'mao_dir')))
    # onde fica cada nota
    onde = {}
    for mao in ('left', 'right'):
        for b in layout[mao]:
            for d in ('open', 'close'): onde.setdefault(b[d], {}).setdefault(mao, []).append(d)
    def celula(lista):
        if not lista: return '<td class="muted">—</td>'
        ab, fe = lista.count('open'), lista.count('close')
        txt = [f'{T["ab"]}' + (f' ×{ab}' if ab > 1 else '') if ab else '', f'{T["fe"]}' + (f' ×{fe}' if fe > 1 else '') if fe else '']
        return '<td>' + ' · '.join(x for x in txt if x) + '</td>'
    linhas = ''.join(f'      <tr><th scope="row">{e(nome_tecla(m, cod))}</th>{celula(onde[m].get("left", []))}{celula(onde[m].get("right", []))}</tr>\n' for m in sorted(onde))
    corpo = f'''  <article class="card licao ref">
    <p class="muted licao-kicker"><a href="../" data-local>{e(T['inicio'])}</a> › {e(T['notas_migalha'])}</p>
    <h1>{e(T['notas_h1'])}</h1>
    <p>{e(T['notas_intro'])}</p>
    <p>{e(T['notas_ler'])}</p>
    <p class="ref-legenda"><span class="ab">● {e(T['legenda_ab'])}</span><span class="fe">● {e(T['legenda_fe'])}</span></p>
    <div class="ref-mapas ref-mapas-notas">
{mapas}    </div>
    <p class="muted">{e(T['notas_origem'])}</p>
    <h2>{e(T['tabela_tit'])}</h2>
    <p>{e(T['tabela_intro'])}</p>
    <div class="ref-tabela"><table>
      <thead><tr><th scope="col">{e(T['col_nota'])}</th><th scope="col">{e(T['col_esq'])}</th><th scope="col">{e(T['col_dir'])}</th></tr></thead>
      <tbody>
{linhas}      </tbody>
    </table></div>
    <div class="row licao-nav"><a class="btn sec" href="../{ACORDES_PASTA}/" data-local>{e(T['ver_acordes'])}</a><a class="btn sec" href="../{ESCALAS_PASTA}/" data-local>{e(T['ver_escalas'])}</a></div>
  </article>
  <div class="card licao-cta">
    <p>{e(T['notas_cta'])}</p>
    <div class="row"><a class="btn" href="../#teclado" data-local>{e(T['abrir_teclado'])}</a><a class="btn sec" href="../#microfone" data-local>{e(T['abrir_afinador'])}</a></div>
  </div>'''
    dados_ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', 'headline': T['notas_h1'], 'description': T['notas_desc'], 'url': urls[cod], 'inLanguage': LANGS[cod],
         'isAccessibleForFree': True, 'publisher': {'@type': 'Organization', 'name': 'BanDoly', 'url': SITE}},
        gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['notas_migalha'], urls[cod])])]}
    return gl.pagina(cod, 1, gl.titulo_pagina('{t} | BanDoly', T['notas_titulo']), T['notas_desc'], urls, corpo, dados_ld)


def lista_botoes(L, ids, dir_, nomes):
    porid = {b['id']: b for b in L}
    bs = sorted((porid[i] for i in ids), key=lambda b: b[dir_])
    return ' · '.join(nome_com_oitava(b[dir_], *nomes[pc12(b[dir_])]) for b in bs)


def pagina_acorde(cod, pc, tipo, dados, urls, slugs):
    T, layout = TEXTOS[cod], dados['layout']
    nomes = grafia(pc, tipo, cod)
    for semi in dados['iv'][tipo]: assert (pc + semi) % 12 in nomes, ('grafia', pc, tipo)
    if cod == 'pt':  # a mesma grafia do app (notasDoAcorde em js/acordes.js)
        assert [nomes[(pc + s) % 12][0] for s in dados['iv'][tipo]] == dados['nomes'][f'{pc}|{tipo}'], ('grafia diferente do app', pc, tipo)
    n = acorde_nome(pc, tipo, cod)
    notas = ' · '.join(nomes[(pc + semi) % 12][0] for semi in dados['iv'][tipo])
    figs = []
    for mao in ('left', 'right'):
        for d in ('open', 'close'):
            vozes = dados['vozes'][f'{pc}|{tipo}|{mao}|{d}']
            titulo = T['fig'][(mao, d)]
            if vozes:
                v = vozes[0]
                L = {b['id']: b for b in layout[mao]}
                # conferência: todo botão aceso dá uma nota do acorde nessa direção, e as obrigatórias estão lá
                pcs = {pc12(L[i][d]) for i in v['ids']}
                assert pcs <= set(nomes), ('botão fora do acorde', pc, tipo, mao, d)
                iv = dados['iv'][tipo]; assert {(pc + iv[k]) % 12 for k in (0, 1, len(iv) - 1)} <= pcs, ('falta nota', pc, tipo, mao, d)
                mapa = svg_acorde(layout[mao], v['ids'], d, nomes, T['mapa_aria'].format(m=titulo, d=n))
                pe = e(T['botoes'].format(l=lista_botoes(layout[mao], v['ids'], d, nomes))) + (f' <span class="muted">({e(T["sem_quinta"])})</span>' if v['sem5'] else '')
            else:
                mapa = svg_acorde(layout[mao], [], d, nomes, T['mapa_aria'].format(m=titulo, d=n))
                pe = f'<span class="muted">{e(T["sem_forma"])}</span>'
            figs.append(f'''      <figure class="ref-mapa">
        <figcaption><b class="ref-dir {d}">{e(titulo)}</b></figcaption>
        {mapa}
        <p class="ref-pe">{pe}</p>
      </figure>
''')
    outro = f' {e(T["outro_nome"].format(a=acorde_nome(pc, tipo, cod, outro=True)))}' if pc in OUTRO_NOME else ''
    mesma = ''.join(f'<a class="btn sec" href="../{slugs[cod][(pc, t)]}/" data-local>{e(acorde_nome(pc, t, cod))}</a>' for t in TIPOS if t != tipo)
    tesc = 'menor' if tipo == 'menor' else 'maior'
    mesma += f'<a class="btn sec" href="../../{ESCALAS_PASTA}/{escala_slug(pc, tesc, cod)}/" data-local>{e(T["escala_link"].format(n=escala_nome(pc, tesc, cod)))}</a>'
    atual = ' aria-current="page"'
    tons = ''.join(f'<li><a href="../{slugs[cod][(p, tipo)]}/" data-local{atual if p == pc else ""}>{e(acorde_nome(p, tipo, cod))}</a></li>' for p in range(12))
    corpo = f'''  <article class="card licao ref">
    <p class="muted licao-kicker"><a href="../../" data-local>{e(T['inicio'])}</a> › <a href="../" data-local>{e(T['acordes_h1'])}</a> › {e(n)}</p>
    <h1>{e(T['acorde_h1'].format(n=n))}</h1>
    <p class="ref-notas"><b>{e(T['notas_lbl'])}:</b> {e(notas)} <span class="muted">({FORMULA[tipo]})</span></p>
    <p>{e(T['explic'][tipo])}{outro}</p>
    <p>{e(T['acorde_ler'])}</p>
    <div class="ref-mapas">
{''.join(figs)}    </div>
    <p class="muted">{e(T['posicao'])}</p>
    <h2>{e(T['outros'])}</h2>
    <p class="muted">{e(T['mesma_tonica'])}</p>
    <div class="row">{mesma}</div>
    <p class="muted">{e(T['outros_tons'].format(tipo=T['tipos'][tipo]))}</p>
    <ul class="ref-tons">{tons}</ul>
    <div class="row licao-nav"><a class="btn sec" href="../" data-local>{e(T['todos_acordes'])}</a><a class="btn sec" href="../../{NOTAS_PASTA}/" data-local>{e(T['ver_notas'])}</a></div>
  </article>
  <div class="card licao-cta">
    <p>{e(T['acorde_cta'])}</p>
    <a class="btn" href="../../#acordes" data-local>{e(T['treinar'])}</a>
  </div>'''
    desc = T['acorde_desc'].format(n=n, notas=notas)
    dados_ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', 'headline': T['acorde_h1'].format(n=n), 'description': desc, 'url': urls[cod], 'inLanguage': LANGS[cod],
         'isAccessibleForFree': True, 'publisher': {'@type': 'Organization', 'name': 'BanDoly', 'url': SITE}},
        gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['acordes_h1'], gl.url(cod, ACORDES_PASTA)), (n, urls[cod])])]}
    v = dados['vozes'][f'{pc}|{tipo}|left|open']
    img = registrar_cartao(cod, ACORDES_PASTA, slugs[cod][(pc, tipo)], n, notas, T['fig'][('left', 'open')], 'open',
                           svg_acorde(layout['left'], v[0]['ids'] if v else [], 'open', nomes, n))
    return gl.pagina(cod, 2, gl.titulo_pagina('{t} | BanDoly', T['acorde_titulo'].format(n=n)), desc, urls, corpo, dados_ld, imagem=img)


def pagina_indice(cod, urls, slugs):
    T = TEXTOS[cod]
    grupos = ''.join(f'''    <h2>{e(T['tipos'][t])}</h2>
    <ul class="ref-tons">{''.join(f'<li><a href="{slugs[cod][(p, t)]}/" data-local>{e(acorde_nome(p, t, cod))}</a></li>' for p in range(12))}</ul>
''' for t in TIPOS)
    corpo = f'''  <div class="card ref">
    <p class="muted licao-kicker"><a href="../" data-local>{e(T['inicio'])}</a> › {e(T['acordes_h1'])}</p>
    <h1>{e(T['acordes_h1'])}</h1>
    <p>{e(T['acordes_intro'])}</p>
{grupos}    <div class="row licao-nav"><a class="btn sec" href="../{NOTAS_PASTA}/" data-local>{e(T['ver_notas'])}</a><a class="btn sec" href="../{ESCALAS_PASTA}/" data-local>{e(T['ver_escalas'])}</a><a class="btn" href="../#acordes" data-local>{e(T['treinar'])}</a></div>
  </div>'''
    dados_ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'CollectionPage', 'name': T['acordes_h1'], 'url': urls[cod], 'inLanguage': LANGS[cod], 'description': T['acordes_desc'],
         'hasPart': [{'@type': 'Article', 'name': T['acorde_h1'].format(n=acorde_nome(p, t, cod)), 'url': gl.url(cod, ACORDES_PASTA, slugs[cod][(p, t)])}
                     for t in TIPOS for p in range(12)]},
        gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['acordes_h1'], urls[cod])])]}
    return gl.pagina(cod, 1, gl.titulo_pagina('{t} | BanDoly', T['acordes_titulo']), T['acordes_desc'], urls, corpo, dados_ld, 'website')


# ---------- escalas ----------
ESCALAS_PASTA = 'escalas'
TIPOS_ESC = ['maior', 'menor', 'harmonica']
LETRA_SLUG = {'pt': ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'], 'es': ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'], 'en': ['c', 'd', 'e', 'f', 'g', 'a', 'b']}
ACID_SLUG = {'pt': {1: '-sustenido', -1: '-bemol', 0: ''}, 'es': {1: '-sostenido', -1: '-bemol', 0: ''}, 'en': {1: '-sharp', -1: '-flat', 0: ''}}
ESC_SLUG = {'pt': {'maior': '-maior', 'menor': '-menor', 'harmonica': '-menor-harmonica'},
            'es': {'maior': '-mayor', 'menor': '-menor', 'harmonica': '-menor-armonica'},
            'en': {'maior': '-major', 'menor': '-minor', 'harmonica': '-harmonic-minor'}}
ESC_NOME = {'pt': {'maior': '{r} maior', 'menor': '{r} menor natural', 'harmonica': '{r} menor harmônica'},
            'es': {'maior': '{r} mayor', 'menor': '{r} menor natural', 'harmonica': '{r} menor armónica'},
            'en': {'maior': '{r} major', 'menor': '{r} natural minor', 'harmonica': '{r} harmonic minor'}}
PASSO = {1: 'S', 2: 'T', 3: '1½'}
ESC = {}  # os dados das escalas e os endereços, preenchidos em gerar_todas()


def escala_nome(pc, tipo, cod):
    letra, acid = ESC['dados'][f'{pc}|{tipo}']['tonica']
    return ESC_NOME[cod][tipo].format(r=nome_letra(letra, acid, cod))


def escala_slug(pc, tipo, cod):
    letra, acid = ESC['dados'][f'{pc}|{tipo}']['tonica']
    return LETRA_SLUG[cod][letra] + ACID_SLUG[cod][acid] + ESC_SLUG[cod][tipo]


def svg_escala(L, notas, aria):
    """O mapa de uma mão com os botões da escala numerados na ordem, na cor do fole de cada nota."""
    W, H = limites(L); usos = {}
    for k, n in enumerate(notas, 1):
        if n['btn']: usos.setdefault(n['btn'], []).append((k, n['dir']))
    partes = [f'<svg class="ch-rel-mapa" viewBox="0.1 0.1 {W + .8:.2f} {H + .8:.2f}" role="img" aria-label="{e(aria)}">']
    for b in L:
        x, y = b['x'] + .5, b['y'] + .5
        u = usos.get(b['id'])
        if not u:
            partes.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r=".35"/>'); continue
        partes.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r=".35" class="on {u[0][1]}"/>')
        outra = next((d for _, d in u if d != u[0][1]), None)
        if outra: partes.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r=".43" class="anel {outra}"/>')
        rot, dois = '·'.join(str(k) for k, _ in u), (' class="dois"' if len(u) > 1 else '')
        partes.append(f'<text x="{x:.2f}" y="{y:.2f}"{dois}>{rot}</text>')
    partes.append('</svg>')
    return ''.join(partes)


def nome_nota_esc(n, cod): return nome_com_oitava(n['midi'], nome_letra(n['letra'], n['acid'], cod), n['acid'])


def pagina_escala(cod, pc, tipo, dados, urls, slugs):
    T, layout, item = TEXTOS[cod], dados['layout'], ESC['dados'][f'{pc}|{tipo}']
    n = escala_nome(pc, tipo, cod)
    alguma = next(v for v in item['maos'].values() if v)['open']
    notas = ' · '.join(nome_letra(x['letra'], x['acid'], cod) for x in alguma)
    formula = ' '.join(PASSO[p] for p in item['passos'])
    figs = []
    for mao, dir_ in (('left', 'open'), ('left', 'close'), ('right', 'open'), ('right', 'close')):
        ns = (item['maos'][mao] or {}).get(dir_); titulo = T['fig'][(mao, dir_)]
        if not ns:
            figs.append(f'      <figure class="ref-mapa">\n        <figcaption><b>{e(titulo)}</b></figcaption>\n        {svg_escala(layout[mao], [], titulo)}\n        <p class="ref-pe muted">{e(T["sem_mao"])}</p>\n      </figure>\n')
            continue
        assert not any(x['erro'] for x in ns), ('nota sem botão', pc, tipo, mao)
        porid = {b['id']: b for b in layout[mao]}
        for x in ns:  # conferência: o botão dá mesmo essa nota nessa direção
            assert porid[x['btn']][x['dir']] == x['midi'], ('botão errado', pc, tipo, mao, x)
        trocas = sum(1 for a, b in zip(ns, ns[1:]) if a['dir'] != b['dir'])
        d0 = T['ab'] if ns[0]['dir'] == 'open' else T['fe']
        resumo = T['fole_resumo'][min(trocas, 2)].format(d=d0, n=trocas)
        passos = ''.join(f'<li class="{x["dir"]}"><small>{k}</small><b>{e(nome_nota_esc(x, cod))}</b></li>' for k, x in enumerate(ns, 1))
        cap = f'{titulo} · {T["a_partir"].format(n=nome_nota_esc(ns[0], cod))}'
        figs.append(f"""      <figure class="ref-mapa">
        <figcaption><b class="ref-dir {dir_}">{e(cap)}</b></figcaption>
        {svg_escala(layout[mao], ns, T['mapa_aria'].format(m=titulo, d=n))}
        <ol class="ref-passos">{passos}</ol>
        <p class="ref-pe">{e(resumo)}</p>
      </figure>
""")
    # ligações: a relativa (ou a natural), as outras escalas da mesma tônica, o acorde
    rel = {'maior': ((pc + 9) % 12, 'menor'), 'menor': ((pc + 3) % 12, 'maior'), 'harmonica': (pc, 'menor')}[tipo]
    # o nome da relativa sai da própria escala (6º grau da maior, 3º da menor): a de Fá♯ maior é Ré♯ menor, cuja
    # página se chama Mi♭ menor (as mesmas teclas); quando os nomes diferem, aparecem os dois
    grau_rel = {'maior': 5, 'menor': 2}.get(tipo)
    rel_nome = escala_nome(*rel, cod) if grau_rel is None else ESC_NOME[cod][rel[1]].format(r=nome_letra(alguma[grau_rel]['letra'], alguma[grau_rel]['acid'], cod))
    if rel_nome != escala_nome(*rel, cod): rel_nome += f' (= {escala_nome(*rel, cod)})'
    rel_link = f'<a href="../{slugs[cod][rel]}/" data-local>{e(rel_nome)}</a>'
    relativa = e(T['relativa'][tipo]).replace('{l}', rel_link)
    mesma = ''.join(f'<a class="btn sec" href="../{slugs[cod][(pc, t)]}/" data-local>{e(T["escala_link"].format(n=escala_nome(pc, t, cod)))}</a>' for t in TIPOS_ESC if t != tipo)
    tac = 'maior' if tipo == 'maior' else 'menor'
    tonica = nome_letra(*item['tonica'], cod)  # o acorde com o nome da tônica desta escala (Sol♯ menor, não Lá♭ menor)
    mesma += f'<a class="btn sec" href="../../{ACORDES_PASTA}/{acorde_slug(pc, tac, cod)}/" data-local>{e(T["acorde_link"].format(n=TIPO_NOME[cod][tac].format(r=tonica)))}</a>'
    atual = ' aria-current="page"'
    tons = ''.join(f'<li><a href="../{slugs[cod][(p, tipo)]}/" data-local{atual if p == pc else ""}>{e(escala_nome(p, tipo, cod))}</a></li>' for p in range(12))
    corpo = f"""  <article class="card licao ref">
    <p class="muted licao-kicker"><a href="../../" data-local>{e(T['inicio'])}</a> › <a href="../" data-local>{e(T['escalas_h1'])}</a> › {e(n)}</p>
    <h1>{e(T['escala_h1'].format(n=n))}</h1>
    <p class="ref-notas"><b>{e(T['notas_lbl'])}:</b> {e(notas)} <span class="muted">({formula})</span></p>
    <p>{e(T['explic_esc'][tipo])} {relativa}</p>
    <p class="muted">{e(T['formula_leg'])}</p>
    <p>{e(T['escala_ler'])}</p>
    <div class="ref-mapas">
{''.join(figs)}    </div>
    <h2>{e(T['outras_escalas'])}</h2>
    <p class="muted">{e(T['mesma_tonica'])}</p>
    <div class="row">{mesma}</div>
    <p class="muted">{e(T['outros_tons_esc'].format(tipo=T['tipos_esc'][tipo]))}</p>
    <ul class="ref-tons">{tons}</ul>
    <div class="row licao-nav"><a class="btn sec" href="../" data-local>{e(T['todas_escalas'])}</a><a class="btn sec" href="../../{NOTAS_PASTA}/" data-local>{e(T['ver_notas'])}</a></div>
  </article>
  <div class="card licao-cta">
    <p>{e(T['escala_cta'])}</p>
    <a class="btn" href="../../#melodias" data-local>{e(T['abrir_escalas'])}</a>
  </div>"""
    desc = T['escala_desc'].format(n=n, notas=notas)
    dados_ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', 'headline': T['escala_h1'].format(n=n), 'description': desc, 'url': urls[cod], 'inLanguage': LANGS[cod],
         'isAccessibleForFree': True, 'publisher': {'@type': 'Organization', 'name': 'BanDoly', 'url': SITE}},
        gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['escalas_h1'], gl.url(cod, ESCALAS_PASTA)), (n, urls[cod])])]}
    mao_c = 'right' if item['maos']['right'] else 'left'
    img = registrar_cartao(cod, ESCALAS_PASTA, slugs[cod][(pc, tipo)], n, notas, T['fig'][(mao_c, 'open')], 'open',
                           svg_escala(layout[mao_c], item['maos'][mao_c]['open'], n))
    return gl.pagina(cod, 2, gl.titulo_pagina('{t} | BanDoly', T['escala_titulo'].format(n=n)), desc, urls, corpo, dados_ld, imagem=img)


def pagina_indice_escalas(cod, urls, slugs):
    T = TEXTOS[cod]
    grupos = ''.join(f"""    <h2>{e(T['tipos_esc'][t])}</h2>
    <ul class="ref-tons">{''.join(f'<li><a href="{slugs[cod][(p, t)]}/" data-local>{e(escala_nome(p, t, cod))}</a></li>' for p in range(12))}</ul>
""" for t in TIPOS_ESC)
    corpo = f"""  <div class="card ref">
    <p class="muted licao-kicker"><a href="../" data-local>{e(T['inicio'])}</a> › {e(T['escalas_h1'])}</p>
    <h1>{e(T['escalas_h1'])}</h1>
    <p>{e(T['escalas_intro'])}</p>
{grupos}    <div class="row licao-nav"><a class="btn sec" href="../{NOTAS_PASTA}/" data-local>{e(T['ver_notas'])}</a><a class="btn sec" href="../{ACORDES_PASTA}/" data-local>{e(T['ver_acordes'])}</a><a class="btn" href="../#melodias" data-local>{e(T['abrir_escalas'])}</a></div>
  </div>"""
    dados_ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'CollectionPage', 'name': T['escalas_h1'], 'url': urls[cod], 'inLanguage': LANGS[cod], 'description': T['escalas_desc'],
         'hasPart': [{'@type': 'Article', 'name': T['escala_h1'].format(n=escala_nome(p, t, cod)), 'url': gl.url(cod, ESCALAS_PASTA, slugs[cod][(p, t)])}
                     for t in TIPOS_ESC for p in range(12)]},
        gl.migalhas(cod, [(T['inicio'], gl.url(cod)), (T['escalas_h1'], urls[cod])])]}
    return gl.pagina(cod, 1, gl.titulo_pagina('{t} | BanDoly', T['escalas_titulo']), T['escalas_desc'], urls, corpo, dados_ld, 'website')


# ---------- imagens de compartilhamento (a prévia do link no WhatsApp, Facebook...) ----------
# Um cartão 1200×630 por página de acorde e de escala: o nome, as notas e o mapa. É desenhado em HTML, com a fonte
# e as cores do site, e fotografado pelo Edge (em lotes, recortados pelo Pillow). manifesto.json guarda o resumo
# de cada cartão: só os cartões que mudaram são refeitos, e --verificar acusa imagem faltando ou desatualizada.
IMG_PASTA = 'imagens/compartilhar'
MANIFESTO = RAIZ / IMG_PASTA / 'manifesto.json'
CARTOES = {}  # caminho da imagem -> html do cartão
ROT_CARTAO = {'pt': {'acordes': 'Acorde no bandoneon', 'escalas': 'Escala no bandoneon'},
              'es': {'acordes': 'Acorde en el bandoneón', 'escalas': 'Escala en el bandoneón'},
              'en': {'acordes': 'Bandoneon chord', 'escalas': 'Bandoneon scale'}}
CSS_CARTAO = """
@font-face{font-family:Onest;font-weight:400 900;src:url(%(f1)s) format('woff2')}
@font-face{font-family:Onest;font-weight:400 900;src:url(%(f2)s) format('woff2');unicode-range:U+0100-02BA,U+1E00-1E9F}
body{margin:0;background:#1c1624}
.c{width:1200px;height:630px;box-sizing:border-box;padding:56px 64px;display:grid;grid-template-columns:440px 1fr;gap:48px;align-items:center;
  background:radial-gradient(circle at 85%% 15%%,#3b2d57 0,#1c1624 62%%);font-family:Onest,system-ui,sans-serif;color:#f1f0ec;overflow:hidden}
.t{height:100%%;display:flex;flex-direction:column;justify-content:space-between}
.k{margin:0 0 16px;font-size:26px;font-weight:600;color:#b997ff}
h1{margin:0 0 24px;font-size:64px;line-height:1.04;font-weight:700;letter-spacing:-.02em}
.n{margin:0;font-size:28px;line-height:1.35;color:#d0c9c4}
.m{margin:0;display:flex;align-items:center;gap:16px;font-size:26px;font-weight:700}
.m img{width:56px;height:56px}
.mapa{background:#2d2734;border-radius:24px;padding:24px 24px 16px;box-shadow:inset 0 0 0 2px rgba(229,231,235,.12)}
.leg{margin:0 0 8px;font-size:24px;font-weight:700} .leg.open{color:#4f9cf0} .leg.close{color:#f08a4b}
svg{display:block;width:100%%;height:auto}
circle{fill:rgba(241,240,236,.1);stroke:rgba(241,240,236,.22);stroke-width:.04}
circle.on.open{fill:#4f9cf0;stroke:#fff;stroke-width:.05} circle.on.close{fill:#f08a4b;stroke:#fff;stroke-width:.05}
circle.anel{fill:none;stroke-width:.06} circle.anel.open{stroke:#4f9cf0} circle.anel.close{stroke:#f08a4b}
text{font-family:Onest,system-ui,sans-serif;font-weight:700;font-size:.26px;fill:#0d1b2e;text-anchor:middle;dominant-baseline:central}
text.dois{font-size:.17px}
"""


def registrar_cartao(cod, pasta, slug, nome, notas, legenda, dir_, svg):
    caminho = f'{IMG_PASTA}/{cod}/{pasta}/{slug}.jpg'
    logo = (RAIZ / 'icones' / 'logo-cabecalho.png').as_uri()
    CARTOES[caminho] = (f'<div class="c"><div class="t"><div><p class="k">{e(ROT_CARTAO[cod][pasta])}</p><h1>{e(nome)}</h1>'
                        f'<p class="n">{e(notas)}</p></div><p class="m"><img src="{logo}" alt="">bandoly.app</p></div>'
                        f'<div class="mapa"><p class="leg {dir_}">{e(legenda)}</p>{svg}</div></div>')
    return caminho


def resumo_cartao(html_cartao):
    return hashlib.sha1((CSS_CARTAO + html_cartao.split('<img src="')[0] + html_cartao.split('" alt="">')[-1]).encode('utf-8')).hexdigest()[:12]


def renderizar_cartoes(pendentes):
    """Fotografa os cartões no Edge, 15 por vez, e recorta cada um em JPEG."""
    from PIL import Image
    edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    if not Path(edge).exists(): sys.exit('Para gerar as imagens de compartilhamento é preciso o Microsoft Edge (' + edge + ')')
    css = CSS_CARTAO % {'f1': (RAIZ / 'fontes' / 'onest-latin.woff2').as_uri(), 'f2': (RAIZ / 'fontes' / 'onest-latin-ext.woff2').as_uri()}
    itens = list(pendentes.items())
    with tempfile.TemporaryDirectory() as tmp:
        for k in range(0, len(itens), 15):
            lote = itens[k:k + 15]
            arq, png = Path(tmp) / f'lote{k}.html', Path(tmp) / f'lote{k}.png'
            arq.write_text('<!DOCTYPE html><html><head><meta charset="utf-8"><style>' + css + '</style></head><body>'
                           + ''.join(h for _, h in lote) + '</body></html>', encoding='utf-8')
            subprocess.run([edge, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                            '--allow-file-access-from-files', '--virtual-time-budget=5000', f'--window-size=1200,{630 * len(lote)}',
                            f'--screenshot={png}', arq.as_uri()], capture_output=True, timeout=180)
            im = Image.open(png).convert('RGB')
            if im.size != (1200, 630 * len(lote)): sys.exit(f'A captura dos cartões saiu com tamanho {im.size}')
            for j, (caminho, _) in enumerate(lote):
                destino = RAIZ / caminho; destino.parent.mkdir(parents=True, exist_ok=True)
                im.crop((0, 630 * j, 1200, 630 * (j + 1))).save(destino, 'JPEG', quality=84, optimize=True, progressive=True)


def gerar_todas():
    dados = dados_do_app()
    ESC['dados'] = dados['escalas']
    slugs = {c: {(p, t): acorde_slug(p, t, c) for p in range(12) for t in TIPOS} for c in LANGS}
    paginas, grupos = {}, []
    base = lambda c: '' if c == 'pt' else c + '/'
    u_notas = {c: gl.url(c, NOTAS_PASTA) for c in LANGS}; grupos.append(u_notas)
    u_ind = {c: gl.url(c, ACORDES_PASTA) for c in LANGS}; grupos.append(u_ind)
    for c in LANGS:
        paginas[f'{base(c)}{NOTAS_PASTA}/index.html'] = pagina_notas(c, dados, u_notas)
        paginas[f'{base(c)}{ACORDES_PASTA}/index.html'] = pagina_indice(c, u_ind, slugs)
    for t in TIPOS:
        for p in range(12):
            u = {c: gl.url(c, ACORDES_PASTA, slugs[c][(p, t)]) for c in LANGS}; grupos.append(u)
            for c in LANGS:
                paginas[f'{base(c)}{ACORDES_PASTA}/{slugs[c][(p, t)]}/index.html'] = pagina_acorde(c, p, t, dados, u, slugs)
    slugs_e = {c: {(p, t): escala_slug(p, t, c) for p in range(12) for t in TIPOS_ESC} for c in LANGS}
    u_esc = {c: gl.url(c, ESCALAS_PASTA) for c in LANGS}; grupos.append(u_esc)
    for c in LANGS: paginas[f'{base(c)}{ESCALAS_PASTA}/index.html'] = pagina_indice_escalas(c, u_esc, slugs_e)
    for t in TIPOS_ESC:
        for p in range(12):
            u = {c: gl.url(c, ESCALAS_PASTA, slugs_e[c][(p, t)]) for c in LANGS}; grupos.append(u)
            for c in LANGS:
                paginas[f'{base(c)}{ESCALAS_PASTA}/{slugs_e[c][(p, t)]}/index.html'] = pagina_escala(c, p, t, dados, u, slugs_e)
    return paginas, grupos


def main():
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    verificar = '--verificar' in sys.argv
    paginas, grupos = gerar_todas()
    arquivos = dict(paginas)
    arquivos['sitemap.xml'] = gl.sitemap_com_bloco('referencia', gl.sitemap_bloco('referencia', grupos, paginas))
    desatualizadas = []
    for caminho, conteudo in arquivos.items():
        destino = RAIZ / caminho
        if verificar:
            if not destino.exists() or destino.read_text(encoding='utf-8') != conteudo: desatualizadas.append(caminho)
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(conteudo.encode('utf-8'))
    # imagens de compartilhamento: refaz só as que faltam ou mudaram; apaga as que nenhuma página usa mais
    manifesto = json.loads(MANIFESTO.read_text(encoding='utf-8')) if MANIFESTO.exists() else {}
    resumos = {c: resumo_cartao(h) for c, h in CARTOES.items()}
    pendentes = {c: h for c, h in CARTOES.items() if manifesto.get(c) != resumos[c] or not (RAIZ / c).exists()}
    sobrando = [f for f in (RAIZ / IMG_PASTA).rglob('*.jpg') if f.relative_to(RAIZ).as_posix() not in CARTOES] if (RAIZ / IMG_PASTA).exists() else []
    if verificar:
        if pendentes: desatualizadas.append(f'{len(pendentes)} imagens de compartilhamento ({next(iter(pendentes))}...)')
        if sobrando: desatualizadas.append(f'{len(sobrando)} imagens sobrando ({sobrando[0].relative_to(RAIZ).as_posix()})')
        if desatualizadas:
            print('Páginas de referência desatualizadas: ' + ', '.join(desatualizadas[:5]) + '. Rode: python ferramentas/gerar_referencia.py'); sys.exit(1)
    else:
        if pendentes:
            print(f'Desenhando {len(pendentes)} imagens de compartilhamento...'); renderizar_cartoes(pendentes)
        for f in sobrando: f.unlink()
        MANIFESTO.parent.mkdir(parents=True, exist_ok=True)
        MANIFESTO.write_bytes(('{\n' + ',\n'.join(f'"{c}": "{resumos[c]}"' for c in sorted(resumos)) + '\n}\n').encode('utf-8'))
        gl.salvar_datas()
        print(f'{len(paginas)} páginas de referência geradas (notas, acordes e escalas), {len(CARTOES)} imagens de compartilhamento e sitemap.xml atualizado')


if __name__ == '__main__':
    main()
