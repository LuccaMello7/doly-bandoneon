/* ================== Caminho de estudo, conquistas e compartilhar ================== */
// Na primeira visita, três perguntas (experiência, se tem bandoneon e o objetivo) montam o caminho
// mostrado na tela Início. Cada etapa sabe se já foi feita olhando o progresso salvo, então nada é
// marcado à mão. As conquistas também saem do progresso; a data em que cada uma foi ganha fica em
// state.progress.insignias, e ela continua ganha mesmo que o recorde caia depois.
state.progress.marcos = state.progress.marcos || {};     // coisas soltas: tocou o teclado, testou o microfone…
state.progress.insignias = state.progress.insignias || {};
const perfilAluno = () => store.get('perfilAluno', null);
function marcar(k){ if(!state.progress.marcos[k]){ state.progress.marcos[k] = true; saveProgress(); } }

const licaoFeita = i => !!state.progress.lessons[i];
const algumaAcad = n => { const nv = ACADEMIA.find(x=>x.nivel===n); return !!nv && nv.exercicios.some(e=>acadConcluido(e.id)); };
const melodiasFeitas = () => state.progress.melodies || {};
function abrirLicao(i){ curLesson = i; renderLesson(); go('licoes'); }
function abrirDesafio(ch){ go('desafios'); const b = $(`[data-ch="${ch}"]`); if(b) b.click(); }
function abrirNivel(n){ go('academia'); const b = $(`#acNiveis [data-nivel="${n}"]`); if(b) b.click(); }

// Etapas do caminho. para(perfil) decide se a etapa entra; t e d podem depender do objetivo.
const ETAPAS = [
  {id:'conhecer', t:'Conheça o instrumento', d:'Lições 1 e 2: a história e as partes do bandoneon.',
   para:p=>p.exp!=='bandoneon', feito:()=>licaoFeita(0) && licaoFeita(1), ir:()=>abrirLicao(licaoFeita(0)?1:0)},
  {id:'teclado', t:'Toque os primeiros botões', d:'Abra o Teclado e toque à vontade, abrindo e fechando o fole.',
   para:p=>p.exp!=='bandoneon', feito:()=>!!state.progress.marcos.teclado, ir:()=>go('teclado')},
  {id:'bisonoro', t:'Abrindo e fechando', d:'Lição 3: o mesmo botão dá duas notas. Faça o exercício da lição.',
   feito:()=>licaoFeita(2), ir:()=>abrirLicao(2)},
  {id:'microfone', t:'Conecte o seu bandoneon', d:'Em Bandoneon real, ligue o microfone e veja o app reconhecer as suas notas.',
   para:p=>p.inst==='sim', feito:()=>!!state.progress.marcos.mic, ir:()=>go('microfone')},
  {id:'academia', t:'Academia · Nível 1', d:'Os primeiros exercícios com o instrutor: um botão de cada vez.',
   feito:()=>algumaAcad(1), ir:()=>abrirNivel(1)},
  {id:'fole', t:'Fole e expressão', d:'Lição 4: como o fole controla o volume e onde trocar a direção.',
   feito:()=>licaoFeita(3), ir:()=>abrirLicao(3)},
  {id:'encontre', t:'Decore os botões', d:'Faça 5 de 10 no desafio Encontre a nota.',
   feito:()=>state.progress.find>=5, ir:()=>abrirDesafio('find')},
  {id:'ouvido', t:'Treine o ouvido', d:'Encontre 5 de 10 notas só pelo som, no Treino de ouvido.',
   feito:()=>state.progress.ouvido>=5, ir:()=>abrirDesafio('ear')},
  {id:'escala', t:'Sua primeira escala', d:'A escala de Dó maior no modo Espera, nas Escalas guiadas.',
   feito:()=>Object.keys(melodiasFeitas()).some(k=>k.startsWith('esc:')),
   ir:()=>{ go('melodias'); loadScale('maior', 0, 'right', 1, validStarts('maior',0,'right',1)[0], 'updown'); $('#melMode').value='wait'; }},
  {id:'leitura', t:'Leia a partitura', d:'Lição 5 e 5 de 10 em Leitura na pauta.',
   feito:()=>licaoFeita(4) && state.progress.staff>=5, ir:()=>licaoFeita(4) ? abrirDesafio('staff') : abrirLicao(4)},
  {id:'ritmo', t:p=>p.obj==='tango'?'O ritmo do tango':'Ritmo e acompanhamento', d:'Lição 6 e o Toque junto até registrar a sua precisão.',
   feito:()=>licaoFeita(5) && state.progress.rhythm!=null, ir:()=>licaoFeita(5) ? go('ritmo') : abrirLicao(5)},
  {id:'acordes', t:'Seus primeiros acordes', d:'Lição 9 e uma rodada do treino de acordes.',
   feito:()=>licaoFeita(8) && state.progress.chords!=null, ir:()=>licaoFeita(8) ? go('acordes') : abrirLicao(8)},
  {id:'melodia', t:'Uma melodia inteira', d:'Termine uma melodia no modo Espera com 80% ou mais.',
   feito:()=>Object.entries(melodiasFeitas()).some(([k,v])=>!k.startsWith('esc:') && v>=80), ir:()=>go('melodias')},
  {id:'duas', t:'Duas mãos, um fole só', d:'Lição 10 e a Ode à Alegria a duas mãos.',
   para:p=>p.obj!=='conhecer', feito:()=>licaoFeita(9) && melodiasFeitas()['ode-duas']!=null,
   ir:()=>{ if(!licaoFeita(9)) abrirLicao(9); else { go('melodias'); loadMelody('ode-duas'); } }},
  {id:'final', t:p=>({tango:'Um tango de verdade', gaucha:'O seu repertório gaúcho', conhecer:'Quem inspirou o nome'})[p.obj],
   d:p=>({tango:'Lição 11 e uma partitura sua na Academia (Minhas partituras).',
          gaucha:'Importe uma música gaúcha de que você gosta (MusicXML ou MIDI) e pratique na Academia.',
          conhecer:'Leia a história de Doly Costa, o bandoneonista que inspirou o BanDoly.'})[p.obj],
   feito:()=>{ const p=perfilAluno()||{}; return p.obj==='conhecer' ? !!state.progress.marcos.doly : (p.obj!=='tango' || licaoFeita(10)) && minhasPartituras().length>0; },
   ir:()=>{ const p=perfilAluno()||{}; if(p.obj==='conhecer') location.href=$('.doly-link').href; else if(p.obj==='tango' && !licaoFeita(10)) abrirLicao(10); else abrirNivel(7); }},
];
const PERFIL_PADRAO = {exp:'nunca', inst:'nao', obj:'tango'};
const valorDe = (x, p) => typeof x==='function' ? x(p) : x;
function etapasDoAluno(){
  const p = perfilAluno() || PERFIL_PADRAO;
  return ETAPAS.filter(e=>!e.para || e.para(p)).map(e=>({...e, t:valorDe(e.t,p), d:valorDe(e.d,p)}));
}
const OBJETIVO_TIT = {tango:'Do primeiro botão ao tango', gaucha:'Do primeiro botão à música gaúcha', conhecer:'Conhecendo o bandoneon'};

