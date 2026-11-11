/* ================== Ritmo ================== */
// Cada padrão é um compasso 4/4 dividido em 8 colcheias.
// hits = {colcheia: intensidade} (1 = fraco, 2 = forte).
const PATTERNS = {
  marcato4:{name:'Marcato em 4', hits:{0:2,2:1,4:2,6:1},
    desc:'A base do tango: acordes curtos e firmes nos 4 tempos, com o 1 e o 3 mais fortes. No bandoneon, a mão esquerda costuma marcar com acordes graves e o fole dá o "peso".'},
  marcato2:{name:'Marcato em 2', hits:{0:2,4:2},
    desc:'Só os tempos 1 e 3, deixando espaço. Muito usado em trechos mais calmos ou para dar respiração à frase.'},
  sincopa:{name:'Síncopa', hits:{0:1,3:2,4:1,7:2},
    desc:'O acento cai no contratempo, antes do tempo forte, e "puxa" a música para frente. Dá a tensão característica do tango.'},
  tres:{name:'3-3-2', hits:{0:2,3:2,6:2},
    desc:'As 8 colcheias agrupadas em 3+3+2. Associado ao tango mais moderno (Piazzolla), mas presente em toda a tradição.'},
  arrastre:{name:'Marcato com arrastre', hits:{0:2,4:2}, arrastre:true,
    desc:'O arrastre é um "arrasto" que cresce até o tempo forte, como se a nota fosse puxada. No bandoneon, ele sai de um movimento rápido do fole chegando no acento.'},
};
const rh={playing:false,step:0,next:0,timer:null,hitTimes:[],errors:[],raf:null};
$('#rPattern').innerHTML=Object.entries(PATTERNS).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('');
function renderSteps(){
  const p=PATTERNS[$('#rPattern').value], lab=['1','e','2','e','3','e','4','e'];
  $('#rDesc').textContent=p.desc;
  $('#rSteps').innerHTML=lab.map((l,i)=>`<div class="step ${p.hits[i]?'hit'+p.hits[i]:''}" data-s="${i}">${l}</div>`).join('');
}
$('#rPattern').onchange=()=>{ renderSteps(); rh.errors=[]; };
$('#rBpm').oninput=e=>$('#rBpmVal').textContent=e.target.value;
renderSteps();
// Batida = acorde grave curto de Lá menor no timbre escolhido
function hitSound(t,lvl,arr){
  const peak=lvl===2?0.22:0.12, dur=0.11;
  if(arr){ // arrastre: crescendo antes do tempo
    const stepDur=60/(+$('#rBpm').value)/2;
    [45,52,57].forEach(m=>{ const v=makeReed(m,'left',0.0001,t-stepDur);
      v.out.gain.cancelScheduledValues(t-stepDur); v.out.gain.setValueAtTime(0.0001,t-stepDur);
      v.out.gain.exponentialRampToValueAtTime(peak,t); v.out.gain.setTargetAtTime(0,t+dur,0.04);
      v.oscs.forEach(o=>o.stop(t+dur+0.4)); });
  } else [45,52,57].forEach(m=>playNote(m,dur,'left',t,peak));
}
function clickSound(t,strong,dest){
  const c=ac(), o=c.createOscillator(), g=c.createGain();
  o.frequency.value=strong?1500:1000; g.gain.setValueAtTime(strong?0.25:0.12,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
  o.connect(g).connect(dest||master); o.start(t); o.stop(t+0.06);
}
// Agendador com antecedência: a cada 25 ms agenda no relógio de áudio as batidas dos próximos
// 120 ms. Assim o tempo fica preciso mesmo que o JavaScript atrase um pouco.
function scheduler(){
  const c=ac(), stepDur=60/(+$('#rBpm').value)/2, p=PATTERNS[$('#rPattern').value];
  while(rh.next < c.currentTime+0.12){
    const s=rh.step%8, t=rh.next;
    if(p.hits[s]){ hitSound(t,p.hits[s],p.arrastre); rh.hitTimes.push(t); }
    if($('#rClick').checked && s%2===0) clickSound(t,s===0);
    setTimeout(()=>{ $$('.step').forEach(x=>x.classList.toggle('now',+x.dataset.s===s)); }, Math.max(0,(t-c.currentTime)*1000));
    rh.next+=stepDur; rh.step++;
  }
  rh.hitTimes=rh.hitTimes.filter(t=>t>c.currentTime-2);
}
function toggleRhythm(){
  if(rh.playing){ clearInterval(rh.timer); rh.playing=false; $('#rPlay').textContent='Tocar'; botaoRodando($('#rPlay'), false); $$('.step').forEach(x=>x.classList.remove('now')); return; }
  const c=ac(); rh.playing=true; rh.step=0; rh.next=c.currentTime+0.6; rh.hitTimes=[]; rh.errors=[];
  rh.timer=setInterval(scheduler,25); $('#rPlay').textContent='Parar'; botaoRodando($('#rPlay'), true); $('#rFeed').textContent=''; $('#rStats').textContent='';
}
$('#rPlay').onclick=toggleRhythm;
// Compara o toque com a batida mais próxima, descontando a latência de saída do áudio
function tap(){
  if(!rh.playing){ $('#rFeed').className='feedback'; $('#rFeed').textContent='Aperte Tocar primeiro.'; return; }
  const now=ac().currentTime - (AC.outputLatency||0);
  const allHits=[...rh.hitTimes]; if(!allHits.length) return;
  const nearest=allHits.reduce((a,b)=>Math.abs(b-now)<Math.abs(a-now)?b:a);
  const ms=Math.round((now-nearest)*1000);
  if(Math.abs(ms)>250) { $('#rFeed').className='feedback bad'; $('#rFeed').textContent='Fora do acento'; rh.errors.push(250); }
  else {
    rh.errors.push(Math.abs(ms));
    const f=$('#rFeed');
    if(Math.abs(ms)<=40){ f.className='feedback ok'; f.textContent=`No tempo! (${ms>0?'+':''}${ms} ms)`; }
    else { f.className='feedback bad'; f.textContent = ms<0?`Adiantado ${-ms} ms`:`Atrasado ${ms} ms`; }
  }
  const last=rh.errors.slice(-12), acc=Math.round(100*last.filter(e=>e<=60).length/last.length);
  $('#rStats').textContent=`Precisão (últimas ${last.length} batidas, tolerância 60 ms): ${acc}%`;
  if(last.length>=12 && (state.progress.rhythm==null || acc>state.progress.rhythm)){ state.progress.rhythm=acc; saveProgress(); }
  if(last.length>=12) logPractice('ritmo');
}
$('#rPad').addEventListener('pointerdown',e=>{ e.preventDefault(); tap(); });
// Os padrões de acompanhamento viram botões lado a lado (js/menus.js)
segmentar($('#rPattern'), {classe:'menu-seg-quebra'});
