/* ================== Teoria musical (aba Aprender → Teoria) e desafio Pauta no bandoneon ================== */
// Sete tópicos curtos, cada um com uma parte para mexer (a pauta toca a nota clicada, as figuras tocam no
// tempo…), um teste rápido e um atalho para praticar. A pauta é desenhada aqui mesmo (pautaSVG): posição
// diatônica d = oitava*7 + letra (Dó=0 … Si=6), como em desafios.js; a linha de baixo é Mi4 (d=30) na
// clave de sol e Sol2 (d=18) na clave de fá.
state.progress.teoria = state.progress.teoria || {};
const BASE_CLAVE = {sol:30, fa:18};
const yPauta = (clave, d) => 100 - (d - BASE_CLAVE[clave])*6;
const dDoMidi = m => { const pc = ((m%12)+12)%12; return {d:(Math.floor(m/12)-1)*7 + SHARP_LETTER[pc], acc:SHARP_ACC[pc]}; };
// notas: [{d, acc (1 = ♯, -1 = ♭), cls, x (opcional), vazia (cabeça branca)}]
function pautaSVG(clave, notas, W=360){
  const base = BASE_CLAVE[clave], Y = d => yPauta(clave, d);
  let s = `<svg class="pauta" viewBox="0 0 ${W} 150" role="img" aria-label="${clave==='sol' ? t('Clave de sol') : t('Clave de fá')}">`;
  for(let i=0;i<5;i++) s += `<line x1="8" x2="${W-8}" y1="${100-i*12}" y2="${100-i*12}" class="pl"/>`;
  s += clave==='sol' ? `<text x="12" y="110" font-size="72" class="pc">𝄞</text>` : `<text x="14" y="90" font-size="50" class="pc">𝄢</text>`;
  const x0 = 92, passo = notas.length>1 ? Math.min(46, (W-x0-24)/(notas.length-1)) : 0;
  notas.forEach((n, i)=>{
    const x = n.x ?? x0 + i*passo, y = Y(n.d), cima = n.d < base+4;
    let g = '';
    for(let k=base-2; k>=n.d; k-=2) g += `<line x1="${x-13}" x2="${x+13}" y1="${Y(k)}" y2="${Y(k)}" class="pl"/>`;
    for(let k=base+10; k<=n.d; k+=2) g += `<line x1="${x-13}" x2="${x+13}" y1="${Y(k)}" y2="${Y(k)}" class="pl"/>`;
    if(n.acc) g += `<text x="${x-22}" y="${y+6}" font-size="20" class="pc">${n.acc>0?'♯':'♭'}</text>`;
    g += `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.5" transform="rotate(-20 ${x} ${y})" class="${n.vazia?'cab-vazia':'cab'}"/>`;
    if(!n.semHaste) g += cima ? `<line x1="${x+7}" x2="${x+7}" y1="${y}" y2="${y-34}" class="ph"/>` : `<line x1="${x-7}" x2="${x-7}" y1="${y}" y2="${y+34}" class="ph"/>`;
    s += `<g class="nota ${n.cls||''}" data-i="${i}">${g}</g>`;
  });
  return s + '</svg>';
}
// Figuras rítmicas desenhadas (semibreve, mínima, semínima, colcheia, semicolcheia)
function figuraSVG(tipo){
  const vazia = tipo==='semibreve' || tipo==='minima', haste = tipo!=='semibreve', bandeiras = {colcheia:1, semicolcheia:2}[tipo] || 0;
  let s = `<svg class="figura" viewBox="0 0 34 56" aria-hidden="true"><ellipse cx="13" cy="44" rx="8" ry="6" transform="rotate(-20 13 44)" class="${vazia?'cab-vazia':'cab'}"/>`;
  if(haste) s += `<line x1="20.5" x2="20.5" y1="42" y2="6" class="ph"/>`;
  for(let b=0;b<bandeiras;b++) s += `<path d="M20.5 ${6+b*9} c 2 6 11 8 9 18" class="pb"/>`;
  return s + '</svg>';
}
const tocarSeq = (midis, spb, cada) => midis.forEach((m, i)=>setTimeout(()=>{ playNote(m, spb*0.85); if(cada) cada(i); }, 120 + i*spb*1000));