let trilhaAberta = false;
function renderTrilha(){
  const lista = $('#trilha'); if(!lista) return;
  const p = perfilAluno() || PERFIL_PADRAO, es = etapasDoAluno(), feitos = es.map(e=>e.feito());
  const atual = feitos.indexOf(false), n = feitos.filter(Boolean).length;
  $('#trilhaTit').textContent = OBJETIVO_TIT[p.obj] || OBJETIVO_TIT.tango;
  $('#trilhaSub').textContent = atual<0 ? 'Caminho completo! A Medalha Doly Costa é sua.' : `Próxima etapa: ${es[atual].t}`;
  $('#trilhaProg').textContent = `${n}/${es.length}`;
  // o botão principal da tela Início leva à próxima etapa
  $('#heroCtaTxt').textContent = atual<0 ? 'Ver as suas conquistas' : `${n===0?'Começar':'Continuar'}: ${es[atual].t}`;
  $('#trilhaCard').style.setProperty('--feito', es.length ? n/es.length : 0);
  // fechado: as feitas mais recentes, a atual e as duas seguintes
  const ini = atual<0 ? es.length-3 : Math.max(0, atual-1), fim = atual<0 ? es.length : atual+3;
  lista.innerHTML = es.map((e,i)=>{
    const est = feitos[i] ? 'feita' : i===atual ? 'atual' : 'futura';
    const escondida = !trilhaAberta && (i<ini || i>=fim);
    return `<li class="etapa ${est}" ${escondida?'hidden':''}><span class="etapa-num">${feitos[i]?'<svg aria-hidden="true"><use href="#i-check"/></svg>':i+1}</span>
      <div class="etapa-txt"><b>${e.t}</b><span class="muted">${e.d}</span></div>
      ${est==='futura' ? '' : `<button type="button" class="btn ${est==='atual'?'':'sec'}" data-etapa="${e.id}">${est==='atual'?'Começar':'Revisar'}</button>`}</li>`;
  }).join('');
  $('#trilhaMais').hidden = es.length<=fim-ini;
  $('#trilhaMais').textContent = trilhaAberta ? 'Mostrar menos' : 'Ver o caminho inteiro';
  $('#trilhaMais').setAttribute('aria-expanded', trilhaAberta);
}
$('#trilha').addEventListener('click', e=>{
  const b = e.target.closest('[data-etapa]'); if(!b) return;
  const et = ETAPAS.find(x=>x.id===b.dataset.etapa); if(et) et.ir();
});
$('#heroCta').onclick = ()=>{ const es = etapasDoAluno(), i = es.findIndex(e=>!e.feito()); if(i<0) go('perfil'); else es[i].ir(); };
$('#trilhaMais').onclick = ()=>{ trilhaAberta = !trilhaAberta; renderTrilha(); };
// marcos que o resto do app não registra
$('.doly-link').addEventListener('click', ()=>marcar('doly'));

