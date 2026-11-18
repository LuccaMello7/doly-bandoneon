/* ================== Teoria musical: os 16 tópicos ================== */
// Cada tópico tem um laboratório (lab: monta a parte de mexer e devolve {mostra(cfg)}, que o botão
// "Ver no laboratório" do teste usa), os geradores de perguntas e os atalhos para praticar.
// Textos: teoria-textos.js; frases: teoria-frases.js (tf). A ordem vem de TEORIA_MODULOS.
// As perguntas sorteiam os dados (a nota, o intervalo, a tonalidade…) e montam o "Por quê" a partir
// deles: o comentário de cada opção errada diz o que aquela opção seria.

const topicoT = x => TEORIA.push(x);
const semN = n => tf(n===1 ? 'ui.semitom' : 'ui.semitons', n);
const fracT = v => ({0.25:'¼', 0.5:'½', 0.75:'¾', 1.5:'1½', 3.5:'3½'})[v] || String(v);
const temposT = v => tf(v <= 1 ? 'ui.tempo1' : 'ui.tempos', fracT(v));
const catT = k => tf('cat.' + k);
function esqueletoT(el, escolhas, o={}){
  el.innerHTML = `${escolhas ? `<div class="tq-escolhas">${escolhas}</div>` : ''}${o.leitura ? '<div class="tq-leitura"></div>' : ''}
    <div class="tq-lab-meio${o.soPauta ? ' so' : ''}"><div class="tq-pauta-box"></div>${o.soPauta ? '' : '<div class="tq-lado"></div>'}</div>${o.acoes ? `<div class="tq-acoes">${o.acoes}</div>` : ''}<div class="tq-inst"></div>`;
  const q = s=>el.querySelector(s);
  return {el, pauta:q('.tq-pauta-box'), lado:q('.tq-lado'), leitura:q('.tq-leitura'), instEl:q('.tq-inst'), acoes:q('.tq-acoes'), rel:relogioT(), q};
}
const escolhaT = (rot, id) => `<div class="tq-escolha"><span class="tq-rotulo">${rot}</span><div data-esc="${id}"></div></div>`;
// {certa, erradas:[{v, e}]} → {o, a, erros}: as opções embaralhadas e o comentário de cada errada
// o.ordena: números em ordem crescente (fica mais natural do que embaralhado)
function opcoesT(certa, erradas, o={}){
  const r = opcoes(certa, erradas.map(x=>x.v)), erros = {};
  if(o.ordena){ const ord = r.o.map((v, k)=>({v, k})).sort((p, q)=>parseFloat(p.v) - parseFloat(q.v));
    r.o = ord.map(x=>x.v); r.idx = ord.map(x=>r.idx[x.k]); r.a = r.idx.indexOf(0); }
  r.idx.forEach((orig, k)=>{ if(orig) erros[k] = erradas[orig-1].e; });
  return {o:r.o, a:r.a, erros};
}
const paresT = bts => bts.slice(1).map((b, i)=>[bts[i] && bts[i].id, b && b.id]).filter(([a, b])=>a && b);
// Toca uma sequência de notas grafadas: cada uma aparece na pauta, acende no teclado (com a seta desde
// a anterior) e soa. o: {clave, W, x0, max, passo (ms), rotulos, armadura, destaque, aoPasso(i), fim(), parado}
function seqT(S, inst, notas, o={}){
  const tec = inst.tec, dir = inst.dir, passo = o.passo || 430, W = o.W || 380;
  S.rel.limpa(); tec.limpa();
  const bts = tec.caminho(notas.map(g=>g.m)), xs = xsT(notas.length, o.x0 || 100, W, o.max || 38);
  const pn = notas.map((g, i)=>({d:g.d, acid:g.acid, x:xs[i]}));
  const pinta = (ate, soa)=>{ S.pauta.innerHTML = pautaT({clave:o.clave, W, armadura:o.armadura, rotulos:o.rotulos ? o.rotulos.slice(0, ate+1) : null,
    notas:pn.slice(0, ate+1).map((n, i)=>({...n, cls:(i===soa ? 'soa ' : '') + ((o.destaque || []).includes(i) ? 'dest' : '')}))}); };
  bts.forEach((b, i)=>{ if(b) tec.rotulo(b.id, nomeG(notas[i])); });
  if(o.parado){ pinta(notas.length-1, -1); tec.acende(bts.filter(Boolean).map(b=>b.id), dir); tec.arcos(paresT(bts), 'fixo'); o.fim && o.fim(); return bts; }
  notas.forEach((g, i)=>S.rel.depois(i*passo, ()=>{
    pinta(i, i); tSom(g.m, 0, passo/1000*.92, .16, inst.mao);
    const b = bts[i]; if(b){ tec.acende([b.id], dir); tec.onda(b.id); if(i && bts[i-1]) tec.maisArco(bts[i-1].id, b.id, 'desenha'); }
    o.aoPasso && o.aoPasso(i);
  }));
  S.rel.depois(notas.length*passo + 150, ()=>{ pinta(notas.length-1, -1); o.fim && o.fim(); });
  return bts;
}
// Na troca do fole, as setas da sequência escorregam para os botões da outra direção
function foleSeqT(inst, notas, velhos){
  const tec = inst.tec, novos = tec.caminho(notas.map(g=>g.m));
  tec.apaga(); tec.limparRotulos(); novos.forEach((b, i)=>{ if(b) tec.rotulo(b.id, nomeG(notas[i])); });
  tec.acende(novos.filter(Boolean).map(b=>b.id), inst.dir); tec.moveArcos(paresT(velhos), paresT(novos));
  return novos;
}
// Um acorde no teclado: a melhor posição (acordes.js) ou, sem ela, um botão para cada nota
function posicaoT(tec, ms){
  const bts = []; let P = null;
  ms.forEach(m=>{ const b = tec.botoes(m).filter(x=>!bts.includes(x)).sort((p, q)=>P ? Math.hypot(p.x-P.x, p.y-P.y) - Math.hypot(q.x-P.x, q.y-P.y) : 0)[0]; if(b){ bts.push(b); P = b; } });
  return bts;
}
function mostraAcordeT(tec, ms, nomes, anima){
  const bts = posicaoT(tec, ms); tec.apaga(); tec.limparRotulos();
  bts.forEach((b, i)=>tec.rotulo(b.id, nomes ? nomes[ms.indexOf(b[tec.dir])] || noteName(b[tec.dir]) : noteName(b[tec.dir])));
  tec.acende(bts.map(b=>b.id), 'ok'); tec.forma(bts.map(b=>b.id), anima);
  if(anima) bts.forEach(b=>tec.onda(b.id, T_COR.ok));
  return bts;
}
// Desenha um compasso de ritmo na pauta: figs = [{tipo, dur (em tempos), pausa, ponto, acento}]
function ritmoT(figs, o={}){
  const W = o.W || 380, x0 = o.x0 || 112, total = figs.reduce((s, f)=>s + f.dur, 0), larg = W - x0 - 34; let t = 0, extra = '';
  figs.forEach((f, i)=>{ const x = x0 + (t/total)*larg + 8; t += f.dur;
    extra += f.pausa ? pausaT(f.tipo, x, {i, cls:f.cls}) : figuraT(f.tipo, x, o.y || 102, {i, ponto:f.ponto, acento:f.acento, cls:f.cls}); });
  return pautaT({W, compasso:o.compasso || [4, 4], barras:[W-14], extra});
}
const NOMES_FIG = ['semibreve','minima','seminima','colcheia','semicolcheia'];
const VALOR_FIG = {semibreve:4, minima:2, seminima:1, colcheia:.5, semicolcheia:.25};

/* ======== Módulo 1: Ler a partitura ======== */
const dirT = d => tf('ui.dir.' + d);
const claveT = c => tf(c==='fa' ? 'ui.clavefa.c' : 'ui.clavesol.c');
const umaOitavaT = l => Array.from({length:8}, (_, i)=>nomeL(l + i));

/* ---------- 1. As notas e as oitavas ---------- */
topicoT({id:'notas',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('ui.nota'), 'letra'));
    let letra = 0, bts = [];
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>doBotao(b, d), aoTrocarFole:()=>{
      const ns = oitavas(); if(ns.length===bts.length && bts.length){ bts = foleSeqT(inst, ns, bts); legenda(ns); } else mostra(null, false); }});
    const oitavas = ()=>[...new Set(inst.tec.L.map(b=>b[inst.dir]))].filter(m=>pcDe(m)===T_NAT[letra]).sort((a, b)=>a-b).map(m=>grafa(m, letra));
    const legenda = ns=>inst.nota(tf('notas.leg', nomeL(letra), ns.length, dirT(inst.dir), ns.map(g=>nomeG(g)).join(' · ')));
    function lado(){ S.lado.innerHTML = `<div class="tq-roda">${umaOitavaT(0).map((n, i)=>`<span class="${i%7===letra ? 'on' : ''}">${n}</span>`).join('')}</div><p class="tq-lado-txt">${tf('notas.lado')}</p>`; }
    function mostra(cfg, som=true){
      if(cfg){ if(cfg.letra!=null){ letra = cfg.letra; ch.marca(letra); } if(cfg.dir && cfg.dir!==inst.dir) inst.setDir(cfg.dir, false); }
      const ns = oitavas(); lado(); bts = seqT(S, inst, ns, {W:360, x0:120, max:62, passo:560, parado:!som}); legenda(ns);
    }
    function doBotao(b, d){
      S.rel.limpa(); const m = b[d], g = grafaSust(m), tec = inst.tec; tSom(m, 0, .6);
      tec.limpa(); tec.acende([b.id], d); tec.onda(b.id); bts = [];
      S.pauta.innerHTML = pautaT({W:360, notas:[{d:g.d, acid:g.acid, x:210, cls:'soa'}]});
      inst.nota(b.open===b.close ? tf('notas.bt.igual', noteName(b.open)) : tf('notas.bt', noteName(b.open), noteName(b.close)));
    }
    const ch = chipsT(S.q('[data-esc="letra"]'), [0,1,2,3,4,5,6].map(i=>({v:i, rot:nomeL(i)})), letra, v=>{ letra = +v; mostra(); });
    mostra(null, false);
    return {mostra:cfg=>mostra(cfg)};
  },
  perguntas:[
    ()=>{ const x = Math.floor(Math.random()*7), c = (x+1)%7, a = 60 + T_NAT[x];
      const er = [6, 2, 4].map(k=>{ const l = (x+k)%7; return {v:nomeL(l), e:k===6 ? tf('notas.e.antes', nomeL(l), nomeL(x)) : tf('notas.e.dist', nomeL(l), k, nomeL(x))}; });
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('notas.q.depois', nomeL(x)), ...opcoesT(nomeL(c), er),
        pq:{contas:[{tipo:'cadeia', titulo:tf('notas.pq.ordem'), itens:umaOitavaT(0), destaque:[x, x===6 ? 7 : c], res:tf('notas.pq.depois', nomeL(x), nomeL(c))}],
          texto:tf('notas.pq.roda'), ouvir:()=>{ tSom(a, 0, .5); tSom(x===6 ? 72 : 60 + T_NAT[c], .55, .7); }, ouvirRot:tf('ui.ouvir.duas'), lab:{letra:c}}}; },
    ()=>{ const x = Math.floor(Math.random()*7), c = (x+6)%7, a = 60 + T_NAT[x];
      const er = [1, 5, 3].map(k=>{ const l = (x+k)%7; return {v:nomeL(l), e:k===1 ? tf('notas.e.depois1', nomeL(l), nomeL(x)) : tf('notas.e.antesn', nomeL(l), 7-k, nomeL(x))}; });
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('notas.q.antes', nomeL(x)), ...opcoesT(nomeL(c), er),
        pq:{contas:[{tipo:'cadeia', titulo:tf('notas.pq.ordem'), itens:umaOitavaT(0), destaque:[x===0 ? 7 : x, c], res:tf('notas.pq.antes', nomeL(x), nomeL(c))}],
          texto:tf('notas.pq.roda'), ouvir:()=>{ tSom(x===0 ? 59 : 60 + T_NAT[c], 0, .5); tSom(a, .55, .7); }, ouvirRot:tf('ui.ouvir.duas'), lab:{letra:c}}}; },
    ()=>{ const casos = ['acima','abaixo','igual','outra'], caso = sorteia(casos), l = Math.floor(Math.random()*7), m1 = (caso==='abaixo' ? 72 : 60) + T_NAT[l];
      const m2 = caso==='acima' ? m1+12 : caso==='abaixo' ? m1-12 : caso==='igual' ? m1 : m1 + sorteia([5, 7, 9]), dist = Math.abs(m2-m1);
      const par = ()=>{ tSom(m1, 0, .6); tSom(m2, .75, .8); return 1.8; };
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('notas.q.ouvir'), som:par,
        ...opcoesT(tf('notas.o.'+caso), casos.filter(c=>c!==caso).map(c=>({v:tf('notas.o.'+c), e:tf('notas.oe.'+c)}))),
        pq:{texto:tf('notas.pq.ouviu', noteName(m1), noteName(m2)) + ' ' + tf('notas.pq.caso.'+caso),
          contas:dist ? [{tipo:'pontos', titulo:tf('notas.pq.dist'), n:dist, res:tf('notas.pq.dist.res', semN(dist))}] : [],
          ouvir:par, ouvirRot:tf('ui.ouvir.duas'), lab:{letra:l}}}; },
    ()=>{ const l = Math.floor(Math.random()*7), dir = sorteia(['open','close']), pc = T_NAT[l], L = state.layout.right, alvos = L.filter(b=>pcDe(b[dir])===pc).sort((a, b)=>a[dir]-b[dir]);
      return {tipo:'tocar', cat:catT('band'), q:tf('notas.q.tocar', nomeL(l), dirT(dir)), mao:'right', dir, resp:nomeL(l),
        toque:(b, m)=>pcDe(m)===pc ? {certa:true, comentario:tf('notas.t.ok', noteName(m))} : {certa:false, comentario:tf('notas.t.e', noteName(m))},
        mostra:tec=>{ alvos.forEach(b=>tec.rotulo(b.id, noteName(b[dir]))); tec.acende(alvos.map(b=>b.id), 'ok'); alvos.forEach(b=>tec.onda(b.id, T_COR.ok)); tec.arcos(paresT(alvos), 'desenha', 220); },
        pq:{contas:[{tipo:'pontos', titulo:tf('notas.t.pt', nomeL(l), dirT(dir)), n:alvos.length, total:L.length, res:tf('notas.t.res', alvos.length, L.length)}],
          texto:tf('notas.t.pq', nomeL(l), alvos.length), ouvir:()=>alvos.forEach((b, i)=>tSom(b[dir], i*.45, .5)), ouvirRot:tf('ui.ouvir.todas'), lab:{letra:l, dir}}}; },
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('notas.q.sete'), ...opcoesT('7', [{v:'8', e:tf('notas.7.e8')}, {v:'12', e:tf('notas.7.e12')}, {v:'5', e:tf('notas.7.e5')}], {ordena:true}),
      pq:{contas:[{tipo:'cadeia', titulo:tf('notas.pq.ordem'), itens:umaOitavaT(0), destaque:[7], res:tf('notas.7.res')}], texto:tf('notas.7.pq'), lab:{letra:0}}}),
    ()=>{ const l = Math.floor(Math.random()*7), cima = Math.random() < .5, a = nomeL(l) + 4, b = nomeL(l) + (cima ? 5 : 3), m4 = 60 + T_NAT[l], mb = m4 + (cima ? 12 : -12);
      const ops = ['acima','abaixo','igual','cinco'], certa = cima ? 'acima' : 'abaixo';
      const com = k=>k==='acima' ? tf('notas.n.e.acima', b, a) : k==='abaixo' ? tf('notas.n.e.abaixo', b, a) : tf('notas.n.e.'+k);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('notas.q.num', b, a), ...opcoesT(tf('notas.n.'+certa), ops.filter(k=>k!==certa).map(k=>({v:tf('notas.n.'+k), e:com(k)}))),
        pq:{contas:[{tipo:'cadeia', titulo:tf('notas.pq.conta8'), itens:umaOitavaT(l), destaque:[0, 7], res:tf('notas.n.res')}],
          texto:tf('notas.n.pq'), ouvir:()=>{ tSom(m4, 0, .6); tSom(mb, .75, .8); }, ouvirRot:tf('ui.ouvir.duas'), lab:{letra:l}}}; },
  ],
  pratica:[['ui.p.teclado', ()=>go('teclado')], ['ui.p.encontre', ()=>abrirDesafio('find')]]});

/* ---------- 2. A pauta e as claves ---------- */
const LINHAS_T = {sol:[30,32,34,36,38], fa:[18,20,22,24,26]};
const ordT = (k, n) => tf('ord.' + k)[n];
// onde fica uma posição da pauta, em palavras: "na 2ª linha", "no 3º espaço", "na 1ª linha suplementar de baixo"…
function ondeT(clave, d){
  const k = d - T_BASE[clave];
  if(k >= 0 && k <= 8) return k%2===0 ? tf('pauta.pos.linha', ordT('linha', k/2)) : tf('pauta.pos.espaco', ordT('espaco', (k-1)/2));
  if(k === -1) return tf('pauta.pos.sob');
  if(k === 9) return tf('pauta.pos.sobre');
  if(k < 0) return k%2===0 ? tf('pauta.pos.supb', ordT('linha', -k/2 - 1)) : tf('pauta.pos.supb.e', ordT('linha', (-k-1)/2 - 1));
  return k%2===0 ? tf('pauta.pos.supc', ordT('linha', (k-8)/2 - 1)) : tf('pauta.pos.supc.e', ordT('linha', (k-9)/2 - 1));
}
// a conta do "Por quê": as linhas ou os espaços da clave, ou o caminho de nota em nota até sair da pauta
function contaPosT(clave, d){
  const base = T_BASE[clave], k = d - base;
  if(k >= 0 && k <= 8){ const linha = k%2===0, ds = linha ? [0,2,4,6,8] : [1,3,5,7];
    return {tipo:'cadeia', titulo:tf(linha ? 'pauta.linhas.cb' : 'pauta.espacos.cb'), itens:ds.map(x=>nomeL(base + x)), destaque:[ds.indexOf(k)]}; }
  const ref = k < 0 ? base : base + 8, passo = k < 0 ? -1 : 1, itens = [];
  for(let x = ref; passo < 0 ? x >= d : x <= d; x += passo) itens.push(nomeL(x));
  return {tipo:'cadeia', titulo:tf(k < 0 ? 'pauta.conta.baixo' : 'pauta.conta.cima'), itens, destaque:[itens.length-1], res:tf('pauta.conta.res', itens.length-1)};
}
const ondeLetraT = (clave, l) => { const r = []; for(let k=0;k<=8;k++) if((T_BASE[clave] + k)%7===l) r.push(ondeT(clave, T_BASE[clave] + k)); return r.join(tf('ui.e')); };
function lerPautaQ(clave){
  const base = T_BASE[clave], d = base - 2 + Math.floor(Math.random()*13), m = dToMidi(d), l = d%7, mao = clave==='fa' ? 'left' : 'right';
  const er = embaralha([-2, -1, 1, 2]).slice(0, 3).map(dl=>{ const L2 = nomeL(l + dl), lado = tf(dl > 0 ? 'ui.acima' : 'ui.abaixo');
    return {v:L2, e:Math.abs(dl)===1 ? tf('pauta.e1', L2, lado) : tf('pauta.en', L2, Math.abs(dl), lado)}; });
  return {tipo:'opcoes', cat:catT('pauta'), q:tf('pauta.q.ler', claveT(clave).toLowerCase()), pauta:{clave, W:300, notas:[{d, acid:0, x:190}]}, ...opcoesT(nomeL(l), er),
    pq:{texto:tf('pauta.pos.frase', noteName(m), ondeT(clave, d)) + ' ' + tf('pauta.mao.' + clave), contas:[contaPosT(clave, d)], ouvir:()=>tSom(m, 0, .8, .16, mao), lab:{clave, d}}};
}
topicoT({id:'pauta',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('ui.clave'), 'clave'));
    let clave = 'sol', d = null, acid = 0;
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, dd)=>doBotao(b, dd), aoTrocarFole:()=>{ if(d!=null) acende(false); }});
    function lado(){ const ls = LINHAS_T[clave], es = ls.slice(0, 4).map(x=>x+1), cel = x=>`<span class="${x===d && !acid ? 'on' : ''}">${nomeL(x)}</span>`;
      S.lado.innerHTML = `<div class="tq-le"><span class="tq-rotulo">${tf('pauta.linhas.cb')}</span><div class="tq-le-l">${ls.map(cel).join('')}</div>
        <span class="tq-rotulo">${tf('pauta.espacos.cb')}</span><div class="tq-le-l">${es.map(cel).join('')}</div></div><p class="tq-lado-txt">${tf('pauta.mao.' + clave)}</p>`; }
    function desenha(cai){
      const base = T_BASE[clave];
      S.pauta.innerHTML = pautaT({clave, W:360, notas:d==null ? [] : [{d, acid, x:215, cls:'soa'}]});
      const svg = S.pauta.querySelector('svg');
      for(let k=base-4; k<=base+12; k++) svg.insertAdjacentHTML('beforeend', `<rect class="tq-alvo" x="64" y="${120-(k-base)*6-3}" width="290" height="6" data-d="${k}"/>`);
      const n = svg.querySelector('.nota'); if(cai && n && !tRM()) n.animate([{transform:'translateY(-30px)', opacity:0}, {transform:'none', opacity:1}], {duration:380, easing:T_EASE});
      lado();
    }
    function acende(som){
      const m = dToMidi(d) + acid, tec = inst.tec, bs = tec.botoes(m);
      tec.limpa(); bs.forEach(b=>tec.rotulo(b.id, noteName(m))); tec.acende(bs.map(b=>b.id), inst.dir); bs.forEach(b=>tec.onda(b.id));
      if(som) tSom(m, 0, .7, .16, inst.mao);
      const onde = acid ? '' : tf('pauta.pos.frase', noteName(m), ondeT(clave, d)) + ' ';
      inst.nota(onde + (bs.length ? tf(bs.length > 1 ? 'pauta.bt.n' : 'pauta.bt.1', dirT(inst.dir), bs.length) : tf('pauta.bt.0', noteName(m), dirT(inst.dir))));
    }
    function doBotao(b, dd){ const g = grafaSust(b[dd]); d = g.d; acid = g.acid; desenha(true); acende(true); }
    S.pauta.addEventListener('click', e=>{ const r = e.target.closest('[data-d]'); if(!r) return; d = +r.dataset.d; acid = 0; desenha(true); acende(true); });
    const ch = chipsT(S.q('[data-esc="clave"]'), [{v:'sol', rot:tf('ui.clavesol.c')}, {v:'fa', rot:tf('ui.clavefa.c')}], clave, v=>{ clave = v; d = null; inst.setMao(v==='fa' ? 'left' : 'right'); desenha(); inst.nota(tf('pauta.dica')); });
    desenha(); inst.nota(tf('pauta.dica'));
    return {mostra(cfg){
      if(cfg.clave && cfg.clave!==clave){ clave = cfg.clave; ch.marca(clave); inst.setMao(clave==='fa' ? 'left' : 'right'); }
      if(cfg.dir && cfg.dir!==inst.dir) inst.setDir(cfg.dir, false);
      d = cfg.d==null ? null : cfg.d; acid = 0; desenha(true); if(d!=null) acende(true); }};
  },
  perguntas:[
    ()=>lerPautaQ('sol'),
    ()=>lerPautaQ('fa'),
    ()=>{ const clave = sorteia(['sol','fa']), base = T_BASE[clave], linha = Math.random() < .6, n = Math.floor(Math.random()*(linha ? 5 : 4)), k = linha ? n*2 : n*2+1, d = base + k, l = d%7;
      const er = embaralha([0,1,2,3,4,5,6].filter(x=>x!==l)).slice(0, 3).map(x=>({v:nomeL(x), e:tf('pauta.ord.e', nomeL(x), ondeLetraT(clave, x))}));
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('pauta.q.ord', claveT(clave).toLowerCase(), ondeT(clave, d)), ...opcoesT(nomeL(l), er),
        pq:{contas:[contaPosT(clave, d)], texto:tf('pauta.mnem.' + clave), ouvir:()=>tSom(dToMidi(d), 0, .8), lab:{clave, d}}}; },
    ()=>{ const dir = sorteia(['open','close']), d = 28 + Math.floor(Math.random()*12), m = dToMidi(d);
      return {tipo:'tocar', cat:catT('band'), q:tf('pauta.q.tocar', dirT(dir)), pauta:{clave:'sol', W:300, notas:[{d, acid:0, x:190}]}, mao:'right', dir, resp:noteName(m),
        toque:(b, mm)=>mm===m ? {certa:true} : {certa:false, comentario:tf('pauta.t.e', noteName(mm)) + (pcDe(mm)===pcDe(m) ? ' ' + tf('pauta.t.oit') : '')},
        mostra:tec=>{ const bs = tec.botoes(m); bs.forEach(b=>tec.rotulo(b.id, noteName(m))); tec.acende(bs.map(b=>b.id), 'ok'); bs.forEach(b=>tec.onda(b.id, T_COR.ok)); },
        pq:{texto:tf('pauta.pos.frase', noteName(m), ondeT('sol', d)) + ' ' + tf('pauta.t.pq', dirT(dir)), contas:[contaPosT('sol', d)], ouvir:()=>tSom(m, 0, .8), lab:{clave:'sol', d, dir}}}; },
    ()=>({tipo:'opcoes', cat:catT('band'), q:tf('pauta.q.clave'),
      ...opcoesT(tf('ui.clavefa.c'), [{v:tf('ui.clavesol.c'), e:tf('pauta.c.e.sol')}, {v:tf('pauta.c.do'), e:tf('pauta.c.e.do')}, {v:tf('pauta.c.cifra'), e:tf('pauta.c.e.cifra')}]),
      pq:{texto:tf('pauta.c.pq'), contas:[{tipo:'pauta', titulo:tf('pauta.c.pt'), pauta:{clave:'fa', W:300, notas:[{d:18, acid:0, x:120}, {d:22, acid:0, x:170}, {d:26, acid:0, x:220}]}}], lab:{clave:'fa', d:22}}}),
    ()=>({tipo:'opcoes', cat:catT('pauta'), q:tf('pauta.q.sup'), pauta:{clave:'sol', W:300, notas:[{d:28, acid:0, x:140}, {d:40, acid:0, x:220}]},
      ...opcoesT(tf('pauta.s.certa'), [{v:tf('pauta.s.clave'), e:tf('pauta.s.e.clave')}, {v:tf('pauta.s.fim'), e:tf('pauta.s.e.fim')}, {v:tf('pauta.s.fole'), e:tf('pauta.s.e.fole')}]),
      pq:{texto:tf('pauta.s.pq', noteName(60), noteName(81)), contas:[contaPosT('sol', 40)], ouvir:()=>{ tSom(60, 0, .6); tSom(81, .7, .8); }, ouvirRot:tf('ui.ouvir.duas'), lab:{clave:'sol', d:28}}}),
  ],
  pratica:[['ui.p.leitura', ()=>abrirDesafio('staff')], ['ui.p.pautabot', ()=>abrirDesafio('pautabot')]]});