/* ---------- Os tópicos ---------- */
const FIGURAS = [{tipo:'semibreve', nome:'Semibreve', tempos:4, cod:'1'}, {tipo:'minima', nome:'Mínima', tempos:2, cod:'2'},
                 {tipo:'seminima', nome:'Semínima', tempos:1, cod:'4'}, {tipo:'colcheia', nome:'Colcheia', tempos:0.5, cod:'8'},
                 {tipo:'semicolcheia', nome:'Semicolcheia', tempos:0.25, cod:'16'}];
const TEORIA = [
  {id:'notas', titulo:'As notas e as oitavas', ic:'note',
   widget:el=>{
     el.innerHTML = `<div class="te-notas">${[60,62,64,65,67,69,71,72].map((m,i)=>`<button type="button" class="te-nota" data-m="${m}" style="--i:${i}"><b>${noteName(m)}</b><small>${EN[m%12]}${Math.floor(m/12)-1}</small></button>`).join('')}</div><p class="muted te-dica">Toque cada nota para ouvir. Repare que o Dó5 soa como o Dó4, só que mais agudo.</p>`;
     el.querySelector('.te-notas').addEventListener('click', e=>{ const b = e.target.closest('[data-m]'); if(!b) return; ac(); playNote(+b.dataset.m, 0.7); b.classList.remove('soa'); void b.offsetWidth; b.classList.add('soa'); });
   },
   teste:()=>({q:t('Qual nota vem depois de {}?', letterNames()[4]), o:[letterNames()[5], letterNames()[3], letterNames()[6], letterNames()[0]], a:0}),
   pratica:[['Teclado livre', ()=>go('teclado')]]},
  {id:'pauta', titulo:'A pauta e as claves', ic:'music',
   widget:el=>{
     let clave = 'sol', d = null;
     const desenha = ()=>{
       const area = el.querySelector('.te-pauta'), base = BASE_CLAVE[clave];
       area.innerHTML = pautaSVG(clave, d==null ? [] : [{d, cls:'acesa'}], 360);
       const svg = area.querySelector('svg');
       for(let k=base-4; k<=base+12; k++) svg.insertAdjacentHTML('beforeend', `<rect x="70" y="${yPauta(clave,k)-3}" width="280" height="6" data-d="${k}" class="te-alvo"/>`);
       el.querySelector('.te-nome').textContent = d==null ? t('Toque numa linha ou num espaço da pauta.') : t('{}: {}', (d-base)%2===0 ? t('Linha') : t('Espaço'), noteName(dToMidi(d)));
     };
     el.innerHTML = `<div class="segmento mini te-claves"><button type="button" class="btn sec on" data-clave="sol">Clave de sol</button><button type="button" class="btn sec" data-clave="fa">Clave de fá</button></div>
       <div class="te-pauta staff"></div><p class="te-nome feedback" aria-live="polite"></p>`;
     el.querySelector('.te-claves').addEventListener('click', e=>{ const b = e.target.closest('[data-clave]'); if(!b) return; clave = b.dataset.clave; d = null;
       el.querySelectorAll('[data-clave]').forEach(x=>x.classList.toggle('on', x===b)); desenha(); });
     el.querySelector('.te-pauta').addEventListener('click', e=>{ const r = e.target.closest('[data-d]'); if(!r) return; d = +r.dataset.d; ac(); playNote(dToMidi(d), 0.7, clave==='fa'?'left':'right'); desenha(); });
     desenha();
   },
   teste:()=>({q:t('Na clave de sol, qual nota fica na 2ª linha (de baixo para cima)?'), o:[letterNames()[4], letterNames()[2], letterNames()[6], letterNames()[3]], a:0}),
   pratica:[['Leitura na pauta', ()=>abrirDesafio('staff')], ['Pauta no bandoneon', ()=>abrirDesafio('pautabot')]]},
  {id:'acidentes', titulo:'Sustenido, bemol e bequadro', ic:'keys',
   widget:el=>{
     const ms = [60,61,62,63,64,65,66,67,68,69,70,71,72];
     el.innerHTML = `<div class="te-cromatica">${ms.map((m,i)=>`<button type="button" class="${[1,3,6,8,10].includes(m%12)?'preta':''}" data-m="${m}" style="--i:${i}">${noteName(m).replace(/\d+$/,'')}</button>`).join('')}</div>
       <p class="muted te-dica">Cada passo é um semitom. Toque Mi e Fá, depois Si e Dó: não há nota entre eles.</p>`;
     el.querySelector('.te-cromatica').addEventListener('click', e=>{ const b = e.target.closest('[data-m]'); if(!b) return; ac(); playNote(+b.dataset.m, 0.6); b.classList.remove('soa'); void b.offsetWidth; b.classList.add('soa'); });
   },
   teste:()=>({q:t('O que faz o sustenido (♯)?'), o:[t('Sobe a nota um semitom'), t('Desce a nota um semitom'), t('Cancela a alteração'), t('Dobra a duração')], a:0}),
   pratica:[['Ache pelo som', ()=>abrirDesafio('ear')]]},
  {id:'figuras', titulo:'Figuras e pausas', ic:'note',
   widget:el=>{
     el.innerHTML = `<div class="te-figuras">${FIGURAS.map((f,i)=>`<div class="te-fig" data-i="${i}" style="--i:${i}">${figuraSVG(f.tipo)}<div><b>${f.nome}</b><span class="muted">${t('{} tempo(s)', f.tempos)} · <code>Dó4:${f.cod}</code></span></div>
       <button type="button" class="btn sec" data-fig="${i}" aria-label="${t('Ouvir {}', t(f.nome))}"><svg aria-hidden="true"><use href="#i-play"/></svg></button></div>`).join('')}</div>`;
     el.querySelector('.te-figuras').addEventListener('click', e=>{
       const b = e.target.closest('[data-fig]'); if(!b) return;
       const f = FIGURAS[+b.dataset.fig], spb = 60/80, c = ac(), t0 = c.currentTime + 0.1, linha = b.closest('.te-fig');
       for(let k=0;k<4;k++) clickSound(t0 + k*spb, k===0);
       for(let x=0; x<4-1e-6; x+=f.tempos) playNote(72, f.tempos*spb*0.85, 'right', t0 + x*spb);
       linha.classList.add('tocando'); setTimeout(()=>linha.classList.remove('tocando'), 4*spb*1000);
     });
   },
   teste:()=>({q:t('Quantas colcheias cabem numa semínima?'), o:['1','2','4','8'], a:1}),
   pratica:[['Ritmo', ()=>go('ritmo')]]},
  {id:'compasso', titulo:'Compasso e tempo', ic:'metro',
   widget:el=>{
     let timer = null;
     el.innerHTML = `<div class="row"><div class="segmento mini te-comp"><button type="button" class="btn sec on" data-n="2">2/4</button><button type="button" class="btn sec" data-n="3">3/4</button><button type="button" class="btn sec" data-n="4">4/4</button></div>
       <button type="button" class="btn" data-tocar><svg aria-hidden="true"><use href="#i-play"/></svg>Tocar</button></div><div class="te-tempos"></div>`;
     const n = ()=>+el.querySelector('.te-comp .on').dataset.n;
     const monta = ()=>{ el.querySelector('.te-tempos').innerHTML = Array.from({length:n()}, (_,k)=>`<span class="${k===0?'forte':''}">${k+1}</span>`).join(''); };
     const parar = ()=>{ clearInterval(timer); timer = null; el.querySelector('[data-tocar]').lastChild.textContent = 'Tocar'; el.querySelectorAll('.te-tempos span').forEach(s=>s.classList.remove('agora')); };
     el.querySelector('.te-comp').addEventListener('click', e=>{ const b = e.target.closest('[data-n]'); if(!b) return; el.querySelectorAll('[data-n]').forEach(x=>x.classList.toggle('on', x===b)); parar(); monta(); });
     el.querySelector('[data-tocar]').onclick = ()=>{
       if(timer){ parar(); return; }
       let k = 0; ac(); el.querySelector('[data-tocar]').lastChild.textContent = 'Parar';
       const bate = ()=>{ const ss = el.querySelectorAll('.te-tempos span'), i = k % n(); clickSound(AC.currentTime+0.02, i===0);
         ss.forEach((s,j)=>s.classList.toggle('agora', j===i)); if(++k >= n()*4 || !el.isConnected || currentView!=='teoria') parar(); };
       bate(); timer = setInterval(bate, 600);
     };
     monta();
   },
   teste:()=>({q:t('Em 2/4, qual figura vale um tempo?'), o:[t('Semibreve'), t('Mínima'), t('Semínima'), t('Colcheia')], a:2}),
   pratica:[['Ritmo', ()=>go('ritmo')]]},
  {id:'escalas', titulo:'Tonalidade e escalas', ic:'route',
   widget:el=>{
     const ESC = {maior:{nome:'Dó maior', ms:[60,62,64,65,67,69,71,72], passos:['T','T','S','T','T','T','S']},
                  menor:{nome:'Lá menor harmônica', ms:[57,59,60,62,64,65,68,69], passos:['T','S','T','T','S','T+S','S']}};
     let qual = 'maior';
     const desenha = (acesa)=>{ const e = ESC[qual];
       el.querySelector('.te-pauta').innerHTML = pautaSVG('sol', e.ms.map((m,i)=>({...dDoMidi(m), cls:i===acesa?'acesa':'', semHaste:true})), 380);
       el.querySelector('.te-passos').innerHTML = e.passos.map(p=>`<span class="${p==='S'?'semi':''}">${p}</span>`).join(''); };
     el.innerHTML = `<div class="row"><div class="segmento mini te-esc"><button type="button" class="btn sec on" data-e="maior">Dó maior</button><button type="button" class="btn sec" data-e="menor">Lá menor harmônica</button></div>
       <button type="button" class="btn" data-ouvir><svg aria-hidden="true"><use href="#i-play"/></svg>Ouvir</button></div><div class="te-pauta staff"></div><div class="te-passos"></div>`;
     el.querySelector('.te-esc').addEventListener('click', e=>{ const b = e.target.closest('[data-e]'); if(!b) return; qual = b.dataset.e; el.querySelectorAll('[data-e]').forEach(x=>x.classList.toggle('on', x===b)); desenha(); });
     el.querySelector('[data-ouvir]').onclick = ()=>{ ac(); tocarSeq(ESC[qual].ms, 0.45, i=>desenha(i)); setTimeout(()=>desenha(), 120 + ESC[qual].ms.length*450 + 300); };
     desenha();
   },
   teste:()=>({q:t('Qual é o desenho da escala maior?'), o:['T T S T T T S','T S T T S T T','S T T T S T T','T T T S T T S'], a:0}),
   pratica:[['Escalas guiadas', ()=>{ go('melodias'); $('#scaleOpen').click(); }]]},
  {id:'acordes', titulo:'Acordes', ic:'chord',
   widget:el=>{
     const AC_T = [{nome:'Dó maior', ms:[60,64,67]}, {nome:'Lá menor', ms:[57,60,64]}, {nome:'Sol com sétima', ms:[55,59,62,65]}];
     el.innerHTML = `<div class="te-acordes">${AC_T.map((a,i)=>`<button type="button" class="te-acorde" data-a="${i}" style="--i:${i}"><span class="staff">${pautaSVG('sol', a.ms.map(m=>({...dDoMidi(m), x:110, semHaste:true})), 170)}</span><b>${a.nome}</b><small class="muted">${a.ms.map(m=>noteName(m).replace(/\d+$/,'')).join(' · ')}</small></button>`).join('')}</div>
       <p class="muted te-dica">Toque um acorde para ouvir: primeiro nota por nota, depois todas juntas.</p>`;
     el.querySelector('.te-acordes').addEventListener('click', e=>{ const b = e.target.closest('[data-a]'); if(!b) return; ac();
       const ms = AC_T[+b.dataset.a].ms, t0 = AC.currentTime + 0.05;
       ms.forEach((m,i)=>playNote(m, 0.4, 'right', t0 + i*0.3)); ms.forEach(m=>playNote(m, 1.1, 'right', t0 + ms.length*0.3 + 0.1));
       b.classList.remove('soa'); void b.offsetWidth; b.classList.add('soa'); });
   },
   teste:()=>({q:t('Quais notas formam o acorde de Dó maior?'), o:[[0,2,4],[0,3,5],[1,3,5],[0,2,5]].map(ix=>ix.map(i=>letterNames()[i]).join(' · ')), a:0}),
   pratica:[['Acordes', ()=>go('acordes')]]},
];