/* ---------- Primeira visita: três perguntas, uma por vez ---------- */
let bvPasso = 0;
function bvMostrar(i){
  bvPasso = i;
  $$('#bvForm .bv-passo').forEach(f=>f.classList.toggle('on', +f.dataset.passo===i));
  $$('#bvForm .bv-pontos i').forEach((p,k)=>p.classList.toggle('on', k<=i));
  $('#bvVoltar').hidden = i===0;
}
function abrirBoasVindas(){
  const d = $('#boasVindas'); if(!d || !d.showModal || d.open) return;
  const p = perfilAluno() || {};
  for(const k of ['exp','inst','obj']) $$(`#bvForm [name="${k}"]`).forEach(r=>{ r.checked = r.value===p[k]; });
  bvMostrar(0); d.showModal();
}
function salvarPerfil(p){
  store.set('perfilAluno', {...PERFIL_PADRAO, ...p, data:dayKey()});
  renderTrilha(); renderPerfil();
}
$('#bvForm').addEventListener('change', e=>{
  if(e.target.type!=='radio') return;
  if(bvPasso<2){ setTimeout(()=>bvMostrar(bvPasso+1), movReduzido()?0:220); return; }
  const f = new FormData($('#bvForm')), p = {};
  for(const k of ['exp','inst','obj']) if(f.get(k)) p[k] = f.get(k);
  $('#boasVindas').close(); salvarPerfil(p);
  go('estudo'); $('#trilhaCard').scrollIntoView({behavior: movReduzido()?'auto':'smooth', block:'center'});
  $('#trilhaCard').classList.add('destaque'); setTimeout(()=>$('#trilhaCard').classList.remove('destaque'), 1800);
});
$('#bvVoltar').onclick = ()=>bvMostrar(Math.max(0, bvPasso-1));
$('#bvPular').onclick = ()=>{ if(!perfilAluno()) salvarPerfil({pulou:true}); };
$('#pfRefazer').onclick = abrirBoasVindas;