/* ---------- 3. Sustenido, bemol e bequadro ---------- */
// a outra grafia do mesmo som: Fá♯ = Sol♭, Mi♯ = Fá, Dó♭ = Si
const enarmT = g => g.acid > 0 ? grafa(g.m, (g.letra+1)%7) : g.acid < 0 ? grafa(g.m, (g.letra+6)%7) : null;
function enarmTxt(g){ const o = enarmT(g); if(!o) return ''; return o.acid===0 ? tf('acid.enh.nat', nomeG(g, false), nomeG(o, false)) : tf('acid.enh', nomeG(g, false), nomeG(o, false)); }
topicoT({id:'acidentes',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('ui.nota'), 'letra') + escolhaT(tf('acid.sinal'), 'acid'));
    let letra = 3, acid = 1, bts = [];
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ S.rel.limpa(); tSom(b[d], 0, .6); inst.tec.limpa(); inst.tec.acende([b.id], d); inst.tec.onda(b.id);
      inst.nota(tf('acid.bt', noteName(b[d]), [1,3,6,8,10].includes(pcDe(b[d])) ? enarmTxt(grafaSust(b[d])) : '')); },
      aoTrocarFole:()=>{ const [a, b] = par(); bts = foleSeqT(inst, [a, b], bts); }});
    // ♯ e ♭: do natural para a nota alterada; ♮: da nota com sustenido de volta ao natural
    const par = ()=>{ const nat = grafa(60 + T_NAT[letra], letra); return acid===0 ? [grafa(nat.m+1, letra), {...nat, bequadro:true}] : [nat, grafa(nat.m + acid, letra)]; };
    function lado(a, b){
      const lo = Math.min(a.m, b.m) - 2, cel = [];
      for(let m=lo; m<lo+6; m++){ const preta = [1,3,6,8,10].includes(pcDe(m)), on = m===a.m || m===b.m;
        cel.push(`<span class="c ${preta ? 'preta' : ''} ${on ? 'conta' : ''} ${m===b.m ? 'ponta' : ''}"><i>${preta ? noteName(m).replace(/\d+$/, '') + '<br>' + nomeG(grafaBem(m), false) : nomeG(grafaSust(m), false)}</i></span>`); }
      S.lado.innerHTML = `<div class="tq-regua seis">${cel.join('')}</div><p class="tq-lado-txt">${acid===0 ? tf('acid.lado.beq') : tf('acid.lado', semN(1))}</p>`;
    }
    function mostra(cfg, som=true){
      if(cfg){ if(cfg.letra!=null){ letra = cfg.letra; chL.marca(letra); } if(cfg.acid!=null){ acid = cfg.acid; chA.marca(acid); } }
      const [a, b] = par(); lado(a, b);
      bts = seqT(S, inst, [a, b], {W:340, x0:140, max:90, passo:650, parado:!som, fim:()=>{
        S.pauta.innerHTML = pautaT({W:340, notas:[{d:a.d, acid:a.acid, x:140}, {d:b.d, acid:b.bequadro ? 0 : b.acid, bequadro:b.bequadro, x:230, cls:'soa'}], chave:{i:0, j:1, rotulo:b.m > a.m ? '+1' : '−1'}}); }});
      inst.nota(acid===0 ? tf('acid.leg.beq', nomeG(a), nomeG(b)) : tf(acid > 0 ? 'acid.leg.sobe' : 'acid.leg.desce', nomeG(a), nomeG(b)) + ' ' + enarmTxt(b));
    }
    const chL = chipsT(S.q('[data-esc="letra"]'), [0,1,2,3,4,5,6].map(i=>({v:i, rot:nomeL(i)})), letra, v=>{ letra = +v; mostra(); });
    const chA = chipsT(S.q('[data-esc="acid"]'), [{v:1, rot:'♯ ' + tf('acid.n.sust')}, {v:-1, rot:'♭ ' + tf('acid.n.bemol')}, {v:0, rot:'♮ ' + tf('acid.n.beq')}], acid, v=>{ acid = +v; mostra(); });
    mostra(null, false);
    return {mostra:cfg=>mostra(cfg)};
  },
  perguntas:[
    ()=>{ const qual = sorteia(['sust','bemol','beq']), certa = {sust:'sobe', bemol:'desce', beq:'cancela'}[qual];
      const todas = ['sobe','desce','cancela','tom'], com = {sobe:'acid.e.sobe', desce:'acid.e.desce', cancela:'acid.e.cancela', tom:'acid.e.tom'};
      const exemplo = {sust:[3, 1], bemol:[6, -1], beq:[3, 0]}[qual];
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('acid.q.' + qual), ...opcoesT(tf('acid.o.' + certa), todas.filter(x=>x!==certa).map(x=>({v:tf('acid.o.' + x), e:tf(com[x])}))),
        pq:{texto:tf('acid.pq.' + qual), lab:{letra:exemplo[0], acid:exemplo[1]}}}; },
    ()=>{ const ops = [[0,1],[1,1],[3,1],[4,1],[5,1],[1,-1],[2,-1],[4,-1],[5,-1],[6,-1]], [l, a] = sorteia(ops), g = grafa(60 + T_NAT[l] + a, l), o = enarmT(g);
      const cand = [grafa(g.m - 2*a, l), grafa(o.m + a*2, o.letra), grafa(T_NAT[o.letra] + 60, o.letra)];
      const er = cand.map(c=>{ const dist = c.m - g.m; return {v:nomeG(c, false), e:tf(dist > 0 ? 'acid.enh.acima' : 'acid.enh.abaixo', nomeG(c, false), semN(Math.abs(dist)), nomeG(g, false))}; });
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('acid.q.enh', nomeG(g, false)), ...opcoesT(nomeG(o, false), er),
        pq:{contas:[{tipo:'cadeia', titulo:tf('acid.pq.enh.t'), itens:[nomeG(grafaSust(g.m-1), false), nomeG(g, false) + ' = ' + nomeG(o, false), nomeG(grafaSust(g.m+1), false)], lig:['+1', '+1'], destaque:[1]}],
          texto:tf('acid.enh', nomeG(g, false), nomeG(o, false)) + ' ' + tf('acid.enh.pq'), ouvir:()=>tSom(g.m, 0, .8), lab:{letra:l, acid:a}}}; },
    ()=>{ const pares = [['mi','fa'], ['si','do'], ['do','re'], ['fa','sol'], ['re','mi'], ['la','si'], ['sol','la']];
      const L = {do:0, re:1, mi:2, fa:3, sol:4, la:5, si:6}, txtPar = ([a, b])=>nomeL(L[a]) + '–' + nomeL(L[b]);
      const combos = [[2, 4], [3, 5], [4, 6]].map(([i, j])=>[pares[i], pares[j]]).slice(0, 3);
      const entre = ([a, b])=>tf('acid.par.e', nomeL(L[a]), nomeL(L[b]), nomeG(grafaSust(60 + T_NAT[L[a]] + 1), false));
      const certa = txtPar(pares[0]) + tf('ui.e') + txtPar(pares[1]);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('acid.q.par'), ...opcoesT(certa, combos.map(c=>({v:txtPar(c[0]) + tf('ui.e') + txtPar(c[1]), e:entre(c[0]) + ' ' + entre(c[1])}))),
        pq:{contas:[{tipo:'cadeia', titulo:tf('acid.par.t'), itens:umaOitavaT(0), lig:[2,2,1,2,2,2,1].map(passoNome), destaque:[2, 3, 6, 7], res:tf('acid.par.res')}],
          texto:tf('acid.par.pq'), ouvir:()=>{ tSom(64, 0, .5); tSom(65, .55, .5); tSom(71, 1.3, .5); tSom(72, 1.85, .7); }, lab:{letra:2, acid:1}}}; },
    ()=>{ const ops = [[0,1],[1,-1],[3,1],[4,-1],[4,1],[5,-1],[6,-1],[1,1],[2,-1],[5,1]], [l, a] = sorteia(ops), dir = sorteia(['open','close']), nat = grafa(60 + T_NAT[l], l), g = grafa(nat.m + a, l);
      return {tipo:'tocar', cat:catT('band'), q:tf('acid.q.tocar', nomeG(g), dirT(dir)), mao:'right', dir, resp:nomeG(g),
        toque:(b, m)=>m===g.m ? {certa:true} : {certa:false, comentario:tf('acid.t.e', noteName(m)) + (m===nat.m ? ' ' + tf('acid.t.nat') : '')},
        mostra:tec=>{ const A = tec.perto(nat.m), B = tec.perto(g.m, A); tec.rotulo(A.id, nomeG(nat)); tec.rotulo(B.id, nomeG(g)); tec.acende([A.id], 'leve'); tec.acende([B.id], 'ok'); tec.onda(B.id, T_COR.ok); tec.arco(A.id, B.id, 'desenha'); },
        pq:{contas:[{tipo:'cadeia', titulo:tf('acid.t.t'), itens:[nomeG(nat), nomeG(g)], lig:[a > 0 ? '+1' : '−1'], destaque:[1]}],
          texto:tf(a > 0 ? 'acid.t.pq.s' : 'acid.t.pq.b', nomeG(nat), nomeG(g)) + ' ' + enarmTxt(g), ouvir:()=>{ tSom(nat.m, 0, .5); tSom(g.m, .55, .7); }, ouvirRot:tf('ui.ouvir.duas'), lab:{letra:l, acid:a, dir}}}; },
    ()=>{ const l = sorteia([0, 3, 4]), beq = Math.random() < .5, nat = grafa(60 + T_NAT[l], l), s = grafa(nat.m + 1, l);
      const pauta = {W:320, notas:[{d:nat.d, acid:1, x:130}, {d:nat.d, acid:0, bequadro:beq, x:210}], barras:[270]};
      const certa = beq ? nomeG(nat, false) : nomeG(s, false), outra = beq ? nomeG(s, false) : nomeG(nat, false);
      const er = [{v:outra, e:tf(beq ? 'acid.c.e.sust' : 'acid.c.e.nat')}, {v:nomeG(grafa(nat.m-1, l), false), e:tf('acid.c.e.bemol')}, {v:nomeL(l+1), e:tf('acid.c.e.outra', nomeL(l+1))}];
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('acid.q.comp'), pauta, ...opcoesT(certa, er),
        pq:{texto:tf(beq ? 'acid.c.pq.beq' : 'acid.c.pq', certa), ouvir:()=>{ tSom(s.m, 0, .5); tSom(beq ? nat.m : s.m, .6, .7); }, ouvirRot:tf('ui.ouvir.duas'), lab:{letra:l, acid:beq ? 0 : 1}}}; },
  ],
  pratica:[['ui.p.ouvido', ()=>abrirDesafio('ear')], ['ui.p.teclado', ()=>go('teclado')]]});

