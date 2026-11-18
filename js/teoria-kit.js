/* ================== Teoria musical: o kit (teclado, pauta, som e o teste com "Por quê") ================== */
// Este arquivo e os outros da teoria (teoria-textos.js, teoria-frases.js, teoria-topicos.js e css/teoria.css)
// só são baixados quando a aba Teoria abre: ver carregarTeoria() em teoria.js. O sw.js guarda todos.
//
// - tf(): as frases da teoria no idioma atual (teoria-frases.js, com as três línguas lado a lado);
// - grafa(): o nome certo de uma nota (Mi♭ e não Ré♯ quando a letra é Mi);
// - tecladoT(): o bandoneon em SVG com o mapa do usuário (state.layout), setas entre botões e brilho;
// - instrumentoT(): o teclado com o seletor do fole (e da mão), usado nos laboratórios;
// - pautaT(): a pauta com clave, armadura, compasso, chave com nome e acordes;
// - testeT(): cinco perguntas sorteadas; depois de cada resposta, certa ou errada, a caixa "Por quê".

const TEORIA = []; // os 16 tópicos, na ordem de TEORIA_MODULOS (preenchido em teoria-topicos.js)
const tRM = () => movReduzido();
const T_EASE = 'cubic-bezier(.16,1,.3,1)';
const ICO_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';

