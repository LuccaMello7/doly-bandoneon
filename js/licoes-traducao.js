/* ================== Lições traduzidas ================== */
// Mesma ordem e mesmo número de perguntas/opções de LESSONS (licoes.js). A resposta certa
// continua vindo de LESSONS, então as opções devem ficar na mesma ordem do português.
const LICOES_TRAD = {
es: [
{ title:'1. Qué es el bandoneón', html:`
  <p>El bandoneón es un instrumento de lengüeta libre y fuelle, de la familia de la concertina. Se desarrolló en Alemania alrededor de 1840 y lleva el nombre de <b>Heinrich Band</b>, comerciante de instrumentos de Krefeld que ayudó a difundirlo.</p>
  <p>Al principio se usaba en música religiosa y popular alemana. A fines del siglo XIX llegó al Río de la Plata (Buenos Aires y Montevideo) con los inmigrantes y terminó siendo <b>la voz del tango</b>.</p>
  <p>Algunos nombres para escuchar: <b>Pedro Maffia, Pedro Laurenz, Aníbal Troilo, Astor Piazzolla, Leopoldo Federico</b> y <b>Dino Saluzzi</b>.</p>`,
  quiz:[{q:'¿En qué país se desarrolló el bandoneón?',o:['Argentina','Alemania','Italia','Uruguay']},
        {q:'¿Con qué género musical se asocia más el bandoneón?',o:['Samba','Fado','Tango','Flamenco']}]},
{ title:'2. Anatomía del instrumento', html:`
  <ul>
    <li><b>Dos cajas</b> (tapas), una en cada mano, con los <b>botones</b>.</li>
    <li><b>Fuelle</b> en el medio: al abrir o cerrar, empuja el aire a través de las lengüetas.</li>
    <li><b>Lengüetas</b>: láminas de metal que vibran. En cada nota suelen sonar dos, afinadas en octava, lo que da el timbre lleno.</li>
    <li><b>Válvula de aire</b>: palanca que se acciona con el pulgar derecho. Deja entrar o salir aire sin sonido para reubicar el fuelle.</li>
    <li><b>Correas</b>: sujetan las manos a las cajas.</li>
  </ul>
  <p>En el bandoneón "argentino" clásico (sistema Rheinische) hay <b>71 botones</b>: 38 en la mano derecha y 33 en la izquierda. Como cada botón da dos notas, son <b>142 voces</b>.</p>`,
  quiz:[{q:'¿Para qué sirve la válvula de aire?',o:['Afinar el instrumento','Mover el fuelle sin producir sonido','Hacer el sonido más fuerte','Cambiar de octava']},
        {q:'¿Por qué un bandoneón de 71 botones se llama "de 142 voces"?',o:['Cada botón da una nota abriendo y otra cerrando','Tiene 142 lengüetas por botón','Son 142 botones en total','Por las dos octavas']}]},
{ title:'3. Bisonoro: abriendo y cerrando', html:`
  <p>Esta es la característica que más asusta al principio: el bandoneón tradicional es <b>bisonoro</b>. El <b>mismo botón</b> da una nota cuando <b>abrís</b> el fuelle y <b>otra</b> cuando lo <b>cerrás</b>.</p>
  <p>Es decir, tenés que aprender <b>cuatro mapas</b>: mano derecha abriendo, mano derecha cerrando, mano izquierda abriendo y mano izquierda cerrando.</p>
  <p><b>Ejercicio:</b> tocá 3 botones abriendo, cambiá la dirección y tocá 3 cerrando. Observá cómo cambia la nota.</p>
  <div id="lessonKbd"></div>`,
  quiz:[{q:'En un bandoneón bisonoro, ¿qué pasa si presionás el mismo botón abriendo y después cerrando?',o:['Suena la misma nota','Suenan notas diferentes','Solo funciona abriendo','La nota sube una octava']}]},
{ title:'4. Fuelle y expresión', html:`
  <p>El fuelle es tu "arco de violín": controla el <b>volumen, el ataque y la expresión</b>. Los dedos solo eligen las notas.</p>
  <ul>
    <li>Más presión en el fuelle: sonido más fuerte. Presión suave: <i>piano</i>.</li>
    <li>Planificá <b>dónde cambiar la dirección</b>, preferentemente entre frases o en silencios, como un cantante planifica la respiración.</li>
    <li>Si el fuelle llega al final, usá la <b>válvula de aire</b> para reubicarlo en silencio.</li>
    <li>Nunca fuerces el fuelle sin presionar botones ni la válvula: eso daña el instrumento.</li>
  </ul>
  <p>En la pestaña <a href="#" data-go="teclado">Teclado</a> el fuelle está simulado: si tocás mucho tiempo en la misma dirección, llega al final. Usá <kbd>Espacio</kbd> para cambiar la dirección. Para reubicar el fuelle en silencio, mantené <kbd>←</kbd> o <kbd>A</kbd> (válvula abriendo) y <kbd>→</kbd> o <kbd>F</kbd> (válvula cerrando). Con el teclado de la computadora tocando notas, usá las flechas.</p>`,
  quiz:[{q:'¿Qué controla principalmente el volumen y la expresión en el bandoneón?',o:['La fuerza de los dedos en los botones','El fuelle','La válvula de aire','Las correas']},
        {q:'El fuelle está casi totalmente abierto y la frase no terminó. Lo mejor habría sido…',o:['Forzar más','Haber planificado el cambio antes, o usar la válvula en un silencio','Soltar las correas','Tocar más rápido']}]},
{ title:'5. Lectura: dos claves', html:`
  <p>Las partituras de bandoneón usan un <b>sistema de dos pentagramas</b>, como el piano:</p>
  <ul><li><b>Clave de sol</b>: mano derecha (agudos).</li><li><b>Clave de fa</b>: mano izquierda (graves).</li></ul>
  <p>En clave de sol, las líneas de abajo hacia arriba son <b>Mi, Sol, Si, Re, Fa</b>. En clave de fa, <b>Sol, Si, Re, Fa, La</b>.</p>
  <p>Practicá en <a href="#" data-go="desafios">Desafíos → Lectura en el pentagrama</a>.</p>`,
  quiz:[{q:'¿Qué clave suele leer la mano izquierda?',o:['Clave de sol','Clave de fa','Clave de do','Ninguna']},
        {q:'¿Qué nota está en la 2.ª línea (de abajo hacia arriba) de la clave de sol?',o:['Mi','Sol','Si','Fa']}]},
{ title:'6. Ritmos del tango', html:`
  <p>El acompañamiento de tango gira en torno a pocos patrones:</p>
  <ul>
    <li><b>Marcato</b>: acordes cortos en cada tiempo (en 4) o en los tiempos 1 y 3 (en 2).</li>
    <li><b>Síncopa</b>: acento desplazado al contratiempo, que empuja la música hacia adelante.</li>
    <li><b>3-3-2</b>: las ocho corcheas agrupadas en 3+3+2.</li>
    <li><b>Arrastre</b>: un "arrastre" que crece hasta el tiempo fuerte.</li>
  </ul>
  <p>Escuchá y tocá junto en la pestaña <a href="#" data-go="ritmo">Ritmo</a>. Empezá despacio (60–70 BPM).</p>`,
  quiz:[{q:'¿Cómo se agrupan las 8 corcheas en el ritmo 3-3-2?',o:['4+4','2+2+2+2','3+3+2','3+2+3']},
        {q:'¿Qué caracteriza a la síncopa?',o:['Acento en el contratiempo','Notas largas','Solo tiempos fuertes','Ausencia de acentos']}]},
{ title:'7. Rutina de estudio', html:`
  <p>Una rutina corta y diaria rinde más que horas una vez por semana. La pestaña <a href="#" data-go="estudo">Mi estudio</a>, en Aprender, muestra tu <b>rutina de hoy</b> y cuántos días seguidos practicaste. Sugerencia de 20–30 minutos:</p>
  <ol>
    <li><b>5 min</b>: fuelle. Notas largas abriendo y cerrando, con volumen estable.</li>
    <li><b>10 min</b>: mapa de botones. Escalas lentas de Do y Sol mayor, una mano por vez. Usá las <a href="#" data-go="melodias">Escalas guiadas</a> en el modo Espera y el desafío <i>Encontrá la nota</i>.</li>
    <li><b>5 min</b>: ritmo. Marcato y síncopa con metrónomo.</li>
    <li><b>5–10 min</b>: repertorio. Una melodía o un fragmento de tango importado (MusicXML), bien despacio, y los acordes del acompañamiento.</li>
  </ol>
  <p>Un profesor presencial es muy importante para la postura, las correas y la mecánica del fuelle, que una app no puede corregir.</p>`,
  quiz:[{q:'¿Qué es más eficiente al principio?',o:['Una sesión larga por semana','Práctica corta y diaria','Tocar solo canciones rápidas','Solo teoría']}]},
{ title:'8. Articulación: legato, staccato y acentos', html:`
  <p>En el bandoneón, la articulación surge de la combinación entre <b>dedos</b> y <b>fuelle</b>:</p>
  <ul>
    <li><b>Legato</b> (ligado): una nota se une a la siguiente, sin silencio. El fuelle sigue moviéndose sin parar y los dedos cambian de botón en el momento justo. Es más fácil cuando las notas de la frase están en la <b>misma dirección</b> del fuelle.</li>
    <li><b>Staccato</b> (picado): notas cortas, con silencio entre ellas. El dedo suelta el botón rápido; el fuelle puede seguir en un movimiento suave.</li>
    <li><b>Acento</b>: un impulso rápido del fuelle al comienzo de la nota (o del acorde) la hace sonar más fuerte. Es lo que da peso al <i>marcato</i>.</li>
    <li><b>Arrastre</b>: el sonido empieza un poco antes del tiempo y crece hasta el acento. Sale de un movimiento de fuelle que acelera hasta el tiempo fuerte.</li>
  </ul>
  <p>Probalo en la pestaña <a href="#" data-go="teclado">Teclado</a>: tocá una escala ligada y después picada. En la pestaña <a href="#" data-go="ritmo">Ritmo</a>, escuchá el patrón "Marcato con arrastre".</p>`,
  quiz:[{q:'¿Qué produce el acento de un acorde en el bandoneón?',o:['Presionar el botón con más fuerza','Un impulso rápido del fuelle','La válvula de aire','Cambiar de mano']},
        {q:'¿Por qué el legato es más fácil con las notas en la misma dirección del fuelle?',o:['Porque el fuelle no necesita parar para invertir','Porque las notas suenan más agudas','Porque usa menos botones','No hace diferencia']}]},
{ title:'9. Acordes en el bandoneón', html:`
  <p>Un acorde se forma con notas apiladas en terceras. El <b>mayor</b> tiene fundamental, tercera mayor y quinta (Do-Mi-Sol). El <b>menor</b> tiene la tercera menor (La-Do-Mi). El de <b>séptima</b> (dominante) agrega la séptima menor (Sol-Si-Re-Fa) y "pide" resolver en el acorde siguiente.</p>
  <p>En el bandoneón bisonoro, <b>cada acorde tiene una forma abriendo y otra cerrando</b>, con botones diferentes. Por eso conviene aprender los acordes más usados en las dos direcciones.</p>
  <p>En el acompañamiento de tango, la mano izquierda suele tocar el <b>bajo</b> (fundamental) en el tiempo fuerte y el <b>acorde</b> en los otros tiempos, o el acorde entero en marcato.</p>
  <p>En la pestaña <a href="#" data-go="acordes">Acordes</a> ves las formas de cada acorde en el teclado, las escuchás y practicás. Empezá por Lam, Rem, Mi7 y Do, muy comunes en tangos en La menor.</p>`,
  quiz:[{q:'¿Qué notas forman el acorde de La menor?',o:['La, Do♯, Mi','La, Do, Mi','La, Re, Fa','La, Si, Do']},
        {q:'En el bandoneón bisonoro, un mismo acorde…',o:['Usa siempre los mismos botones','Tiene una forma abriendo y otra cerrando','Solo se puede tocar abriendo','Solo existe en la mano derecha']}]},
{ title:'10. Dos manos, un solo fuelle', html:`
  <p>Las dos manos comparten el <b>mismo fuelle</b>. Eso tiene dos consecuencias importantes:</p>
  <ol>
    <li>En un momento dado, <b>las dos manos tocan en la misma dirección</b>. Una nota de la melodía y un bajo tocados juntos tienen que existir en la misma dirección.</li>
    <li>Mientras una nota está <b>sonando</b>, el fuelle no puede invertirse, o la nota cambia de altura en el medio. Por eso el cambio de dirección ocurre cuando las dos manos atacan juntas o en un silencio.</li>
  </ol>
  <p>Cómo estudiar: primero cada mano sola, después las dos juntas bien despacio. En la pestaña <a href="#" data-go="melodias">Melodías</a>, abrí el <i>Himno de la alegría a dos manos</i> en el modo Espera. La app planifica el fuelle para las dos manos y muestra la partitura en doble pentagrama.</p>`,
  quiz:[{q:'Melodía y bajo tocados al mismo tiempo tienen que estar…',o:['En direcciones opuestas del fuelle','En la misma dirección del fuelle','En la misma mano','En octavas iguales']},
        {q:'¿Qué pasa si el fuelle se invierte mientras una nota está sonando?',o:['Nada','La nota cambia de altura','El sonido se vuelve más fuerte','El fuelle se traba']}]},
{ title:'11. Cómo leer una partitura de tango', html:`
  <p>Las partituras para bandoneón solo suelen usar <b>dos pentagramas</b> (sol para la derecha, fa para la izquierda), como el piano. En las partes de orquesta típica, el bandoneón muchas veces tiene <b>un solo pentagrama</b>, en clave de sol, con la melodía o un contracanto. Los bajos quedan para el contrabajo y el piano.</p>
  <p>Qué buscar al abrir un tango:</p>
  <ul>
    <li><b>Forma</b>: los tangos tradicionales suelen tener dos partes (A y B), y los más antiguos a veces una tercera (trío). Ubicá dónde empieza cada parte.</li>
    <li><b>Repeticiones</b>: barras de repetición, <i>D.C.</i> (volver al principio), <i>D.S.</i> (volver al signo 𝄋), <i>Coda</i> (𝄌) y <i>Fine</i> (fin).</li>
    <li><b>Tonalidad y compás</b>: muchos tangos están en tono menor y en 2/4 o 4/4.</li>
    <li><b>Indicaciones de carácter</b>: <i>marcato</i>, <i>legato</i>, <i>rall.</i> (desacelerando), <i>a tempo</i>, y dinámicas como <i>p</i>, <i>f</i> y <i>sfz</i>.</li>
  </ul>
  <p>Consejo: con una partitura digital (MuseScore), exportá en MusicXML y usá <a href="#" data-go="melodias">Melodías → Importar MusicXML</a> para practicar fragmento por fragmento. Prefiere obras de dominio público o partituras que tengas derecho a usar.</p>`,
  quiz:[{q:'¿Qué significa "D.C." en una partitura?',o:['Disminuir el volumen','Volver al principio','Duplicar el compás','Tocar con la mano derecha']},
        {q:'En una parte de orquesta típica, el bandoneón muchas veces…',o:['Tiene un solo pentagrama, en clave de sol','No tiene partitura','Lee solo cifrados','Usa clave de do']}]},
],
en: [
{ title:'1. What is the bandoneon', html:`
  <p>The bandoneon is a free-reed bellows instrument from the concertina family. It was developed in Germany around 1840 and is named after <b>Heinrich Band</b>, an instrument dealer from Krefeld who helped spread it.</p>
  <p>It was first used in German religious and folk music. At the end of the 19th century it reached the Río de la Plata (Buenos Aires and Montevideo) with immigrants and became <b>the voice of tango</b>.</p>
  <p>Some names to listen to: <b>Pedro Maffia, Pedro Laurenz, Aníbal Troilo, Astor Piazzolla, Leopoldo Federico</b> and <b>Dino Saluzzi</b>.</p>`,
  quiz:[{q:'In which country was the bandoneon developed?',o:['Argentina','Germany','Italy','Uruguay']},
        {q:'Which musical genre is the bandoneon most associated with?',o:['Samba','Fado','Tango','Flamenco']}]},
{ title:'2. Anatomy of the instrument', html:`
  <ul>
    <li><b>Two boxes</b> (sides), one in each hand, holding the <b>buttons</b>.</li>
    <li><b>Bellows</b> in the middle: opening or closing it pushes air through the reeds.</li>
    <li><b>Reeds</b>: metal tongues that vibrate. Each note usually sounds two of them, tuned an octave apart, which gives the full tone.</li>
    <li><b>Air valve</b>: a lever worked by the right thumb. It lets air in or out silently so you can reposition the bellows.</li>
    <li><b>Straps</b>: hold your hands to the boxes.</li>
  </ul>
  <p>The classic "Argentine" bandoneon (Rheinische system) has <b>71 buttons</b>: 38 on the right hand and 33 on the left. Since each button plays two notes, that makes <b>142 voices</b>.</p>`,
  quiz:[{q:'What is the air valve for?',o:['Tuning the instrument','Moving the bellows without sound','Making the sound louder','Changing octave']},
        {q:'Why is a 71-button bandoneon called a "142-voice" bandoneon?',o:['Each button plays one note opening and another closing','It has 142 reeds per button','There are 142 buttons in total','Because of the two octaves']}]},
{ title:'3. Bisonoric: opening and closing', html:`
  <p>This is the feature that scares beginners the most: the traditional bandoneon is <b>bisonoric</b>. The <b>same button</b> plays one note when you <b>open</b> the bellows and <b>another</b> when you <b>close</b> it.</p>
  <p>In other words, you need to learn <b>four maps</b>: right hand opening, right hand closing, left hand opening and left hand closing.</p>
  <p><b>Exercise:</b> play 3 buttons opening, switch direction and play 3 closing. Notice how the note changes.</p>
  <div id="lessonKbd"></div>`,
  quiz:[{q:'On a bisonoric bandoneon, what happens when you press the same button opening and then closing?',o:['The same note plays','Different notes play','It only works opening','The note goes up an octave']}]},
{ title:'4. Bellows and expression', html:`
  <p>The bellows is your "violin bow": it controls <b>volume, attack and expression</b>. Your fingers only choose the notes.</p>
  <ul>
    <li>More bellows pressure: louder sound. Light pressure: <i>piano</i>.</li>
    <li>Plan <b>where to change direction</b>, ideally between phrases or in rests, the way a singer plans breathing.</li>
    <li>If the bellows runs out, use the <b>air valve</b> to reposition it silently.</li>
    <li>Never force the bellows without pressing buttons or the valve: it damages the instrument.</li>
  </ul>
  <p>On the <a href="#" data-go="teclado">Keyboard</a> tab the bellows is simulated: if you play too long in one direction, it runs out. Use <kbd>Space</kbd> to switch direction. To reposition the bellows silently, hold <kbd>←</kbd> or <kbd>A</kbd> (valve opening) and <kbd>→</kbd> or <kbd>F</kbd> (valve closing). When the computer keyboard is playing notes, use the arrows.</p>`,
  quiz:[{q:'What mainly controls volume and expression on the bandoneon?',o:['Finger pressure on the buttons','The bellows','The air valve','The straps']},
        {q:'The bellows is almost fully open and the phrase is not over. The best move would have been…',o:['Pushing harder','Planning the change earlier, or using the valve in a rest','Loosening the straps','Playing faster']}]},
{ title:'5. Reading: two clefs', html:`
  <p>Bandoneon scores use a <b>two-staff system</b>, like the piano:</p>
  <ul><li><b>Treble clef</b>: right hand (high notes).</li><li><b>Bass clef</b>: left hand (low notes).</li></ul>
  <p>In the treble clef, the lines from bottom to top are <b>E, G, B, D, F</b>. In the bass clef, <b>G, B, D, F, A</b>.</p>
  <p>Practice in <a href="#" data-go="desafios">Challenges → Staff reading</a>.</p>`,
  quiz:[{q:'Which clef does the left hand usually read?',o:['Treble clef','Bass clef','C clef','None']},
        {q:'Which note is on the 2nd line (from the bottom) of the treble clef?',o:['E','G','B','F']}]},
{ title:'6. Tango rhythms', html:`
  <p>Tango accompaniment revolves around a few patterns:</p>
  <ul>
    <li><b>Marcato</b>: short chords on every beat (in 4) or on beats 1 and 3 (in 2).</li>
    <li><b>Syncopation (síncopa)</b>: the accent moves to the offbeat, pushing the music forward.</li>
    <li><b>3-3-2</b>: the eight eighth notes grouped as 3+3+2.</li>
    <li><b>Arrastre</b>: a "drag" that grows into the strong beat.</li>
  </ul>
  <p>Listen and play along on the <a href="#" data-go="ritmo">Rhythm</a> tab. Start slowly (60–70 BPM).</p>`,
  quiz:[{q:'How are the 8 eighth notes grouped in the 3-3-2 rhythm?',o:['4+4','2+2+2+2','3+3+2','3+2+3']},
        {q:'What characterizes the síncopa?',o:['Accent on the offbeat','Long notes','Only strong beats','No accents']}]},
{ title:'7. Practice routine', html:`
  <p>A short daily routine pays off more than hours once a week. The <a href="#" data-go="estudo">My study</a> tab, under Learn, shows your <b>routine for today</b> and how many days in a row you have practiced. A 20–30 minute suggestion:</p>
  <ol>
    <li><b>5 min</b>: bellows. Long notes opening and closing, at a steady volume.</li>
    <li><b>10 min</b>: button map. Slow C and G major scales, one hand at a time. Use the <a href="#" data-go="melodias">Guided scales</a> in Wait mode and the <i>Find the note</i> challenge.</li>
    <li><b>5 min</b>: rhythm. Marcato and syncopation with a metronome.</li>
    <li><b>5–10 min</b>: repertoire. A melody or an imported tango excerpt (MusicXML), very slowly, plus the accompaniment chords.</li>
  </ol>
  <p>An in-person teacher matters a lot for posture, straps and bellows technique, which an app cannot correct.</p>`,
  quiz:[{q:'What is most effective at the beginning?',o:['One long session a week','Short daily practice','Only playing fast songs','Only theory']}]},
{ title:'8. Articulation: legato, staccato and accents', html:`
  <p>On the bandoneon, articulation comes from combining <b>fingers</b> and <b>bellows</b>:</p>
  <ul>
    <li><b>Legato</b> (connected): one note flows into the next with no silence. The bellows keeps moving and the fingers change buttons at exactly the right moment. It is easier when the notes of the phrase are in the <b>same bellows direction</b>.</li>
    <li><b>Staccato</b> (detached): short notes with silence between them. The finger releases the button quickly; the bellows can keep moving smoothly.</li>
    <li><b>Accent</b>: a quick push of the bellows at the start of the note (or chord) makes it louder. This is what gives <i>marcato</i> its weight.</li>
    <li><b>Arrastre</b>: the sound starts a little before the beat and grows into the accent. It comes from a bellows movement that speeds up toward the strong beat.</li>
  </ul>
  <p>Try it on the <a href="#" data-go="teclado">Keyboard</a> tab: play a scale legato and then staccato. On the <a href="#" data-go="ritmo">Rhythm</a> tab, listen to the "Marcato with arrastre" pattern.</p>`,
  quiz:[{q:'What produces a chord accent on the bandoneon?',o:['Pressing the button harder','A quick push of the bellows','The air valve','Switching hands']},
        {q:'Why is legato easier when the notes are in the same bellows direction?',o:['Because the bellows does not need to stop and reverse','Because the notes sound higher','Because it uses fewer buttons','It makes no difference']}]},
{ title:'9. Chords on the bandoneon', html:`
  <p>A chord is made of notes stacked in thirds. The <b>major</b> chord has a root, a major third and a fifth (C-E-G). The <b>minor</b> has a minor third (A-C-E). The <b>seventh</b> (dominant) adds a minor seventh (G-B-D-F) and "wants" to resolve to the next chord.</p>
  <p>On the bisonoric bandoneon, <b>every chord has one shape opening and another closing</b>, with different buttons. That is why it pays to learn the most common chords in both directions.</p>
  <p>In tango accompaniment, the left hand usually plays the <b>bass</b> (root) on the strong beat and the <b>chord</b> on the other beats, or the whole chord in marcato.</p>
  <p>On the <a href="#" data-go="acordes">Chords</a> tab you can see each chord shape on the keyboard, hear it and practice. Start with Am, Dm, E7 and C, very common in tangos in A minor.</p>`,
  quiz:[{q:'Which notes make up the A minor chord?',o:['A, C♯, E','A, C, E','A, D, F','A, B, C']},
        {q:'On the bisonoric bandoneon, the same chord…',o:['Always uses the same buttons','Has one shape opening and another closing','Can only be played opening','Only exists on the right hand']}]},
{ title:'10. Two hands, one bellows', html:`
  <p>Both hands share the <b>same bellows</b>. This has two important consequences:</p>
  <ol>
    <li>At any given moment, <b>both hands play in the same direction</b>. A melody note and a bass played together must both exist in that direction.</li>
    <li>While a note is <b>sounding</b>, the bellows cannot reverse, or the note changes pitch midway. So direction changes happen when both hands attack together or in a rest.</li>
  </ol>
  <p>How to practice: first each hand alone, then both together very slowly. On the <a href="#" data-go="melodias">Melodies</a> tab, open <i>Ode to Joy with both hands</i> in Wait mode. The app plans the bellows for both hands and shows the score on a grand staff.</p>`,
  quiz:[{q:'A melody and bass played at the same time must be…',o:['In opposite bellows directions','In the same bellows direction','In the same hand','In the same octaves']},
        {q:'What happens if the bellows reverses while a note is sounding?',o:['Nothing','The note changes pitch','The sound gets louder','The bellows locks']}]},
{ title:'11. How to read a tango score', html:`
  <p>Scores for solo bandoneon usually use <b>two staves</b> (treble for the right hand, bass for the left), like the piano. In orquesta típica parts, the bandoneon often has <b>a single staff</b> in treble clef, with the melody or a countermelody. The basses go to the double bass and the piano.</p>
  <p>What to look for when you open a tango:</p>
  <ul>
    <li><b>Form</b>: traditional tangos usually have two sections (A and B), and older ones sometimes a third (trio). Find where each section starts.</li>
    <li><b>Repeats</b>: repeat bars, <i>D.C.</i> (back to the beginning), <i>D.S.</i> (back to the sign 𝄋), <i>Coda</i> (𝄌) and <i>Fine</i> (end).</li>
    <li><b>Key and time signature</b>: many tangos are in a minor key and in 2/4 or 4/4.</li>
    <li><b>Expression marks</b>: <i>marcato</i>, <i>legato</i>, <i>rall.</i> (slowing down), <i>a tempo</i>, and dynamics such as <i>p</i>, <i>f</i> and <i>sfz</i>.</li>
  </ul>
  <p>Tip: with a digital score (MuseScore), export to MusicXML and use <a href="#" data-go="melodias">Melodies → Import MusicXML</a> to practice it section by section. Prefer public-domain works or scores you have the right to use.</p>`,
  quiz:[{q:'What does "D.C." mean in a score?',o:['Lower the volume','Go back to the beginning','Double the bar','Play with the right hand']},
        {q:'In an orquesta típica part, the bandoneon often…',o:['Has a single staff, in treble clef','Has no score','Reads only chord symbols','Uses the C clef']}]},
],
};