/* ---------- 4. Figuras e pausas ---------- */
const miniPautaT = c => `<svg class="tq-fig-grande" viewBox="0 60 80 82" aria-hidden="true">${[0,1,2,3,4].map(i=>`<line class="pl" x1="4" x2="76" y1="${120-i*12}" y2="${120-i*12}"/>`).join('')}${c}</svg>`;
topicoT({id:'figuras',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('fig.figura'), 'fig') + escolhaT(tf('fig.escrita'), 'tipo'), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}${tf('ui.tocar')}</button>`});
    let fig = 'seminima', pausa = false, ativa = -1, beat = -1;
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ tSom(b[d], 0, .5); inst.tec.onda(b.id); }}), M = 69;
    const figs = ()=>{ const v = VALOR_FIG[fig]; return Array.from({length:4/v}, ()=>({tipo:fig, dur:v, pausa})); };
    function pinta(){
      const v = VALOR_FIG[fig];
      S.pauta.innerHTML = ritmoT(figs().map((f, i)=>({...f, cls:i===ativa ? 'soa' : ''})));
      S.lado.innerHTML = `<div class="tq-tempos4">${[0,1,2,3].map(k=>`<span class="${k===0 ? 'forte' : ''} ${k===beat ? 'agora' : ''}">${k+1}</span>`).join('')}</div>
        <div class="tq-dur">${figs().map((f, i)=>`<span class="${pausa ? 'pausa' : ''} ${i===ativa ? 'on' : ''}" style="flex:${v}"></span>`).join('')}</div>
        <p class="tq-lado-txt">${tf(pausa ? 'fig.lado.pausa' : 'fig.lado', tf('fig.n.' + fig), temposT(v), 4/v)}</p>`;
    }
    function toca(){
      S.rel.limpa(); ac(); const spb = .75, v = VALOR_FIG[fig], n = 4/v, tec = inst.tec, b = tec.perto(M);
      tec.limpa(); if(b) tec.rotulo(b.id, noteName(M));
      for(let k=0;k<4;k++){ tClique(k*spb, k===0); S.rel.depois(k*spb*1000, ()=>{ beat = k; pinta(); }); }
      for(let i=0;i<n;i++){ const t = i*v*spb;
        if(!pausa) tSom(M, t, v*spb*.88);
        S.rel.depois(t*1000, ()=>{ ativa = i; pinta(); if(b){ tec.apaga(); if(!pausa){ tec.acende([b.id], inst.dir); tec.onda(b.id); } else tec.acende([b.id], 'leve'); } });
        if(!pausa && b) S.rel.depois((t + v*spb*.88)*1000, ()=>tec.apaga(inst.dir)); }
      S.rel.depois(4*spb*1000 + 100, ()=>{ ativa = -1; beat = -1; pinta(); tec.apaga(); });
    }
    S.acoes.querySelector('[data-tocar]').onclick = toca;
    const chF = chipsT(S.q('[data-esc="fig"]'), NOMES_FIG.map(f=>({v:f, rot:tf('fig.N.' + f)})), fig, v=>{ fig = v; S.rel.limpa(); ativa = beat = -1; pinta(); toca(); });
    const chT = chipsT(S.q('[data-esc="tipo"]'), [{v:'nota', rot:tf('fig.nota')}, {v:'pausa', rot:tf('fig.pausa')}], 'nota', v=>{ pausa = v==='pausa'; S.rel.limpa(); ativa = beat = -1; pinta(); toca(); });
    pinta(); inst.nota(tf('fig.dica'));
    return {mostra(cfg){ if(cfg.fig){ fig = cfg.fig; chF.marca(fig); } pausa = !!cfg.pausa; chT.marca(pausa ? 'pausa' : 'nota'); ativa = beat = -1; pinta(); toca(); }};
  },
  perguntas:[
    ()=>{ const [p, g] = sorteia([['colcheia','seminima'], ['seminima','minima'], ['seminima','semibreve'], ['colcheia','minima'], ['semicolcheia','seminima'], ['minima','semibreve']]);
      const n = VALOR_FIG[g]/VALOR_FIG[p], todos = [1, 2, 4, 8, 16].filter(x=>x!==n), er = embaralha(todos).slice(0, 3);
      return {tipo:'opcoes', cat:catT('conta'), q:tf('fig.q.quantas', tf('fig.pl.' + p), tf('fig.n.' + g)),
        ...opcoesT(String(n), er.map(k=>({v:String(k), e:tf('fig.q.e', k, tf(k===1 ? 'fig.n.' + p : 'fig.pl.' + p), temposT(k*VALOR_FIG[p]), tf('fig.n.' + g), temposT(VALOR_FIG[g]))})), {ordena:true}),
        pq:{contas:[{tipo:'barras', titulo:tf('fig.n.' + g) + ' = ' + temposT(VALOR_FIG[g]), partes:[{v:1, rot:tf('fig.N.' + g), cls:'grande'}]},
          {tipo:'barras', titulo:n + ' × ' + tf('fig.n.' + p), partes:Array.from({length:n}, ()=>({v:1, rot:fracT(VALOR_FIG[p])})), res:tf('fig.q.res', n, tf('fig.pl.' + p), tf('fig.n.' + g))}],
          texto:tf('fig.q.pq'), lab:{fig:p}}}; },
    ()=>{ const f = sorteia(['semibreve','minima','seminima','colcheia']), vals = [4, 2, 1, .5, .25], v = VALOR_FIG[f];
      const er = embaralha(vals.filter(x=>x!==v)).slice(0, 3).map(x=>({v:temposT(x), e:tf('fig.v.e', temposT(x), tf('fig.n.' + NOMES_FIG[vals.indexOf(x)]))}));
      return {tipo:'opcoes', cat:catT('conta'), q:tf('fig.q.valor', tf('fig.n.' + f)), html:`<div class="tq-fig-q">${miniPautaT(figuraT(f, 40, 102))}</div>`, ...opcoesT(temposT(v), er),
        pq:{contas:[{tipo:'barras', titulo:tf('fig.v.t'), partes:[{v, rot:tf('fig.N.' + f), cls:'on'}, ...(4 - v > 0 ? [{v:4 - v, rot:'', cls:'vazio'}] : [])], res:tf('fig.v.res', tf('fig.n.' + f), temposT(v), 4/v)}],
          texto:tf('fig.v.pq'), lab:{fig:f}}}; },
    ()=>{ const f = sorteia(NOMES_FIG), er = embaralha(NOMES_FIG.filter(x=>x!==f)).slice(0, 3).map(x=>({v:tf('fig.N.' + x), e:tf('fig.cara.' + x)}));
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('fig.q.qual'), html:`<div class="tq-fig-q">${miniPautaT(figuraT(f, 40, 102))}</div>`, ...opcoesT(tf('fig.N.' + f), er),
        pq:{texto:tf('fig.cara.' + f) + ' ' + tf('fig.qual.pq', tf('fig.n.' + f), temposT(VALOR_FIG[f])), lab:{fig:f}}}; },
    ()=>{ const f = sorteia(NOMES_FIG), er = embaralha(NOMES_FIG.filter(x=>x!==f)).slice(0, 3).map(x=>({v:tf('fig.P.' + x), e:tf('fig.pcara.' + x)}));
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('fig.q.pausa'), html:`<div class="tq-fig-q">${miniPautaT(pausaT(f, 40))}</div>`, ...opcoesT(tf('fig.P.' + f), er),
        pq:{texto:tf('fig.pcara.' + f) + ' ' + tf('fig.pausa.pq', temposT(VALOR_FIG[f])), lab:{fig:f, pausa:true}}}; },
    ()=>{ const f = sorteia(['seminima','minima']), v = VALOR_FIG[f];
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('fig.q.ponto', tf('fig.n.' + f)), html:`<div class="tq-fig-q">${miniPautaT(figuraT(f, 34, 102, {ponto:true}))}</div>`,
        ...opcoesT(tf('fig.ponto.certa', temposT(v*1.5)), [{v:tf('fig.ponto.dobra'), e:tf('fig.ponto.e.dobra')}, {v:tf('fig.ponto.curta'), e:tf('fig.ponto.e.curta')}, {v:tf('fig.ponto.repete'), e:tf('fig.ponto.e.repete')}]),
        pq:{contas:[{tipo:'barras', titulo:tf('fig.ponto.t', tf('fig.n.' + f)), partes:[{v, rot:fracT(v), cls:'on'}, {v:v/2, rot:'+' + fracT(v/2), cls:'mais'}], res:tf('fig.ponto.res', temposT(v), temposT(v/2), temposT(v*1.5))}],
          texto:tf('fig.ponto.pq'), lab:{fig:f}}}; },
    ()=>{ const f = sorteia(['minima','seminima','colcheia']), v = VALOR_FIG[f], spb = .75, ops = ['minima','seminima','colcheia','semibreve'];
      const som = ()=>{ for(let k=0;k<4;k++) tClique(k*spb, k===0); for(let t=0; t<4-1e-6; t+=v) tSom(69, t*spb, v*spb*.85); return 3.2; };
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('fig.q.ouvir'), som,
        ...opcoesT(tf('fig.Pl.' + f), ops.filter(x=>x!==f).map(x=>({v:tf('fig.Pl.' + x), e:tf('fig.o.e', 4/VALOR_FIG[x])}))),
        pq:{contas:[{tipo:'barras', titulo:tf('fig.o.t'), partes:Array.from({length:4/v}, ()=>({v, rot:'♪', cls:'on'})), res:tf('fig.o.res', 4/v, temposT(v))}], texto:tf('fig.o.pq'), ouvir:som, lab:{fig:f}}}; },
  ],
  pratica:[['ui.p.ritmo', ()=>go('ritmo')]]});

/* ---------- 5. Compasso e tempo ---------- */
topicoT({id:'compasso',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('comp.compasso'), 'n'), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}<span>${tf('comp.tocar')}</span></button><span class="tq-fb" aria-live="polite"></span>`});
    let n = 4, tocando = false, batidas = [], acertos = 0, total = 0;
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>bate(b, d)}), M = 69, fb = S.acoes.querySelector('.tq-fb'), btn = S.acoes.querySelector('[data-tocar]');
    function pinta(beat){
      S.pauta.innerHTML = ritmoT(Array.from({length:n}, (_, i)=>({tipo:'seminima', dur:1, acento:i===0, cls:i===beat ? 'soa' : ''})), {compasso:[n, 4]});
      S.lado.innerHTML = `<div class="tq-tempos4 n${n}">${Array.from({length:n}, (_, k)=>`<span class="${k===0 ? 'forte' : ''} ${k===beat ? 'agora' : ''}">${k+1}</span>`).join('')}</div><p class="tq-lado-txt">${tf('comp.lado', n)}</p>`;
    }
    function para(){ S.rel.limpa(); tocando = false; btn.querySelector('span').textContent = tf('comp.tocar'); pinta(-1); inst.tec.apaga(); if(total) fb.innerHTML = tf('comp.fb.fim', acertos, total); }
    function toca(){
      if(tocando){ para(); return; }
      tocando = true; acertos = total = 0; ac(); fb.textContent = ''; btn.querySelector('span').textContent = tf('comp.parar');
      const spb = .6, comp = 4, t0 = performance.now() + 40, b = inst.tec.perto(M); batidas = [];
      if(b) inst.tec.rotulo(b.id, noteName(M));
      for(let c=0;c<comp;c++) for(let k=0;k<n;k++){ const t = (c*n + k)*spb; batidas.push(t0 + t*1000); tClique(t, k===0);
        S.rel.depois(t*1000, ()=>{ pinta(k); if(b){ inst.tec.apaga(); inst.tec.acende([b.id], 'hint'); inst.tec.onda(b.id, k===0 ? T_COR.ok : T_COR[inst.dir]); } }); }
      S.rel.depois(comp*n*spb*1000 + 200, para);
    }
    function bate(b, d){
      tSom(b[d], 0, .22, .14); inst.tec.onda(b.id); inst.tec.efeito(b.id, 'festa');
      if(!tocando){ fb.textContent = tf('comp.fb.antes'); return; }
      const agora = performance.now(), alvo = batidas.reduce((p, q)=>Math.abs(q-agora) < Math.abs(p-agora) ? q : p), dt = agora - alvo; total++;
      if(Math.abs(dt) < 110){ acertos++; fb.innerHTML = tf('comp.fb.ok'); } else fb.innerHTML = tf(dt < 0 ? 'comp.fb.cedo' : 'comp.fb.tarde');
    }
    btn.onclick = toca;
    const ch = chipsT(S.q('[data-esc="n"]'), [2, 3, 4].map(k=>({v:k, rot:k + '/4'})), n, v=>{ n = +v; if(tocando) para(); pinta(-1); });
    pinta(-1); inst.nota(tf('comp.dica'));
    return {mostra(cfg){ if(cfg.n){ n = cfg.n; ch.marca(n); } if(tocando) para(); pinta(-1); toca(); }};
  },
  perguntas:[
    ()=>{ const n = sorteia([2, 3, 4]), er = ['minima','colcheia','semibreve'].map(f=>({v:tf('fig.N.' + f), e:tf('comp.um.e', n, tf('fig.n.' + f), temposT(VALOR_FIG[f]))}));
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('comp.q.um', n + '/4'), ...opcoesT(tf('fig.N.seminima'), er),
        pq:{contas:[{tipo:'barras', titulo:n + '/4', partes:Array.from({length:n}, (_, k)=>({v:1, rot:String(k+1), cls:k ? 'on' : 'forte'})), res:tf('comp.um.res', n)}], texto:tf('comp.um.pq'), lab:{n}}}; },
    ()=>{ const n = sorteia([2, 3, 4]);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('comp.q.cima', n + '/4'), pauta:{W:200, compasso:[n, 4]},
        ...opcoesT(tf('comp.c.tempos'), [{v:tf('comp.c.fig'), e:tf('comp.c.e.fig')}, {v:tf('comp.c.vel'), e:tf('comp.c.e.vel')}, {v:tf('comp.c.quantos'), e:tf('comp.c.e.quantos')}]),
        pq:{texto:tf('comp.c.pq', n), lab:{n}}}; },
    ()=>{ const n = sorteia([2, 3, 4]);
      const combos = [[['minima'],2],[['seminima','seminima'],2],[['seminima','colcheia','colcheia'],2],[['minima','seminima'],3],[['seminima','seminima','seminima'],3],[['minima','colcheia','colcheia'],3],
        [['minima','minima'],4],[['minima','seminima','seminima'],4],[['semibreve'],4],[['minima','seminima','colcheia','colcheia'],4],[['semibreve','seminima'],5],[['minima','minima','seminima'],5],[['seminima'],1],[['colcheia','colcheia','colcheia'],1.5]];
      const desc = c=>{ const cont = {}; c.forEach(f=>{ cont[f] = (cont[f] || 0) + 1; }); return Object.entries(cont).map(([f, k])=>k > 1 ? k + ' ' + tf('fig.pl.' + f) : tf('fig.um.' + f)).join(' + '); };
      const certa = sorteia(combos.filter(c=>c[1]===n)), er = embaralha(combos.filter(c=>c[1]!==n)).slice(0, 3);
      return {tipo:'opcoes', cat:catT('conta'), q:tf('comp.q.completa', n + '/4'), ...opcoesT(desc(certa[0]), er.map(c=>({v:desc(c[0]), e:tf('comp.co.e', desc(c[0]), temposT(c[1]), n)}))),
        pq:{contas:[{tipo:'barras', titulo:desc(certa[0]), partes:certa[0].map(f=>({v:VALOR_FIG[f], rot:fracT(VALOR_FIG[f]), cls:'on'})), res:tf('comp.co.res', temposT(n))}], texto:tf('comp.co.pq', n), lab:{n}}}; },
    ()=>{ const n = sorteia([2, 3, 4]), spb = .55, som = ()=>{ for(let i=0;i<n*3;i++) tClique(i*spb, i%n===0); return n*3*spb + .3; };
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('comp.q.ouvir'), som,
        ...opcoesT(n + '/4', [2, 3, 4].filter(k=>k!==n).map(k=>({v:k + '/4', e:tf('comp.o.e', k, k)})), {ordena:true}),
        pq:{contas:[{tipo:'barras', titulo:tf('comp.o.t'), partes:Array.from({length:n*2}, (_, i)=>({v:1, rot:String(i%n + 1), cls:i%n ? 'on' : 'forte'})), res:tf('comp.o.res', n)}], texto:tf('comp.o.pq'), ouvir:som, lab:{n}}}; },
    ()=>({tipo:'opcoes', cat:catT('band'), q:tf('comp.q.tango'),
      ...opcoesT(tf('comp.t.certa'), [{v:'3/4', e:tf('comp.t.e.3')}, {v:'6/8', e:tf('comp.t.e.6')}, {v:'5/4', e:tf('comp.t.e.5')}]),
      pq:{texto:tf('comp.t.pq'), lab:{n:2}}}),
  ],
  pratica:[['ui.p.ritmo', ()=>go('ritmo')]]});

/* ---------- 6. Dinâmica: o fole fala ---------- */
const DINS = ['pp','p','mp','mf','f','ff'], PICO_DIN = {pp:.035, p:.06, mp:.09, mf:.13, f:.18, ff:.24};
const dinT = d => `<i class="tq-din">${d}</i>`;
// a pauta da dinâmica: quatro semínimas e o sinal embaixo (letras, "garfo" de crescendo/decrescendo, sfz ou acentos)
function pautaDinT(gesto, din){
  const xs = [130, 190, 250, 310]; let extra = xs.map((x, i)=>figuraT('seminima', x, 102, {acento:gesto==='acento' && i%2===0, i})).join('');
  if(gesto==='cresc') extra += '<path class="garfo" d="M128 150 L318 142 M128 150 L318 158"/>';
  else if(gesto==='decresc') extra += '<path class="garfo" d="M128 142 L318 150 M128 158 L318 150"/>';
  else if(gesto==='sfz') extra += `<text class="din" x="250" y="156">sfz</text><text class="din" x="130" y="156">p</text>`;
  else if(gesto==='acento') extra += '<text class="din" x="130" y="156">mf</text>';
  else extra += `<text class="din" x="130" y="156">${din}</text>`;
  return pautaT({W:360, extra});
}
topicoT({id:'dinamica',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('din.nivel'), 'din') + escolhaT(tf('din.gesto'), 'gesto'));
    let din = 'mf', gesto = null;
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ tSom(b[d], 0, .6, PICO_DIN[din]); inst.tec.onda(b.id); }}), M = 69;
    function lado(v, dur){
      S.lado.innerHTML = `<div class="tq-pressao"><span class="tq-rotulo">${tf('din.pressao')}</span><div class="tq-medidor"><i style="--v:0"></i></div>
        <svg class="tq-sanfona g" viewBox="0 0 54 30" aria-hidden="true"><rect x="0" y="3" width="5" height="24" rx="2"/><rect x="49" y="3" width="5" height="24" rx="2"/><g class="tq-pregas"><path d="M9 4 L13 26 L17 4 L21 26 L25 4 L29 26 L33 4 L37 26 L41 4 L45 26"/></g></svg></div>
        <p class="tq-lado-txt">${gesto ? tf('din.g.' + gesto) : tf('din.d.' + din)}</p>`;
      const i = S.lado.querySelector('.tq-medidor i'), sf = S.lado.querySelector('.tq-sanfona');
      sf.style.setProperty('--abre', .7); i.style.transitionDuration = (dur || .5) + 's';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{ i.style.setProperty('--v', v); sf.style.setProperty('--abre', .7 + v*.6); sf.style.transitionDuration = (dur || .5) + 's'; }));
      return i;
    }
    const nivel = d => (DINS.indexOf(d) + 1)/DINS.length;
    function toca(){
      S.rel.limpa(); ac(); const tec = inst.tec, b = tec.perto(M); tec.limpa(); if(b) tec.rotulo(b.id, noteName(M));
      const luz = ()=>{ if(b){ tec.acende([b.id], inst.dir); tec.onda(b.id); } };
      S.pauta.innerHTML = pautaDinT(gesto, din);
      if(!gesto){ lado(nivel(din)); tSom(M, 0, 1.4, PICO_DIN[din]); luz(); S.rel.depois(1400, ()=>tec.apaga()); inst.nota(tf('din.leg', dinT(din), tf('din.n.' + din))); return; }
      if(gesto==='cresc' || gesto==='decresc'){
        const sobe = gesto==='cresc', med = lado(sobe ? .1 : 1, 0);
        S.rel.depois(60, ()=>{ med.style.transitionDuration = '2.6s'; med.style.setProperty('--v', sobe ? 1 : .1); const sf = S.lado.querySelector('.tq-sanfona'); sf.style.transitionDuration = '2.6s'; sf.style.setProperty('--abre', sobe ? 1.3 : .76); });
        tRampa(M, 2.6, sobe ? .025 : .23, sobe ? .23 : .025); luz(); S.rel.depois(2600, ()=>tec.apaga());
      } else {
        const picos = gesto==='sfz' ? [.06, .06, .26, .06] : [.2, .08, .2, .08], med = lado(.3, .15);
        picos.forEach((p, i)=>{ tSom(M, i*.55, .42, p); S.rel.depois(i*550, ()=>{ med.style.setProperty('--v', p/.26); luz(); const n = S.pauta.querySelectorAll('.fig')[i]; if(n){ S.pauta.querySelectorAll('.fig').forEach(f=>f.classList.remove('soa')); n.classList.add('soa'); } }); });
        S.rel.depois(2300, ()=>tec.apaga());
      }
      inst.nota(tf('din.leg.g.' + gesto));
    }
    const chD = chipsT(S.q('[data-esc="din"]'), DINS.map(d=>({v:d, rot:dinT(d), title:tf('din.n.' + d)})), din, v=>{ din = v; gesto = null; chG.marca(''); toca(); });
    const chG = chipsT(S.q('[data-esc="gesto"]'), ['cresc','decresc','sfz','acento'].map(g=>({v:g, rot:tf('din.gn.' + g)})), '', v=>{ gesto = v; chD.marca(''); toca(); });
    S.pauta.innerHTML = pautaDinT(null, din); lado(nivel(din)); inst.nota(tf('din.dica'));
    return {mostra(cfg){ if(cfg.gesto){ gesto = cfg.gesto; chG.marca(gesto); chD.marca(''); } else if(cfg.din){ din = cfg.din; gesto = null; chD.marca(din); chG.marca(''); } toca(); }};
  },
  perguntas:[
    ()=>{ const d = sorteia(['p','f','pp','ff']), certa = tf('din.sig.' + d), outras = ['p','f','pp','ff'].filter(x=>x!==d);
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('din.q.sig', dinT(d), tf('din.it.' + d)), ...opcoesT(certa, outras.map(x=>({v:tf('din.sig.' + x), e:tf('din.sig.e', dinT(x), tf('din.sig.' + x).toLowerCase())}))),
        pq:{contas:[{tipo:'cadeia', titulo:tf('din.ordem'), itens:DINS.map(dinT), destaque:[DINS.indexOf(d)], res:tf('din.ordem.res')}], texto:tf('din.sig.pq'), ouvir:()=>tSom(69, 0, 1.2, PICO_DIN[d]), lab:{din:d}}}; },
    ()=>{ const ops = embaralha(DINS.slice()).slice(0, 4), forte = ops.reduce((a, b)=>DINS.indexOf(b) > DINS.indexOf(a) ? b : a);
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('din.q.forte'), ...opcoesT(dinT(forte), ops.filter(x=>x!==forte).map(x=>({v:dinT(x), e:tf('din.forte.e', dinT(x), tf('din.n.' + x), dinT(forte))}))),
        pq:{contas:[{tipo:'cadeia', titulo:tf('din.ordem'), itens:DINS.map(dinT), destaque:ops.map(x=>DINS.indexOf(x)), res:tf('din.ordem.res')}], texto:tf('din.forte.pq'),
          ouvir:()=>ops.slice().sort((a, b)=>DINS.indexOf(a)-DINS.indexOf(b)).forEach((x, i)=>tSom(69, i*.7, .6, PICO_DIN[x])), ouvirRot:tf('din.ouvir.ordem'), lab:{din:forte}}}; },
    ()=>{ const g = sorteia(['cresc','decresc']), outro = g==='cresc' ? 'decresc' : 'cresc';
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('din.q.garfo'), pauta:null, html:`<div class="tq-pauta-q">${pautaDinT(g)}</div>`,
        ...opcoesT(tf('din.gn.' + g), [{v:tf('din.gn.' + outro), e:tf('din.garfo.e.' + outro)}, {v:tf('din.gn.acento'), e:tf('din.garfo.e.acento')}, {v:tf('din.rit'), e:tf('din.garfo.e.rit')}]),
        pq:{texto:tf('din.g.' + g), ouvir:()=>tRampa(69, 2.4, g==='cresc' ? .025 : .23, g==='cresc' ? .23 : .025), lab:{gesto:g}}}; },
    ()=>{ const caso = sorteia(['cresc','decresc','igual']), som = ()=>{ if(caso==='igual') tSom(69, 0, 2.4, .12); else tRampa(69, 2.4, caso==='cresc' ? .025 : .23, caso==='cresc' ? .23 : .025); return 2.6; };
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('din.q.ouvir'), som,
        ...opcoesT(tf('din.ov.' + caso), ['cresc','decresc','igual'].filter(x=>x!==caso).map(x=>({v:tf('din.ov.' + x), e:tf('din.ov.e.' + x)}))),
        pq:{texto:tf('din.ov.pq.' + caso), ouvir:som, lab:caso==='igual' ? {din:'mf'} : {gesto:caso}}}; },
    ()=>({tipo:'opcoes', cat:catT('band'), q:tf('din.q.fole'),
      ...opcoesT(tf('din.f.certa'), [{v:tf('din.f.dedo'), e:tf('din.f.e.dedo')}, {v:tf('din.f.dir'), e:tf('din.f.e.dir')}, {v:tf('din.f.mao'), e:tf('din.f.e.mao')}]),
      pq:{texto:tf('din.f.pq'), lab:{gesto:'cresc'}}}),
    ()=>({tipo:'opcoes', cat:catT('pauta'), q:tf('din.q.sfz'),
      ...opcoesT(tf('din.s.certa'), [{v:tf('din.s.suave'), e:tf('din.s.e.suave')}, {v:tf('din.s.rapido'), e:tf('din.s.e.rapido')}, {v:tf('din.s.longo'), e:tf('din.s.e.longo')}]),
      pq:{texto:tf('din.s.pq'), ouvir:()=>[.06, .06, .26, .06].forEach((p, i)=>tSom(69, i*.55, .42, p)), lab:{gesto:'sfz'}}}),
  ],
  pratica:[['ui.p.fole', ()=>go('teclado')], ['ui.p.licao.fole', ()=>{ curLesson = 3; renderLesson(); go('licoes'); }]]});

/* ---------- 7. O ritmo do tango na partitura ---------- */
// os padrões de ritmo.js (PATTERNS: oito colcheias, 1 = fraco, 2 = forte) e como cada um aparece escrito
const PADROES_T = {
  marcato4:[{tipo:'seminima', dur:1, acento:true}, {tipo:'seminima', dur:1}, {tipo:'seminima', dur:1, acento:true}, {tipo:'seminima', dur:1}],
  marcato2:[{tipo:'seminima', dur:1, acento:true}, {tipo:'seminima', dur:1, pausa:true}, {tipo:'seminima', dur:1, acento:true}, {tipo:'seminima', dur:1, pausa:true}],
  sincopa:[{tipo:'seminima', dur:1.5, ponto:true}, {tipo:'colcheia', dur:.5, acento:true}, {tipo:'seminima', dur:1.5, ponto:true}, {tipo:'colcheia', dur:.5, acento:true}],
  tres:[{tipo:'seminima', dur:1.5, ponto:true, acento:true}, {tipo:'seminima', dur:1.5, ponto:true, acento:true}, {tipo:'seminima', dur:1, acento:true}]};