/* ---------- Conquistas ---------- */
const acertosNaMao = lado => Object.entries(state.progress.btnStats||{}).filter(([k])=>k.startsWith(lado+'|')).reduce((s,[,v])=>s+v.ok, 0);
const INSIGNIAS = [
  {id:'primeiro-dia', ic:'keys',    t:'Primeiro dia',        d:'Praticou pela primeira vez.', feito:()=>Object.keys(state.progress.days||{}).length>0},
  {id:'bisonoro',     ic:'bellows', t:'Bisonoro',            d:'Concluiu a lição Abrindo e fechando.', feito:()=>licaoFeita(2)},
  {id:'memoria',      ic:'target',  t:'Mapa na cabeça',      d:'8 de 10 no desafio Encontre a nota.', feito:()=>state.progress.find>=8},
  {id:'ouvido',       ic:'ear',     t:'Ouvido afinado',      d:'8 de 10 no Treino de ouvido.', feito:()=>state.progress.ouvido>=8},
  {id:'leitor',       ic:'note',    t:'Leitor de pauta',     d:'8 de 10 em Leitura na pauta.', feito:()=>state.progress.staff>=8},
  {id:'mao-esquerda', ic:'keys',    t:'Mão esquerda firme',  d:'30 acertos na mão esquerda nos desafios e na Academia.', feito:()=>acertosNaMao('left')>=30},
  {id:'pulso',        ic:'metro',   t:'Pulso de tango',      d:'80% de precisão no Toque junto.', feito:()=>state.progress.rhythm>=80},
  {id:'acordista',    ic:'chord',   t:'Acordista',           d:'8 de 10 no treino de acordes.', feito:()=>state.progress.chords>=8},
  {id:'duas-maos',    ic:'music',   t:'Duas mãos, um fole',  d:'Terminou a Ode à Alegria a duas mãos.', feito:()=>melodiasFeitas()['ode-duas']!=null},
  {id:'semana',       ic:'flame',   t:'Uma semana seguida',  d:'7 dias seguidos de prática.', feito:()=>streak()>=7},
  {id:'licoes',       ic:'book',    t:'Todas as lições',     d:'Concluiu as 11 lições.', feito:()=>LESSONS.every((_,i)=>licaoFeita(i))},
  {id:'academia',     ic:'cap',     t:'Formado na Academia', d:'Concluiu um exercício em cada um dos 6 níveis.', feito:()=>[1,2,3,4,5,6].every(algumaAcad)},
  {id:'doly',         ic:'star',    t:'Medalha Doly Costa',  d:'Percorreu o caminho inteiro. Uma homenagem ao bandoneonista que inspirou o nome BanDoly.',
   feito:()=>etapasDoAluno().every(e=>e.feito()), especial:true},
];
// Confere as conquistas. Na primeira vez (ao abrir o app) só registra, sem festa.
let conquistasIniciadas = false;
function checarConquistas(){
  const ganhas = state.progress.insignias, novas = [];
  for(const x of INSIGNIAS) if(!ganhas[x.id] && x.feito()){ ganhas[x.id] = dayKey(); novas.push(x); }
  if(novas.length){ store.set('progress', state.progress); renderPerfil(); }
  if(novas.length && conquistasIniciadas){
    const x = novas[novas.length-1];
    avisar(`<span class="toast-ic">${iconeInsignia(x)}</span><span><b>Conquista nova: ${x.t}</b><br><span class="muted">${x.d}</span></span>
      <button type="button" class="btn sec" data-ver-conquistas>Ver</button>`);
    comemorar();
  }
  conquistasIniciadas = true;
}
document.addEventListener('click', e=>{ if(e.target.closest('[data-ver-conquistas]')){ $('#toast').hidden = true; go('perfil'); } });
const iconeInsignia = x => `<svg aria-hidden="true"><use href="#i-${x.ic}"/></svg>`;
function renderPerfil(){
  const box = $('#insignias'); if(!box) return;
  const ganhas = state.progress.insignias, n = INSIGNIAS.filter(x=>ganhas[x.id]).length;
  $('#pfResumo').textContent = `${n} de ${INSIGNIAS.length} conquistas`;
  const p = perfilAluno();
  const rot = (nome, v) => { const r = $(`#bvForm [name="${nome}"][value="${v}"]`); return r ? r.parentNode.lastChild.textContent : ''; };
  $('#pfPerfil').textContent = p && !p.pulou ? [rot('exp',p.exp), rot('inst',p.inst), rot('obj',p.obj)].join(' · ') : 'Responda as perguntas iniciais para personalizar o seu caminho.';
  box.innerHTML = INSIGNIAS.map(x=>{
    const g = ganhas[x.id];
    return `<div class="insignia ${g?'ganha':'bloqueada'} ${x.especial?'especial':''}">
      <div class="medalha"><svg class="filete" aria-hidden="true"><use href="#i-filete"/></svg><span class="medalha-ic">${g ? iconeInsignia(x) : '<svg aria-hidden="true"><use href="#i-lock"/></svg>'}</span></div>
      <b>${x.t}</b><span class="muted">${x.d}</span>
      ${g ? `<span class="insignia-data">${new Date(g+'T12:00').toLocaleDateString(IDIOMAS[state.lang].html)}</span><button type="button" class="btn sec" data-partilhar="${x.id}"><svg aria-hidden="true"><use href="#i-share"/></svg>Compartilhar</button>` : ''}
    </div>`;
  }).join('');
}
$('#insignias').addEventListener('click', e=>{ const b = e.target.closest('[data-partilhar]'); if(b) compartilharInsignia(b.dataset.partilhar); });

