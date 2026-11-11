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
  if(currentView==='eco'){ if(typeof ecoMicNota==='function') ecoMicNota(m); return; }
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
  // nunca calibrou e ligou o microfone fora do Afinador (Melodias, Academia, RepeTCHÊ): oferece a calibragem ali mesmo
  if(store.get('micLimiar', null)==null && currentView!=='microfone')
    setTimeout(()=>avisar(`<span class="toast-ic"><svg aria-hidden="true"><use href="#i-mic"/></svg></span><span><b>${t('Para o app ouvir melhor')}</b><br><span class="muted">${t('Meça o silêncio do ambiente: são só dois segundos.')}</span></span><button type="button" class="btn sec" data-calibrar>${t('Calibrar agora')}</button>`, 9000), 400);
  return true;
}
function micStop(){
  clearInterval(mic.timer); mic.on=false;
  if(mic.src) mic.src.disconnect();
  if(mic.stream) mic.stream.getTracks().forEach(t=>t.stop());
  mic.stream = mic.src = null;
  const el = $('#micStatus'); if(el) el.textContent = '';
}
/* ---------- Tela Afinador: a nota ouvida, a afinação e os botões que dão essa nota ---------- */
// Com "Abrindo e fechando", cada botão tem duas notas: os nomes ficam só nos botões acesos (a nota ouvida)
let mcAcesos = {};
const mcOpts = {getDir:()=>'open', rotulo:b=>state.showLabels && mcAcesos[b.id]!=null ? noteName(mcAcesos[b.id]) : ''};
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
  mcUltima = m; const ab = true, fe = true, n = {open:0, close:0}; // sempre as duas direções: o som não diz qual é
  mcAcesos = {};
  // o som não diz a direção do fole: acende onde a nota sai abrindo (azul) e onde sai fechando (laranja).
  // Vale a oitava exata; só se ela não existir naquela direção entra a oitava vizinha (o microfone às vezes erra a oitava).
  const exata = dir => state.layout.left.concat(state.layout.right).some(b=>b[dir]===m);
  const vale = {open: exata('open') ? x=>x===m : x=>micMatches(m, x), close: exata('close') ? x=>x===m : x=>micMatches(m, x)};
  for(const [k,lado] of [[mcL,'left'],[mcR,'right']]){
    k.clearMarks();
    state.layout[lado].forEach(b=>{
      const a = ab && vale.open(b.open), f = fe && vale.close(b.close);
      if(a) n.open++; if(f) n.close++;
      if(a || f){ k.mark(b.id, a && f ? 'mc-ambas' : a ? 'mc-abre' : 'mc-fecha', 0); mcAcesos[b.id] = a ? b.open : b.close; }
    });
    k.refresh();
  }
  const conta = (q, um, varios) => t(q===1 ? um : varios, q);
  const partes = [ab && n.open && `<span><i class="menu-ponto open" aria-hidden="true"></i>${t('abrindo')}: ${conta(n.open, '{} botão', '{} botões')}</span>`,
                  fe && n.close && `<span><i class="menu-ponto close" aria-hidden="true"></i>${t('fechando')}: ${conta(n.close, '{} botão', '{} botões')}</span>`].filter(Boolean);
  $('#mcOnde').innerHTML = partes.length ? partes.join('') : `<span>${t('Essa nota não está no teclado do bandoneon.')}</span>`;
}
$('#mcOn').onclick = async ()=>{
  if(mic.on){ micStop(); mcDono=false; $('#micToggle').checked=false; $('#acMic').checked=false; $('#ecoMicOn').checked=false; }
  else if(await micStart()){ mcDono=true; $('#mcInfo').textContent=''; }
  mcEstado();
};
// Mede o barulho do ambiente por 2 segundos: sons mais baixos que isso passam a ser ignorados
function calibrarSilencio(info, fim){
  if(!mic.on) return;
  info(t('Silêncio, por favor… medindo o barulho do ambiente.'));
  const medidas = [], t0 = performance.now();
  const iv = setInterval(()=>{
    if(!mic.on){ clearInterval(iv); if(fim) fim(); return; }
    mic.analyser.getFloatTimeDomainData(mic.buf);
    let r = 0; for(let i=0;i<mic.buf.length;i++) r += mic.buf[i]*mic.buf[i];
    medidas.push(Math.sqrt(r/mic.buf.length));
    if(performance.now()-t0 < 2000) return;
    clearInterval(iv); medidas.sort((a,b)=>a-b);
    mic.limiar = Math.min(0.06, Math.max(0.008, 2.5*medidas[Math.floor(medidas.length*0.9)]));
    store.set('micLimiar', mic.limiar);
    info(t('Pronto! O app vai ignorar os sons mais baixos que o barulho medido.')); if(fim) fim();
  }, 50);
}
$('#mcCal').onclick = ()=>{
  if(!mic.on) return;
  $('#mcCal').disabled = true;
  calibrarSilencio(msg=>{ $('#mcInfo').textContent = msg; }, ()=>{ $('#mcCal').disabled = false; });
};
// "Calibrar agora" no aviso que aparece ao ligar o microfone em outra tela
document.addEventListener('click', e=>{
  if(!e.target.closest('[data-calibrar]')) return;
  calibrarSilencio(msg=>avisar(`<span class="toast-ic"><svg aria-hidden="true"><use href="#i-mic"/></svg></span><span>${menuEsc(msg)}</span>`, 4000));
});
ganchosAba.push((v, antes)=>{
  if(antes==='microfone' && v!=='microfone' && mcDono){ micStop(); mcDono=false; mcEstado(); }
  if(v==='microfone'){ mcL.build(); mcR.build(); mcUltima=null; mcEstado(); }
});

$('#micToggle').onchange = async e=>{
  if(e.target.checked){ if(!await micStart()) e.target.checked=false; }
  else micStop();
};
// A direção do fole vira dois botões, com as bolinhas de cor (js/menus.js)