const PAD_NOMES = ['marcato4','marcato2','sincopa','tres'];
const contaColT = ['1','e','2','e','3','e','4','e'];
const barrasPadT = k => PAD_NOMES.includes(k) ? contaColT.map((r, i)=>({v:1, rot:r, cls:PATTERNS[k].hits[i]===2 ? 'forte' : PATTERNS[k].hits[i] ? 'on' : 'vazio'})) : [];
// o acorde de Lá menor na mão esquerda, na direção do fole (acordes.js); sem posição, um botão para cada nota
function acordeEsqT(tec, pc=9, tipo='menor'){
  const v = chordVoicings('left', tec.dir, pc, tipo)[0];
  return v ? v.btns : posicaoT(tec, TRIADES[tipo].map(s=>45 + ((pc - 9 + 12)%12) + s));
}
function tocaPadraoT(k, quando=0, compassos=2, aoBater){
  const col = .3, hits = PATTERNS[k].hits, ms = [45, 48, 52];
  for(let c=0;c<compassos;c++) for(let i=0;i<8;i++) if(hits[i]){ const t = quando + (c*8 + i)*col;
    ms.forEach(m=>tSom(m, t, .2, hits[i]===2 ? .11 : .06, 'left')); if(aoBater) aoBater(c*8 + i, hits[i], t); }
  return quando + compassos*8*col;
}
topicoT({id:'ritmo',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('rit.padrao'), 'pad'), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}${tf('ui.tocar')}</button>`});
    let pad = 'marcato4', bts = [];
    const inst = instrumentoT(S.instEl, {mao:'left', aoTocar:(b, d)=>{ tSom(b[d], 0, .3, .14, 'left'); inst.tec.onda(b.id); }, aoTrocarFole:()=>prepara()});
    function prepara(){ const tec = inst.tec; tec.limpa(); bts = acordeEsqT(tec); bts.forEach(b=>tec.rotulo(b.id, noteName(b[tec.dir]))); tec.forma(bts.map(b=>b.id)); tec.acende(bts.map(b=>b.id), 'leve');
      inst.nota(tf('rit.leg', bts.map(b=>noteName(b[tec.dir])).join(' · '))); }
    function pinta(ativa){
      S.pauta.innerHTML = ritmoT(PADROES_T[pad]);
      const hits = PATTERNS[pad].hits;
      S.lado.innerHTML = `<div class="tq-grade8">${contaColT.map((r, i)=>`<span class="${hits[i]===2 ? 'forte' : hits[i] ? 'fraco' : ''} ${i===ativa ? 'agora' : ''}"><i></i>${r}</span>`).join('')}</div><p class="tq-lado-txt">${tf('rit.d.' + pad)}</p>`;
    }
    function toca(){
      S.rel.limpa(); ac(); prepara(); const tec = inst.tec, figs = S.pauta;
      const fim = tocaPadraoT(pad, 0, 2, (i, forca, t)=>S.rel.depois(t*1000, ()=>{
        pinta(i%8); tec.apaga('ok'); tec.apaga(tec.dir); tec.acende(bts.map(b=>b.id), forca===2 ? 'ok' : tec.dir); bts.forEach(b=>tec.onda(b.id, forca===2 ? T_COR.ok : undefined));
        const fs = figs.querySelectorAll('.fig'), hitsAte = Object.keys(PATTERNS[pad].hits).map(Number).filter(h=>h<=i%8).length - 1;
        fs.forEach((f, j)=>f.classList.toggle('soa', j===hitsAte + (pad==='marcato2' ? hitsAte : 0)));
        S.rel.depois(200, ()=>{ tec.apaga('ok'); tec.apaga(tec.dir); });
      }));
      for(let i=0;i<16;i++) S.rel.depois(i*300, ()=>S.lado.querySelectorAll('.tq-grade8 span').forEach((s, j)=>s.classList.toggle('agora', j===i%8)));
      S.rel.depois(fim*1000 + 100, ()=>pinta(-1));
    }
    S.acoes.querySelector('[data-tocar]').onclick = toca;
    const ch = chipsT(S.q('[data-esc="pad"]'), PAD_NOMES.map(k=>({v:k, rot:tf('rit.n.' + k)})), pad, v=>{ pad = v; pinta(-1); toca(); });
    pinta(-1); prepara();
    return {mostra(cfg){ if(cfg.pad){ pad = cfg.pad; ch.marca(pad); } pinta(-1); toca(); }};
  },
  perguntas:[
    ()=>{ const k = sorteia(PAD_NOMES), som = ()=>tocaPadraoT(k, .1, 2) + .2;
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('rit.q.ouvir'), som,
        ...opcoesT(tf('rit.n.' + k), PAD_NOMES.filter(x=>x!==k).map(x=>({v:tf('rit.n.' + x), e:tf('rit.e.' + x)}))),
        pq:{contas:[{tipo:'barras', titulo:tf('rit.grade'), partes:barrasPadT(k), res:tf('rit.res.' + k)}], texto:tf('rit.d.' + k), ouvir:som, lab:{pad:k}}}; },
    ()=>{ const k = sorteia(PAD_NOMES);
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('rit.q.pauta'), html:`<div class="tq-pauta-q">${ritmoT(PADROES_T[k])}</div>`,
        ...opcoesT(tf('rit.n.' + k), PAD_NOMES.filter(x=>x!==k).map(x=>({v:tf('rit.n.' + x), e:tf('rit.p.' + x)}))),
        pq:{contas:[{tipo:'barras', titulo:tf('rit.grade'), partes:barrasPadT(k), res:tf('rit.res.' + k)}], texto:tf('rit.p.' + k), ouvir:()=>tocaPadraoT(k, .1, 2), lab:{pad:k}}}; },
    ()=>({tipo:'opcoes', cat:catT('pauta'), q:tf('rit.q.332'),
      ...opcoesT(tf('rit.332.certa'), [{v:tf('rit.332.tres'), e:tf('rit.332.e.tres')}, {v:tf('rit.332.oito'), e:tf('rit.332.e.oito')}, {v:tf('rit.332.duas'), e:tf('rit.332.e.duas')}]),
      pq:{contas:[{tipo:'barras', titulo:'3 + 3 + 2', partes:[{v:3, rot:'1½', cls:'forte'}, {v:3, rot:'1½', cls:'forte'}, {v:2, rot:'1', cls:'forte'}], res:tf('rit.332.res')}], texto:tf('rit.332.pq'), ouvir:()=>tocaPadraoT('tres', .1, 2), lab:{pad:'tres'}}}),
    ()=>({tipo:'opcoes', cat:catT('pauta'), q:tf('rit.q.acento'), html:`<div class="tq-fig-q">${miniPautaT(figuraT('seminima', 40, 102, {acento:true}))}</div>`,
      ...opcoesT(tf('rit.a.certa'), [{v:tf('din.gn.cresc'), e:tf('rit.a.e.cresc')}, {v:tf('rit.a.stacc'), e:tf('rit.a.e.stacc')}, {v:tf('rit.a.fermata'), e:tf('rit.a.e.fermata')}]),
      pq:{texto:tf('rit.a.pq'), ouvir:()=>tocaPadraoT('marcato4', .1, 1), lab:{pad:'marcato4'}}}),
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('rit.q.sincopa'),
      ...opcoesT(tf('rit.s.certa'), [{v:tf('rit.s.um'), e:tf('rit.s.e.um')}, {v:tf('rit.s.igual'), e:tf('rit.s.e.igual')}, {v:tf('rit.s.ultimo'), e:tf('rit.s.e.ultimo')}]),
      pq:{contas:[{tipo:'barras', titulo:tf('rit.grade'), partes:barrasPadT('sincopa'), res:tf('rit.res.sincopa')}], texto:tf('rit.s.pq'), ouvir:()=>tocaPadraoT('sincopa', .1, 2), lab:{pad:'sincopa'}}}),
    ()=>({tipo:'opcoes', cat:catT('band'), q:tf('rit.q.mao'),
      ...opcoesT(tf('rit.m.certa'), [{v:tf('rit.m.dir'), e:tf('rit.m.e.dir')}, {v:tf('rit.m.fole'), e:tf('rit.m.e.fole')}, {v:tf('rit.m.duas'), e:tf('rit.m.e.duas')}]),
      pq:{texto:tf('rit.m.pq'), ouvir:()=>tocaPadraoT('marcato4', .1, 2), lab:{pad:'marcato4'}}}),
  ],
  pratica:[['ui.p.ritmo', ()=>go('ritmo')], ['ui.p.licao.ritmos', ()=>{ curLesson = 5; renderLesson(); go('licoes'); }]]});

/* ======== Módulo 2: Escalas e tonalidades ======== */
const nomeTon = ton => nomeG(grafa(ton.m, ton.letra), false);
const nomeTonT = (ton, tipo='maior') => tf('esc.nome.' + tipo, nomeTon(ton));
const ORDEM_SUST = [3,0,4,1,5,2,6], ORDEM_BEMOL = [6,2,5,1,4,0,3];
const listaT = arr => arr.length < 2 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + tf('ui.e') + arr[arr.length-1];
// os acidentes de uma escala, na ordem em que aparecem na armadura (Fá♯ Dó♯… ou Si♭ Mi♭…)
function acidentesT(notas){
  const alt = notas.slice(0, 7).filter(g=>g.acid), ordem = alt.some(g=>g.acid > 0) ? ORDEM_SUST : ORDEM_BEMOL;
  return alt.sort((a, b)=>ordem.indexOf(a.letra) - ordem.indexOf(b.letra)).map(g=>nomeG(g, false));
}
const descAcidT = notas => { const a = acidentesT(notas); return a.length ? listaT(a) : tf('esc.nenhum'); };
const ligPassosT = tipo => ESCALAS_T[tipo].map(passoNome);
const ordGrau = i => tf('ord.grau')[i];

/* ---------- 8. Intervalos (o laboratório da maquete) ---------- */
const BASES_IV = [TON.do4, TON.re4, TON.mi4, TON.fa4, TON.sol4, TON.la4];
const exIvT = (base, iv) => nomeTon(base) + '–' + nomeG(grafar(base, iv), false);
const ivErroT = (base, iv) => tf('iv.e', ivNome(iv), iv.n, semN(iv.s), exIvT(base, iv));
const ivDistT = iv => embaralha(INTERVALOS.filter(v=>v!==iv).sort((a, b)=>Math.abs(a.s-iv.s) - Math.abs(b.s-iv.s)).slice(0, 5)).slice(0, 3);
function contasIvT(base, iv){
  const alvo = grafar(base, iv), letras = Array.from({length:iv.n}, (_, i)=>nomeL(base.letra + i)); letras[iv.n-1] = nomeG(alvo, false); letras[0] = nomeTon(base);
  return [{tipo:'cadeia', titulo:tf('iv.pq.notas'), itens:letras, res:tf('iv.pq.notas.res', iv.n, ivNum(iv.n))},
          {tipo:'pontos', titulo:tf('iv.pq.semis'), n:iv.s, res:tf('iv.pq.semis.res', semN(iv.s), ivTipo(iv))}];
}
const tocaParT = (a, b) => { tSom(a, 0, .6); tSom(b, .65, .6); tSom(a, 1.35, .9, .12); tSom(b, 1.35, .9, .12); return 2.3; };
topicoT({id:'intervalos',
  lab(el){
    el.innerHTML = `<div class="tq-escolhas">${escolhaT(tf('iv.partida'), 'base')}${escolhaT(tf('iv.intervalo'), 'iv')}</div>
      <div class="tq-leitura"><span class="grande"></span><span class="par"></span><span class="tq-conts"><span class="cont letras"><b>1</b> ${tf('iv.notas')}</span><span class="cont semis"><b>0</b> ${tf('iv.semis')}</span></span></div>
      <div class="tq-lab-meio"><div class="tq-pauta-box"></div><div class="tq-lado tq-contagem"><div class="tq-regua"></div><div class="tq-letras"></div><div class="tq-cont-leg"><span>${tf('iv.leg.semis')}</span><span>${tf('iv.leg.notas')}</span></div></div></div>
      <div class="tq-acoes"><button class="btn" type="button" data-tocar>${ICO_PLAY}${tf('iv.ouvir')}</button></div><div class="tq-inst"></div>`;
    const q = s=>el.querySelector(s), rel = relogioT(), S = {pauta:q('.tq-pauta-box'), rel};
    const lab = {base:BASES_IV[0], iv:INTERVALOS[3]};
    const inst = instrumentoT(q('.tq-inst'), {mao:'right', aoTocar:(b, d)=>{
      const s = b[d] - lab.base.m;
      if(s >= 1 && s <= 12){ lab.iv = ivDe(s); chI.marca(lab.iv.k); mostra(true); return; }
      rel.limpa(); tSom(b[d], 0, .5); inst.tec.onda(b.id);
      inst.nota(s===0 ? tf('iv.bt.base', nomeTon(lab.base)) : tf('iv.bt.fora', noteName(b[d]), nomeTon(lab.base) + (Math.floor(lab.base.m/12)-1), noteName(lab.base.m+1), noteName(lab.base.m+12)));
    }, aoTrocarFole:(novo, velho)=>trocaFole(novo, velho)});
    const nomeBase = ()=>nomeG(grafa(lab.base.m, lab.base.letra));
    function letrasAte(k){
      const iv = lab.iv, oit = Math.floor(lab.base.m/12); let c = 1;
      for(let i=1; i<=iv.n-2; i++){ const li = lab.base.letra + i; if((oit + Math.floor(li/7))*12 + T_NAT[li%7] - lab.base.m <= k) c++; }
      return c + (k >= iv.s ? 1 : 0);
    }
    function pares(dir){ const alvo = grafar(lab.base, lab.iv), tec = inst.tec, A = tec.perto(lab.base.m, null, dir), B = tec.perto(alvo.m, A, dir); return {alvo, A, B}; }
    function legenda(){
      const alvo = grafar(lab.base, lab.iv), na = nomeBase(), nb = nomeG(alvo), L = inst.tec.L, igual = m=>L.some(b=>b.open===m && b.close===m), ia = igual(lab.base.m), ib = igual(alvo.m);
      if(ia && ib) return tf('iv.leg.iguais', na, nb);
      if(!ia && !ib) return tf('iv.leg.muda', na, nb);
      return tf('iv.leg.um', ia ? na : nb, ia ? nb : na);
    }
    function regua(alvo, ateS, ateL){
      let h = '';
      for(let k=0;k<=12;k++){ const m = lab.base.m + k, preta = [1,3,6,8,10].includes(pcDe(m)), nome = k===lab.iv.s ? nomeG(alvo, false) : noteName(m).replace(/\d+$/, '');
        h += `<span class="c ${preta ? 'preta' : ''} ${k > 0 && k <= ateS ? 'conta' : ''} ${k===ateS && ateS===lab.iv.s ? 'ponta' : ''}"><i>${nome}</i></span>`; }
      const cel = 100/13;
      q('.tq-regua').innerHTML = h + `<span class="trilho"></span><span class="barra" style="left:${cel/2}%;width:${ateS*cel}%"></span>`;
      q('.tq-letras').innerHTML = Array.from({length:8}, (_, i)=>`<span class="${i < ateL ? 'conta' : ''}">${nomeL(lab.base.letra + i)}</span>`).join('');
    }
    const conta = (l, s)=>{ const nl = q('.cont.letras b'), ns = q('.cont.semis b'); if(+nl.textContent!==l){ nl.textContent = l; pulaNum(nl); } if(+ns.textContent!==s){ ns.textContent = s; pulaNum(ns); } };
    function mostra(som){
      rel.limpa(); const tec = inst.tec, dir = inst.dir, {alvo, A, B} = pares(dir), iv = lab.iv;
      q('.tq-leitura .grande').textContent = ivNome(iv); q('.tq-leitura .par').innerHTML = `<b>${nomeBase()}</b> → <b>${nomeG(alvo)}</b>`;
      inst.nota(legenda());
      const notas = [{d:grafa(lab.base.m, lab.base.letra).d, acid:0, x:150}, {d:alvo.d, acid:alvo.acid, x:250}], Y = d=>120 - (d-30)*6;
      tec.limpa(); if(B) tec.rotulo(B.id, nomeG(alvo));
      if(!som){ S.pauta.innerHTML = pautaT({W:360, notas, chave:{i:0, j:1, rotulo:ivCurto(iv)}}); regua(alvo, iv.s, iv.n); conta(iv.n, iv.s);
        if(A && B){ tec.acende([A.id, B.id], dir); tec.arco(A.id, B.id, 'fixo'); } return; }
      S.pauta.innerHTML = pautaT({W:360, notas:[notas[0]]}); regua(alvo, 0, 1); conta(1, 0);
      tSom(lab.base.m, 0, .55); if(A){ tec.acende([A.id], dir); tec.onda(A.id); }
      const passo = 52, ini = 160;
      for(let k=1; k<=iv.s; k++) rel.depois(ini + k*passo, ()=>{ const l = letrasAte(k); regua(alvo, k, l); conta(l, k); });
      const fim = ini + iv.s*passo + 120;
      rel.depois(fim, ()=>{
        if(A && B) tec.arco(A.id, B.id, 'desenha');
        S.pauta.innerHTML = pautaT({W:360, notas});
        const g2 = S.pauta.querySelector('.nota[data-i="1"]');
        if(g2 && !tRM()) g2.animate([{transform:`translate(${notas[0].x-notas[1].x}px, ${Y(notas[0].d)-Y(notas[1].d)}px)`, opacity:.3}, {transform:'none', opacity:1}], {duration:420, easing:T_EASE});
      });
      rel.depois(fim + 430, ()=>{ tSom(alvo.m, 0, .55); if(B){ tec.acende([B.id], dir); tec.onda(B.id); } S.pauta.querySelectorAll('.nota').forEach((g, i)=>g.classList.toggle('soa', i===1)); });
      rel.depois(fim + 1080, ()=>{
        tSom(lab.base.m, 0, 1, .12); tSom(alvo.m, 0, 1, .12);
        S.pauta.innerHTML = pautaT({W:360, notas:notas.map(n=>({...n, cls:'soa'})), chave:{i:0, j:1, rotulo:ivCurto(iv)}});
        const ch = S.pauta.querySelector('.chave-g'); if(ch && !tRM()) ch.animate([{opacity:0, transform:'translateY(6px)'}, {opacity:1, transform:'none'}], {duration:380, easing:T_EASE});
        if(A) tec.efeito(A.id, 'festa'); if(B) tec.efeito(B.id, 'festa');
      });
      rel.depois(fim + 2200, ()=>S.pauta.querySelectorAll('.nota').forEach(g=>g.classList.remove('soa')));
    }
    function trocaFole(novo, velho){
      rel.limpa(); const v = pares(velho), n = pares(novo), tec = inst.tec;
      tec.apaga(); tec.limparRotulos(); if(n.B) tec.rotulo(n.B.id, nomeG(n.alvo)); if(n.A && n.B) tec.acende([n.A.id, n.B.id], novo);
      if(v.A && v.B && n.A && n.B) tec.moveArcos([[v.A.id, v.B.id]], [[n.A.id, n.B.id]]);
      inst.nota(legenda());
      rel.depois(650, ()=>{ tSom(lab.base.m, 0, .45); if(n.A) tec.onda(n.A.id); });
      rel.depois(1050, ()=>{ tSom(n.alvo.m, 0, .45); if(n.B) tec.onda(n.B.id); });
    }
    const chB = chipsT(q('[data-esc="base"]'), BASES_IV.map((b, i)=>({v:i, rot:nomeG(grafa(b.m, b.letra))})), 0, v=>{ lab.base = BASES_IV[+v]; mostra(true); });
    const chI = chipsT(q('[data-esc="iv"]'), INTERVALOS.map(v=>({v:v.k, rot:ivCurto(v), title:ivNome(v) + ': ' + semN(v.s)})), lab.iv.k, v=>{ lab.iv = INTERVALOS.find(x=>x.k===v); mostra(true); });
    q('[data-tocar]').onclick = ()=>mostra(true);
    mostra(false);
    return {mostra(cfg){
      lab.base = BASES_IV[cfg.base || 0]; lab.iv = INTERVALOS.find(x=>x.k===cfg.iv) || lab.iv; chB.marca(cfg.base || 0); chI.marca(lab.iv.k);
      if(cfg.dirAntes && cfg.dirAntes!==inst.dir) inst.setDir(cfg.dirAntes, false);
      mostra(true);
      if(cfg.dir && cfg.dir!==inst.dir) rel.depois(2500, ()=>inst.setDir(cfg.dir));
    }};
  },
  perguntas:[
    ()=>{ const bi = Math.floor(Math.random()*BASES_IV.length), base = BASES_IV[bi], iv = sorteia(['2m','2M','3m','3M','4J','5J','6M','8J'].map(k=>INTERVALOS.find(v=>v.k===k))), alvo = grafar(base, iv);
      const som = ()=>tocaParT(base.m, alvo.m);
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('iv.q.ouvir'), som, ...opcoesT(ivNome(iv), ivDistT(iv).map(v=>({v:ivNome(v), e:ivErroT(base, v)}))),
        pq:{contas:contasIvT(base, iv), texto:tf('iv.pq.ouviu', nomeG(grafa(base.m, base.letra)) + ' → ' + nomeG(alvo), iv.n, ivNum(iv.n), semN(iv.s), ivTipo(iv)), ouvir:som, ouvirRot:tf('iv.ouvir'), lab:{base:bi, iv:iv.k}}}; },
    ()=>{ const bi = Math.floor(Math.random()*BASES_IV.length), base = BASES_IV[bi], iv = sorteia(['2M','3m','3M','4J','5J','6m','6M'].map(k=>INTERVALOS.find(v=>v.k===k))), alvo = grafar(base, iv);
      const notas = [{d:grafa(base.m, base.letra).d, acid:0, x:150}, {d:alvo.d, acid:alvo.acid, x:230}];
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('iv.q.pauta'), pauta:{W:320, notas}, ...opcoesT(ivNome(iv), ivDistT(iv).map(v=>({v:ivNome(v), e:ivErroT(base, v)}))),
        depois:box=>{ box.querySelector('.tq-pauta-q').innerHTML = pautaT({W:320, notas:notas.map(n=>({...n, cls:'soa'})), chave:{i:0, j:1, rotulo:ivCurto(iv)}}); },
        pq:{contas:contasIvT(base, iv), texto:tf('iv.pq.pauta', iv.n, ivNum(iv.n), semN(iv.s), ivTipo(iv)), ouvir:()=>tocaParT(base.m, alvo.m), ouvirRot:tf('iv.ouvir'), lab:{base:bi, iv:iv.k}}}; },
    ()=>{ const bi = Math.floor(Math.random()*BASES_IV.length), base = BASES_IV[bi], iv = sorteia(['2M','3m','3M','4J','5J','6M','8J'].map(k=>INTERVALOS.find(v=>v.k===k))), alvo = grafar(base, iv), dir = sorteia(['open','close']), nb = nomeG(grafa(base.m, base.letra));
      return {tipo:'tocar', cat:catT('band'), q:tf('iv.q.tocar', ivNome(iv).toLowerCase(), nb, dirT(dir)), mao:'right', dir, resp:nomeG(alvo),
        prepara:tec=>{ const A = tec.perto(base.m); if(A){ tec.rotulo(A.id, nb); tec.acende([A.id], 'leve'); } },
        toque:(b, m)=>{ if(m===alvo.m) return {certa:true}; const s = m - base.m;
          return {certa:false, comentario:s===0 ? tf('iv.t.e.zero', nb) : (s >= 1 && s <= 12) ? tf('iv.t.e', nomeG(grafar(base, ivDe(s))), ivUm(ivDe(s)), nb) : tf('iv.t.e.fora', noteName(m), nb)}; },
        mostra:tec=>{ const A = tec.perto(base.m), B = tec.perto(alvo.m, A); tec.rotulo(B.id, nomeG(alvo)); tec.acende([A.id], dir); tec.acende([B.id], 'ok'); tec.onda(B.id, T_COR.ok); tec.efeito(B.id, 'festa'); tec.arco(A.id, B.id, 'desenha'); },
        pq:{contas:contasIvT(base, iv), texto:tf('iv.t.pq', ordGrau(iv.n-1), nomeTon(base), nomeG(alvo, false), nb, nomeG(alvo), semN(iv.s), dirT(dir)), ouvir:()=>tocaParT(base.m, alvo.m), ouvirRot:tf('iv.ouvir'), lab:{base:bi, iv:iv.k, dirAntes:dir}}}; },
    ()=>{ const iv = sorteia(['2M','3m','3M','4J','5J','6m','7m'].map(k=>INTERVALOS.find(v=>v.k===k))), base = TON.do4, alvo = grafar(base, iv);
      const er = [iv.s-1, iv.s+1, iv.s+2].filter(k=>k > 0).slice(0, 3).map(k=>({v:String(k), e:tf('iv.s.e', semN(k), ivUm(ivDe(k)))}));
      return {tipo:'opcoes', cat:catT('conta'), q:tf('iv.q.semis', ivNome(iv).toLowerCase()), ...opcoesT(String(iv.s), er, {ordena:true}),
        pq:{contas:contasIvT(base, iv), texto:tf('iv.s.pq', nomeTon(base) + ' → ' + nomeG(alvo, false), iv.n, ivNum(iv.n), semN(iv.s), ivTipo(iv)), ouvir:()=>tocaParT(base.m, alvo.m), ouvirRot:tf('iv.ouvir'), lab:{base:0, iv:iv.k}}}; },
    ()=>{ const L = state.layout.right, par = sorteia([[0, '3M'], [1, '4J'], [2, '3m'], [0, '5J']]), base = BASES_IV[par[0]], iv = INTERVALOS.find(v=>v.k===par[1]), alvo = grafar(base, iv);
      const igual = m=>L.some(b=>b.open===m && b.close===m), mesmos = igual(base.m) && igual(alvo.m), iguais = L.filter(b=>b.open===b.close).length, par2 = nomeG(grafa(base.m, base.letra)) + '–' + nomeG(alvo);
      const ops = {outros:tf('iv.f.outros'), mesmos:tf('iv.f.mesmos'), outro:tf('iv.f.outro'), nao:tf('iv.f.nao')}, certa = mesmos ? 'mesmos' : 'outros';
      const com = {outros:tf('iv.f.e.outros'), mesmos:tf('iv.f.e.mesmos', par2), outro:tf('iv.f.e.outro', par2, ivUm(iv)), nao:tf('iv.f.e.nao')};
      return {tipo:'opcoes', cat:catT('band'), q:tf('iv.q.fole', par2), ...opcoesT(ops[certa], Object.keys(ops).filter(k=>k!==certa).map(k=>({v:ops[k], e:com[k]}))),
        pq:{contas:[{tipo:'pontos', titulo:tf('iv.f.pt'), n:iguais, total:L.length, res:tf('iv.f.res', iguais, L.length)}], texto:tf('iv.f.pq'), ouvir:()=>tocaParT(base.m, alvo.m), ouvirRot:tf('iv.ouvir'), lab:{base:par[0], iv:iv.k, dirAntes:'open', dir:'close'}}}; },
  ],
  pratica:[['ui.p.ouvido', ()=>abrirDesafio('ear')], ['ui.p.teclado', ()=>go('teclado')]]});

/* ---------- 9. A escala maior ---------- */
const TONS_MAIOR = {do:TON.do4, sol:TON.sol4, re:TON.re4, la:TON.la3, mi:TON.mi4, fa:TON.fa4, sib:TON.sib3, mib:TON.mib4};
// o laboratório das escalas (maior e menores): a escada de tons e semitons, a pauta e o caminho no teclado
function escadaT(S, notas, tipo, ate, txt){
  const ps = ESCALAS_T[tipo], muda = tipo==='harmonica' ? [5, 6] : tipo==='melodica' ? [4, 5, 6] : [];
  S.lado.innerHTML = `<div class="tq-degraus">${notas.map((g, i)=>`<span class="n ${g.acid ? 'alt' : ''} ${i <= ate ? 'on' : ''}">${nomeG(g, false)}</span>${i < 7 ? `<em class="${ps[i]===1 ? 's' : ps[i]===3 ? 'ts' : ''} ${i < ate ? 'on' : ''} ${muda.includes(i) ? 'muda' : ''}">${passoNome(ps[i])}</em>` : ''}`).join('')}</div><p class="tq-lado-txt">${txt}</p>`;
}
function labEscalaT(el, o){
  const tipos = o.tipos, S = esqueletoT(el, escolhaT(tf('esc.tonica'), 'ton') + (tipos.length > 1 ? escolhaT(tf('men.tipo'), 'tipo') : ''), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}${tf('ui.tocar')}</button>`});
  let k = o.ini, tipo = tipos[0], bts = [];
  const notas = ()=>escalaT(tipo, o.tons[k]), destaque = ns=>ns.map((g, i)=>(tipo!=='maior' && ((tipo==='harmonica' && i===6) || (tipo==='melodica' && (i===5 || i===6)))) || (tipo==='maior' && g.acid) ? i : -1).filter(i=>i >= 0);
  const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{
    S.rel.limpa(); const m = b[d], ns = notas(), g = ns.find(x=>pcDe(x.m)===pcDe(m)); tSom(m, 0, .5); inst.tec.onda(b.id);
    inst.nota(g ? tf('esc.bt.sim', nomeG(g, false), ordGrau(ns.indexOf(g)), o.nome(o.tons[k], tipo)) : tf('esc.bt.nao', noteName(m).replace(/\d+$/, ''), o.nome(o.tons[k], tipo))); },
    aoTrocarFole:()=>{ bts = foleSeqT(inst, notas(), bts); }});
  const legenda = ()=>o.legenda(o.tons[k], tipo, notas());
  function mostra(cfg, som=true){
    if(cfg){ if(cfg.ton){ k = cfg.ton; chT.marca(k); } if(cfg.tipo && chP){ tipo = cfg.tipo; chP.marca(tipo); } if(cfg.dir && cfg.dir!==inst.dir) inst.setDir(cfg.dir, false); }
    const ns = notas(), txt = legenda(); escadaT(S, ns, tipo, som ? 0 : 7, txt);
    bts = seqT(S, inst, ns, {W:380, x0:96, max:36, passo:420, parado:!som, rotulos:ns.map((_, i)=>String(i+1)), destaque:destaque(ns), aoPasso:i=>escadaT(S, ns, tipo, i, txt)});
    inst.nota(txt);
    if(som && tipo==='melodica') S.rel.depois(8*420 + 300, ()=>{ const desce = escalaT('natural', o.tons[k]).reverse(); desce.forEach((g, i)=>S.rel.depois(i*300, ()=>tSom(g.m, 0, .28))); inst.nota(tf('men.mel.desce')); });
  }
  // trocar o tipo de escala menor: as notas que mudam pulam na pauta e as setas escorregam para os botões novos
  function trocaTipo(novo){
    S.rel.limpa(); tipo = novo; const ns = notas(), tec = inst.tec, novos = tec.caminho(ns.map(g=>g.m));
    tec.apaga(); tec.limparRotulos(); novos.forEach((b, i)=>{ if(b) tec.rotulo(b.id, nomeG(ns[i])); }); tec.acende(novos.filter(Boolean).map(b=>b.id), inst.dir);
    tec.moveArcos(paresT(bts), paresT(novos)); bts = novos;
    const xs = xsT(8, 96, 380, 36);
    S.pauta.innerHTML = pautaT({W:380, rotulos:ns.map((_, i)=>String(i+1)), notas:ns.map((g, i)=>({d:g.d, acid:g.acid, x:xs[i], cls:destaque(ns).includes(i) ? 'dest' : ''}))});
    escadaT(S, ns, tipo, 7, legenda()); inst.nota(legenda());
    S.rel.depois(650, ()=>mostra(null, true));
  }
  const chT = chipsT(S.q('[data-esc="ton"]'), Object.keys(o.tons).map(x=>({v:x, rot:nomeTon(o.tons[x])})), k, v=>{ k = v; mostra(); });
  const chP = tipos.length > 1 ? chipsT(S.q('[data-esc="tipo"]'), tipos.map(x=>({v:x, rot:tf('men.n.' + x)})), tipo, v=>trocaTipo(v)) : null;
  S.acoes.querySelector('[data-tocar]').onclick = ()=>mostra();
  mostra(null, false);
  return {mostra:cfg=>mostra(cfg)};
}
const escalaQ = (k, tipo='maior') => escalaT(tipo, (tipo==='maior' ? TONS_MAIOR : TONS_MENOR)[k]);
const tocaEscT = (ns, passo=.3) => { ns.forEach((g, i)=>tSom(g.m, i*passo, passo*.95)); return ns.length*passo + .3; };
topicoT({id:'escalas',
  lab:el=>labEscalaT(el, {tipos:['maior'], tons:TONS_MAIOR, ini:'do', nome:t=>nomeTonT(t), legenda:(t, tp, ns)=>acidentesT(ns).length ? tf('esc.leg', nomeTonT(t), listaT(acidentesT(ns))) : tf('esc.leg.0', nomeTonT(t))}),
  perguntas:[
    ()=>{ const fmt = ps=>ps.map(passoNome).join(' ');
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('esc.q.desenho'),
        ...opcoesT(fmt([2,2,1,2,2,2,1]), [{v:fmt([2,1,2,2,1,2,2]), e:tf('esc.d.e.menor')}, {v:fmt([1,2,2,2,1,2,2]), e:tf('esc.d.e.s')}, {v:fmt([2,2,2,1,2,2,1]), e:tf('esc.d.e.ttt')}]),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TON.do4), itens:escalaQ('do').map(g=>nomeG(g, false)), lig:ligPassosT('maior'), destaque:[2, 3, 6, 7], res:tf('esc.d.res')}], texto:tf('esc.d.pq'), ouvir:()=>tocaEscT(escalaQ('do')), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:'do'}}}; },
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('esc.q.semis'),
      ...opcoesT(tf('esc.s.certa'), [{v:tf('esc.s.menor'), e:tf('esc.s.e.menor')}, {v:tf('esc.s.45'), e:tf('esc.s.e.45')}, {v:tf('esc.s.12'), e:tf('esc.s.e.12')}]),
      pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TON.do4), itens:escalaQ('do').map((g, i)=>(i+1) + '·' + nomeG(g, false)), lig:ligPassosT('maior'), destaque:[2, 3, 6, 7]}], texto:tf('esc.s.pq'), ouvir:()=>tocaEscT(escalaQ('do')), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:'do'}}}),
    ()=>{ const ks = ['sol','re','la','mi','fa','sib','mib'], k = sorteia(ks), ns = escalaQ(k), certa = descAcidT(ns);
      const outros = embaralha(['do', ...ks].filter(x=>x!==k)).slice(0, 3).map(x=>({v:descAcidT(escalaQ(x)), e:tf('esc.a.e', descAcidT(escalaQ(x)), nomeTonT(TONS_MAIOR[x]))}));
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('esc.q.acid', nomeTonT(TONS_MAIOR[k])), ...opcoesT(certa, outros),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TONS_MAIOR[k]), itens:ns.map(g=>nomeG(g, false)), lig:ligPassosT('maior'), destaque:ns.map((g, i)=>g.acid ? i : -1).filter(i=>i >= 0), res:tf('esc.a.res', certa)}],
          texto:tf('esc.a.pq'), ouvir:()=>tocaEscT(ns), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:k}}}; },
    ()=>{ const tipo = sorteia(['maior','natural','harmonica','cromatica']), ns = tipo==='cromatica' ? Array.from({length:13}, (_, i)=>grafaSust(60+i)) : escalaT(tipo, TON.do4);
      const nome = x=>tf('esc.o.' + x), som = ()=>tocaEscT(ns, .28);
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('esc.q.ouvir'), som, ...opcoesT(nome(tipo), ['maior','natural','harmonica','cromatica'].filter(x=>x!==tipo).map(x=>({v:nome(x), e:tf('esc.o.e.' + x)}))),
        pq:{contas:[{tipo:'cadeia', titulo:nome(tipo), itens:ns.map(g=>nomeG(g, false)), lig:tipo==='cromatica' ? null : ligPassosT(tipo)}], texto:tf('esc.o.pq.' + tipo), ouvir:som, ouvirRot:tf('ui.ouvir.escala'), lab:tipo==='maior' ? {ton:'do'} : null}}; },
    ()=>{ const k = sorteia(['do','sol','re','fa','mi']), ns = escalaQ(k), falta = 1 + Math.floor(Math.random()*6), g = ns[falta], dir = sorteia(['open','close']);
      return {tipo:'tocar', cat:catT('band'), q:tf('esc.q.tocar', nomeTonT(TONS_MAIOR[k]), dirT(dir)), mao:'right', dir, resp:nomeG(g),
        prepara:tec=>{ const bs = tec.caminho(ns.map(x=>x.m)); bs.forEach((b, i)=>{ if(b && i!==falta){ tec.rotulo(b.id, nomeG(ns[i])); tec.acende([b.id], 'leve'); } }); },
        toque:(b, m)=>m===g.m ? {certa:true} : {certa:false, comentario:tf('esc.t.e', noteName(m)) + ' ' + (pcDe(m)===pcDe(g.m) ? tf('esc.t.e.oit') : ns.some(x=>x.m===m) ? tf('esc.t.e.ja') : '')},
        mostra:tec=>{ const bs = tec.caminho(ns.map(x=>x.m)); tec.rotulo(bs[falta].id, nomeG(g)); tec.acende([bs[falta].id], 'ok'); tec.onda(bs[falta].id, T_COR.ok);
          tec.arcos([[bs[falta-1].id, bs[falta].id], [bs[falta].id, bs[falta+1].id]], 'desenha', 380); },
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TONS_MAIOR[k]), itens:ns.map(x=>nomeG(x, false)), lig:ligPassosT('maior'), destaque:[falta]}],
          texto:tf('esc.t.pq', ordGrau(falta), nomeTonT(TONS_MAIOR[k]), nomeG(g, false), tf('esc.passo.' + ESCALAS_T.maior[falta-1]), nomeG(ns[falta-1], false)), ouvir:()=>tocaEscT(ns), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:k, dir}}}; },
    ()=>{ const k = sorteia(['sol','re','fa','la','sib','mi']), ns = escalaQ(k), i = sorteia([2, 3, 6].filter(j=>j<7)), g = ns[i], nm = nomeG(g, false);
      const errs = [];
      const mesmaLetra = grafa(g.m + (g.acid ? -g.acid : sorteia([1, -1])), g.letra); errs.push({v:nomeG(mesmaLetra, false), e:tf('esc.g.e.acid', nomeG(mesmaLetra, false))});
      const NAT_ENH = {0:6, 2:3, 3:2, 6:0}, enh = g.acid ? enarmT(g) : (g.letra in NAT_ENH ? grafa(g.m, NAT_ENH[g.letra]) : null); // Dó = Si♯, Mi = Fá♭, Fá = Mi♯, Si = Dó♭
      errs.push(enh ? {v:nomeG(enh, false), e:tf('esc.g.e.enh', nomeG(enh, false), ordGrau(i), nomeL(g.letra))} : {v:nomeG(ns[i+1], false), e:tf('esc.g.e.viz', nomeG(ns[i+1], false), ordGrau(i+1))});
      const viz = ns[i-1]; errs.push({v:nomeG(viz, false), e:tf('esc.g.e.viz', nomeG(viz, false), ordGrau(i-1))});
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('esc.q.grau', nomeTonT(TONS_MAIOR[k]), ordGrau(i)), ...opcoesT(nm, errs),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TONS_MAIOR[k]), itens:ns.map(x=>nomeG(x, false)), lig:ligPassosT('maior'), destaque:[i], res:tf('esc.g.res', ordGrau(i), nm)}], texto:tf('esc.g.pq'), ouvir:()=>tocaEscT(ns.slice(0, i+1)), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:k}}}; },
  ],
  pratica:[['ui.p.escalas', ()=>{ go('melodias'); $('#scaleOpen').click(); }], ['ui.p.mapaesc', ()=>{ location.href = 'escalas/'; }]]});