/* ---------- frases ---------- */
function tf(k, ...vals){
  let s = (TF[state.lang] || {})[k];
  if(s == null) s = TF.pt[k];
  if(s == null){ console.warn('tf', k); return k; }
  if(typeof s !== 'string') return s;
  vals.forEach(v=>{ s = s.replace('{}', v); });
  return s;
}
const tituloT = x => TEORIA_TEXTOS[x.id]['titulo_' + state.lang] || TEORIA_TEXTOS[x.id].titulo_pt;
const textoT = (x, campo) => TEORIA_TEXTOS[x.id][(campo ? campo + '_' : '') + state.lang] || TEORIA_TEXTOS[x.id][(campo ? campo + '_' : '') + 'pt'];
const sorteia = lista => lista[Math.floor(Math.random()*lista.length)];
function embaralha(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// opções: a certa e as erradas, embaralhadas; devolve {o, a, idx} (idx[k] = posição original da opção k)
function opcoes(certa, erradas){
  const todas = [certa, ...erradas].map((v, i)=>({v, i})); embaralha(todas);
  return {o: todas.map(x=>x.v), a: todas.findIndex(x=>x.i===0), idx: todas.map(x=>x.i)};
}

/* ---------- nomes das notas ---------- */
// grafa(midi, letra): a letra (0 = Dó … 6 = Si) vem da regra (do intervalo, da escala, do acorde);
// o acidente e a oitava saem da distância até a nota natural. Dó♭5 é a tecla do Si4.
const T_NAT = [0,2,4,5,7,9,11];
const T_SINAL = {'-2':'𝄫','-1':'♭','0':'','1':'♯','2':'𝄪'};
const T_LETRA_SUST = [0,0,1,1,2,3,3,4,4,5,5,6], T_LETRA_BEMOL = [0,1,1,2,2,3,4,4,5,5,6,6];
const pcDe = m => ((m%12)+12)%12;
function grafa(m, letra){
  let oct = Math.floor(m/12) - 1, acid = m - ((oct+1)*12 + T_NAT[letra]);
  if(acid > 6){ oct++; acid -= 12; } else if(acid < -6){ oct--; acid += 12; }
  return {m, letra, acid, oct, d: oct*7 + letra};
}
const grafaSust = m => grafa(m, T_LETRA_SUST[pcDe(m)]);
const grafaBem = m => grafa(m, T_LETRA_BEMOL[pcDe(m)]);
const nomeG = (g, oit=true) => letterNames()[g.letra] + T_SINAL[g.acid] + (oit ? g.oct : '');
const nomeL = l => letterNames()[((l%7)+7)%7];

/* ---------- intervalos, escalas e acordes ---------- */
const INTERVALOS = [{n:2,s:1,k:'2m'},{n:2,s:2,k:'2M'},{n:3,s:3,k:'3m'},{n:3,s:4,k:'3M'},{n:4,s:5,k:'4J'},{n:4,s:6,k:'4A'},
  {n:5,s:7,k:'5J'},{n:6,s:8,k:'6m'},{n:6,s:9,k:'6M'},{n:7,s:10,k:'7m'},{n:7,s:11,k:'7M'},{n:8,s:12,k:'8J'}];
const ivDe = s => INTERVALOS.find(v=>v.s===s);
const ivNome = iv => tf('iv.' + iv.k), ivCurto = iv => tf('ivc.' + iv.k), ivUm = iv => tf('ivu.' + iv.k);
const ivTipo = iv => tf('ivt.' + iv.k.slice(-1)), ivNum = n => tf('ivn.' + n);
const grafar = (base, iv) => grafa(base.m + iv.s, (base.letra + iv.n - 1) % 7); // base: {m, letra}
const ESCALAS_T = {maior:[2,2,1,2,2,2,1], natural:[2,1,2,2,1,2,2], harmonica:[2,1,2,2,1,3,1], melodica:[2,1,2,2,2,2,1]};
function escalaT(tipo, ton){ // ton: {m, letra} → as 8 notas grafadas
  let m = ton.m; const out = [grafa(m, ton.letra)];
  ESCALAS_T[tipo].forEach((s, i)=>{ m += s; out.push(grafa(m, (ton.letra + i + 1) % 7)); });
  return out;
}
const passoNome = s => tf(s===1 ? 'esc.s' : s===2 ? 'esc.t' : 'esc.ts');
const acordeT = (fund, ivs) => ivs.map((s, i)=>grafa(fund.m + s, (fund.letra + 2*i) % 7)); // terças empilhadas
const TRIADES = {maior:[0,4,7], menor:[0,3,7], dim:[0,3,6], aum:[0,4,8], dom7:[0,4,7,10], maj7:[0,4,7,11], m7:[0,3,7,10]};
// tônicas usadas nos exemplos (letra + midi), com a grafia habitual
const TON = {do4:{m:60,letra:0}, re4:{m:62,letra:1}, mi4:{m:64,letra:2}, fa4:{m:65,letra:3}, sol4:{m:67,letra:4}, la4:{m:69,letra:5}, si4:{m:71,letra:6},
  la3:{m:57,letra:5}, sib3:{m:58,letra:6}, si3:{m:59,letra:6}, mib4:{m:63,letra:2}, lab4:{m:68,letra:5}, sib4:{m:70,letra:6}, fas4:{m:66,letra:3}, dos4:{m:61,letra:0}};

/* ---------- som ---------- */
function tSom(m, quando=0, dur=.6, peak=.16, mao){ const c = ac(); playNote(m, dur, mao, c.currentTime + .04 + quando, peak); }
function tAcorde(ms, quando=0, dur=1, mao){ const pk = ms.length > 2 ? .085 : .12; ms.forEach(m=>tSom(m, quando, dur, pk, mao)); }
function tArpejo(ms, quando=0, passo=.32, mao){ ms.forEach((m, i)=>tSom(m, quando + i*passo, passo*.95 + .05, .15, mao)); return quando + ms.length*passo; }
// nota com o volume mudando (crescendo, decrescendo): o mesmo timbre do app, com o ganho em rampa
function tRampa(m, dur, de, ate, mao){
  const c = ac(), t0 = c.currentTime + .04, v = makeReed(m, mao || (m < 57 ? 'left' : 'right'), de, t0), g = v.out.gain;
  g.setValueAtTime(de, t0 + .08); g.linearRampToValueAtTime(ate, t0 + dur); g.setTargetAtTime(0, t0 + dur, .06);
  v.oscs.forEach(o=>o.stop(t0 + dur + .6));
}
function tClique(quando, forte){ const c = ac(); clickSound(c.currentTime + .04 + quando, forte); }
// cada laboratório e cada pergunta tem seu relógio; trocar de tópico para tudo
const T_RELOGIOS = new Set();
function relogioT(){
  const ts = [], r = {depois(ms, f){ ts.push(setTimeout(f, ms)); }, limpa(){ ts.forEach(clearTimeout); ts.length = 0; }};
  T_RELOGIOS.add(r); return r;
}
const pararRelogiosT = () => T_RELOGIOS.forEach(r=>r.limpa());

/* ---------- o teclado do bandoneon em SVG ---------- */
const T_NS = 'http://www.w3.org/2000/svg', T_R = .37;
const svgEl = (tag, at={}, pai) => { const e = document.createElementNS(T_NS, tag); for(const k in at) e.setAttribute(k, at[k]); if(pai) pai.appendChild(e); return e; };
const T_COR = {open:'#4f9cf0', close:'#f08a4b', ok:'#b997ff'};
function curvaT(A, B){
  const dx = B.x-A.x, dy = B.y-A.y, d = Math.hypot(dx, dy) || 1, nx = -dy/d, ny = dx/d, k = Math.min(.8, d*.3), s = ny > 0 ? -1 : 1;
  const C = {x:(A.x+B.x)/2 + nx*k*s, y:(A.y+B.y)/2 + ny*k*s};
  const borda = (P, r)=>{ const vx = C.x-P.x, vy = C.y-P.y, l = Math.hypot(vx, vy) || 1; return {x:P.x+vx/l*r, y:P.y+vy/l*r}; };
  const a = borda(A, T_R+.06), b = borda(B, T_R+.13);
  return ['M', a.x, a.y, 'Q', C.x, C.y, b.x, b.y].map(v=>typeof v==='number' ? v.toFixed(3) : v).join(' ');
}
let tecN = 0;
function tecladoT(svg, mao, aoTocar){
  const L = state.layout[mao], pre = 'tq' + (++tecN) + '-';
  // referências com o endereço inteiro da página: com <base href> (testes, capturas), url(#id) apontaria para outro documento
  const ref = id => 'url("' + location.href.split('#')[0] + '#' + pre + id + '")';
  svg.innerHTML = ''; svg.classList.add('tq-tec');
  const xs = L.map(b=>b.x), ys = L.map(b=>b.y), x0 = Math.min(...xs)-.55, y0 = Math.min(...ys)-.55;
  svg.setAttribute('viewBox', `${x0} ${y0} ${(Math.max(...xs)-x0+.55).toFixed(2)} ${(Math.max(...ys)-y0+.6).toFixed(2)}`);
  const defs = svgEl('defs', {}, svg);
  const grad = (id, cores)=>{ const g = svgEl('radialGradient', {id:pre+id, cx:'34%', cy:'28%', r:'75%'}, defs); cores.forEach(([o, c])=>svgEl('stop', {offset:o, 'stop-color':c}, g)); };
  grad('p', [['0','#fffdf7'],['.52','#ece5d6'],['1','#bdb3a1']]);
  grad('a', [['0','#d7e8ff'],['.7','#4f9cf0'],['1','#3b82d6']]);
  grad('f', [['0','#ffe2cf'],['.7','#f08a4b'],['1','#d9733a']]);
  grad('ok', [['0','#f1ebff'],['1','#b997ff']]);
  grad('bad', [['0','#f59b94'],['1','#c0392b']]);
  const mk = svgEl('marker', {id:pre+'seta', viewBox:'0 0 10 10', refX:'6', refY:'5', markerWidth:'3.4', markerHeight:'3.4', orient:'auto-start-reverse'}, defs);
  svgEl('path', {d:'M0 0 L10 5 L0 10 z', class:'tq-seta'}, mk);
  const camadaF = svgEl('g', {}, svg), camadaB = svgEl('g', {}, svg), camadaA = svgEl('g', {}, svg);
  const G = {}; let dir = 'open', formaEl = null; const arcos = [];
  L.forEach(b=>{
    const g = svgEl('g', {class:'tq-bt', transform:`translate(${b.x} ${b.y})`, tabindex:'0', role:'button'}, camadaB);
    svgEl('circle', {class:'tq-sombra', r:T_R, cy:'.05'}, g);
    const corpo = svgEl('g', {class:'tq-corpo'}, g);
    svgEl('circle', {r:T_R, fill:ref('p')}, corpo);
    ['a','f','ok','bad'].forEach(c=>svgEl('circle', {class:'tq-luz '+c, r:T_R, fill:ref(c)}, corpo));
    svgEl('circle', {class:'tq-foco', r:T_R+.07}, corpo);
    const t = svgEl('text', {class:'tq-rot', y:'.01'}, corpo);
    G[b.id] = {g, t, b, rot:null};
    const aperta = ()=>aoTocar && aoTocar(b, dir);
    g.addEventListener('click', aperta);
    g.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); aperta(); } });
  });
  const rotular = ()=>{ for(const id in G){ const x = G[id], txt = x.rot || noteName(x.b[dir]); x.t.textContent = txt; x.g.setAttribute('aria-label', txt); } };
  const rotularSeLivre = ()=>{ if(!svg.classList.contains('trocando')) rotular(); }; // na troca do fole, o texto muda escondido
  rotular();
  const zera = p=>{ p.getAnimations().forEach(a=>a.cancel()); p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; };
  const api = {
    mao, L,
    get dir(){ return dir; },
    botoes:(m, d=dir)=>L.filter(b=>b[d]===m),
    // o botão da nota mais perto de um ponto (para a seta ficar curta)
    perto(m, P, d=dir){ const l = api.botoes(m, d); if(!l.length) return null; if(!P) return l[0];
      return l.slice().sort((p, q)=>Math.hypot(p.x-P.x, p.y-P.y) - Math.hypot(q.x-P.x, q.y-P.y))[0]; },
    // um botão para cada nota de uma sequência, cada um perto do anterior
    caminho(ms, d=dir){ let P = null; return ms.map(m=>{ const b = api.perto(m, P, d); if(b) P = b; return b; }); },
    setDir(d, anima){
      if(d===dir) return; dir = d;
      if(anima && !tRM()){ svg.classList.add('trocando'); setTimeout(()=>{ svg.classList.remove('trocando'); rotular(); }, 150); } else rotular();
    },
    rotulo(id, txt){ if(G[id]){ G[id].rot = txt; rotularSeLivre(); } },
    limparRotulos(){ for(const id in G) G[id].rot = null; rotularSeLivre(); },
    acende(ids, cls){ ids.forEach(id=>G[id] && G[id].g.classList.add(cls)); },
    apaga(cls){ for(const id in G) (cls ? [cls] : ['open','close','ok','bad','hint','leve']).forEach(c=>G[id].g.classList.remove(c)); },
    onda(id, cor){
      if(tRM() || !G[id]) return; const x = G[id], c = svgEl('circle', {class:'tq-onda', r:T_R, cx:x.b.x, cy:x.b.y, stroke:cor || T_COR[dir]}, camadaA);
      c.animate([{r:T_R, opacity:.9}, {r:T_R*2.3, opacity:0}], {duration:650, easing:T_EASE}).onfinish = ()=>c.remove();
    },
    efeito(id, cls){ if(!G[id]) return; const g = G[id].g; g.classList.remove(cls); void g.getBBox(); g.classList.add(cls); setTimeout(()=>g.classList.remove(cls), 500); },
    pos:id=>({x:G[id].b.x, y:G[id].b.y}),
    // setas entre pares de botões [[idA, idB], …]; 'desenha' anima uma depois da outra
    arcos(pares, modo='fixo', passo=0){ api.semArcos(); pares.forEach(([a, b], i)=>api.maisArco(a, b, modo, i*passo)); },
    // mais uma seta, sem apagar as outras (o caminho de uma escala vai crescendo)
    maisArco(a, b, modo='fixo', atraso=0){
      {
        if(!G[a] || !G[b] || a===b) return;
        const p = svgEl('path', {class:'tq-arco', d:curvaT(api.pos(a), api.pos(b))}, camadaA); arcos.push(p);
        if(modo==='desenha' && !tRM()){
          let L2 = 0; try{ L2 = p.getTotalLength(); }catch(e){}
          if(!L2){ p.setAttribute('marker-end', ref('seta')); return; }
          p.style.strokeDasharray = L2; p.style.strokeDashoffset = L2;
          const an = p.animate([{strokeDashoffset:L2}, {strokeDashoffset:0}], {duration:400, delay:atraso, easing:'cubic-bezier(.65,0,.35,1)', fill:'forwards'});
          an.onfinish = ()=>{ zera(p); p.setAttribute('marker-end', ref('seta')); };
        } else p.setAttribute('marker-end', ref('seta'));
      }
    },
    arco(a, b, modo){ api.arcos([[a, b]], modo); },
    // as setas escorregam para os botões da outra direção do fole (mesmo número de setas)
    moveArcos(de, para){
      const ok = de.length===para.length && arcos.length===de.length && de.every(([a, b])=>G[a] && G[b]) && para.every(([a, b])=>G[a] && G[b] && a!==b);
      if(tRM() || !ok){ api.arcos(para, 'fixo'); return; }
      arcos.forEach(p=>{ zera(p); p.setAttribute('marker-end', ref('seta')); });
      const els = arcos.slice(), t0 = performance.now(), D = 620, ease = t=>1-Math.pow(1-t, 4), mix = (p, q, k)=>({x:p.x+(q.x-p.x)*k, y:p.y+(q.y-p.y)*k});
      const P0 = de.map(([a, b])=>[api.pos(a), api.pos(b)]), P1 = para.map(([a, b])=>[api.pos(a), api.pos(b)]);
      const passo = agora=>{ if(arcos[0]!==els[0]) return; const k = ease(Math.min(1, (agora-t0)/D));
        els.forEach((p, i)=>p.setAttribute('d', curvaT(mix(P0[i][0], P1[i][0], k), mix(P0[i][1], P1[i][1], k)))); if(k < 1) requestAnimationFrame(passo); };
      requestAnimationFrame(passo);
    },
    semArcos(){ arcos.forEach(p=>{ zera(p); p.remove(); }); arcos.length = 0; },
    // a forma de um acorde: os botões ligados por baixo, como a mão vê
    forma(ids, anima){
      if(formaEl){ formaEl.remove(); formaEl = null; }
      const P = (ids || []).filter(id=>G[id]).map(id=>G[id].b); if(P.length < 2) return;
      const cx = P.reduce((s, b)=>s+b.x, 0)/P.length, cy = P.reduce((s, b)=>s+b.y, 0)/P.length;
      P.sort((a, b)=>Math.atan2(a.y-cy, a.x-cx) - Math.atan2(b.y-cy, b.x-cx));
      formaEl = svgEl('polygon', {class:'tq-forma', points:P.map(b=>`${b.x},${b.y}`).join(' ')}, camadaF);
      formaEl.style.transformOrigin = `${cx}px ${cy}px`;
      if(anima && !tRM()) formaEl.animate([{opacity:0, transform:'scale(.5)'}, {opacity:1, transform:'none'}], {duration:480, easing:T_EASE});
    },
    limpa(){ api.apaga(); api.limparRotulos(); api.semArcos(); api.forma(null); }
  };
  return api;
}

