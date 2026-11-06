/* ================== Microfone: toque no seu bandoneon ================== */
// Detecta a altura do som do microfone (algoritmo YIN) e usa a nota como se
// você tivesse apertado o botão na tela, nos modos Espera e No tempo.
const MIC_LATENCY = 0.09; // atraso médio da detecção (s), descontado no modo No tempo
const mic = {on:false, stream:null, src:null, analyser:null, buf:null, timer:null,
             cand:null, candCount:0, current:null, peak:0, silent:0,
             limiar: store.get('micLimiar', 0.008)}; // volume mínimo (medido em "Calibrar o silêncio")

// YIN simplificado: devolve {freq, clarity, rms} ou null se não houver nota clara
function detectPitch(buf, sr){
  const N = buf.length;
  let rms = 0; for(let i=0;i<N;i++) rms += buf[i]*buf[i]; rms = Math.sqrt(rms/N);
  if(rms < Math.max(0.008, mic.limiar||0)) return null;
  const maxLag = Math.min(Math.floor(sr/60), N>>1), W = N - maxLag, minLag = Math.floor(sr/1600);
  const d = new Float32Array(maxLag+1);
  for(let lag=1; lag<=maxLag; lag++){
    let s = 0;
    for(let i=0; i<W; i++){ const x = buf[i]-buf[i+lag]; s += x*x; }
    d[lag] = s;
  }
  // diferença normalizada cumulativa
  let run = 0; d[0] = 1;
  for(let lag=1; lag<=maxLag; lag++){ run += d[lag]; d[lag] = run ? d[lag]*lag/run : 1; }
  let lag = -1;
  for(let l=minLag; l<maxLag; l++) if(d[l] < 0.15){ while(l+1<maxLag && d[l+1]<d[l]) l++; lag = l; break; }
  if(lag < 0) return null;
  const a = d[lag-1], b = d[lag], c = d[lag+1];
  const den = a - 2*b + c, p = den ? (a-c)/(2*den) : 0;
  return {freq: sr/(lag+p), clarity: 1-b, rms};
}
const freqToMidi = f => 69 + 12*Math.log2(f/state.tuning);
// o bandoneon soa duas palhetas em oitava: aceita a nota certa em qualquer uma das oitavas
const micMatches = (heard, target) => heard===target || Math.abs(heard-target)===12;

function micTick(){
  mic.analyser.getFloatTimeDomainData(mic.buf);
  const r = detectPitch(mic.buf, AC.sampleRate);
  if(!r){ mic.cand=null; mic.candCount=0; if(++mic.silent>3){ mic.current=null; mic.peak=0; } showMic(null); return; }
  mic.silent = 0;
  const mf = freqToMidi(r.freq), m = Math.round(mf);
  showMic(m, Math.round((mf-m)*100), r.rms);
  // nota repetida: uma queda de volume entre as duas notas conta como novo ataque
  if(mic.current!=null){ mic.peak = Math.max(mic.peak, r.rms); if(r.rms < 0.4*mic.peak){ mic.current=null; mic.peak=0; } }
  if(m===mic.cand) mic.candCount++; else { mic.cand=m; mic.candCount=1; }
  if(mic.candCount===3 && m!==mic.current){ mic.current=m; mic.peak=r.rms; onMicNote(m); }
}
function showMic(m, cents, rms){
  if(currentView==='microfone') mcMostrar(m, cents, rms);
  const el = $('#micStatus'); if(!el) return;
  if(m==null){ el.innerHTML = '<svg aria-hidden="true"><use href="#i-mic"/></svg> Ouvindo… <span class="muted">(toque uma nota)</span>'; return; }
  const c = cents>0 ? '+'+cents : String(cents), cls = Math.abs(cents)<=10 ? 'ok' : 'bad';
  el.innerHTML = `<svg aria-hidden="true"><use href="#i-mic"/></svg> <b>${noteName(m)}</b> <span class="${cls}">${c} cents</span> <span class="micbar"><span style="width:${Math.min(100,Math.round(rms*400))}%"></span></span>`;
}

function onMicNote(m){
  if(currentView==='microfone'){ marcar('mic'); return; }
  if(currentView==='academia'){ acadOuvir(m); return; }
  if(!mel.running || !mel.cur) return;
  const mode = $('#melMode').value;
  if(mode==='wait') melHear(m);
  else if(mode==='timed') timedPress(m, AC.currentTime - MIC_LATENCY, true);
}