/* ---------- A aba Teoria ---------- */
let teoriaAtual = 0;
function renderTeoriaLista(){
  $('#teLista').innerHTML = TEORIA.map((x,i)=>`<button type="button" class="te-item ${i===teoriaAtual?'on':''} ${state.progress.teoria[x.id]?'feito':''}" data-t="${i}" style="--i:${i}">
    <span class="te-num">${state.progress.teoria[x.id] ? '<svg aria-hidden="true"><use href="#i-check"/></svg>' : i+1}</span><span>${t(x.titulo)}</span></button>`).join('');
}
function renderTeoria(){
  renderTeoriaLista();
  const x = TEORIA[teoriaAtual], q = x.teste();
  const box = $('#teConteudo');
  box.innerHTML = `<div class="te-cab"><span class="pg-ic t-teoria"><svg aria-hidden="true"><use href="#i-${x.ic}"/></svg></span><div><h3>${t(x.titulo)}</h3><p class="te-topico">${t('Tópico {} de {}', teoriaAtual+1, TEORIA.length)}</p></div></div>
    <div class="te-texto" translate="no">${(TEORIA_TEXTOS[x.id]||{})[state.lang] || TEORIA_TEXTOS[x.id].pt}</div>
    <div class="te-widget"></div>
    <div class="q te-q" data-a="${q.a}"><div><b>${t('Teste rápido')}:</b> ${q.q}</div><div class="opts">${q.o.map((o,i)=>`<button type="button" class="btn sec" data-o="${i}">${o}</button>`).join('')}</div><div class="fb muted"></div></div>
    <div class="row te-pratica"><span class="muted">${t('Pratique:')}</span>${x.pratica.map(([n],i)=>`<button type="button" class="btn" data-p="${i}">${t(n)}</button>`).join('')}</div>
    <div class="row te-nav"><button type="button" class="btn ghost" data-nav="-1" ${teoriaAtual===0?'disabled':''}>← ${t('Anterior')}</button><button type="button" class="btn sec" data-nav="1" ${teoriaAtual===TEORIA.length-1?'disabled':''}>${t('Próximo')} →</button></div>`;
  x.widget(box.querySelector('.te-widget'));
  box.classList.remove('troca'); void box.offsetWidth; box.classList.add('troca');
}
$('#teLista').addEventListener('click', e=>{ const b = e.target.closest('[data-t]'); if(b){ teoriaAtual = +b.dataset.t; renderTeoria(); } });
$('#teConteudo').addEventListener('click', e=>{
  const x = TEORIA[teoriaAtual];
  const o = e.target.closest('[data-o]');
  if(o){ const q = o.closest('.te-q'), certo = +o.dataset.o === +q.dataset.a;
    o.classList.add(certo?'right':'wrong'); vibrar(certo?'ok':'erro');
    q.querySelector('.fb').textContent = certo ? t('Correto!') : t('Ainda não, tente outra opção.');
    if(certo && !state.progress.teoria[x.id]){ state.progress.teoria[x.id] = true; saveProgress(); renderTeoriaLista(); if(TEORIA.every(y=>state.progress.teoria[y.id])) comemorar(); }
    return; }
  const p = e.target.closest('[data-p]'); if(p){ x.pratica[+p.dataset.p][1](); return; }
  const n = e.target.closest('[data-nav]'); if(n && !n.disabled){ teoriaAtual += +n.dataset.nav; renderTeoria(); $('#v-teoria').scrollIntoView({behavior: movReduzido()?'auto':'smooth', block:'start'}); }
});
ganchosAba.push(v=>{ if(v==='teoria') renderTeoria(); });
function abrirTeoria(i){ teoriaAtual = i; go('teoria'); }