// O fole: dois botões com o "polegar" que escorrega e a sanfona que abre e fecha
function foleUI(lugar, dir, aoTrocar){
  lugar.innerHTML = `<div class="tq-fole"><div class="tq-seg" data-dir="${dir}" role="group" aria-label="${tf('ui.fole')}"><span class="tq-polegar"></span>
    <button type="button" data-dir="open" aria-pressed="${dir==='open'}">${tf('ui.abrindo')}</button><button type="button" data-dir="close" aria-pressed="${dir==='close'}">${tf('ui.fechando')}</button></div>
    <svg class="tq-sanfona" data-dir="${dir}" viewBox="0 0 54 30" aria-hidden="true"><rect x="0" y="3" width="5" height="24" rx="2"/><rect x="49" y="3" width="5" height="24" rx="2"/><g class="tq-pregas"><path d="M9 4 L13 26 L17 4 L21 26 L25 4 L29 26 L33 4 L37 26 L41 4 L45 26"/></g></svg></div>`;
  const seg = lugar.querySelector('.tq-seg'), sanf = lugar.querySelector('.tq-sanfona');
  const ui = {set(d){ seg.dataset.dir = d; sanf.dataset.dir = d; seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.dir===d))); }};
  seg.addEventListener('click', e=>{ const b = e.target.closest('[data-dir]'); if(b && b.dataset.dir!==seg.dataset.dir) aoTrocar(b.dataset.dir); });
  return ui;
}