/* ---------- Cartão para compartilhar (imagem 1080 × 1080) ---------- */
// O ornamento do cartão usa os mesmos traços do ícone #i-filete
const FILETE = [...document.querySelectorAll('#i-filete path')].map(p=>p.getAttribute('d'));
function desenharCartao(x){
  const cv = document.createElement('canvas'); cv.width = cv.height = 1080;
  const c = cv.getContext('2d'), F = 'Nunito, "Segoe UI", sans-serif';
  const g = c.createLinearGradient(0,0,1080,1080); g.addColorStop(0,'#1e4c86'); g.addColorStop(.5,'#13305a'); g.addColorStop(1,'#2a2a64');
  c.fillStyle = g; c.fillRect(0,0,1080,1080);
  c.strokeStyle = '#e6b450'; c.lineWidth = 6; c.strokeRect(40,40,1000,1000); c.lineWidth = 2; c.strokeRect(58,58,964,964);
  // ornamentos de fileteado em cima e embaixo
  const ornamento = (y, virar) => { c.save(); c.translate(540, y); c.scale(4.2, virar ? -4.2 : 4.2); c.translate(-60,-20);
    c.strokeStyle = '#e6b450'; c.lineWidth = 1.6/4.2*3; c.lineCap = 'round'; FILETE.forEach(d=>{ try{ c.stroke(new Path2D(d)); }catch(e){} }); c.restore(); };
  ornamento(190, false); ornamento(890, true);
  // medalha
  c.beginPath(); c.arc(540, 450, 120, 0, Math.PI*2); c.fillStyle = '#e6b450'; c.fill();
  c.beginPath(); c.arc(540, 450, 100, 0, Math.PI*2); c.fillStyle = '#0d1b2e'; c.fill();
  c.fillStyle = '#f0c96e'; c.font = `900 120px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', 540, 458);
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#f0c96e'; c.font = `900 34px ${F}`; c.fillText(t('Conquista no BanDoly').toUpperCase(), 540, 650);
  c.fillStyle = '#ffffff'; c.font = `900 72px ${F}`; c.fillText(t(x.t), 540, 740);
  c.fillStyle = '#d5def0'; c.font = `600 34px ${F}`;
  quebrar(c, t(x.d), 800).forEach((l,i)=>c.fillText(l, 540, 800+i*46));
  c.font = `900 44px ${F}`; c.fillStyle = '#ffffff'; const w1 = c.measureText('Ban').width, w2 = c.measureText('Doly').width, x0 = 540-(w1+w2)/2;
  c.textAlign = 'left'; c.fillText('Ban', x0, 975); c.fillStyle = '#e6b450'; c.fillText('Doly', x0+w1, 975);
  c.textAlign = 'center'; c.fillStyle = '#9fb0c8'; c.font = `700 26px ${F}`; c.fillText('bandoly.app', 540, 1012);
  return cv;
}
function quebrar(c, txt, largura){
  const linhas = []; let l = '';
  for(const p of txt.split(' ')){ const n = l ? l+' '+p : p; if(c.measureText(n).width>largura && l){ linhas.push(l); l = p; } else l = n; }
  if(l) linhas.push(l); return linhas.slice(0,3);
}
function compartilharInsignia(id){
  const x = INSIGNIAS.find(i=>i.id===id); if(!x) return;
  const texto = t('Ganhei a conquista "{}" no BanDoly, o app gratuito para aprender bandoneon.', t(x.t));
  desenharCartao(x).toBlob(async blob=>{
    if(!blob) return;
    const arq = new File([blob], `bandoly-${id}.png`, {type:'image/png'});
    try{
      if(navigator.canShare && navigator.canShare({files:[arq]})){ await navigator.share({files:[arq], text:texto+' https://bandoly.app/'}); return; }
    }catch(e){ if(e && e.name==='AbortError') return; }
    // sem compartilhamento de arquivos (computador): baixa a imagem
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = arq.name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
    avisar(`<span>${t('Imagem salva. Agora é só postar!')}</span>`);
  }, 'image/png');
}

/* ---------- Ao abrir as abas ---------- */
ganchosAba.push(v=>{
  if(v==='estudo'){ const s=$('#v-estudo'); encherAneis(s); contarNumeros(s); }
  if(v==='perfil') renderPerfil();
});
renderPerfil();
// primeira visita: as perguntas aparecem na tela Início (quem chega por um link para uma aba não é interrompido)
if(!perfilAluno() && !location.hash) setTimeout(()=>{ if(currentView==='inicio' && !perfilAluno()) abrirBoasVindas(); }, 600);