/* ---------- 10. As três escalas menores ---------- */
const TONS_MENOR = {la:TON.la4, re:TON.re4, mi:TON.mi4, si:TON.si3, sol:TON.sol4, do:TON.do4, fa:TON.fa4};
const RELATIVAS = [['do','la'], ['sol','mi'], ['fa','re'], ['re','si'], ['sib','sol'], ['mib','do']];
topicoT({id:'menores',
  lab:el=>labEscalaT(el, {tipos:['natural','harmonica','melodica'], tons:TONS_MENOR, ini:'la', nome:(t, tp)=>tf('men.nome', nomeTon(t), tf('men.n.' + tp).toLowerCase()),
    legenda:(t, tp, ns)=>tf('men.leg.' + tp, nomeTonT(t, 'menor'), tp==='harmonica' ? nomeG(ns[6], false) : tp==='melodica' ? nomeG(ns[5], false) + tf('ui.e') + nomeG(ns[6], false) : '')}),
  perguntas:[
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('men.q.harm'),
      ...opcoesT(tf('men.h.certa'), [{v:tf('men.h.3'), e:tf('men.h.e.3')}, {v:tf('men.h.67'), e:tf('men.h.e.67')}, {v:tf('men.h.nada'), e:tf('men.h.e.nada')}]),
      pq:{contas:[{tipo:'cadeia', titulo:tf('men.nome', nomeTon(TON.la4), tf('men.n.harmonica').toLowerCase()), itens:escalaQ('la', 'harmonica').map(g=>nomeG(g, false)), lig:ligPassosT('harmonica'), destaque:[6]}],
        texto:tf('men.h.pq'), ouvir:()=>tocaEscT(escalaQ('la', 'harmonica')), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:'la', tipo:'harmonica'}}}),
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('men.q.mel'),
      ...opcoesT(tf('men.m.certa'), [{v:tf('men.m.7'), e:tf('men.m.e.7')}, {v:tf('men.m.36'), e:tf('men.m.e.36')}, {v:tf('men.m.nenhum'), e:tf('men.m.e.nenhum')}]),
      pq:{contas:[{tipo:'cadeia', titulo:tf('men.nome', nomeTon(TON.la4), tf('men.n.melodica').toLowerCase()), itens:escalaQ('la', 'melodica').map(g=>nomeG(g, false)), lig:ligPassosT('melodica'), destaque:[5, 6]}],
        texto:tf('men.m.pq'), ouvir:()=>tocaEscT(escalaQ('la', 'melodica')), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:'la', tipo:'melodica'}}}),
    ()=>{ const k = sorteia(['la','re','mi']), tipo = sorteia(['natural','harmonica','melodica']), ns = escalaQ(k, tipo), som = ()=>tocaEscT(ns), nome = x=>tf('men.n.' + x);
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('men.q.ouvir'), som, ...opcoesT(nome(tipo), ['natural','harmonica','melodica','maior'].filter(x=>x!==tipo).map(x=>({v:x==='maior' ? tf('esc.o.maior') : nome(x), e:tf('men.o.e.' + x)}))),
        pq:{contas:[{tipo:'cadeia', titulo:tf('men.nome', nomeTon(TONS_MENOR[k]), nome(tipo).toLowerCase()), itens:ns.map(g=>nomeG(g, false)), lig:ligPassosT(tipo), destaque:tipo==='harmonica' ? [6] : tipo==='melodica' ? [5, 6] : []}],
          texto:tf('men.o.pq.' + tipo), ouvir:som, ouvirRot:tf('ui.ouvir.escala'), lab:{ton:k, tipo}}}; },
    ()=>{ const [M, m] = sorteia(RELATIVAS), maior = TONS_MAIOR[M], menor = TONS_MENOR[m], rel = tf('esc.nome.menor', nomeTon(menor));
      const par = tf('esc.nome.menor', nomeTon(maior)), terca = tf('esc.nome.menor', nomeG(grafar(maior, INTERVALOS[3]), false)), quinta = tf('esc.nome.menor', nomeG(grafar(maior, INTERVALOS[6]), false));
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('men.q.rel', nomeTonT(maior)),
        ...opcoesT(rel, [{v:par, e:tf('men.r.e.par', par)}, {v:terca, e:tf('men.r.e.outra', terca, nomeTonT(maior))}, {v:quinta, e:tf('men.r.e.outra', quinta, nomeTonT(maior))}]),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(maior), itens:escalaT('maior', maior).map(g=>nomeG(g, false)), destaque:[5], res:tf('men.r.res', ordGrau(5), nomeTon(menor))}],
          texto:tf('men.r.pq', nomeTonT(maior), rel), ouvir:()=>{ tocaEscT(escalaT('maior', maior)); }, ouvirRot:tf('ui.ouvir.escala'), lab:{ton:m, tipo:'natural'}}}; },
    ()=>{ const k = sorteia(['la','re','mi','sol']), ns = escalaQ(k, 'harmonica'), nat = escalaQ(k, 'natural'), s = ns[6];
      const errs = [{v:nomeG(nat[6], false), e:tf('men.s.e.nat', nomeG(nat[6], false))}, {v:nomeG(enarmT(s), false), e:tf('men.s.e.enh', nomeG(enarmT(s), false), nomeL(s.letra))}, {v:nomeG(escalaQ(k, 'melodica')[5], false), e:tf('men.s.e.mel', nomeG(escalaQ(k, 'melodica')[5], false))}];
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('men.q.sens', nomeTon(TONS_MENOR[k])), ...opcoesT(nomeG(s, false), errs),
        pq:{contas:[{tipo:'cadeia', titulo:tf('men.nome', nomeTon(TONS_MENOR[k]), tf('men.n.harmonica').toLowerCase()), itens:ns.map(g=>nomeG(g, false)), lig:ligPassosT('harmonica'), destaque:[6, 7]}],
          texto:tf('men.s.pq', nomeG(s, false), nomeTon(TONS_MENOR[k])), ouvir:()=>{ tSom(s.m, 0, .6); tSom(ns[7].m, .6, .9); }, ouvirRot:tf('ui.ouvir.duas'), lab:{ton:k, tipo:'harmonica'}}}; },
    ()=>{ const k = sorteia(['la','re','mi']), ns = escalaQ(k, 'harmonica'), s = ns[6], nat7 = escalaQ(k, 'natural')[6].m, dir = sorteia(['open','close']);
      return {tipo:'tocar', cat:catT('band'), q:tf('men.q.tocar', nomeTon(TONS_MENOR[k]), dirT(dir)), mao:'right', dir, resp:nomeG(s),
        prepara:tec=>{ const bs = tec.caminho(ns.map(x=>x.m)); bs.forEach((b, i)=>{ if(b && i!==6){ tec.rotulo(b.id, nomeG(ns[i])); tec.acende([b.id], 'leve'); } }); },
        toque:(b, m)=>m===s.m ? {certa:true} : {certa:false, comentario:tf('men.t.e', noteName(m)) + (m===nat7 ? ' ' + tf('men.t.e.nat') : '')},
        mostra:tec=>{ const bs = tec.caminho(ns.map(x=>x.m)); tec.rotulo(bs[6].id, nomeG(s)); tec.acende([bs[6].id], 'ok'); tec.onda(bs[6].id, T_COR.ok); tec.arco(bs[6].id, bs[7].id, 'desenha'); },
        pq:{contas:[{tipo:'cadeia', titulo:tf('men.nome', nomeTon(TONS_MENOR[k]), tf('men.n.harmonica').toLowerCase()), itens:ns.map(g=>nomeG(g, false)), lig:ligPassosT('harmonica'), destaque:[6]}],
          texto:tf('men.s.pq', nomeG(s, false), nomeTon(TONS_MENOR[k])), ouvir:()=>tocaEscT(ns), ouvirRot:tf('ui.ouvir.escala'), lab:{ton:k, tipo:'harmonica', dir}}}; },
    ()=>({tipo:'opcoes', cat:catT('band'), q:tf('men.q.salto'),
      ...opcoesT(tf('men.sa.certa'), [{v:tf('men.sa.s'), e:tf('men.sa.e.s')}, {v:tf('men.sa.t'), e:tf('men.sa.e.t')}, {v:tf('men.sa.2t'), e:tf('men.sa.e.2t')}]),
      pq:{contas:[{tipo:'pontos', titulo:nomeG(escalaQ('la', 'harmonica')[5], false) + ' → ' + nomeG(escalaQ('la', 'harmonica')[6], false), n:3, res:semN(3)}], texto:tf('men.sa.pq'),
        ouvir:()=>{ const ns = escalaQ('la', 'harmonica'); tSom(ns[5].m, 0, .6); tSom(ns[6].m, .6, .6); tSom(ns[7].m, 1.2, .9); }, ouvirRot:tf('ui.ouvir.trecho'), lab:{ton:'la', tipo:'harmonica'}}}),
  ],
  pratica:[['ui.p.escalas', ()=>{ go('melodias'); $('#scaleOpen').click(); }], ['ui.p.mapaesc', ()=>{ location.href = 'escalas/'; }]]});

