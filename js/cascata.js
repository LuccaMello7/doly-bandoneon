/* ================== Melodias: notas caindo ================== */
// Outra forma de ver a melodia, para quem ainda não lê partitura: cada nota desce até a linha
// dourada no momento de tocar. A posição na horizontal segue a altura (graves à esquerda), a cor
// segue o fole (azul abrindo, laranja fechando) e o comprimento do bloco é a duração.
// Ouvir e No tempo: as notas caem no ritmo. Espera: a faixa anda até a nota que você precisa tocar.
const roll = {pos:0, raf:null};
const ROLL_TEMPOS = 6; // quantos tempos aparecem acima da linha
const rollLigado = () => $('#melRollOn').checked && currentView==='melodias' && !!mel.cur && !$('#melRoll').hidden;
$('#melRollOn').checked = store.get('melRoll', false);
$('#melRoll').hidden = !$('#melRollOn').checked;
$('#melRollOn').onchange = e=>{ $('#melRoll').hidden = !e.target.checked; store.set('melRoll', e.target.checked); rollIniciar(); };

// Posição atual da música, em tempos
function rollAlvo(){
  if(mel.running && mel.rollTipo==='timed' && AC) return (AC.currentTime - mel.rollInicio)/mel.rollSpb;
  if(mel.running && mel.rollTipo==='listen') return (performance.now()/1000 - mel.rollInicio)/mel.rollSpb;
  const g = mel.cur.groups[Math.max(0, mel.g)]; return g ? g.t : 0;
}
function rollQuadro(){
  roll.raf = null; if(!rollLigado()) return;
  const box = $('#melRoll'), cv = $('#melRollCv'), W = box.clientWidth, H = box.clientHeight, dpr = window.devicePixelRatio || 1;
  if(!W || !H) return;
  if(cv.width!==Math.round(W*dpr) || cv.height!==Math.round(H*dpr)){ cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,W,H);
  const alvo = rollAlvo(), corre = mel.running && !!mel.rollTipo;
  roll.pos = corre || movReduzido() ? alvo : roll.pos + (alvo-roll.pos)*0.2;
  const ns = mel.cur.notes.filter(n=>!n.rest && !n.error); if(!ns.length) return;
  const lo = Math.min(...ns.map(n=>n.midi)) - 1, hi = Math.max(...ns.map(n=>n.midi)) + 1;
  const linha = H - 30, ppt = (linha - 8) / ROLL_TEMPOS, lw = W / (hi - lo + 1);
  // guias verticais em cada Dó e a linha de tocar
  c.fillStyle = '#ffffff0d';
  for(let m=lo; m<=hi; m++) if(((m%12)+12)%12===0) c.fillRect((m-lo)*lw, 0, 1, H);
  c.fillStyle = '#e6b45033'; c.fillRect(0, linha-6, W, 12);
  c.fillStyle = '#e6b450'; c.fillRect(0, linha-1, W, 3);
  c.font = '800 12px Nunito, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for(const n of ns){
    const fim = linha - (n.t - roll.pos)*ppt, alto = Math.max(14, n.beats*ppt - 4), topo = fim - alto;
    if(topo > H || fim < -4) continue;
    const g = mel.cur.groups[n.g], cor = g && g.dir==='close' ? '#f08a4b' : '#4f9cf0';
    const passou = n.t + n.beats <= roll.pos + 1e-3, agora = !passou && n.t <= roll.pos + 0.02;
    const w = Math.max(16, lw - 4), x = (n.midi - lo)*lw + (lw - w)/2;
    c.globalAlpha = passou ? 0.25 : 1;
    c.fillStyle = cor; c.beginPath();
    if(c.roundRect) c.roundRect(x, topo, w, alto, 6); else c.rect(x, topo, w, alto);
    c.fill();
    if(agora){ c.strokeStyle = '#f0c96e'; c.lineWidth = 3; c.stroke(); }
    if(alto >= 18 && w >= 22){ c.fillStyle = '#fff'; c.fillText(noteLabel(n).replace(/\d+$/,''), x + w/2, fim - 10); }
  }
  c.globalAlpha = 1;
  // continua animando enquanto a música corre ou a faixa ainda está chegando na nota
  if(corre || Math.abs(alvo - roll.pos) > 0.002) roll.raf = requestAnimationFrame(rollQuadro);
}
function rollIniciar(){ if(!roll.raf && rollLigado()) roll.raf = requestAnimationFrame(rollQuadro); }
ganchosAba.push(v=>{ if(v==='melodias') rollIniciar(); });
window.addEventListener('resize', rollIniciar);