// O instrumento dos laboratórios: cabeçalho (mão e fole), a caixa com o teclado e uma legenda
function instrumentoT(el, o){
  let mao = o.mao || 'right', dir = o.dir || 'open';
  el.classList.add('tq-band');
  el.innerHTML = `<div class="tq-band-cab"><span class="tq-mao"></span><span class="tq-fole-lugar"></span></div>
    <div class="tq-caixa" data-dir="${dir}"><svg role="group"></svg></div><p class="tq-band-nota" aria-live="polite"></p>`;
  const caixa = el.querySelector('.tq-caixa'), nota = el.querySelector('.tq-band-nota'), maoEl = el.querySelector('.tq-mao');
  const inst = {
    tec:null, get dir(){ return dir; }, get mao(){ return mao; },
    nota(html){ nota.innerHTML = html || ''; },
    setDir(d, anima=true){ if(d===dir) return; const velho = dir; dir = d; fole.set(d); caixa.dataset.dir = d; inst.tec.setDir(d, anima); o.aoTrocarFole && o.aoTrocarFole(d, velho); },
    setMao(m){ if(m===mao) return; mao = m; monta(); o.aoTrocarMao && o.aoTrocarMao(m); }
  };
  const fole = foleUI(el.querySelector('.tq-fole-lugar'), dir, d=>inst.setDir(d));
  function monta(){
    const svg = caixa.querySelector('svg'); // o da caixa (o desenho da sanfona, no cabeçalho, também é um svg)
    inst.tec = tecladoT(svg, mao, (b, d)=>o.aoTocar && o.aoTocar(b, d, inst));
    inst.tec.setDir(dir);
    svg.setAttribute('aria-label', mao==='left' ? tf('ui.mao.esq') : tf('ui.mao.dir'));
    if(o.maos) maoEl.innerHTML = `<span class="tq-chips tq-maos">${['right','left'].map(m=>`<button type="button" class="tq-chip ${m===mao?'on':''}" data-mao="${m}" aria-pressed="${m===mao}">${tf(m==='left'?'ui.mao.esq':'ui.mao.dir')}</button>`).join('')}</span>`;
    else maoEl.textContent = tf(mao==='left' ? 'ui.mao.esq.38' : 'ui.mao.dir.38', state.layout[mao].length);
  }
  maoEl.addEventListener('click', e=>{ const b = e.target.closest('[data-mao]'); if(b) inst.setMao(b.dataset.mao); });
  monta();
  return inst;
}

