/* ================== Rotina diária e sequência de dias ================== */
state.progress.days = state.progress.days || {};
const dayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// Escala do dia: percorre o ciclo das quintas, alternando maior e menor harmônica
const CICLO_QUINTAS = [0,7,2,9,4,11,5,10,3,8,1,6];
function dailyScale(d=new Date()){
  const n = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()/86400000);
  return {pc: CICLO_QUINTAS[n%12], type: Math.floor(n/12)%2 ? 'harmonica' : 'maior'};
}
function openDailyScale(){
  const {pc,type} = dailyScale();
  go('melodias');
  loadScale(type, pc, 'right', 1, validStarts(type,pc,'right',1)[0], 'updown');
  $('#melMode').value='wait';
}

const ROUTINE = [
  {k:'fole',       icon:'bellows', t:'Aquecimento de fole', d:'1 minuto de notas longas no Teclado, abrindo e fechando com volume estável.', go:()=>go('teclado')},
  {k:'escala',     icon:'music',   t:'Escala do dia',        d:'', go:openDailyScale},
  {k:'desafio',    icon:'target',  t:'Encontre a nota',      d:'Uma rodada de 10 no sorteio inteligente (ou a leitura na pauta).', go:()=>go('desafios')},
  {k:'repertorio', icon:'note',    t:'Melodia ou acordes',   d:'Termine uma melodia no modo Espera ou No tempo, ou um treino de acordes.', go:()=>go('melodias')},
  {k:'ritmo',      icon:'metro',   t:'Ritmo',                d:'Toque junto até registrar a precisão (12 batidas).', go:()=>go('ritmo')},
];
const KIND_TO_ROUTINE = {melodia:'repertorio', acordes:'repertorio'};

// Registra uma atividade de hoje (conta para a sequência de dias e marca a rotina)
function logPractice(kind){
  const k = KIND_TO_ROUTINE[kind] || kind, d = state.progress.days[dayKey()] = state.progress.days[dayKey()] || {};
  if(!d[k]){ d[k]=true; saveProgress(); }
}
function streak(){
  let n=0; const d=new Date();
  if(!state.progress.days[dayKey(d)]) d.setDate(d.getDate()-1); // ainda dá tempo de praticar hoje
  while(state.progress.days[dayKey(d)]){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function renderRoutine(){
  const done = state.progress.days[dayKey()] || {}, {pc,type} = dailyScale();
  ROUTINE[1].d = `Hoje: ${tonicLabel(type,pc)} ${SCALE_TYPES[type].name.toLowerCase()}, no modo Espera.`;
  const feitos = ROUTINE.filter(r=>done[r.k]).length, s = streak();
  $('#streak').classList.toggle('vazio', !s);
  $('#streak').innerHTML = s ? `<svg aria-hidden="true"><use href="#i-flame"/></svg> <b>${s}</b> dia${s>1?'s':''} seguido${s>1?'s':''}` : '<span class="muted">Pratique hoje para começar uma sequência</span>';
  $('#week').innerHTML = Array.from({length:7},(_,k)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-k));
    const on = !!state.progress.days[dayKey(d)];
    return `<span class="day ${on?'on':''} ${k===6?'today':''}" title="${d.toLocaleDateString(IDIOMAS[state.lang].html)}">${d.toLocaleDateString(IDIOMAS[state.lang].html,{weekday:'narrow'}).toUpperCase()}</span>`;
  }).join('') + `<span class="muted" style="margin-left:8px">${feitos}/${ROUTINE.length} hoje</span>`;
  $('#routine').innerHTML = ROUTINE.map((r,i)=>`<div class="ritem ${done[r.k]?'done':''}">
      <span class="rcheck ic-${r.k}"><svg aria-hidden="true"><use href="#i-${done[r.k]?'check':r.icon}"/></svg></span>
      <div class="rtext"><b>${r.t}</b><div class="muted">${r.d}</div></div>
      <button class="btn sec" data-r="${i}">${done[r.k]?'De novo':'Ir'}</button></div>`).join('');
}
$('#routine').addEventListener('click', e=>{ const b=e.target.closest('[data-r]'); if(b) ROUTINE[+b.dataset.r].go(); });
