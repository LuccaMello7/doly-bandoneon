// Testes automáticos: rode com  python tests/rodar_testes.py
const TESTES = [];
const teste = (nome, fn) => TESTES.push({nome, fn});
const ok = (cond, msg) => { if(!cond) throw new Error(msg || 'condição falsa'); };
const igual = (a, b, msg) => {
  if(JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg ? msg + ': ' : ''}esperado ${JSON.stringify(b)}, obtido ${JSON.stringify(a)}`);
};
// avança a simulação do fole sem depender de requestAnimationFrame (headless)
const passarTempoFole = ms => { for(let t=0; t<ms; t+=50) bellowsLoop(bel.last + 50); };
const tecla = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, {code, bubbles:true}));
const tocarEspera = () => { let n=0; while(mel.running && n++<5000){ const c=mel.cur.notes[mel.idx]; melPress(c.btn, c.midi, c.dir); } };

/* ---------- Base ---------- */
teste('página carrega sem erros de JavaScript', () => igual(window.__erros, []));
teste('mapa Rheinische 142: 38 + 33 botões', () => {
  igual(state.layout.right.length, 38); igual(state.layout.left.length, 33);
});
teste('nomes de notas e leitura de notas digitadas', () => {
  igual(parseNote('Dó4'), 60); igual(parseNote('F#3'), 54); igual(parseNote('Sib4'), 70); igual(parseNote('b4'), 71);
  igual(noteName(61), state.names==='pt' ? 'Dó♯4' : 'C♯4');
});

/* ---------- Fole e válvula ---------- */
teste('válvula: A abre e F fecha sem mudar a direção', () => {
  go('teclado'); bel.level = 0.5; setDir('open');
  tecla('keydown','KeyF'); passarTempoFole(400); tecla('keyup','KeyF');
  ok(bel.level < 0.5, 'F deveria fechar'); igual(state.dir, 'open');
  const l = bel.level; tecla('keydown','KeyA'); passarTempoFole(400); tecla('keyup','KeyA');
  ok(bel.level > l, 'A deveria abrir'); igual(bel.valve, null);
});
teste('fole no limite bloqueia e a válvula libera', () => {
  bel.level = 1; setDir('open'); bel.blocked = true;
  tecla('keydown','KeyF'); passarTempoFole(200); tecla('keyup','KeyF');
  igual(bel.blocked, false);
});

/* ---------- Melodias ---------- */
teste('todas as melodias prontas têm todas as notas no mapa', () => {
  for(const x of BUILTIN_MELODIES){
    const m = parseMelody(x.text); fingerMelody(m);
    igual(m.bad, [], x.id); igual(m.notes.filter(n=>n.error).length, 0, x.id);
  }
});
teste('formato de texto: tercinas, pontos, ligaduras e pausas', () => {
  const m = parseMelody('título: t\nDó4:8t Ré4:8t Mi4:8t Fá4:4. Sol4:8 | Lá4:2~ | Lá4:4 p:4');
  igual(m.notes.map(n=>+n.beats.toFixed(3)), [0.333,0.333,0.333,1.5,0.5,3,1]);
});
teste('modo Espera completo registra 100%', () => {
  go('melodias'); loadMelody('ode'); $('#melMode').value='wait'; $('#melAuto').checked=true; $('#melStart').click();
  tocarEspera(); ok(/100%/.test($('#melFeed').textContent), $('#melFeed').textContent);
});
teste('dedilhado escala para 1200 notas em menos de 500 ms', () => {
  const m = parseMelody('título: x\n' + Array(150).fill('Dó4:8 Ré4:8 Mi4:8 Fá4:8 Sol4:8 Lá4:8 Si4:8 Dó5:8').join(' '));
  const t0 = performance.now(); fingerMelody(m); ok(performance.now()-t0 < 500);
});

/* ---------- MusicXML ---------- */
const XML_TESTE = `<?xml version="1.0"?><score-partwise version="3.1"><work><work-title>T</work-title></work>
<part-list><score-part id="P1"><part-name>Band</part-name></score-part></part-list><part id="P1">
<measure number="1"><attributes><divisions>6</divisions><staves>2</staves></attributes><direction><sound tempo="100"/></direction>
<note><pitch><step>C</step><octave>5</octave></pitch><duration>6</duration><staff>1</staff></note>
<note><chord/><pitch><step>E</step><octave>5</octave></pitch><duration>6</duration><staff>1</staff></note>
<note><grace/><pitch><step>A</step><octave>5</octave></pitch><staff>1</staff></note>
<note><pitch><step>E</step><octave>5</octave></pitch><duration>2</duration><staff>1</staff></note>
<note><pitch><step>F</step><alter>1</alter><octave>5</octave></pitch><duration>2</duration><staff>1</staff></note>
<note><pitch><step>G</step><octave>5</octave></pitch><duration>2</duration><staff>1</staff></note>
<note><pitch><step>B</step><alter>-1</alter><octave>5</octave></pitch><duration>12</duration><tie type="start"/><staff>1</staff></note>
<backup><duration>24</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>24</duration><staff>2</staff></note></measure>
<measure number="2"><note><pitch><step>B</step><alter>-1</alter><octave>5</octave></pitch><duration>6</duration><tie type="stop"/><staff>1</staff></note>
<note><rest/><duration>18</duration><staff>1</staff></note><backup><duration>24</duration></backup>
<note><pitch><step>A</step><octave>2</octave></pitch><duration>24</duration><staff>2</staff></note></measure></part></score-partwise>`;
teste('MusicXML: acorde, enfeite, tercina e ligadura', () => {
  const sc = parseMusicXML(XML_TESTE); igual(sc.tempo, 100); igual(sc.parts[0].staves, 2);
  const r = melodyFromScore(sc, {part:0, staff:'1', pick:'high', hand:'right', fitOctave:false});
  ok(r.text.includes('Mi5:4 Mi5:8t Fá#5:8t Sol5:8t Lá#5:2~ | Lá#5:4'), r.text);
  const m = parseMelody(r.text);
  igual(m.notes.filter(n=>!n.rest).map(n=>n.beats.toFixed(2)), ['1.00','0.33','0.33','0.33','3.00']);
});

/* ---------- Escalas ---------- */
teste('escalas: grafia correta', () => {
  const nomes = (t,pc) => scaleNotes(t,pc,validStarts(t,pc,'right',1)[0],1,'up').map(n=>spellName(n)).join(' ');
  if(state.names==='pt'){
    igual(nomes('maior',5), 'Fá Sol Lá Si♭ Dó Ré Mi Fá');
    igual(nomes('harmonica',9), 'Lá Si Dó Ré Mi Fá Sol♯ Lá');
  }
});
teste('escalas: pelo menos 231 das 240 combinações cabem no instrumento', () => {
  let n = 0;
  for(const t in SCALE_TYPES) for(const h of ['right','left']) for(const o of [1,2]) for(let pc=0; pc<12; pc++) if(validStarts(t,pc,h,o).length) n++;
  ok(n >= 231, n + ' combinações');
});

/* ---------- Som ---------- */
teste('som: toda nota do mapa tem amostra (transposição até 7 semitons)', () => {
  if(!SF) return;
  for(const h of ['left','right']) for(const b of state.layout[h]) for(const d of ['open','close']){
    const z = sfZone(b[d]); ok(Math.abs(b[d]-z.root) <= 7, 'nota ' + b[d]);
  }
});

/* ---------- Execução ---------- */
(async () => {
  const linhas = [];
  for(const t of TESTES){
    try{ await t.fn(); linhas.push('OK     ' + t.nome); }
    catch(e){ linhas.push('FALHA  ' + t.nome + ' → ' + e.message); }
  }
  const falhas = linhas.filter(l=>l.startsWith('FALHA')).length;
  linhas.push('', `${TESTES.length - falhas}/${TESTES.length} testes passaram.`);
  const pre = document.createElement('pre'); pre.id = 'resultado-testes'; pre.textContent = linhas.join('\n');
  document.body.prepend(pre); document.title = 'TESTES-FIM';
})();