// Seletores (chips): itens [{v, rot, title}]; devolve {marca(v)}
function chipsT(el, itens, atual, aoEscolher){
  el.classList.add('tq-chips');
  el.innerHTML = itens.map(x=>`<button type="button" class="tq-chip" data-v="${x.v}"${x.title ? ` title="${x.title}"` : ''}>${x.rot}</button>`).join('');
  const marca = v=>el.querySelectorAll('.tq-chip').forEach(c=>{ const on = c.dataset.v===String(v); c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
  el.addEventListener('click', e=>{ const c = e.target.closest('[data-v]'); if(!c) return; marca(c.dataset.v); aoEscolher(c.dataset.v); });
  marca(atual);
  return {marca};
}
const pulaNum = el=>{ if(!el) return; el.classList.remove('pula'); void el.offsetWidth; el.classList.add('pula'); };

/* ---------- a pauta ---------- */
// o: {clave, notas:[{d, acid, x, cls, vazia}], W, armadura:{acid:±1, n}, compasso:[4,4], barras:[x], chave:{i, j, rotulo}, rotulos:[...]}
// Notas com o mesmo x formam um acorde (a segunda vizinha vai para o lado). A linha de baixo é Mi4 (sol) ou Sol2 (fá).
const T_BASE = {sol:30, fa:18};
const T_ARM = {sol:{s:[38,35,39,36,33,37,34], b:[34,37,33,36,32,35,31]}, fa:{s:[24,21,25,22,19,23,20], b:[20,23,19,22,18,21,17]}};
function pautaT(o){
  const clave = o.clave || 'sol', base = T_BASE[clave], W = o.W || 360, Y = d=>120 - (d-base)*6;
  let s = `<svg class="tq-pauta" viewBox="0 0 ${W} 168" role="img" aria-label="${tf(clave==='sol' ? 'ui.clavesol' : 'ui.clavefa')}">`;
  for(let i=0;i<5;i++) s += `<line class="pl" x1="8" x2="${W-8}" y1="${120-i*12}" y2="${120-i*12}"/>`;
  s += clave==='sol' ? '<text class="clave" x="14" y="131" font-size="74">𝄞</text>' : '<text class="clave" x="16" y="110" font-size="50">𝄢</text>';
  let x = 64;
  if(o.armadura && o.armadura.n){
    const lista = T_ARM[clave][o.armadura.acid > 0 ? 's' : 'b'];
    for(let i=0;i<o.armadura.n;i++) s += `<text class="acid arm" x="${x + i*11}" y="${Y(lista[i]) + 7}" style="--i:${i}">${o.armadura.acid > 0 ? '♯' : '♭'}</text>`;
    x += o.armadura.n*11 + 8;
  }
  if(o.compasso) s += `<text class="tsig" x="${x+8}" y="94">${o.compasso[0]}</text><text class="tsig" x="${x+8}" y="118">${o.compasso[1]}</text>`;
  (o.barras || []).forEach(bx=>{ s += `<line class="pl barra" x1="${bx}" x2="${bx}" y1="72" y2="120"/>`; });
  const notas = (o.notas || []).map((n, i)=>({...n, i, xx:n.x}));
  const porX = {}; notas.forEach(n=>{ (porX[n.x] = porX[n.x] || []).push(n); });
  Object.values(porX).forEach(g=>{ g.sort((a, b)=>a.d-b.d); for(let k=1;k<g.length;k++) if(g[k].d - g[k-1].d === 1 && g[k-1].xx === g[k-1].x) g[k].xx = g[k].x + 15; });
  notas.forEach(n=>{
    const y = Y(n.d), xx = n.xx; let g = '';
    for(let k=base-2; k>=n.d; k-=2) g += `<line class="pl" x1="${xx-14}" x2="${xx+14}" y1="${Y(k)}" y2="${Y(k)}"/>`;
    for(let k=base+10; k<=n.d; k+=2) g += `<line class="pl" x1="${xx-14}" x2="${xx+14}" y1="${Y(k)}" y2="${Y(k)}"/>`;
    if(n.acid || n.bequadro) g += `<text class="acid" x="${n.x-26 - (porX[n.x].length > 1 && n.acid ? 0 : 0)}" y="${y+7}">${n.bequadro ? '♮' : T_SINAL[n.acid]}</text>`;
    g += `<ellipse class="${n.vazia ? 'cab-vazia' : 'cab'}" cx="${xx}" cy="${y}" rx="8" ry="6" transform="rotate(-20 ${xx} ${y})"/>`;
    s += `<g class="nota ${n.cls || ''}" data-i="${n.i}">${g}</g>`;
  });
  if(o.chave){
    const a = notas[o.chave.i], b = notas[o.chave.j];
    if(a && b){ const yt = Math.max(16, Math.min(Y(a.d), Y(b.d)) - 26);
      s += `<g class="chave-g"><path class="chave" d="M${a.xx} ${yt+8} V${yt} H${b.xx} V${yt+8}"/><text class="chave-txt" x="${(a.xx+b.xx)/2}" y="${yt-6}">${o.chave.rotulo}</text></g>`; }
  }
  (o.rotulos || []).forEach((r, i)=>{ const n = notas.find(q=>q.i===i); if(n && r) s += `<text class="rot-nota" x="${n.x}" y="162">${r}</text>`; });
  return s + (o.extra || '') + '</svg>';
}
// x das notas espalhadas na pauta
const xsT = (n, x0=110, W=360, max=46) => Array.from({length:n}, (_, i)=>x0 + i*(n > 1 ? Math.min(max, (W - x0 - 26)/(n-1)) : 0));

/* ---------- figuras e pausas desenhadas (Figuras, Compasso e Ritmo do tango) ---------- */
function figuraT(tipo, x, y=96, o={}){
  const vazia = tipo==='semibreve' || tipo==='minima', haste = tipo!=='semibreve', band = {colcheia:1, semicolcheia:2}[tipo] || 0;
  let s = `<g class="fig ${o.cls || ''}" data-i="${o.i ?? ''}"><ellipse class="${vazia ? 'cab-vazia' : 'cab'}" cx="${x}" cy="${y}" rx="8" ry="6" transform="rotate(-20 ${x} ${y})"/>`;
  if(haste) s += `<line class="ph" x1="${x+7}" x2="${x+7}" y1="${y-1}" y2="${y-36}"/>`;
  for(let b=0;b<band;b++) s += `<path class="pb" d="M${x+7} ${y-36+b*8} c 2 6 11 8 9 18"/>`;
  if(o.ponto) s += `<circle class="cab" cx="${x+15}" cy="${y-3}" r="2.6"/>`;
  if(o.acento) s += `<text class="acento" x="${x}" y="${y+28}">&gt;</text>`;
  return s + '</g>';
}
function pausaT(tipo, x, o={}){ // na pauta de 5 linhas (linhas em 72…120)
  let s = `<g class="fig pausa ${o.cls || ''}" data-i="${o.i ?? ''}">`;
  if(tipo==='semibreve') s += `<rect class="cab" x="${x-8}" y="84" width="16" height="6"/>`;
  else if(tipo==='minima') s += `<rect class="cab" x="${x-8}" y="90" width="16" height="6"/>`;
  else if(tipo==='seminima') s += `<path class="pausa-sem" d="M${x-3} 75 L${x+4} 84 L${x-3} 92 L${x+4} 100 Q${x-7} 97 ${x-1} 108"/>`; // o zigue-zague com o gancho embaixo
  else { const n = tipo==='semicolcheia' ? 2 : 1;
    s += `<line class="ph" x1="${x+5}" x2="${x-3}" y1="88" y2="${tipo==='semicolcheia' ? 118 : 110}"/>`;
    for(let k=0;k<n;k++) s += `<circle class="cab" cx="${x-3}" cy="${90+k*10}" r="3"/><path class="ph" d="M${x-3} ${92+k*10} q 5 1 ${8 - k*2} ${-4}"/>`; }
  return s + '</g>';
}

/* ---------- o teste com a caixa "Por quê" ---------- */
// Cada tópico tem uma lista de geradores (x.perguntas); cada um devolve uma pergunta:
// {tipo:'opcoes'|'ouvir'|'tocar', cat, q, o, a, erros:{k: comentário}, som(), pauta:{…}, resp,
//  mao, dir, toque(b, m, qz) → null (continua) | {certa, comentario}, mostra(tec, certa),
//  pq:{texto, contas:[…], ouvir(), lab:{…}}}
// As contas da caixa: {tipo:'cadeia', titulo, itens, lig, destaque, res} (notas acendendo uma a uma),
// {tipo:'pontos', titulo, n, total, res} (bolinhas), {tipo:'barras', titulo, partes:[{v, rot, cls}], res}, {tipo:'pauta', titulo, pauta}.
function contaHTML(c, t0){
  let h = '', fim = t0;
  if(c.tipo==='cadeia'){
    h = `<div class="tq-cadeia">${c.itens.map((it, i)=>`${i && c.lig ? `<em style="--d:${t0 + i*120 - 60}ms">${c.lig[i-1]}</em>` : ''}<i class="${(c.destaque || []).includes(i) ? 'dest' : ''}" style="--d:${t0 + i*120}ms">${it}</i>`).join('')}</div>`;
    fim = t0 + c.itens.length*120;
  } else if(c.tipo==='pontos'){
    const total = c.total || c.n, passo = total > 20 ? 45 : 80;
    h = `<div class="tq-pontos ${total > 20 ? 'grade' : ''}">${Array.from({length:total}, (_, i)=>`<i class="${i < c.n ? 'sim' : ''}" style="--d:${t0 + i*passo}ms"></i>`).join('')}</div>`;
    fim = t0 + c.n*passo;
  } else if(c.tipo==='barras'){
    h = `<div class="tq-barras">${c.partes.map((p, i)=>`<span class="${p.cls || ''}" style="flex:${p.v};--d:${t0 + i*160}ms">${p.rot}</span>`).join('')}</div>`;
    fim = t0 + c.partes.length*160;
  } else if(c.tipo==='pauta'){
    h = `<div class="tq-pq-pauta" style="--d:${t0}ms">${pautaT(c.pauta)}</div>`; fim = t0 + 300;
  }
  return {html:`<div class="tq-pq-passo">${c.titulo ? `<span class="rt">${c.titulo}</span>` : ''}${h}${c.res ? `<span class="tq-pq-res" style="--d:${fim}ms">${c.res}</span>` : ''}</div>`, fim:fim + 150};
}
function entraT(el, de='translateX(24px)'){ if(!tRM() && el.animate) el.animate([{opacity:0, transform:de}, {opacity:1, transform:'none'}], {duration:380, easing:T_EASE}); }

function testeT(el, x, ctx){
  const qz = {qs:[], i:0, hist:[], feita:false, tec:null, toques:[]}, rel = relogioT();
  el.innerHTML = `<div class="tq-teste-cab"><div><h3>${tf('ui.teste')}</h3><p>${tf('ui.teste.sub')}</p></div></div>
    <div class="tq-passos" aria-hidden="true">${'<i></i>'.repeat(5)}</div><div class="tq-pergunta" aria-live="polite"></div>`;
  const box = el.querySelector('.tq-pergunta');
  function sortear(){
    const gens = embaralha(x.perguntas.slice()), qs = [], vistas = new Set();
    for(let k=0; qs.length < 5 && k < 80; k++){
      const P = gens[k % gens.length](), chave = P.q + '|' + (P.o ? P.o[P.a] : P.resp);
      if(vistas.has(chave)) continue; vistas.add(chave); qs.push(P);
    }
    return qs;
  }
  const passos = ()=>el.querySelectorAll('.tq-passos i').forEach((p, k)=>{ p.className = qz.hist[k] || (k===qz.i && qz.i < 5 ? 'agora' : ''); });
  function render(){
    rel.limpa(); const P = qz.qs[qz.i]; qz.feita = false; qz.toques = []; passos();
    box.className = 'tq-pergunta';
    let meio = '';
    if(P.tipo==='ouvir') meio += `<div class="tq-ouvir"><button class="btn" type="button" data-ouvir>${ICO_PLAY}${tf('ui.ouvir')}</button><span class="tq-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`;
    if(P.pauta) meio += `<div class="tq-pauta-q">${pautaT(P.pauta)}</div>`;
    if(P.html) meio += P.html;
    if(P.tipo==='tocar') meio += `<span class="dirpill ${P.dir}">${dirLabel(P.dir)} · ${maoNome(P.mao)}</span><div class="tq-caixa" data-dir="${P.dir}"><svg class="tq-tec-q" role="group" aria-label="${tf('ui.tecresponder')}"></svg></div>`;
    const opts = P.o ? `<div class="tq-opts">${P.o.map((o, k)=>`<button type="button" class="tq-opt" data-o="${k}">${o}</button>`).join('')}</div>` : '';
    box.innerHTML = `<div class="tq-enun"><small>${tf('ui.pergunta', qz.i+1, 5)} · ${P.cat}</small>${P.q}</div>${meio}${opts}<div class="tq-pq-lugar"></div><div class="tq-rodape"></div>`;
    if(P.tipo==='tocar'){ qz.tec = tecladoT(box.querySelector('.tq-tec-q'), P.mao, b=>toque(b)); qz.tec.setDir(P.dir); if(P.prepara) P.prepara(qz.tec); }
    entraT(box);
  }
  function ouvir(){ const P = qz.qs[qz.i], eq = box.querySelector('.tq-eq'); ac(); const dur = P.som() || 2.2;
    if(eq){ eq.classList.add('toca'); rel.depois(dur*1000, ()=>eq.classList.remove('toca')); } }
  function toque(b){
    if(qz.feita) return; const P = qz.qs[qz.i], m = b[P.dir];
    tSom(m, 0, .5, .16, P.mao); qz.tec.onda(b.id, T_COR[P.dir]);
    const r = P.toque(b, m, qz);
    if(!r){ qz.tec.acende([b.id], P.dir); vibrar('toque'); return; }
    if(!r.certa){ qz.tec.acende([b.id], 'bad'); qz.tec.efeito(b.id, 'treme'); }
    rel.depois(r.certa ? 0 : 380, ()=>P.mostra && P.mostra(qz.tec, r.certa));
    explica(r.certa, r.comentario || '');
  }
  function explica(certa, comentario){
    const P = qz.qs[qz.i], pq = P.pq || {}, resp = P.resp || P.o[P.a];
    vibrar(certa ? 'ok' : 'erro');
    let t0 = 200; const contas = (pq.contas || []).map(c=>{ const r = contaHTML(c, t0); t0 = r.fim; return r.html; });
    const lugar = box.querySelector('.tq-pq-lugar');
    lugar.innerHTML = `<div class="tq-pq ${certa ? 'certo' : 'errado'}">
      <div class="tq-pq-cab"><span class="tq-selo">${certa ? '✓ ' + tf('ui.certo') : '✗ ' + tf('ui.naoe')}</span><b>${tf(certa ? 'ui.porque' : 'ui.acerta', resp)}</b></div>
      ${comentario ? `<p class="tq-pq-sua">${comentario}</p>` : ''}
      ${contas.length ? `<div class="tq-pq-contas n${contas.length}">${contas.join('')}</div>` : ''}
      ${pq.texto ? `<p class="tq-pq-texto">${pq.texto}</p>` : ''}
      ${pq.ouvir || pq.lab ? `<div class="tq-pq-acoes">${pq.ouvir ? `<button class="btn sec" type="button" data-pq-ouvir>${ICO_PLAY}${pq.ouvirRot || tf('ui.ouvir.resp')}</button>` : ''}${pq.lab ? `<button class="btn sec" type="button" data-pq-lab>${tf('ui.verlab')}</button>` : ''}</div>` : ''}</div>`;
    entraT(lugar.firstElementChild, 'translateY(10px) scale(.98)');
    qz.feita = true; qz.hist[qz.i] = certa ? 'certa' : 'errada'; passos();
    box.querySelector('.tq-rodape').innerHTML = `<button class="btn" type="button" data-prox>${tf(qz.i===4 ? 'ui.resultado' : 'ui.proxima')} →</button>`;
  }
  function resultado(){
    rel.limpa();
    const certas = qz.hist.filter(h=>h==='certa').length, C = 2*Math.PI*50, passou = certas >= 4, prox = TEORIA[ctx.indice+1];
    qz.i = 5; passos();
    box.className = 'tq-pergunta'; box.classList.add('tq-resultado');
    box.innerHTML = `<svg class="tq-anel-g" viewBox="0 0 120 120" aria-hidden="true"><circle class="fundo" cx="60" cy="60" r="50"/><circle class="valor" cx="60" cy="60" r="50" stroke-dasharray="${C}" stroke-dashoffset="${C}"/><text x="60" y="61">${certas}/5</text></svg>
      <h4>${tf(passou ? 'ui.concluido' : 'ui.quase')}</h4><p>${tf(passou ? 'ui.acertou' : 'ui.acertou.revise', certas)}</p>
      <div class="tq-linha"><button class="btn sec" type="button" data-refazer>${tf('ui.refazer')}</button>${prox ? `<button class="btn" type="button" data-prox-topico>${tituloT(prox)} →</button>` : ''}</div>`;
    entraT(box);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ const v = box.querySelector('.tq-anel-g .valor'); if(v) v.style.strokeDashoffset = C*(1-certas/5); }));
    if(passou){ const novo = !state.progress.teoria[x.id]; state.progress.teoria[x.id] = true; saveProgress(); logPractice('licao'); ctx.aoConcluir && ctx.aoConcluir(novo); comemorar(); }
  }
  box.addEventListener('click', e=>{
    const P = qz.qs[Math.min(qz.i, 4)];
    if(e.target.closest('[data-ouvir]')){ ouvir(); return; }
    if(e.target.closest('[data-pq-ouvir]')){ ac(); P.pq.ouvir(); return; }
    if(e.target.closest('[data-pq-lab]')){ ctx.irAoLab(P.pq.lab, box); return; }
    if(e.target.closest('[data-prox]')){ if(qz.i < 4){ qz.i++; render(); } else resultado(); return; }
    if(e.target.closest('[data-refazer]')){ comecar(); return; }
    if(e.target.closest('[data-prox-topico]')){ abrirTeoria(ctx.indice+1, true); return; }
    const o = e.target.closest('[data-o]'); if(!o || qz.feita) return;
    const k = +o.dataset.o, certa = k===P.a;
    box.querySelectorAll('.tq-opt').forEach((b, j)=>{ b.disabled = true; if(j===P.a) b.classList.add(certa ? 'certa' : 'era-certa'); });
    if(!certa) o.classList.add('errada');
    if(P.depois) P.depois(box, certa);
    explica(certa, certa ? '' : tf('ui.marcou', P.o[k]) + (P.erros && P.erros[k] ? ' ' + P.erros[k] : ''));
  });
  function comecar(){ Object.assign(qz, {qs:sortear(), i:0, hist:[]}); render(); }
  comecar();
  return {qz, comecar, box};
}