async function micStart(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    alert(t('Este navegador não permite usar o microfone aqui. Use o app pelo link https (GitHub Pages) ou num navegador atualizado.')); return false;
  }
  try{
    mic.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}});
  }catch(e){ alert(t('Não foi possível usar o microfone (permissão negada ou nenhum microfone encontrado).')); return false; }
  const c = ac();
  mic.src = c.createMediaStreamSource(mic.stream);
  mic.analyser = c.createAnalyser(); mic.analyser.fftSize = 2048;
  mic.buf = new Float32Array(mic.analyser.fftSize);
  mic.src.connect(mic.analyser); // não liga na saída: evita microfonia
  Object.assign(mic, {on:true, cand:null, candCount:0, current:null, peak:0, silent:0});
  mic.timer = setInterval(micTick, 30);
  showMic(null);
  return true;
}
function micStop(){
  clearInterval(mic.timer); mic.on=false;
  if(mic.src) mic.src.disconnect();
  if(mic.stream) mic.stream.getTracks().forEach(t=>t.stop());
  mic.stream = mic.src = null;
  const el = $('#micStatus'); if(el) el.textContent = '';
}
/* ---------- Tela Bandoneon real: afinador e botões que dão a nota ouvida ---------- */
const mcOpts = {getDir:()=>$('#mcDir').value};
const mcL = kb($('#mcLeft'),'left',mcOpts), mcR = kb($('#mcRight'),'right',mcOpts);
let mcDono = false, mcUltima = null; // mcDono: o microfone foi ligado nesta tela (e desliga ao sair dela)
function mcEstado(){
  $('#mcOn').lastChild.textContent = mic.on ? 'Desligar o microfone' : 'Ligar o microfone';
  $('#mcOn').classList.toggle('sec', mic.on); $('#mcCal').disabled = !mic.on;
  if(!mic.on){ mcMostrar(null); $('#mcCents').textContent = 'Ligue o microfone e toque uma nota.'; }
}
// Mostra a nota ouvida, a afinação (agulha de -50 a +50 cents), o volume e acende os botões
function mcMostrar(m, cents, rms){
  $('#mcNivel').style.width = m==null ? '0%' : Math.min(100, Math.round((rms||0)*400))+'%';
  if(m==null){ $('#mcAgulha').style.left='50%'; $('#mcAfinador').classList.remove('afinado'); return; }
  $('#mcNota').textContent = noteName(m);
  $('#mcAgulha').style.left = (50 + Math.max(-50, Math.min(50, cents))) + '%';
  $('#mcCents').textContent = Math.abs(cents)<=10 ? 'Afinado' : cents>0 ? `${cents} cents acima` : `${-cents} cents abaixo`;
  $('#mcAfinador').classList.toggle('afinado', Math.abs(cents)<=10);
  if(m===mcUltima) return;
  mcUltima = m; const dir = $('#mcDir').value;
  for(const [k,lado] of [[mcL,'left'],[mcR,'right']]){
    k.clearMarks();
    state.layout[lado].forEach(b=>{ if(micMatches(m, b[dir])) k.mark(b.id,'chord',0); });
  }
}
$('#mcOn').onclick = async ()=>{
  if(mic.on){ micStop(); mcDono=false; $('#micToggle').checked=false; $('#acMic').checked=false; }
  else if(await micStart()){ mcDono=true; $('#mcInfo').textContent=''; }
  mcEstado();
};
$('#mcDir').onchange = ()=>{ mcUltima=null; mcL.refresh(); mcR.refresh(); mcL.clearMarks(); mcR.clearMarks(); };
// Mede o barulho do ambiente por 2 segundos: sons mais baixos que isso passam a ser ignorados
$('#mcCal').onclick = ()=>{
  if(!mic.on) return;
  $('#mcCal').disabled = true; $('#mcInfo').textContent = 'Silêncio, por favor… medindo o barulho do ambiente.';
  const medidas = [], t0 = performance.now();
  const iv = setInterval(()=>{
    if(!mic.on){ clearInterval(iv); return; }
    mic.analyser.getFloatTimeDomainData(mic.buf);
    let r = 0; for(let i=0;i<mic.buf.length;i++) r += mic.buf[i]*mic.buf[i];
    medidas.push(Math.sqrt(r/mic.buf.length));
    if(performance.now()-t0 < 2000) return;
    clearInterval(iv); medidas.sort((a,b)=>a-b);
    mic.limiar = Math.min(0.06, Math.max(0.008, 2.5*medidas[Math.floor(medidas.length*0.9)]));
    store.set('micLimiar', mic.limiar); $('#mcCal').disabled = false;
    $('#mcInfo').textContent = 'Pronto! O app vai ignorar os sons mais baixos que o barulho medido.';
  }, 50);
};
ganchosAba.push((v, antes)=>{
  if(antes==='microfone' && v!=='microfone' && mcDono){ micStop(); mcDono=false; mcEstado(); }
  if(v==='microfone'){ mcL.build(); mcR.build(); mcUltima=null; mcEstado(); }
});

$('#micToggle').onchange = async e=>{
  if(e.target.checked){ if(!await micStart()) e.target.checked=false; }
  else micStop();
};