/* ---------- 11. Armadura e ciclo das quintas ---------- */
// as 12 casas do ciclo (sentido horário = uma quinta acima); n > 0 sustenidos, n < 0 bemóis
const CICLO = [{pc:0,l:0,n:0},{pc:7,l:4,n:1},{pc:2,l:1,n:2},{pc:9,l:5,n:3},{pc:4,l:2,n:4},{pc:11,l:6,n:5},{pc:6,l:3,n:6},{pc:1,l:1,n:-5},{pc:8,l:5,n:-4},{pc:3,l:2,n:-3},{pc:10,l:6,n:-2},{pc:5,l:3,n:-1}];
const tonCiclo = c => ({m:60 + c.pc, letra:c.l});
const menorCiclo = c => grafa(60 + c.pc + 9, (c.l + 5)%7);
const nomeCasaT = c => nomeG(grafa(60 + c.pc, c.l), false) + (c.n===6 ? '/' + nomeG(grafa(66, 4), false) : '');
const descArmT = n => n===0 ? tf('arm.zero') : tf(Math.abs(n)===1 ? (n > 0 ? 'arm.s1' : 'arm.b1') : (n > 0 ? 'arm.sn' : 'arm.bn'), Math.abs(n));
const armLista = n => (n > 0 ? ORDEM_SUST : ORDEM_BEMOL).slice(0, Math.abs(n)).map(l=>nomeL(l) + (n > 0 ? '♯' : '♭'));
function regraArmT(c){
  const n = c.n, lista = armLista(n), ton = nomeTonT(tonCiclo(c));
  if(n===0) return tf('arm.reg.zero');
  if(n > 0) return tf('arm.reg.s', lista[lista.length-1], ton);
  if(n===-1) return tf('arm.reg.b1', ton);
  return tf('arm.reg.b', lista[lista.length-2], ton);
}
topicoT({id:'armadura',
  lab(el){
    const S = esqueletoT(el, '', {acoes:`<button class="btn sec" type="button" data-q="-1">← ${tf('arm.quinta.baixo')}</button><button class="btn sec" type="button" data-q="1">${tf('arm.quinta.cima')} →</button>`});
    let sel = 0, angulo = 0;
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ tSom(b[d], 0, .5); inst.tec.onda(b.id); }, aoTrocarFole:()=>teclas(false)});
    S.lado.innerHTML = `<svg class="tq-ciclo" viewBox="0 0 240 240" role="group" aria-label="${tf('arm.ciclo')}"><g class="roda">
      <circle class="aro" cx="120" cy="120" r="112"/><circle class="aro2" cx="120" cy="120" r="80"/><circle class="miolo" cx="120" cy="120" r="50"/>
      ${CICLO.map((c, i)=>{ const a = (i*30 - 90)*Math.PI/180, x1 = 120 + 96*Math.cos(a), y1 = 120 + 96*Math.sin(a), x2 = 120 + 65*Math.cos(a), y2 = 120 + 65*Math.sin(a);
        return `<g class="casa" data-pos="${i}" tabindex="0" role="button" aria-label="${nomeTonT(tonCiclo(c))}"><circle class="bola" cx="${x1}" cy="${y1}" r="15"/><text class="maior" x="${x1}" y="${y1}">${nomeCasaT(c)}</text><text class="menor" x="${x2}" y="${y2}">${nomeG(menorCiclo(c), false)}m</text></g>`; }).join('')}
      </g><text class="centro n" x="120" y="114"></text><text class="centro t" x="120" y="134"></text></svg>`;
    const roda = S.lado.querySelector('.roda');
    function teclas(som){
      const c = CICLO[sel], prox = CICLO[(sel+1)%12], tec = inst.tec, t = 60 + c.pc, A = tec.perto(t), B = tec.perto(t + 7, A);
      tec.limpa(); if(A){ tec.rotulo(A.id, nomeTon(tonCiclo(c))); tec.acende([A.id], 'ok'); if(som) tec.onda(A.id, T_COR.ok); }
      if(B){ tec.rotulo(B.id, nomeTon(tonCiclo(prox))); tec.acende([B.id], inst.dir); }
      if(A && B) tec.arco(A.id, B.id, som ? 'desenha' : 'fixo');
    }
    function mostra(i, som=true){
      const delta = ((i - sel)%12 + 18)%12 - 6; angulo -= delta*30; sel = i;
      roda.style.transform = `rotate(${angulo}deg)`;
      S.lado.querySelectorAll('.casa').forEach((g, j)=>{ g.classList.toggle('on', j===sel); g.querySelectorAll('text').forEach(tx=>{ tx.style.transform = `rotate(${-angulo}deg)`; }); });
      const c = CICLO[sel], ton = tonCiclo(c);
      S.lado.querySelector('.centro.n').textContent = c.n===0 ? '0' : Math.abs(c.n) + (c.n > 0 ? '♯' : '♭');
      S.lado.querySelector('.centro.t').textContent = nomeTon(ton) + ' · ' + nomeG(menorCiclo(c), false) + 'm';
      S.pauta.innerHTML = pautaT({W:360, armadura:{acid:c.n >= 0 ? 1 : -1, n:Math.abs(c.n)}, notas:[{d:grafa(ton.m, ton.letra).d, acid:0, x:290, vazia:true}]});
      inst.nota(tf('arm.leg', nomeTonT(ton), tf('esc.nome.menor', nomeG(menorCiclo(c), false)), descArmT(c.n) + (c.n ? ' (' + listaT(armLista(c.n)) + ')' : '')));
      teclas(som);
      if(som){ ac(); escalaT('maior', ton).forEach((g, k)=>tSom(g.m, k*.16, .16)); tAcorde([ton.m, ton.m + 4, ton.m + 7], 8*.16 + .1, 1); }
    }
    S.lado.addEventListener('click', e=>{ const g = e.target.closest('[data-pos]'); if(g) mostra(+g.dataset.pos); });
    S.lado.addEventListener('keydown', e=>{ const g = e.target.closest('[data-pos]'); if(g && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); mostra(+g.dataset.pos); } });
    S.acoes.addEventListener('click', e=>{ const b = e.target.closest('[data-q]'); if(b) mostra((sel + +b.dataset.q + 12)%12); });
    mostra(0, false);
    return {mostra:cfg=>mostra(cfg.pos || 0)};
  },
  perguntas:[
    ()=>{ const pos = sorteia([1,2,3,4,5,7,8,9,10,11]), c = CICLO[pos], certa = nomeTonT(tonCiclo(c));
      const viz = [pos-1, pos+1, pos+2].map(i=>CICLO[(i+12)%12]).filter(x=>x.n!==0 && x!==c);
      const er = viz.slice(0, 3).map(x=>({v:nomeTonT(tonCiclo(x)), e:tf('arm.e', nomeTonT(tonCiclo(x)), descArmT(x.n))}));
      while(er.length < 3){ const x = CICLO[(pos+6)%12]; er.push({v:nomeTonT(tonCiclo(x)), e:tf('arm.e', nomeTonT(tonCiclo(x)), descArmT(x.n))}); }
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('arm.q.qual'), pauta:{W:260, armadura:{acid:c.n > 0 ? 1 : -1, n:Math.abs(c.n)}}, ...opcoesT(certa, er),
        pq:{contas:[{tipo:'cadeia', titulo:tf(c.n > 0 ? 'arm.ordem.s' : 'arm.ordem.b'), itens:armLista(c.n), destaque:[Math.abs(c.n) - (c.n < -1 ? 2 : 1)]}], texto:regraArmT(c), ouvir:()=>tocaEscT(escalaT('maior', tonCiclo(c))), ouvirRot:tf('ui.ouvir.escala'), lab:{pos}}}; },
    ()=>{ const pos = sorteia([1,2,3,4,5,8,9,10,11]), c = CICLO[pos], n = Math.abs(c.n), sust = c.n > 0;
      const er = [1,2,3,4,5,6].filter(k=>k!==n && CICLO.some(y=>y.n===(sust ? k : -k))).sort((a, b)=>Math.abs(a-n) - Math.abs(b-n)).slice(0, 3).map(k=>{ const x = CICLO.find(y=>y.n===(sust ? k : -k)); return {v:String(k), e:tf('arm.q.e', descArmT(sust ? k : -k), nomeTonT(tonCiclo(x)))}; });
      const passos = sust ? CICLO.slice(0, pos+1) : [CICLO[0], ...CICLO.slice(pos).reverse()];
      return {tipo:'opcoes', cat:catT('conta'), q:tf(sust ? 'arm.q.quantos.s' : 'arm.q.quantos.b', nomeTonT(tonCiclo(c))), ...opcoesT(String(n), er, {ordena:true}),
        pq:{contas:[{tipo:'cadeia', titulo:tf(sust ? 'arm.passos.s' : 'arm.passos.b'), itens:passos.map(x=>nomeTon(tonCiclo(x))), lig:passos.slice(1).map(()=>sust ? '+♯' : '+♭'), destaque:[passos.length-1], res:descArmT(c.n)}],
          texto:tf(sust ? 'arm.q.pq.s' : 'arm.q.pq.b'), lab:{pos}}}; },
    ()=>{ const L = (ls, s)=>ls.map(l=>nomeL(l) + s).join(' ');
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('arm.q.ordem'),
        ...opcoesT(L(ORDEM_SUST, '♯'), [{v:L(ORDEM_BEMOL, '♯'), e:tf('arm.o.e.inv')}, {v:L([0,4,1,5,2,6,3], '♯'), e:tf('arm.o.e.ciclo')}, {v:L([3,4,5,6,0,1,2], '♯'), e:tf('arm.o.e.escala')}]),
        pq:{contas:[{tipo:'cadeia', titulo:tf('arm.ordem.s'), itens:armLista(7), lig:Array(6).fill('+5ª')}, {tipo:'cadeia', titulo:tf('arm.ordem.b'), itens:armLista(-7), lig:Array(6).fill('−5ª')}], texto:tf('arm.o.pq'), lab:{pos:2}}}; },
    ()=>{ const pos = sorteia([0,1,2,3,10,11,9]), c = CICLO[pos], rel = tf('esc.nome.menor', nomeG(menorCiclo(c), false)), par = tf('esc.nome.menor', nomeTon(tonCiclo(c)));
      const outro = CICLO[(pos+11)%12], outroRel = tf('esc.nome.menor', nomeG(menorCiclo(outro), false)), dom = tf('esc.nome.menor', nomeG(grafa(60 + c.pc + 4, (c.l+2)%7), false));
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('men.q.rel', nomeTonT(tonCiclo(c))),
        ...opcoesT(rel, [{v:par, e:tf('men.r.e.par', par)}, {v:outroRel, e:tf('arm.r.e.viz', outroRel, nomeTonT(tonCiclo(outro)))}, {v:dom, e:tf('men.r.e.outra', dom, nomeTonT(tonCiclo(c)))}]),
        pq:{texto:tf('arm.r.pq', nomeTonT(tonCiclo(c)), rel, descArmT(c.n)), contas:[{tipo:'cadeia', titulo:nomeTonT(tonCiclo(c)), itens:escalaT('maior', tonCiclo(c)).map(g=>nomeG(g, false)), destaque:[5]}], lab:{pos}}}; },
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('arm.q.horario'),
      ...opcoesT(tf('arm.h.certa'), [{v:tf('arm.h.bemol'), e:tf('arm.h.e.bemol')}, {v:tf('arm.h.menor'), e:tf('arm.h.e.menor')}, {v:tf('arm.h.nada'), e:tf('arm.h.e.nada')}]),
      pq:{contas:[{tipo:'cadeia', titulo:tf('arm.passos.s'), itens:CICLO.slice(0, 4).map(x=>nomeTon(tonCiclo(x))), lig:['+♯','+♯','+♯'], res:tf('arm.h.res')}], texto:tf('arm.h.pq'), lab:{pos:1}}}),
    ()=>{ const pos = sorteia([1,2,3,10,11,9]), c = CICLO[pos], dir = sorteia(['open','close']), pc = c.pc, L = state.layout.right;
      return {tipo:'tocar', cat:catT('band'), q:tf('arm.q.tocar', descArmT(c.n), dirT(dir)), pauta:{W:240, armadura:{acid:c.n > 0 ? 1 : -1, n:Math.abs(c.n)}}, mao:'right', dir, resp:nomeTon(tonCiclo(c)),
        toque:(b, m)=>pcDe(m)===pc ? {certa:true} : {certa:false, comentario:tf('arm.t.e', noteName(m).replace(/\d+$/, ''))},
        mostra:tec=>{ const bs = L.filter(b=>pcDe(b[dir])===pc); bs.forEach(b=>tec.rotulo(b.id, nomeTon(tonCiclo(c)) + (Math.floor(b[dir]/12) - 1))); tec.acende(bs.map(b=>b.id), 'ok'); bs.forEach(b=>tec.onda(b.id, T_COR.ok)); },
        pq:{texto:regraArmT(c) + ' ' + tf('arm.t.pq'), contas:[{tipo:'cadeia', titulo:tf(c.n > 0 ? 'arm.ordem.s' : 'arm.ordem.b'), itens:armLista(c.n), destaque:[Math.abs(c.n) - (c.n < -1 ? 2 : 1)]}], ouvir:()=>tocaEscT(escalaT('maior', tonCiclo(c))), ouvirRot:tf('ui.ouvir.escala'), lab:{pos}}}; },
  ],
  pratica:[['ui.p.mapaesc', ()=>{ location.href = 'escalas/'; }], ['ui.p.escalas', ()=>{ go('melodias'); $('#scaleOpen').click(); }]]});

/* ---------- 12. Os graus da escala ---------- */
const TONS_GRAU = {do:TON.do4, sol:TON.sol4, fa:TON.fa4, re:TON.re4};
const ROMANOS = ['I','II','III','IV','V','VI','VII'];
const nomeGrauT = i => tf('gr.nome')[i];
topicoT({id:'graus',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('esc.tonica'), 'ton'), {acoes:`<button class="btn sec" type="button" data-mov="sens">${tf('gr.mov.sens')}</button><button class="btn sec" type="button" data-mov="dom">${tf('gr.mov.dom')}</button>`});
    let k = 'do', grau = 4;
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ tSom(b[d], 0, .5); inst.tec.onda(b.id); }, aoTrocarFole:()=>mostra(null, false)});
    const ns = ()=>escalaT('maior', TONS_GRAU[k]);
    function cartas(){ const n = ns();
      S.lado.innerHTML = `<div class="tq-graus">${ROMANOS.map((r, i)=>`<button type="button" class="tq-grau ${i===grau ? 'on' : ''}" data-g="${i}" style="--i:${i}"><b>${r}</b><span>${nomeGrauT(i)}</span><small>${nomeG(n[i], false)}</small></button>`).join('')}</div>`; }
    function pauta(destaque){ const n = ns(), xs = xsT(8, 96, 380, 36);
      S.pauta.innerHTML = pautaT({W:380, rotulos:[...ROMANOS, 'I'], notas:n.map((g, i)=>({d:g.d, acid:g.acid, x:xs[i], cls:destaque.includes(i) ? 'dest' : ''}))}); }
    function mostra(cfg, som=true){
      if(cfg){ if(cfg.ton){ k = cfg.ton; ch.marca(k); } if(cfg.grau!=null) grau = cfg.grau; }
      S.rel.limpa(); const n = ns(), tec = inst.tec, A = tec.perto(n[0].m), B = tec.perto(n[grau].m, A);
      cartas(); pauta([0, grau]); tec.limpa();
      if(A){ tec.rotulo(A.id, nomeG(n[0])); tec.acende([A.id], 'leve'); }
      if(B && grau){ tec.rotulo(B.id, nomeG(n[grau])); tec.acende([B.id], 'ok'); tec.arco(A.id, B.id, som ? 'desenha' : 'fixo'); }
      inst.nota(tf('gr.leg', ROMANOS[grau], nomeGrauT(grau), nomeG(n[grau], false), nomeTonT(TONS_GRAU[k]), tf('gr.d.' + grau)));
      if(som){ tSom(n[0].m, 0, .5); if(B && grau){ tSom(n[grau].m, .55, .8); S.rel.depois(550, ()=>tec.onda(B.id, T_COR.ok)); } }
      if(cfg && cfg.mov) S.rel.depois(1500, ()=>movimento(cfg.mov));
    }
    function movimento(qual){
      S.rel.limpa(); const n = ns(), tec = inst.tec, [de, para] = qual==='sens' ? [6, 7] : [4, 7], A = tec.perto(n[de].m), B = tec.perto(n[para].m, A);
      grau = de; cartas(); pauta([de, para]); tec.limpa();
      tec.rotulo(A.id, nomeG(n[de])); tec.rotulo(B.id, nomeG(n[para])); tec.acende([A.id], inst.dir); tSom(n[de].m, 0, .9); tec.onda(A.id);
      if(qual==='dom') tAcorde([n[4].m - 12, n[6].m - 12, n[1].m], 0, .9);
      S.rel.depois(950, ()=>{ tec.acende([B.id], 'ok'); tec.onda(B.id, T_COR.ok); tec.arco(A.id, B.id, 'desenha'); tSom(n[para].m, 0, 1.2); if(qual==='dom') tAcorde([n[0].m - 12, n[2].m - 12, n[4].m - 12], 0, 1.2); });
      inst.nota(tf('gr.mov.leg.' + qual, nomeG(n[de], false), nomeG(n[para], false)));
    }
    S.lado.addEventListener('click', e=>{ const b = e.target.closest('[data-g]'); if(b){ grau = +b.dataset.g; mostra(); } });
    S.acoes.addEventListener('click', e=>{ const b = e.target.closest('[data-mov]'); if(b) movimento(b.dataset.mov); });
    const ch = chipsT(S.q('[data-esc="ton"]'), Object.keys(TONS_GRAU).map(x=>({v:x, rot:nomeTon(TONS_GRAU[x])})), k, v=>{ k = v; mostra(); });
    mostra(null, false);
    return {mostra:cfg=>mostra(cfg)};
  },
  perguntas:[
    ()=>{ const i = sorteia([0, 3, 4, 6, 1, 5]), er = embaralha([0,1,2,3,4,5,6].filter(x=>x!==i)).slice(0, 3).map(x=>({v:nomeGrauT(x), e:tf('gr.n.e', nomeGrauT(x), ordGrau(x))}));
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('gr.q.nome', ordGrau(i)), ...opcoesT(nomeGrauT(i), er),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TON.do4), itens:ROMANOS.map((r, j)=>r + ' ' + nomeL(j)), destaque:[i], res:tf('gr.n.res', ROMANOS[i], nomeGrauT(i))}], texto:tf('gr.d.' + i), lab:{ton:'do', grau:i}}}; },
    ()=>{ const k = sorteia(['do','sol','fa','re']), i = sorteia([3, 4, 6]), n = escalaT('maior', TONS_GRAU[k]), certa = nomeG(n[i], false);
      const er = [0, 3, 4, 6, 1].filter(x=>x!==i).slice(0, 3).map(x=>({v:nomeG(n[x], false), e:tf('gr.nt.e', nomeG(n[x], false), nomeGrauT(x).toLowerCase(), nomeTonT(TONS_GRAU[k]))}));
      return {tipo:'opcoes', cat:catT('conta'), q:tf('gr.q.nota', nomeTonT(TONS_GRAU[k]), nomeGrauT(i).toLowerCase()), ...opcoesT(certa, er),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TONS_GRAU[k]), itens:n.slice(0, i+1).map((g, j)=>ROMANOS[j] + ' ' + nomeG(g, false)), destaque:[i], res:tf('gr.nt.res', ROMANOS[i], certa)}],
          texto:tf('gr.d.' + i), ouvir:()=>{ tSom(n[0].m, 0, .5); tSom(n[i].m, .55, .8); }, ouvirRot:tf('ui.ouvir.duas'), lab:{ton:k, grau:i}}}; },
    ()=>{ const k = sorteia(['do','sol','fa','re']), n = escalaT('maior', TONS_GRAU[k]), nm = i=>nomeG(n[i], false);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('gr.q.sens', nomeTonT(TONS_GRAU[k])),
        ...opcoesT(tf('gr.s.op', nm(6), nm(0)), [{v:tf('gr.s.op', nm(4), nm(0)), e:tf('gr.s.e.dom', nm(4))}, {v:tf('gr.s.op', nm(3), nm(2)), e:tf('gr.s.e.sub', nm(3), nm(2))}, {v:tf('gr.s.op', nm(1), nm(0)), e:tf('gr.s.e.sup', nm(1))}]),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TONS_GRAU[k]), itens:[nm(6), nm(0)], lig:[passoNome(1)], destaque:[0, 1]}], texto:tf('gr.s.pq', nm(6), nm(0)), ouvir:()=>{ tSom(n[6].m, 0, .7); tSom(n[7].m, .7, 1); }, ouvirRot:tf('ui.ouvir.duas'), lab:{ton:k, grau:6, mov:'sens'}}}; },
    ()=>{ const i = sorteia([3, 4, 5, 6]), n = escalaT('maior', TON.do4), som = ()=>{ n.slice(0, i+1).forEach((g, j)=>tSom(g.m, j*.38, j===i ? 1 : .34)); return (i+1)*.38 + .8; };
      const op = j=>ROMANOS[j] + ' · ' + nomeGrauT(j);
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('gr.q.ouvir', nomeTonT(TON.do4)), som, ...opcoesT(op(i), [3, 4, 5, 6].filter(j=>j!==i).map(j=>({v:op(j), e:tf('gr.o.e', ordGrau(j), j+1)}))),
        pq:{contas:[{tipo:'cadeia', titulo:tf('gr.o.t'), itens:n.slice(0, i+1).map((g, j)=>ROMANOS[j] + ' ' + nomeG(g, false)), destaque:[i], res:tf('gr.o.res', i+1, ROMANOS[i])}], texto:tf('gr.o.pq') + (i===6 ? ' ' + tf('gr.o.pq.sens') : ''), ouvir:som, lab:{ton:'do', grau:i}}}; },
    ()=>{ const k = sorteia(['sol','fa','re','do']), i = sorteia([3, 4, 6]), n = escalaT('maior', TONS_GRAU[k]), pc = pcDe(n[i].m), dir = sorteia(['open','close']), L = state.layout.right;
      return {tipo:'tocar', cat:catT('band'), q:tf('gr.q.tocar', nomeTonT(TONS_GRAU[k]), nomeGrauT(i).toLowerCase(), dirT(dir)), mao:'right', dir, resp:nomeG(n[i], false),
        prepara:tec=>{ const A = tec.perto(n[0].m); if(A){ tec.rotulo(A.id, nomeG(n[0])); tec.acende([A.id], 'leve'); } },
        toque:(b, m)=>pcDe(m)===pc ? {certa:true} : {certa:false, comentario:(()=>{ const j = n.slice(0, 7).findIndex(g=>pcDe(g.m)===pcDe(m)); return j >= 0 ? tf('gr.t.e.grau', nomeG(n[j], false), ROMANOS[j], nomeGrauT(j).toLowerCase()) : tf('gr.t.e.fora', noteName(m).replace(/\d+$/, ''), nomeTonT(TONS_GRAU[k])); })()},
        mostra:tec=>{ const A = tec.perto(n[0].m), bs = L.filter(b=>pcDe(b[dir])===pc); bs.forEach(b=>tec.rotulo(b.id, nomeG(grafa(b[dir], n[i].letra)))); tec.acende(bs.map(b=>b.id), 'ok'); const B = tec.perto(n[i].m, A); if(A && B) tec.arco(A.id, B.id, 'desenha'); },
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(TONS_GRAU[k]), itens:n.slice(0, i+1).map((g, j)=>ROMANOS[j] + ' ' + nomeG(g, false)), destaque:[i]}], texto:tf('gr.d.' + i), ouvir:()=>{ tSom(n[0].m, 0, .5); tSom(n[i].m, .55, .8); }, ouvirRot:tf('ui.ouvir.duas'), lab:{ton:k, grau:i, dir}}}; },
  ],
  pratica:[['ui.p.escalas', ()=>{ go('melodias'); $('#scaleOpen').click(); }]]});

