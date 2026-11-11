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
function abrirDesafio(ch){
  if(ch==='ear'){ go('qualnota'); ouvidoModo('som'); return; } // o Ache pelo som mora na aba Ouvido
  go('desafios'); const b = $(`[data-ch="${ch}"]`); if(b) b.click();
}
function abrirNivel(n){ go('academia'); const b = $(`#acNiveis [data-nivel="${n}"]`); if(b) b.click(); }

// Etapas do caminho. para(perfil) decide se a etapa entra; t e d podem depender do objetivo.
const ETAPAS = [
  {id:'conhecer', t:'Conheça o instrumento', d:'Lições 1 e 2: a história e as partes do bandoneon.',
   para:p=>p.exp!=='bandoneon', feito:()=>licaoFeita(0) && licaoFeita(1), ir:()=>abrirLicao(licaoFeita(0)?1:0)},
  {id:'teclado', t:'Toque os primeiros botões', d:'Abra o Teclado e toque à vontade, abrindo e fechando o fole.',
   para:p=>p.exp!=='bandoneon', feito:()=>!!state.progress.marcos.teclado, ir:()=>go('teclado')},
  {id:'bisonoro', t:'Abrindo e fechando', d:'Lição 3: o mesmo botão dá duas notas. Faça o exercício da lição.',
   feito:()=>licaoFeita(2), ir:()=>abrirLicao(2)},
  {id:'microfone', t:'Conecte o seu bandoneon', d:'No Afinador, ligue o microfone e veja o app reconhecer as suas notas.',
   para:p=>p.inst==='sim', feito:()=>!!state.progress.marcos.mic, ir:()=>go('microfone')},
  {id:'academia', t:'Academia · Nível 1', d:'Os primeiros exercícios com o instrutor: um botão de cada vez.',
   feito:()=>algumaAcad(1), ir:()=>abrirNivel(1)},
  {id:'fole', t:'Fole e expressão', d:'Lição 4: como o fole controla o volume e onde trocar a direção.',
   feito:()=>licaoFeita(3), ir:()=>abrirLicao(3)},
  {id:'encontre', t:'Decore os botões', d:'Faça 5 de 10 no desafio Encontre a nota.',
   feito:()=>state.progress.find>=5, ir:()=>abrirDesafio('find')},
  {id:'ouvido', t:'Treine o ouvido', d:'Encontre 5 de 10 notas só pelo som, em Ouvido → Ache pelo som.',
   feito:()=>state.progress.ouvido>=5, ir:()=>abrirDesafio('ear')},
  {id:'eco', t:'Toque de ouvido', d:'Complete uma música no RepeTCHÊ: o bandoneon toca e você repete.',
   feito:()=>Object.keys(state.progress.eco||{}).length>0, ir:()=>go('eco')},
  {id:'escala', t:'Sua primeira escala', d:'A escala de Dó maior no modo Espera, nas Escalas guiadas.',
   feito:()=>Object.keys(melodiasFeitas()).some(k=>k.startsWith('esc:')),
   ir:()=>{ go('melodias'); loadScale('maior', 0, 'right', 1, validStarts('maior',0,'right',1)[0], 'updown'); $('#melMode').value='wait'; }},
  {id:'teoria-pauta', t:'A pauta e as claves', d:'Teoria: onde fica cada nota na clave de sol e na clave de fá.',
   feito:()=>!!(state.progress.teoria||{}).pauta, ir:()=>abrirTeoria(1)},
  {id:'leitura', t:'Leia a partitura', d:'Lição 5 e 5 de 10 em Leitura na pauta.',
   feito:()=>licaoFeita(4) && state.progress.staff>=5, ir:()=>licaoFeita(4) ? abrirDesafio('staff') : abrirLicao(4)},
  {id:'teoria-tempo', t:'Figuras e compasso', d:'Teoria: quanto dura cada nota e como se conta o tempo.',
   feito:()=>{ const te = state.progress.teoria||{}; return !!(te.figuras && te.compasso); }, ir:()=>abrirTeoria(state.progress.teoria.figuras ? 4 : 3)}, // teoria.js (que cria progress.teoria) carrega depois
  {id:'ritmo', t:p=>p.obj==='tango'?'O ritmo do tango':'Ritmo e acompanhamento', d:'Lição 6 e o Toque junto até registrar a sua precisão.',
   feito:()=>licaoFeita(5) && state.progress.rhythm!=null, ir:()=>licaoFeita(5) ? go('ritmo') : abrirLicao(5)},
  {id:'acordes', t:'Seus primeiros acordes', d:'Lição 9 e uma rodada do treino de acordes.',
   feito:()=>licaoFeita(8) && state.progress.chords!=null, ir:()=>licaoFeita(8) ? go('acordes') : abrirLicao(8)},
  {id:'melodia', t:'Uma melodia inteira', d:'Termine uma melodia no modo Espera com 80% ou mais.',
   feito:()=>Object.entries(melodiasFeitas()).some(([k,v])=>!k.startsWith('esc:') && v>=80), ir:()=>go('melodias')},
  {id:'tango', t:'Seu primeiro tango', d:'A introdução de El Choclo (Ángel Villoldo, 1903), em Melodias. Termine no modo Espera.',
   para:p=>p.obj!=='conhecer', feito:()=>melodiasFeitas()['choclo-intro']!=null, ir:()=>{ go('melodias'); loadMelody('choclo-intro'); $('#melMode').value='wait'; }},
  {id:'duas', t:'Duas mãos, um fole só', d:'Lição 10 e a Ode à Alegria a duas mãos.',
   para:p=>p.obj!=='conhecer', feito:()=>licaoFeita(9) && melodiasFeitas()['ode-duas']!=null,
   ir:()=>{ if(!licaoFeita(9)) abrirLicao(9); else { go('melodias'); loadMelody('ode-duas'); } }},
  {id:'final', t:p=>({tango:'Um tango de verdade', gaucha:'O seu repertório gaúcho', conhecer:'Quem inspirou o nome'})[p.obj],
   d:p=>({tango:'Lição 11 e uma música sua na Academia (Minhas músicas).',
          gaucha:'Importe uma música gaúcha de que você gosta (MusicXML ou MIDI) e pratique na Academia.',
          conhecer:'Leia a história de Doly Costa, o bandoneonista que inspirou o BanDoly.'})[p.obj],
   feito:()=>{ const p=perfilAluno()||{}; return p.obj==='conhecer' ? !!state.progress.marcos.doly : (p.obj!=='tango' || licaoFeita(10)) && minhasMusicas().length>0; },
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
  if(typeof renderInicio==='function') renderInicio(es, n, atual); // Início (js/inicio.js)
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
  {id:'ouvido',       ic:'ear',     t:'Ouvido afinado',      d:'8 de 10 em Ouvido → Ache pelo som.', feito:()=>state.progress.ouvido>=8},
  {id:'leitor',       ic:'note',    t:'Leitor de pauta',     d:'8 de 10 em Leitura na pauta.', feito:()=>state.progress.staff>=8},
  {id:'mao-esquerda', ic:'keys',    t:'Mão esquerda firme',  d:'30 acertos na mão esquerda nos desafios e na Academia.', feito:()=>acertosNaMao('left')>=30},
  {id:'eco',          ic:'eco',     t:'RepeTCHÊ perfeito',   d:'Completou uma música do RepeTCHÊ sem errar nenhuma nota.', feito:()=>Object.values(state.progress.eco||{}).some(x=>x.estrelas>=3)},
  {id:'eco-semana',   ic:'flame',   t:'Sete dias de RepeTCHÊ', d:'Fez a música do dia do RepeTCHÊ 7 dias seguidos.', feito:()=>typeof ecoSequenciaDias==='function' && ecoSequenciaDias()>=7},
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
  renderMapaBotoes();
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

// Mapa de botões: cada botão aceso conforme os acertos (abrindo e fechando juntos) nos Desafios e na Academia
function renderMapaBotoes(){
  const st = state.progress.btnStats || {}; let treinados = 0, total = 0;
  for(const [mao, id] of [['left', 'pfMapaEsq'], ['right', 'pfMapaDir']]){
    const L = state.layout[mao], W = Math.max(...L.map(b=>b.x)) + 1, H = Math.max(...L.map(b=>b.y)) + 1;
    total += L.length;
    $('#' + id).setAttribute('viewBox', `-0.1 -0.1 ${W + .2} ${H + .2}`);
    $('#' + id).innerHTML = L.map((b, i)=>{
      const a = st[statKey(mao, b.id, 'open')] || {ok:0, err:0}, f = st[statKey(mao, b.id, 'close')] || {ok:0, err:0};
      const ok = a.ok + f.ok, n = ok + a.err + f.err; if(n) treinados++;
      const dica = `${noteName(b.open)} / ${noteName(b.close)}` + (n ? ' · ' + t('{} acertos, {} erros', ok, n - ok) : ' · ' + t('ainda não treinado'));
      return `<circle cx="${b.x + .5}" cy="${b.y + .5}" r=".42" class="${n ? '' : 'nunca'}" style="--acc:${n ? (ok / n).toFixed(2) : 0};--i:${i}"><title>${dica}</title></circle>`;
    }).join('');
  }
  $('#pfMapaN').textContent = treinados; $('#pfMapaDe').textContent = t('de {} botões treinados', total);
}


/* ---------- Cartão para compartilhar (imagem 1080 × 1080) ---------- */
// O ornamento do cartão usa os mesmos traços do ícone #i-filete
function desenharCartao(x){
  const cv = document.createElement('canvas'); cv.width = cv.height = 1080;
  const c = cv.getContext('2d'), F = 'Onest, "Segoe UI", sans-serif';
  // fundo ameixa com a luz violeta por trás da medalha (o mundo do app)
  c.fillStyle = '#1c1624'; c.fillRect(0,0,1080,1080);
  const luz = (x, y, r, cor) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, cor); g.addColorStop(1, 'rgba(28,22,36,0)'); c.fillStyle = g; c.fillRect(0,0,1080,1080); };
  luz(470, 470, 520, 'rgba(107,19,245,.42)'); luz(620, 500, 380, 'rgba(255,86,50,.16)'); luz(540, 430, 300, 'rgba(255,158,250,.22)');
  c.strokeStyle = 'rgba(229,231,235,.14)'; c.lineWidth = 2; c.strokeRect(48,48,984,984);
  // medalha: disco lavanda com uma estrela ameixa
  const md = c.createRadialGradient(500, 400, 10, 540, 450, 120); md.addColorStop(0, '#e9dfff'); md.addColorStop(1, '#b997ff');
  c.beginPath(); c.arc(540, 450, 112, 0, Math.PI*2); c.fillStyle = md; c.fill();
  c.beginPath();
  for(let k=0; k<10; k++){ const r = k%2 ? 26 : 60, ang = -Math.PI/2 + k*Math.PI/5; c.lineTo(540 + r*Math.cos(ang), 456 + r*Math.sin(ang)); }
  c.closePath(); c.fillStyle = '#1c1624'; c.fill();
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillStyle = '#b997ff'; c.font = `500 32px ${F}`; c.fillText(t('Conquista no BanDoly'), 540, 650);
  c.fillStyle = '#f1f0ec'; c.font = `650 72px ${F}`; c.fillText(t(x.t), 540, 740);
  c.fillStyle = '#d0c9c4'; c.font = `400 34px ${F}`;
  quebrar(c, t(x.d), 800).forEach((l,i)=>c.fillText(l, 540, 800+i*46));
  c.fillStyle = '#f1f0ec'; c.font = `600 44px ${F}`; c.fillText('BanDoly', 540, 975);
  c.fillStyle = '#a5a2a5'; c.font = `500 26px ${F}`; c.fillText('bandoly.app', 540, 1012);
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
  if(v==='estudo') renderPerfil(); // as Conquistas ficam no fim do Meu estudo
});
renderPerfil();
// primeira visita: as perguntas aparecem na tela Início (quem chega por um link para uma aba não é interrompido)
if(!perfilAluno() && !location.hash) setTimeout(()=>{ if(currentView==='inicio' && !perfilAluno()) abrirBoasVindas(); }, 1200);
ganchosAba.push(v=>{ if(v === 'estudo') contarNumeros($('#conquistas'), '.pf-conta'); });
// Pontes: Encontre a nota ↔ Academia nível 1 (treinam a mesma coisa de jeitos diferentes)
document.addEventListener('click', e=>{
  const n = e.target.closest('[data-abrir-nivel]'); if(n){ abrirNivel(+n.dataset.abrirNivel); return; }
  const d = e.target.closest('[data-abrir-desafio]'); if(d) abrirDesafio(d.dataset.abrirDesafio);
});