/* ---------- a aba Teoria: a trilha dos módulos e o tópico aberto ---------- */
const NOVOS_T = ['dinamica','ritmo','intervalos','menores','armadura','graus','setima','funcoes','cadencias'];
const ICO_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
const ICO_INFO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>';
const ICO_SETA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const nomeModT = mod => mod[state.lang] || mod.pt;
let tqObservador = null, tqTopicoCtx = null;
function renderTeoria(){
  const raiz = $('#teoriaApp'); if(!raiz) return;
  if(typeof teoriaAtual === 'string'){ const k = TEORIA.findIndex(x=>x.id===teoriaAtual); teoriaAtual = k < 0 ? 0 : k; } // abrirTeoria('intervalos')
  teoriaAtual = Math.max(0, Math.min(TEORIA.length - 1, teoriaAtual|0));
  const tr = raiz.querySelector('.tq-trilha'), aberta = tr ? tr.open : matchMedia('(min-width: 980px)').matches;
  raiz.innerHTML = `<details class="tq-trilha" ${aberta ? 'open' : ''}><summary><span>${tf('ui.trilha')} <small class="tq-trilha-res"></small></span><span class="tq-seta-d">${ICO_SETA}</span></summary><div class="tq-modulos"></div></details>
    <article class="tq-topico"></article><button class="btn tq-volta" type="button" hidden>${tf('ui.volta')} ↓</button>`;
  renderTrilhaT(true); renderTopicoT();
}
function renderTrilhaT(anima){
  const raiz = $('#teoriaApp'), C = 2*Math.PI*13, feito = id=>!!state.progress.teoria[id]; let j = 0;
  raiz.querySelector('.tq-modulos').innerHTML = TEORIA_MODULOS.map((mod, k)=>{
    const n = mod.topicos.filter(feito).length, alvo = C*(1 - n/mod.topicos.length);
    return `<div class="tq-modulo"><div class="tq-mod-cab"><svg class="tq-anel" viewBox="0 0 34 34" aria-hidden="true"><circle class="fundo" cx="17" cy="17" r="13"/><circle class="valor" cx="17" cy="17" r="13" stroke-dasharray="${C}" stroke-dashoffset="${anima && !tRM() ? C : alvo}" data-alvo="${alvo}"/><text x="17" y="17.5">${n}/${mod.topicos.length}</text></svg>
      <div><small>${tf('ui.modulo', k+1)}</small><b>${nomeModT(mod)}</b></div></div>
      <ol class="tq-topicos">${mod.topicos.map(id=>{ const i = j++, x = TEORIA[i], f = feito(id);
        return `<li><button type="button" class="${f ? 'feito' : ''}" data-t="${i}" style="--i:${i}"><span class="n">${f ? ICO_CHECK : i+1}</span><span class="tt">${tituloT(x)}</span>${NOVOS_T.includes(id) && !f ? `<span class="tq-novo">${tf('ui.novo')}</span>` : ''}</button></li>`; }).join('')}</ol></div>`;
  }).join('');
  raiz.querySelector('.tq-trilha-res').textContent = tf('ui.trilha.res', TEORIA.filter(x=>feito(x.id)).length, TEORIA.length);
  if(anima && !tRM()) requestAnimationFrame(()=>requestAnimationFrame(()=>raiz.querySelectorAll('.tq-anel .valor').forEach(c=>{ c.style.strokeDashoffset = c.dataset.alvo; })));
  marcaTrilhaT();
}
function marcaTrilhaT(){
  $$('#teoriaApp .tq-topicos button').forEach(b=>{ const on = +b.dataset.t===teoriaAtual; b.classList.toggle('on', on); b.toggleAttribute('aria-current', on); });
}
function renderTopicoT(){
  pararRelogiosT();
  const raiz = $('#teoriaApp'), i = teoriaAtual, x = TEORIA[i], k = TEORIA_MODULOS.findIndex(m=>m.topicos.includes(x.id)), art = raiz.querySelector('.tq-topico');
  const ant = TEORIA[i-1], prox = TEORIA[i+1];
  raiz.querySelector('.tq-volta').hidden = true;
  art.innerHTML = `<div class="tq-cab"><span class="tq-olho">${tf('ui.olho', k+1, nomeModT(TEORIA_MODULOS[k]), i+1, TEORIA.length)}</span><h2>${tituloT(x)}</h2></div>
    <div class="tq-texto">${textoT(x)}</div>
    <section class="tq-lab"><div class="tq-lab-cab"><h3>${tf('ui.lab')}</h3><p>${tf(x.id + '.lab')}</p></div><div class="tq-lab-corpo"></div></section>
    <aside class="tq-porque"><span class="ic">${ICO_INFO}</span><div><h3>${tf('ui.band')}</h3>${textoT(x, 'band')}</div></aside>
    <section class="tq-teste"></section>
    <div class="tq-pratica"><span class="r">${tf('ui.pratique')}</span>${x.pratica.map(([nome], j)=>`<button type="button" class="btn sec" data-p="${j}">${tf(nome)}</button>`).join('')}</div>
    <nav class="tq-nav" aria-label="${tf('ui.nav')}">${ant ? `<button type="button" class="btn sec" data-nav="-1"><small>← ${tf('ui.anterior')}</small>${tituloT(ant)}</button>` : '<span></span>'}${prox ? `<button type="button" class="btn sec prox" data-nav="1"><small>${tf('ui.proximo')} →</small>${tituloT(prox)}</button>` : ''}</nav>`;
  const ctx = {indice:i, labEl:art.querySelector('.tq-lab'), aoConcluir:()=>renderTrilhaT(false)};
  ctx.irAoLab = cfg=>irAoLabT(ctx, cfg);
  tqTopicoCtx = ctx;
  ctx.lab = x.lab(art.querySelector('.tq-lab-corpo'), ctx) || {};
  ctx.teste = testeT(art.querySelector('.tq-teste'), x, ctx);
  if(tqObservador) tqObservador.disconnect();
  tqObservador = new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)) raiz.querySelector('.tq-volta').hidden = true; }, {threshold:.2});
  tqObservador.observe(art.querySelector('.tq-teste'));
  art.classList.remove('troca'); void art.offsetWidth; art.classList.add('troca');
  marcaTrilhaT();
}
// "Ver no laboratório": sobe até o laboratório já montado com o exemplo da pergunta
function irAoLabT(ctx, cfg){
  const volta = $('#teoriaApp .tq-volta');
  ctx.labEl.scrollIntoView({behavior: tRM() ? 'auto' : 'smooth', block:'start'});
  setTimeout(()=>{
    if(ctx.lab.mostra) ctx.lab.mostra(cfg);
    const r = ctx.teste.box.getBoundingClientRect();
    if(r.top > innerHeight || r.bottom < 0){ volta.hidden = false; entraT(volta, 'translate(-50%, 12px)'); }
  }, tRM() ? 60 : 600);
}
document.addEventListener('click', e=>{
  const raiz = e.target.closest('#teoriaApp'); if(!raiz) return;
  const vt = e.target.closest('.tq-volta');
  if(vt){ vt.hidden = true; tqTopicoCtx.teste.box.scrollIntoView({behavior: tRM() ? 'auto' : 'smooth', block:'center'}); return; }
  const tb = e.target.closest('[data-t]');
  if(tb){ teoriaAtual = +tb.dataset.t; renderTopicoT();
    if(!matchMedia('(min-width: 980px)').matches){ raiz.querySelector('.tq-trilha').open = false; raiz.querySelector('.tq-topico').scrollIntoView({behavior: tRM() ? 'auto' : 'smooth', block:'start'}); }
    return; }
  const p = e.target.closest('.tq-pratica [data-p]'); if(p){ TEORIA[teoriaAtual].pratica[+p.dataset.p][1](); return; }
  const n = e.target.closest('.tq-nav [data-nav]');
  if(n){ teoriaAtual += +n.dataset.nav; renderTopicoT(); $('#v-teoria').scrollIntoView({behavior: tRM() ? 'auto' : 'smooth', block:'start'}); }
});
ganchosAba.push(v=>{ if(v!=='teoria'){ pararRelogiosT(); const vt = $('#teoriaApp .tq-volta'); if(vt) vt.hidden = true; } });