/* ======== Módulo 3: Harmonia ======== */
const RAIZES = [TON.do4, TON.re4, TON.mi4, TON.fa4, TON.sol4, TON.la4, TON.si4];
const SUF_AC = {maior:'', menor:'m', dim:'°', aum:'+', dom7:'7', maj7:'7M', m7:'m7', sexta:'6'};
const IVS_AC = {...TRIADES, sexta:[0,4,7,9]};
const nomeAc = (raiz, tipo) => nomeTon(raiz) + SUF_AC[tipo];
const notasAcT = (raiz, tipo) => tipo==='sexta' ? [...acordeT(raiz, [0,4,7]), grafa(raiz.m + 9, (raiz.letra + 5)%7)] : acordeT(raiz, IVS_AC[tipo]);
const listaAc = ns => ns.map(g=>nomeG(g, false)).join(' · ');
const nomeTipoAc = (raiz, tipo) => tf('ac.t.' + tipo, nomeTon(raiz));
// a pilha de terças do "Por quê": as notas com os semitons entre elas
const pilhaT = (ns, titulo, res) => ({tipo:'cadeia', titulo, itens:ns.map(g=>nomeG(g, false)), lig:ns.slice(1).map((g, i)=>'+' + (g.m - ns[i].m)), res});
function tocaAcT(ms, quando=0, mao){ const t = tArpejo(ms, quando, .26, mao); tAcorde(ms, t + .08, 1.1, mao); return t + 1.3; }

/* ---------- 13. Tríades: maior e menor ---------- */
topicoT({id:'acordes',
  lab(el){
    el.classList.add('tq-lab-acordes');
    const S = esqueletoT(el, escolhaT(tf('ac.raiz'), 'raiz') + escolhaT(tf('ac.tipo'), 'tipo'), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}${tf('ui.tocar')}</button>`});
    let ri = 0, tipo = 'maior';
    const inst = instrumentoT(S.instEl, {mao:'right', maos:true, aoTocar:(b, d)=>{ tSom(b[d], 0, .5, .16, inst.mao); inst.tec.onda(b.id); }, aoTrocarFole:()=>mostra(null, false), aoTrocarMao:()=>mostra(null, false)});
    const notas = ()=>{ const r = RAIZES[ri], desloc = inst.mao==='left' ? -12 : 0; return notasAcT({m:r.m + desloc, letra:r.letra}, tipo); };
    function lado(ate){ const ns = notas();
      S.lado.innerHTML = `<div class="tq-pilha">${ns.slice().reverse().map((g, j)=>{ const i = ns.length-1-j; return `<div class="deg ${i <= ate ? 'on' : ''}" style="--i:${i}"><b>${['1','3','5'][i]}</b><span>${nomeG(g, false)}</span>${i ? `<em>+${g.m - ns[i-1].m} · ${ivCurto(ivDe(g.m - ns[i-1].m))}</em>` : ''}</div>`; }).join('')}</div>
        <p class="tq-lado-txt">${tf('ac.lado.' + tipo)}</p>`; }
    function pauta(ate, junto){ const ns = notas(), clave = inst.mao==='left' ? 'fa' : 'sol';
      S.pauta.innerHTML = pautaT({clave, W:340, notas:ns.slice(0, ate+1).map((g, i)=>({d:g.d, acid:g.acid, x:junto ? 230 : 120 + i*55, cls:i===ate ? 'soa' : ''})),
        chave:!junto && ate >= 1 ? {i:ate-1, j:ate, rotulo:ivCurto(ivDe(ns[ate].m - ns[ate-1].m))} : null}); }
    function teclas(anima){
      const tec = inst.tec, ns = notas(); let bts;
      if(inst.mao==='left' && tipo!=='dim'){ const v = chordVoicings('left', tec.dir, pcDe(ns[0].m), tipo)[0]; bts = v ? v.btns : posicaoT(tec, ns.map(g=>g.m)); }
      else bts = posicaoT(tec, ns.map(g=>g.m));
      tec.limpa(); bts.forEach(b=>{ const g = ns.find(x=>pcDe(x.m)===pcDe(b[tec.dir])); tec.rotulo(b.id, g ? nomeG(grafa(b[tec.dir], g.letra)) : noteName(b[tec.dir])); });
      tec.acende(bts.map(b=>b.id), 'ok'); tec.forma(bts.map(b=>b.id), anima); if(anima) bts.forEach(b=>tec.onda(b.id, T_COR.ok));
      const falta = ns.length - bts.length;
      inst.nota(tf('ac.leg', nomeAc(RAIZES[ri], tipo), listaAc(ns)) + (falta > 0 ? ' ' + tf('ac.leg.falta', dirT(tec.dir)) : ''));
      return bts.map(b=>b[tec.dir]);
    }
    function mostra(cfg, som=true){
      if(cfg){ if(cfg.raiz!=null){ ri = cfg.raiz; chR.marca(ri); } if(cfg.tipo){ tipo = cfg.tipo; chT.marca(tipo); } if(cfg.mao) inst.setMao(cfg.mao); if(cfg.dir && cfg.dir!==inst.dir) inst.setDir(cfg.dir, false); }
      S.rel.limpa(); const ns = notas();
      if(!som){ lado(2); pauta(2, true); teclas(false); return; }
      ns.forEach((g, i)=>S.rel.depois(i*520, ()=>{ lado(i); pauta(i, false); tSom(g.m, 0, .5, .16, inst.mao); }));
      S.rel.depois(3*520 + 100, ()=>{ pauta(2, true); const ms = teclas(true); tAcorde(ms.length ? ms : ns.map(g=>g.m), 0, 1.3, inst.mao); });
    }
    const chR = chipsT(S.q('[data-esc="raiz"]'), RAIZES.map((r, i)=>({v:i, rot:nomeTon(r)})), ri, v=>{ ri = +v; mostra(); });
    const chT = chipsT(S.q('[data-esc="tipo"]'), ['maior','menor','dim'].map(x=>({v:x, rot:tf('ac.n.' + x)})), tipo, v=>{ tipo = v; mostra(); });
    S.acoes.querySelector('[data-tocar]').onclick = ()=>mostra();
    mostra(null, false);
    return {mostra:cfg=>mostra(cfg)};
  },
  perguntas:[
    ()=>{ const ri = Math.floor(Math.random()*6), r = RAIZES[ri], tipo = sorteia(['maior','menor']), outro = tipo==='maior' ? 'menor' : 'maior', ns = notasAcT(r, tipo);
      const sus = [ns[0], grafa(r.m + 5, (r.letra + 3)%7), ns[2]];
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('ac.q.notas', nomeTipoAc(r, tipo)),
        ...opcoesT(listaAc(ns), [{v:listaAc(notasAcT(r, outro)), e:tf('ac.n.e.qual', nomeTipoAc(r, outro), tf('ac.terca.' + outro))}, {v:listaAc(notasAcT(r, 'dim')), e:tf('ac.n.e.dim', nomeG(notasAcT(r, 'dim')[2], false), nomeTipoAc(r, 'dim'))}, {v:listaAc(sus), e:tf('ac.n.e.sus', nomeG(sus[1], false))}]),
        pq:{contas:[pilhaT(ns, nomeTipoAc(r, tipo), tf('ac.res.' + tipo))], texto:tf('ac.pq.' + tipo), ouvir:()=>tocaAcT(ns.map(g=>g.m)), ouvirRot:tf('ui.ouvir.acorde'), lab:{raiz:ri, tipo}}}; },
    ()=>{ const ri = Math.floor(Math.random()*6), r = RAIZES[ri], tipo = sorteia(['maior','menor','maior','menor','dim']), ns = notasAcT(r, tipo), som = ()=>tocaAcT(ns.map(g=>g.m));
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('ac.q.ouvir'), som, ...opcoesT(tf('ac.n.' + tipo), ['maior','menor','dim'].filter(x=>x!==tipo).map(x=>({v:tf('ac.n.' + x), e:tf('ac.o.e.' + x)}))),
        pq:{contas:[pilhaT(ns, nomeTipoAc(r, tipo), tf('ac.res.' + tipo))], texto:tf('ac.o.pq.' + tipo), ouvir:som, ouvirRot:tf('ui.ouvir.acorde'), lab:{raiz:ri, tipo}}}; },
    ()=>{ const tipo = sorteia(['maior','menor']), op = {maior:'ac.f.Mm', menor:'ac.f.mM', dim:'ac.f.mm', aum:'ac.f.MM'};
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('ac.q.formula', tf('ac.tri.' + tipo)),
        ...opcoesT(tf(op[tipo]), Object.keys(op).filter(x=>x!==tipo).map(x=>({v:tf(op[x]), e:tf('ac.f.e', tf('ac.tri.' + x))}))),
        pq:{contas:[pilhaT(notasAcT(TON.do4, tipo), nomeTipoAc(TON.do4, tipo), tf('ac.res.' + tipo))], texto:tf('ac.pq.' + tipo), ouvir:()=>tocaAcT(notasAcT(TON.do4, tipo).map(g=>g.m)), ouvirRot:tf('ui.ouvir.acorde'), lab:{raiz:0, tipo}}}; },
    ()=>{ const ri = Math.floor(Math.random()*6), r = RAIZES[ri], tipo = sorteia(['maior','menor']), ns = notasAcT(r, tipo);
      const maior = tipo==='maior', outro = maior ? 'menor' : 'maior';
      // os vizinhos que dividem duas notas com ele: a terça abaixo e a terça acima (Dó maior: Lá menor e Mi menor)
      const rel = maior ? {r:grafa(r.m - 3, (r.letra + 5)%7), t:'menor'} : {r:grafa(r.m + 3, (r.letra + 2)%7), t:'maior'}, sup = maior ? {r:grafa(r.m + 4, (r.letra + 2)%7), t:'menor'} : {r:grafa(r.m - 4, (r.letra + 5)%7), t:'maior'};
      const cands = [{r, t:outro}, rel, sup].map(c=>({v:nomeTipoAc(c.r, c.t), e:tf('ac.p.e', nomeTipoAc(c.r, c.t), listaAc(notasAcT(c.r, c.t)))}));
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('ac.q.pauta'), pauta:{W:260, notas:ns.map(g=>({d:g.d, acid:g.acid, x:170}))}, ...opcoesT(nomeTipoAc(r, tipo), cands),
        pq:{contas:[pilhaT(ns, nomeTipoAc(r, tipo), tf('ac.res.' + tipo))], texto:tf('ac.p.pq', nomeTon(r)), ouvir:()=>tocaAcT(ns.map(g=>g.m)), ouvirRot:tf('ui.ouvir.acorde'), lab:{raiz:ri, tipo}}}; },
    ()=>{ const ri = Math.floor(Math.random()*7), r = RAIZES[ri], tipo = sorteia(['maior','menor']), ns = notasAcT(r, tipo), pcs = ns.map(g=>pcDe(g.m)), dir = sorteia(['open','close']);
      return {tipo:'tocar', cat:catT('band'), q:tf('ac.q.tocar', nomeTipoAc(r, tipo), dirT(dir)), mao:'right', dir, resp:listaAc(ns),
        toque:(b, m, qz)=>{ const pc = pcDe(m); if(!pcs.includes(pc)) return {certa:false, comentario:tf('ac.t.e', noteName(m), nomeTipoAc(r, tipo), listaAc(ns))};
          if(!qz.toques.includes(pc)) qz.toques.push(pc); return qz.toques.length===3 ? {certa:true} : null; },
        mostra:tec=>{ mostraAcordeT(tec, ns.map(g=>g.m), ns.map(g=>nomeG(g)), true); tAcorde(ns.map(g=>g.m), .1, 1); },
        pq:{contas:[pilhaT(ns, nomeTipoAc(r, tipo), tf('ac.res.' + tipo))], texto:tf('ac.t.pq', dirT(dir)), ouvir:()=>tocaAcT(ns.map(g=>g.m)), ouvirRot:tf('ui.ouvir.acorde'), lab:{raiz:ri, tipo, mao:'right', dir}}}; },
    ()=>{ const L = state.layout.left, iguais = L.filter(b=>b.open===b.close).length;
      return {tipo:'opcoes', cat:catT('band'), q:tf('ac.q.fole'),
        ...opcoesT(tf('ac.b.certa'), [{v:tf('ac.b.menor'), e:tf('ac.b.e.menor')}, {v:tf('ac.b.sem'), e:tf('ac.b.e.sem')}, {v:tf('ac.b.igual'), e:tf('ac.b.e.igual')}]),
        pq:{contas:[{tipo:'pontos', titulo:tf('ac.b.pt'), n:iguais, total:L.length, res:tf('ac.b.res', iguais, L.length)}], texto:tf('ac.b.pq'), lab:{raiz:0, tipo:'maior', mao:'left', dir:'close'}}}; },
  ],
  pratica:[['ui.p.acordes', ()=>go('acordes')], ['ui.p.mapaac', ()=>{ location.href = 'acordes/'; }]]});

/* ---------- 14. Sétima e inversões ---------- */
const RAIZES7 = [TON.sol4, TON.do4, TON.re4, TON.la4, TON.mi4];
const INVS = ['fund','inv1','inv2','inv3'];
// o acorde com sétima na inversão pedida: a nota de baixo sobe uma oitava a cada inversão
function inversaoT(ns, inv){ const r = ns.map(g=>({...g})); for(let k=0;k<inv;k++){ const g = r.shift(); r.push(grafa(g.m + 12, g.letra)); } return r; }
const GRAU_AC = ['1','3','5','7'];
topicoT({id:'setima',
  lab(el){
    const S = esqueletoT(el, escolhaT(tf('se.acorde'), 'ac') + escolhaT(tf('se.inv'), 'inv'), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}${tf('ui.tocar')}</button>`});
    let ai = 0, inv = 0, bts = [];
    const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ tSom(b[d], 0, .5); inst.tec.onda(b.id); }, aoTrocarFole:()=>mostra(null, false)});
    const base = ()=>notasAcT(RAIZES7[ai], 'dom7'), voz = ()=>inversaoT(base(), inv);
    function lado(){ const ns = base(), baixo = inv;
      S.lado.innerHTML = `<div class="tq-tons4">${ns.map((g, i)=>`<span class="${i===baixo ? 'baixo' : ''}" style="--i:${i}"><b>${GRAU_AC[i]}</b>${nomeG(g, false)}</span>`).join('')}</div>
        <p class="tq-lado-txt">${tf('se.lado', nomeG(ns[baixo], false), tf('se.grau.' + baixo), tf('se.n.' + INVS[inv]).toLowerCase())}</p>`; }
    function pauta(velho){ const ns = voz(), Y = d=>120 - (d-30)*6;
      S.pauta.innerHTML = pautaT({W:300, notas:ns.map((g, i)=>({d:g.d, acid:g.acid, x:180, cls:i===0 ? 'dest' : ''}))});
      if(velho && !tRM()){ // a nota que mudou de oitava sobe até o lugar novo
        const sobe = S.pauta.querySelectorAll('.nota')[ns.length-1], de = velho[0]; if(sobe && de) sobe.animate([{transform:`translateY(${Y(de.d) - Y(ns[ns.length-1].d)}px)`, opacity:.4}, {transform:'none', opacity:1}], {duration:520, easing:T_EASE}); }
    }
    function mostra(cfg, som=true, velho){
      if(cfg){ if(cfg.ac!=null){ ai = cfg.ac; chA.marca(ai); } if(cfg.inv!=null){ inv = cfg.inv; chI.marca(inv); } }
      S.rel.limpa(); const ns = voz(), tec = inst.tec; lado(); pauta(velho);
      const novos = posicaoT(tec, ns.map(g=>g.m)); tec.apaga(); tec.limparRotulos(); novos.forEach(b=>{ const g = ns.find(x=>x.m===b[tec.dir]); tec.rotulo(b.id, g ? nomeG(g) : noteName(b[tec.dir])); });
      tec.acende(novos.map(b=>b.id), 'ok'); tec.forma(novos.map(b=>b.id), som);
      const mudou = velho && bts.length ? bts.filter(b=>!novos.includes(b)) : [];
      if(mudou.length && novos.length) tec.arcos([[mudou[0].id, novos[novos.length-1].id]], 'desenha'); else tec.semArcos();
      bts = novos;
      inst.nota(tf('se.leg', nomeAc(RAIZES7[ai], 'dom7'), tf('se.n.' + INVS[inv]), nomeG(ns[0], false)));
      if(som) tocaAcT(ns.map(g=>g.m));
    }
    const chA = chipsT(S.q('[data-esc="ac"]'), RAIZES7.map((r, i)=>({v:i, rot:nomeAc(r, 'dom7')})), ai, v=>{ ai = +v; mostra(); });
    const chI = chipsT(S.q('[data-esc="inv"]'), INVS.map((x, i)=>({v:i, rot:tf('se.n.' + x)})), inv, v=>{ const antes = inv, velho = voz(); inv = +v; mostra(null, true, inv===antes+1 ? velho : null); });
    S.acoes.querySelector('[data-tocar]').onclick = ()=>mostra();
    mostra(null, false);
    return {mostra:cfg=>mostra(cfg)};
  },
  perguntas:[
    ()=>{ const r = sorteia(RAIZES7), ns = notasAcT(r, 'dom7');
      const maj7 = notasAcT(r, 'maj7'), m7 = notasAcT(r, 'm7'), sexta = notasAcT(r, 'sexta');
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('se.q.notas', nomeAc(r, 'dom7')),
        ...opcoesT(listaAc(ns), [{v:listaAc(maj7), e:tf('se.n.e.maj7', nomeG(maj7[3], false), nomeAc(r, 'maj7'), nomeAc(r, 'dom7'))}, {v:listaAc(m7), e:tf('se.n.e.m7', nomeG(m7[1], false), nomeAc(r, 'm7'))}, {v:listaAc(sexta), e:tf('se.n.e.6', nomeG(sexta[3], false), nomeAc(r, 'sexta'))}]),
        pq:{contas:[pilhaT(ns, nomeAc(r, 'dom7'), tf('se.n.res'))], texto:tf('se.n.pq'), ouvir:()=>tocaAcT(ns.map(g=>g.m)), ouvirRot:tf('ui.ouvir.acorde'), lab:{ac:RAIZES7.indexOf(r), inv:0}}}; },
    ()=>{ const ai = Math.floor(Math.random()*RAIZES7.length), r = RAIZES7[ai], inv = Math.floor(Math.random()*4), ns = inversaoT(notasAcT(r, 'dom7'), inv), base = notasAcT(r, 'dom7');
      return {tipo:'opcoes', cat:catT('pauta'), q:tf('se.q.inv', nomeAc(r, 'dom7')), pauta:{W:240, notas:ns.map(g=>({d:g.d, acid:g.acid, x:150}))},
        ...opcoesT(tf('se.n.' + INVS[inv]), INVS.filter((_, i)=>i!==inv).map(x=>{ const i = INVS.indexOf(x); return {v:tf('se.n.' + x), e:tf('se.i.e', tf('se.n.' + x), tf('se.grau.' + i), nomeG(base[i], false))}; })),
        pq:{contas:[{tipo:'cadeia', titulo:nomeAc(r, 'dom7'), itens:base.map((g, i)=>GRAU_AC[i] + ' ' + nomeG(g, false)), destaque:[inv]}], texto:tf('se.i.pq', nomeG(ns[0], false), tf('se.grau.' + inv), tf('se.n.' + INVS[inv]).toLowerCase()), ouvir:()=>tocaAcT(ns.map(g=>g.m)), ouvirRot:tf('ui.ouvir.acorde'), lab:{ac:ai, inv}}}; },
    ()=>{ const inv = 1 + Math.floor(Math.random()*3), op = i=>tf('se.b.' + i);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('se.q.baixo', tf('se.n.' + INVS[inv]).toLowerCase()),
        ...opcoesT(op(inv), [0,1,2,3].filter(i=>i!==inv).map(i=>({v:op(i), e:tf('se.b.e', op(i), tf('se.n.' + INVS[i]).toLowerCase())}))),
        pq:{contas:[{tipo:'cadeia', titulo:nomeAc(TON.sol4, 'dom7'), itens:inversaoT(notasAcT(TON.sol4, 'dom7'), inv).map(g=>nomeG(g, false)), destaque:[0], res:tf('se.b.res', tf('se.n.' + INVS[inv]), tf('se.grau.' + inv))}], texto:tf('se.b.pq'), lab:{ac:0, inv}}}; },
    ()=>{ const r = sorteia(RAIZES7), com7 = Math.random() < .5, ns = notasAcT(r, com7 ? 'dom7' : 'maior'), som = ()=>tocaAcT(ns.map(g=>g.m));
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('se.q.ouvir'), som, ...opcoesT(tf(com7 ? 'se.o.7' : 'se.o.3'), [{v:tf(com7 ? 'se.o.3' : 'se.o.7'), e:tf(com7 ? 'se.o.e.3' : 'se.o.e.7')}]),
        pq:{contas:[pilhaT(ns, nomeAc(r, com7 ? 'dom7' : 'maior'))], texto:tf(com7 ? 'se.o.pq.7' : 'se.o.pq.3'), ouvir:som, ouvirRot:tf('ui.ouvir.acorde'), lab:{ac:RAIZES7.indexOf(r), inv:0}}}; },
    ()=>{ const r = sorteia(RAIZES7), ns = notasAcT(r, 'dom7'), set = ns[3];
      const er = [[9, grafa(r.m + 9, (r.letra + 5)%7)], [11, grafa(r.m + 11, (r.letra + 6)%7)], [12, grafa(r.m + 12, r.letra)]].map(([k, g])=>({v:String(k), e:tf('se.s.e.' + k, nomeG(g, false))}));
      return {tipo:'opcoes', cat:catT('conta'), q:tf('se.q.semis', nomeAc(r, 'dom7'), nomeG(set, false), nomeTon(r)), ...opcoesT('10', er, {ordena:true}),
        pq:{contas:[{tipo:'pontos', titulo:nomeTon(r) + ' → ' + nomeG(set, false), n:10, res:tf('se.s.res')}], texto:tf('se.s.pq'), ouvir:()=>{ tSom(r.m, 0, .6); tSom(set.m, .65, .6); tSom(r.m, 1.35, .9, .12); tSom(set.m, 1.35, .9, .12); }, ouvirRot:tf('ui.ouvir.duas'), lab:{ac:RAIZES7.indexOf(r), inv:0}}}; },
    ()=>{ const k = sorteia([['do', TON.sol4], ['fa', TON.do4], ['sol', TON.re4]]), ton = TONS_MAIOR[k[0]] || TON.do4, dom = k[1], ops = [nomeAc(dom, 'dom7'), nomeAc(ton, 'dom7'), nomeAc(grafar(ton, INTERVALOS[4]), 'dom7'), nomeAc(dom, 'maj7')];
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('se.q.dom', nomeTonT(ton)),
        ...opcoesT(ops[0], [{v:ops[1], e:tf('se.d.e.ton', ops[1], nomeTon(ton))}, {v:ops[2], e:tf('se.d.e.sub', ops[2])}, {v:ops[3], e:tf('se.d.e.maj7', ops[3], nomeTonT(ton))}]),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTonT(ton), itens:escalaT('maior', ton).slice(0, 7).map((g, i)=>ROMANOS[i] + ' ' + nomeG(g, false)), destaque:[4]}], texto:tf('se.d.pq', ops[0], nomeTon(ton)), ouvir:()=>{ const t = tocaAcT(notasAcT(dom, 'dom7').map(g=>g.m)); tAcorde(acordeT(ton, [0,4,7]).map(g=>g.m), t, 1.2); }, ouvirRot:tf('ui.ouvir.acorde'), lab:{ac:RAIZES7.indexOf(dom), inv:0}}}; },
  ],
  pratica:[['ui.p.acordes', ()=>go('acordes')], ['ui.p.licao.acordes', ()=>{ curLesson = 8; renderLesson(); go('licoes'); }]]});