/* ---------- Desafio: Pauta no bandoneon ---------- */
// A nota aparece na pauta (clave de sol para a mão direita, de fá para a esquerda) e o aluno toca o
// botão que dá essa nota na direção indicada. Dez rodadas; depois de dois erros o botão certo brilha.
const pq = {round:0, score:0, dir:'open', hand:'right', answer:null, target:null, errors:0, active:false, hist:[]};
state.progress.pautabot = state.progress.pautabot ?? null;
const pOpts = {getDir:()=>pq.dir, onPress:(b,m,dir,k)=>pautaPress(b,m,k)};
const pkL = kb($('#pkLeft'),'left',pOpts), pkR = kb($('#pkRight'),'right',pOpts);
const FAIXA_PAUTA = {right:[55,84], left:[38,64]}; // o que dá para ler sem muitas linhas suplementares
function pautaFeed(msg, cls=''){ const f = $('#pFeed'); f.className = 'feedback '+cls; f.textContent = msg; }
function desenhaPautaDesafio(cls){
  const clave = pq.hand==='left' ? 'fa' : 'sol';
  $('#pPauta').innerHTML = pq.target==null ? pautaSVG(clave, [], 300) : pautaSVG(clave, [{...dDoMidi(pq.target), cls}], 300);
}
function nextPauta(){
  pkL.clearMarks(); pkR.clearMarks();
  if(pq.round>=10){
    pq.active = false; $('#pDirPill').style.visibility = 'hidden'; menuPratica('p', false);
    pautaFeed(`Fim! ${pq.score}/10`, pq.score>=8?'ok':''); placarBolinhas('p', pq.hist, pq.round, pq.score, false);
    if(state.progress.pautabot==null || pq.score>state.progress.pautabot){ state.progress.pautabot = pq.score; saveProgress(); }
    logPractice('desafio'); if(pq.score>=8) comemorar(); return;
  }
  pq.hand = $('#pHand').value; pq.dir = $('#pDir').value==='rand' ? pick(['open','close']) : $('#pDir').value;
  const [lo, hi] = FAIXA_PAUTA[pq.hand], todas = $('#pNotas').value==='todas';
  const L = state.layout[pq.hand].filter(b=>b[pq.dir]>=lo && b[pq.dir]<=hi && (todas || NATURAIS.includes(((b[pq.dir]%12)+12)%12)));
  let b; do{ b = pick(L); }while(L.length>1 && b===pq.answer);
  Object.assign(pq, {answer:b, target:b[pq.dir], errors:0});
  pkL.setDim(pq.hand!=='left'); pkR.setDim(pq.hand!=='right'); pkL.refresh(); pkR.refresh();
  const p = $('#pDirPill'); p.style.visibility = 'visible'; p.className = 'dirpill ' + pq.dir; p.textContent = `${dirLabel(pq.dir)} · ${maoNome(pq.hand)}`;
  placarBolinhas('p', pq.hist, pq.round, pq.score, true);
  pautaFeed('Leia a nota e toque o botão.'); desenhaPautaDesafio('entra');
}
function pautaPress(b, m, k){
  if(!pq.active) return;
  if(k.hand!==pq.hand){ pautaFeed('Essa nota está na outra mão.', 'bad'); return; }
  if(m===pq.target){
    k.mark(b.id,'ok'); pq.score += pq.errors===0 ? 1 : 0; pq.hist.push(pq.errors===0 ? 'certa' : 'meia'); pq.round++; placarBolinhas('p', pq.hist, pq.round, pq.score, true);
    pautaFeed(pq.errors ? 'Achou! (não conta ponto por ter errado antes)' : `Certo! ${noteName(m)}`, 'ok'); desenhaPautaDesafio('certa');
    setTimeout(nextPauta, 900);
  } else {
    pq.errors++; k.mark(b.id,'bad'); desenhaPautaDesafio('errada');
    pautaFeed(`Esse é ${noteName(m)}. Tente de novo.`, 'bad');
    if(pq.errors>=2) k.mark(pq.answer.id,'hint',0);
  }
}
$('#pStart').onclick = ()=>{ ac(); Object.assign(pq, {round:0, score:0, active:true, answer:null, hist:[]}); menuPratica('p', true); nextPauta(); };
function pararPauta(){
  pq.active = false; pkL.clearMarks(); pkR.clearMarks(); pkL.setDim(false); pkR.setDim(false); pkL.refresh(); pkR.refresh();
  $('#pDirPill').style.visibility = 'hidden'; pautaFeed(''); pq.target = null; desenhaPautaDesafio(); $('#pHud').hidden = true; menuPratica('p', false);
}
$('#pParar').onclick = pararPauta;
segmentar($('#pHand'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'}); segmentar($('#pDir'), {rotulo:rotuloFole}); segmentar($('#pNotas'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'});
desenhaPautaDesafio();
