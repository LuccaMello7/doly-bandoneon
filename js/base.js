/* ================== Estado e utilidades ================== */
const PT = ["Dó","Dó♯","Ré","Ré♯","Mi","Fá","Fá♯","Sol","Sol♯","Lá","Lá♯","Si"];
const EN = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const LETTERS_PT = ["Dó","Ré","Mi","Fá","Sol","Lá","Si"];
const LETTERS_EN = ["C","D","E","F","G","A","B"];
const DIA_SEMI = [0,2,4,5,7,9,11];

const store = {
  get(k,d){ try{ const v=localStorage.getItem('bandoneon.'+k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem('bandoneon.'+k, JSON.stringify(v)); }catch(e){} }
};
// Mapa Rheinische 142 vozes (38 botões na direita, 33 na esquerda).
// Fontes: diagramas de Omar Caccia e Matías Gobbo. x/y = posição do botão no desenho.
const DEFAULT_LAYOUT = {"name":"Rheinische 142","left":[{"id":"left-0","x":1.66,"y":0.25,"open":44,"close":44},{"id":"left-1","x":2.69,"y":0.0,"open":46,"close":46},{"id":"left-2","x":3.77,"y":0.0,"open":49,"close":51},{"id":"left-3","x":5.06,"y":0.0,"open":53,"close":63},{"id":"left-4","x":6.06,"y":0.21,"open":68,"close":67},{"id":"left-5","x":0.25,"y":0.96,"open":40,"close":38},{"id":"left-6","x":1.16,"y":0.9,"open":45,"close":50},{"id":"left-7","x":2.25,"y":0.65,"open":55,"close":58},{"id":"left-8","x":3.31,"y":0.59,"open":51,"close":60},{"id":"left-9","x":4.38,"y":0.53,"open":65,"close":49},{"id":"left-10","x":5.5,"y":0.65,"open":58,"close":48},{"id":"left-11","x":6.56,"y":0.78,"open":41,"close":42},{"id":"left-12","x":0.75,"y":1.65,"open":50,"close":43},{"id":"left-13","x":1.75,"y":1.46,"open":57,"close":55},{"id":"left-14","x":2.81,"y":1.34,"open":60,"close":59},{"id":"left-15","x":3.88,"y":1.27,"open":64,"close":62},{"id":"left-16","x":4.94,"y":1.27,"open":48,"close":65},{"id":"left-17","x":6.0,"y":1.4,"open":43,"close":54},{"id":"left-18","x":0.31,"y":2.38,"open":52,"close":45},{"id":"left-19","x":1.31,"y":2.21,"open":56,"close":52},{"id":"left-20","x":2.38,"y":2.05,"open":59,"close":57},{"id":"left-21","x":3.41,"y":1.93,"open":62,"close":61},{"id":"left-22","x":4.44,"y":1.93,"open":66,"close":64},{"id":"left-23","x":5.5,"y":2.0,"open":61,"close":56},{"id":"left-24","x":6.5,"y":2.05,"open":42,"close":47},{"id":"left-25","x":0.0,"y":3.21,"open":38,"close":40},{"id":"left-26","x":0.94,"y":2.96,"open":47,"close":52},{"id":"left-27","x":2.0,"y":2.77,"open":67,"close":66},{"id":"left-28","x":3.0,"y":2.62,"open":69,"close":68},{"id":"left-29","x":4.0,"y":2.62,"open":63,"close":71},{"id":"left-30","x":5.0,"y":2.65,"open":54,"close":53},{"id":"left-31","x":5.94,"y":2.77,"open":39,"close":37},{"id":"left-32","x":6.94,"y":2.9,"open":36,"close":41}],"right":[{"id":"right-0","x":1.81,"y":0.07,"open":95,"close":93},{"id":"right-1","x":3.06,"y":0.0,"open":92,"close":92},{"id":"right-2","x":4.31,"y":0.0,"open":91,"close":90},{"id":"right-3","x":5.49,"y":0.14,"open":89,"close":89},{"id":"right-4","x":1.39,"y":0.69,"open":61,"close":60},{"id":"right-5","x":2.36,"y":0.62,"open":93,"close":91},{"id":"right-6","x":3.61,"y":0.6,"open":90,"close":82},{"id":"right-7","x":4.83,"y":0.62,"open":88,"close":84},{"id":"right-8","x":5.83,"y":0.74,"open":87,"close":87},{"id":"right-9","x":0.9,"y":1.32,"open":60,"close":62},{"id":"right-10","x":1.94,"y":1.21,"open":62,"close":61},{"id":"right-11","x":3.12,"y":1.11,"open":67,"close":68},{"id":"right-12","x":4.17,"y":1.18,"open":82,"close":70},{"id":"right-13","x":5.24,"y":1.25,"open":84,"close":72},{"id":"right-14","x":6.32,"y":1.39,"open":86,"close":86},{"id":"right-15","x":0.42,"y":2.12,"open":59,"close":59},{"id":"right-16","x":1.53,"y":1.9,"open":64,"close":66},{"id":"right-17","x":2.5,"y":1.81,"open":73,"close":78},{"id":"right-18","x":3.58,"y":1.74,"open":66,"close":67},{"id":"right-19","x":4.61,"y":1.81,"open":69,"close":71},{"id":"right-20","x":5.69,"y":1.9,"open":72,"close":74},{"id":"right-21","x":6.74,"y":2.12,"open":76,"close":79},{"id":"right-22","x":0.0,"y":2.78,"open":57,"close":57},{"id":"right-23","x":1.04,"y":2.6,"open":65,"close":65},{"id":"right-24","x":1.97,"y":2.5,"open":70,"close":64},{"id":"right-25","x":2.99,"y":2.36,"open":68,"close":69},{"id":"right-26","x":3.96,"y":2.32,"open":71,"close":73},{"id":"right-27","x":5.07,"y":2.36,"open":74,"close":76},{"id":"right-28","x":6.04,"y":2.57,"open":80,"close":81},{"id":"right-29","x":7.15,"y":2.78,"open":83,"close":85},{"id":"right-30","x":0.56,"y":3.33,"open":58,"close":58},{"id":"right-31","x":1.53,"y":3.1,"open":63,"close":63},{"id":"right-32","x":2.5,"y":2.99,"open":77,"close":77},{"id":"right-33","x":3.47,"y":2.96,"open":75,"close":76},{"id":"right-34","x":4.44,"y":2.99,"open":78,"close":80},{"id":"right-35","x":5.42,"y":3.06,"open":81,"close":83},{"id":"right-36","x":6.39,"y":3.26,"open":85,"close":88},{"id":"right-37","x":7.43,"y":3.47,"open":79,"close":75}]};
const makeDefaultLayout = () => JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
function loadLayout(){
  const L = store.get('layout', null);
  return (L && L.left && L.right && !L.didactic && L.left[0].y!=null) ? L : makeDefaultLayout();
}
const state = {
  names: store.get('names','pt'),
  sound: store.get('sound','samples'),
  tuning: store.get('tuning',443),
  volume: store.get('volume',80),
  dir: 'open',
  showLabels: true,
  editing: false,
  layout: loadLayout(),
  progress: store.get('progress', {lessons:{}, find:null, staff:null, rhythm:null}),
};
function saveProgress(){ store.set('progress', state.progress); renderProgress(); }
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rand = n => Math.floor(Math.random()*n);
const pick = a => a[rand(a.length)];
function noteName(m){ return (state.names==='pt'?PT:EN)[((m%12)+12)%12] + (Math.floor(m/12)-1); }
function letterNames(){ return state.names==='pt'?LETTERS_PT:LETTERS_EN; }
const dirLabel = d => d==='open' ? 'Abrindo' : 'Fechando';

function parseNote(s){
  if(s==null) return null;
  s = s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  if(/^\d+$/.test(s)) return +s;
  const m = s.match(/^(do|re|mi|fa|sol|la|si|[a-g])\s*(#|♯|b|♭)?\s*(-?\d)$/);
  if(!m) return null;
  const map={c:0,d:2,e:4,f:5,g:7,a:9,b:11,do:0,re:2,mi:4,fa:5,sol:7,la:9,si:11};
  let v = map[m[1]]; if(m[2]==='#'||m[2]==='♯') v++; if(m[2]==='b'||m[2]==='♭') v--;
  return (parseInt(m[3])+1)*12+v;
}