/* ---------- 15 e 16. Funções e cadências: os acordes do tom, em posição próxima ---------- */
const TONS_HARM = {do:{ton:TON.do4, menor:false}, sol:{ton:TON.sol4, menor:false}, la:{ton:TON.la4, menor:true}, re:{ton:TON.re4, menor:true}};
const nomeTomH = k => TONS_HARM[k].menor ? tf('esc.nome.menor', nomeTon(TONS_HARM[k].ton)) : nomeTonT(TONS_HARM[k].ton);
// I, IV, V7, V e VI com as vozes perto umas das outras (o que muda de um acorde para o outro anda pouco)
function acordesTomT(k){
  const {ton, menor} = TONS_HARM[k], t = ton.m, g = (s, dl)=>grafa(t + s, (ton.letra + dl + 7)%7);
  return {
    I:{notas:[g(0,0), g(menor ? 3 : 4, 2), g(7,4)], nome:nomeTon(ton) + (menor ? 'm' : ''), grau:menor ? 'i' : 'I', func:'T', tensao:.12},
    IV:{notas:[g(0,0), g(5,3), g(menor ? 8 : 9, 5)], nome:nomeG(g(5,3), false) + (menor ? 'm' : ''), grau:menor ? 'iv' : 'IV', func:'S', tensao:.5},
    V7:{notas:[g(-1,6), g(2,1), g(5,3), g(7,4)], nome:nomeG(g(7,4), false) + '7', grau:'V7', func:'D', tensao:.95},
    V:{notas:[g(-1,6), g(2,1), g(7,4)], nome:nomeG(g(7,4), false), grau:'V', func:'D', tensao:.85},
    VI:{notas:menor ? [g(0,0), g(3,2), g(8,5)] : [g(0,0), g(4,2), g(9,5)], nome:menor ? nomeG(g(8,5), false) : nomeG(g(9,5), false) + 'm', grau:menor ? 'VI' : 'vi', func:'T', tensao:.35}};
}
const msAc = a => a.notas.map(g=>g.m);
// o baixo (a fundamental do acorde) na região grave, para a mão esquerda: Mi2 a Ré♯3
const baixoAc = (x, k) => { const {ton, menor} = TONS_HARM[k], pc = (ton.m + (x==='VI' ? (menor ? 8 : 9) : {I:0, IV:5, V7:7, V:7}[x]))%12; return 36 + pc + (pc < 4 ? 12 : 0); };
function tocaAcordeH(x, k, quando=0, dur=1, curto){ const a = acordesTomT(k)[x]; tAcorde(msAc(a), quando, curto ? .2 : dur); tSom(baixoAc(x, k), quando, curto ? .2 : dur, .13, 'left'); }
// o laboratório das funções e das cadências: cartões, medidor de tensão, pauta e as vozes que andam no teclado
function labHarmoniaT(el, o){
  const S = esqueletoT(el, escolhaT(tf('esc.tonica'), 'tom') + (o.cadencias ? escolhaT(tf('cad.cad'), 'cad') : ''), {acoes:`<button class="btn" type="button" data-tocar>${ICO_PLAY}${tf(o.cadencias ? 'ui.tocar' : 'fu.tocar.prog')}</button>`});
  let k = o.tomIni, cad = 'perfeita', atual = [];
  const inst = instrumentoT(S.instEl, {mao:'right', aoTocar:(b, d)=>{ tSom(b[d], 0, .5); inst.tec.onda(b.id); }, aoTrocarFole:()=>{ atual = []; }});
  const ACS = ()=>acordesTomT(k);
  function lado(seq, ativo){
    const A = ACS();
    S.lado.innerHTML = `<div class="tq-funcoes">${seq.map((x, i)=>`<button type="button" class="tq-func f${A[x].func} ${i===ativo ? 'on' : ''}" data-ac="${x}" style="--i:${i}"><b>${A[x].grau}</b><span>${A[x].nome}</span><small>${tf('fu.' + A[x].func)}</small></button>`).join('')}</div>
      <div class="tq-tensao"><span class="tq-rotulo">${tf('fu.tensao')}</span><div class="tq-medidor h"><i style="--v:${ativo >= 0 ? A[seq[ativo]].tensao : 0}"></i></div></div>
      ${o.cadencias ? `<p class="tq-lado-txt">${tf('cad.d.' + cad)}</p>` : ''}`;
  }
  function pauta(seq, ativo){ const A = ACS(), xs = xsT(seq.length, 110, 360, 70), notas = [], rotulos = [];
    // o rótulo (I, IV, V7…) vai embaixo da primeira nota de cada acorde
    seq.forEach((x, i)=>A[x].notas.forEach((g, j)=>{ notas.push({d:g.d, acid:g.acid, x:xs[i], cls:i===ativo ? 'soa' : ''}); rotulos.push(j===0 ? A[x].grau : ''); }));
    S.pauta.innerHTML = pautaT({W:360, rotulos, notas}); }
  // um acorde no teclado; as setas mostram as vozes que andam desde o acorde anterior
  function teclas(a, anima){
    const tec = inst.tec, ms = msAc(a), novos = posicaoT(tec, ms);
    const pares = atual.length ? atual.map(b=>{ const m = b[tec.dir]; if(ms.includes(m)) return null; const alvo = novos.slice().sort((p, q)=>Math.abs(p[tec.dir]-m) - Math.abs(q[tec.dir]-m))[0]; return alvo ? [b.id, alvo.id] : null; }).filter(Boolean) : [];
    tec.apaga(); tec.limparRotulos(); novos.forEach(b=>{ const g = a.notas.find(x=>x.m===b[tec.dir]); tec.rotulo(b.id, g ? nomeG(g) : noteName(b[tec.dir])); });
    tec.acende(novos.map(b=>b.id), a.func==='D' ? inst.dir : 'ok'); tec.forma(novos.map(b=>b.id), anima);
    if(pares.length) tec.arcos(pares, 'desenha'); else tec.semArcos();
    atual = novos;
  }
  function toca(seq, curto){
    S.rel.limpa(); ac(); atual = []; const A = ACS(), passo = curto ? .42 : 1.15;
    seq.forEach((x, i)=>S.rel.depois(i*passo*1000, ()=>{ lado(seq, i); pauta(seq, i); teclas(A[x], true); tocaAcordeH(x, k, 0, passo*.9, curto); }));
    S.rel.depois(seq.length*passo*1000 + 200, ()=>pauta(seq, -1));
    inst.nota(o.legenda(k, cad, seq));
  }
  const seqCad = ()=>({perfeita:['V7','I'], plagal:['IV','I'], suspensiva:['I','V'], interrompida:['V7','VI'], tango:['V7','I']})[cad];
  const seqAtual = ()=>o.cadencias ? seqCad() : ['I','IV','V7','I'];
  function mostra(cfg, som=true){
    if(cfg){ if(cfg.tom){ k = cfg.tom; chT.marca(k); } if(cfg.cad && chC){ cad = cfg.cad; chC.marca(cad); } }
    const seq = seqAtual(); lado(seq, -1); pauta(seq, -1); inst.tec.limpa(); atual = [];
    if(som) toca(seq, o.cadencias && cad==='tango'); else inst.nota(o.legenda(k, cad, seq));
    if(cfg && cfg.func && !o.cadencias){ const A = ACS(), x = {T:'I', S:'IV', D:'V7'}[cfg.func]; S.rel.limpa(); lado(['I','IV','V7'], ['T','S','D'].indexOf(cfg.func)); teclas(A[x], true); tocaAcordeH(x, k, 0, 1.2); }
  }
  S.lado.addEventListener('click', e=>{ const b = e.target.closest('[data-ac]'); if(!b) return; S.rel.limpa(); const A = ACS(), seq = seqAtual(), i = [...b.parentNode.children].indexOf(b);
    lado(seq, i); pauta(seq, i); teclas(A[b.dataset.ac], true); tocaAcordeH(b.dataset.ac, k, 0, 1.2); });
  const chT = chipsT(S.q('[data-esc="tom"]'), Object.keys(TONS_HARM).map(x=>({v:x, rot:nomeTomH(x)})), k, v=>{ k = v; mostra(); });
  const chC = o.cadencias ? chipsT(S.q('[data-esc="cad"]'), ['perfeita','plagal','suspensiva','interrompida','tango'].map(x=>({v:x, rot:tf('cad.n.' + x)})), cad, v=>{ cad = v; mostra(); }) : null;
  S.acoes.querySelector('[data-tocar]').onclick = ()=>mostra();
  mostra(null, false);
  return {mostra:cfg=>mostra(cfg)};
}
const progT = (k, seq, curto) => { const p = curto ? .42 : 1.1; seq.forEach((x, i)=>tocaAcordeH(x, k, i*p, p*.9, curto)); return seq.length*p + .4; };

/* ---------- 15. Tônica, subdominante e dominante ---------- */
topicoT({id:'funcoes',
  lab:el=>labHarmoniaT(el, {tomIni:'do', legenda:k=>{ const A = acordesTomT(k); return tf('fu.leg', nomeTomH(k), A.I.nome, A.IV.nome, A.V7.nome); }}),
  perguntas:[
    ()=>{ const k = sorteia(Object.keys(TONS_HARM)), A = acordesTomT(k), f = sorteia(['D','S','T']), x = {T:'I', S:'IV', D:'V7'}[f], outros = ['I','IV','V7','VI'].filter(y=>y!==x);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('fu.q.qual', nomeTomH(k), tf('fu.' + f).toLowerCase()),
        ...opcoesT(A[x].nome, outros.map(y=>({v:A[y].nome, e:tf('fu.e', A[y].nome, tf(y==='VI' ? 'fu.VI' : 'fu.' + A[y].func).toLowerCase(), A[y].grau)}))),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTomH(k), itens:['I','IV','V7'].map(y=>A[y].grau + ' ' + A[y].nome), destaque:[['I','IV','V7'].indexOf(x)], res:tf('fu.res')}], texto:tf('fu.d.' + f), ouvir:()=>progT(k, [x]), ouvirRot:tf('ui.ouvir.acorde'), lab:{tom:k, func:f}}}; },
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('fu.q.tensao'),
      ...opcoesT(tf('fu.D'), [{v:tf('fu.T'), e:tf('fu.t.e.T')}, {v:tf('fu.S'), e:tf('fu.t.e.S')}, {v:tf('fu.t.nenhuma'), e:tf('fu.t.e.nenhuma')}]),
      pq:{texto:tf('fu.t.pq'), ouvir:()=>progT('do', ['I','IV','V7','I']), ouvirRot:tf('ui.ouvir.prog'), lab:{tom:'do'}}}),
    ()=>{ const k = sorteia(['la','re']), A = acordesTomT(k), sens = A.V7.notas[0], dm = nomeG(A.V7.notas[3], false) + 'm';
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('fu.q.menor', nomeTomH(k), A.V7.nome, dm),
        ...opcoesT(tf('fu.m.certa', nomeG(sens, false)), [{v:tf('fu.m.sempre'), e:tf('fu.m.e.sempre')}, {v:tf('fu.m.naoexiste', dm), e:tf('fu.m.e.naoexiste', dm)}, {v:tf('fu.m.tanto'), e:tf('fu.m.e.tanto')}]),
        pq:{contas:[{tipo:'cadeia', titulo:A.V7.nome, itens:A.V7.notas.map(g=>nomeG(g, false)), destaque:[0]}], texto:tf('fu.m.pq', nomeG(sens, false), nomeTon(TONS_HARM[k].ton)), ouvir:()=>progT(k, ['V7','I']), ouvirRot:tf('ui.ouvir.prog'), lab:{tom:k, func:'D'}}}; },
    ()=>{ const k = sorteia(['do','la']), volta = Math.random() < .5, seq = volta ? ['I','IV','V7','I'] : ['I','IV','V7'], som = ()=>progT(k, seq);
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('fu.q.ouvir'), som, ...opcoesT(tf(volta ? 'fu.o.repouso' : 'fu.o.suspenso'), [{v:tf(volta ? 'fu.o.suspenso' : 'fu.o.repouso'), e:tf(volta ? 'fu.o.e.suspenso' : 'fu.o.e.repouso')}]),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTomH(k), itens:seq.map(x=>acordesTomT(k)[x].grau), lig:seq.slice(1).map(()=>'→'), destaque:[seq.length-1]}], texto:tf(volta ? 'fu.o.pq.repouso' : 'fu.o.pq.suspenso'), ouvir:som, ouvirRot:tf('ui.ouvir.prog'), lab:{tom:k}}}; },
    ()=>{ const k = sorteia(['do','sol']), A = acordesTomT(k), x = sorteia(['IV','V7','I']), f = A[x].func, fora = nomeG(grafa(TONS_HARM[k].ton.m + 1, (TONS_HARM[k].ton.letra + 1)%7), false);
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('fu.q.func', nomeTomH(k), A[x].nome),
        ...opcoesT(tf('fu.' + f), ['T','S','D'].filter(y=>y!==f).map(y=>({v:tf('fu.' + y), e:tf('fu.f.e', tf('fu.' + y).toLowerCase(), A[{T:'I', S:'IV', D:'V7'}[y]].nome)})).concat([{v:tf('fu.f.fora'), e:tf('fu.f.e.fora', A[x].nome, nomeTomH(k), fora)}]).slice(0, 3)),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTomH(k), itens:escalaT('maior', TONS_HARM[k].ton).slice(0, 7).map((g, i)=>ROMANOS[i] + ' ' + nomeG(g, false)), destaque:[{I:0, IV:3, V7:4}[x]]}], texto:tf('fu.d.' + f), ouvir:()=>progT(k, [x]), ouvirRot:tf('ui.ouvir.acorde'), lab:{tom:k, func:f}}}; },
  ],
  pratica:[['ui.p.acordes', ()=>go('acordes')]]});

/* ---------- 16. Cadências: a harmonia do tango ---------- */
const CADS = ['perfeita','plagal','suspensiva','interrompida'];
const SEQ_CAD = {perfeita:['V7','I'], plagal:['IV','I'], suspensiva:['I','V'], interrompida:['V7','VI'], tango:['V7','I']};
topicoT({id:'cadencias',
  lab:el=>labHarmoniaT(el, {tomIni:'la', cadencias:true, legenda:(k, cad, seq)=>{ const A = acordesTomT(k); return tf('cad.leg', tf('cad.n.' + cad), nomeTomH(k), seq.map(x=>A[x].nome).join(' → ')); }}),
  perguntas:[
    ()=>{ const k = sorteia(['do','la']), c = sorteia(CADS), som = ()=>progT(k, ['I', ...SEQ_CAD[c]].slice(c==='suspensiva' ? 1 : 0));
      return {tipo:'ouvir', cat:catT('ouvido'), q:tf('cad.q.ouvir'), som, ...opcoesT(tf('cad.n.' + c), CADS.filter(x=>x!==c).map(x=>({v:tf('cad.n.' + x), e:tf('cad.e.' + x)}))),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTomH(k), itens:SEQ_CAD[c].map(x=>acordesTomT(k)[x].grau + ' ' + acordesTomT(k)[x].nome), lig:['→'], destaque:[1]}], texto:tf('cad.d.' + c), ouvir:som, ouvirRot:tf('ui.ouvir.prog'), lab:{tom:k, cad:c}}}; },
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('cad.q.perfeita'),
      ...opcoesT(tf('cad.p.VI'), [{v:tf('cad.p.IVI'), e:tf('cad.p.e.plagal')}, {v:tf('cad.p.IV'), e:tf('cad.p.e.susp')}, {v:tf('cad.p.Vvi'), e:tf('cad.p.e.int')}]),
      pq:{contas:[{tipo:'cadeia', titulo:tf('cad.n.perfeita'), itens:['V7', 'I'], lig:['→'], destaque:[1]}], texto:tf('cad.d.perfeita'), ouvir:()=>progT('do', ['I','V7','I']), ouvirRot:tf('ui.ouvir.prog'), lab:{tom:'do', cad:'perfeita'}}}),
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('cad.q.susp'),
      ...opcoesT(tf('cad.s.certa'), [{v:tf('cad.s.final'), e:tf('cad.s.e.final')}, {v:tf('cad.s.erro'), e:tf('cad.s.e.erro')}, {v:tf('cad.s.tom'), e:tf('cad.s.e.tom')}]),
      pq:{texto:tf('cad.d.suspensiva'), ouvir:()=>progT('la', ['I','IV','V']), ouvirRot:tf('ui.ouvir.prog'), lab:{tom:'la', cad:'suspensiva'}}}),
    ()=>({tipo:'opcoes', cat:catT('band'), q:tf('cad.q.tango'),
      ...opcoesT(tf('cad.t.certa'), [{v:tf('cad.t.longos'), e:tf('cad.t.e.longos')}, {v:tf('cad.t.plagal'), e:tf('cad.t.e.plagal')}, {v:tf('cad.t.nota'), e:tf('cad.t.e.nota')}]),
      pq:{texto:tf('cad.d.tango'), ouvir:()=>progT('la', ['V7','I'], true), ouvirRot:tf('cad.ouvir.chan'), lab:{tom:'la', cad:'tango'}}}),
    ()=>{ const k = sorteia(['la','re']), A = acordesTomT(k), op = (a, b)=>A[a].nome + ' → ' + A[b].nome;
      return {tipo:'opcoes', cat:catT('conceito'), q:tf('cad.q.menor', nomeTomH(k)),
        ...opcoesT(op('V7','I'), [{v:op('IV','I'), e:tf('cad.m.e', tf('cad.n.plagal').toLowerCase())}, {v:op('I','V7'), e:tf('cad.m.e', tf('cad.n.suspensiva').toLowerCase())}, {v:op('V7','VI'), e:tf('cad.m.e', tf('cad.n.interrompida').toLowerCase())}]),
        pq:{contas:[{tipo:'cadeia', titulo:nomeTomH(k), itens:[A.V7.grau + ' ' + A.V7.nome, A.I.grau + ' ' + A.I.nome], lig:['→'], destaque:[1]}], texto:tf('cad.m.pq', A.V7.nome, nomeG(A.V7.notas[0], false), nomeTon(TONS_HARM[k].ton)), ouvir:()=>progT(k, ['V7','I']), ouvirRot:tf('ui.ouvir.prog'), lab:{tom:k, cad:'perfeita'}}}; },
    ()=>({tipo:'opcoes', cat:catT('conceito'), q:tf('cad.q.inter'),
      ...opcoesT(tf('cad.i.certa'), [{v:tf('cad.i.ton'), e:tf('cad.i.e.ton')}, {v:tf('cad.i.sub'), e:tf('cad.i.e.sub')}, {v:tf('cad.i.dom'), e:tf('cad.i.e.dom')}]),
      pq:{texto:tf('cad.d.interrompida'), ouvir:()=>progT('do', ['I','IV','V7','VI']), ouvirRot:tf('ui.ouvir.prog'), lab:{tom:'do', cad:'interrompida'}}}),
  ],
  pratica:[['ui.p.melodias', ()=>go('melodias')], ['ui.p.licao.partitura', ()=>{ curLesson = 10; renderLesson(); go('licoes'); }]]});
