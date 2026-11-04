/* ================== Movimento, vibração e comemoração ================== */
// O movimento serve para orientar: mostra o que entrou na tela, o que mudou e o que você acertou.
// Tudo usa transform e opacity (leve até em celular simples) e respeita o "reduzir movimento" do
// sistema e a escolha em Ajustes → Animações. Quando reduzido, a informação é a mesma, sem animação.
const mov = { pref: store.get('movimento', 'normal'), vib: store.get('vibracao', true) };
const movReduzido = () => mov.pref==='reduzido' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function aplicarMovimento(){ document.documentElement.classList.toggle('sem-mov', movReduzido()); }
aplicarMovimento();

// Vibração curta no celular: um toque no acerto, dois no erro, três na comemoração
const VIBRACOES = {ok:[16], erro:[28,50,28], vitoria:[30,40,30,40,90]};
function vibrar(tipo){
  if(!mov.vib || !navigator.vibrate) return;
  try{ navigator.vibrate(VIBRACOES[tipo] || VIBRACOES.ok); }catch(e){}
}

// Entrada em cascata: ao abrir uma aba, os blocos dela entram um logo depois do outro
function cascata(sec){
  if(!sec || movReduzido() || !sec.animate) return;
  [...sec.children].filter(el=>el.offsetParent!==null && !el.hasAttribute('data-revela')).slice(0,7).forEach((el,i)=>
    el.animate([{opacity:0, transform:'translateY(14px)'}, {opacity:1, transform:'none'}],
               {duration:420, delay:i*60, easing:'cubic-bezier(.2,.8,.2,1)', fill:'backwards'}));
}

// Os números da tela Início contam do zero até o valor (só o número do começo do texto: "7/11", "92%")
function contarNumeros(raiz){
  if(movReduzido()) return;
  raiz.querySelectorAll('.stat').forEach(el=>{
    const m = el.textContent.match(/^(\d+)(.*)$/); if(!m || +m[1]===0) return;
    const fim = +m[1], resto = m[2], t0 = performance.now(), dur = 900;
    const passo = agora=>{
      const k = Math.min(1, (agora-t0)/dur), e = 1-Math.pow(1-k,3);
      el.textContent = Math.round(fim*e) + resto;
      if(k<1 && el.isConnected) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
}
// Os anéis de progresso se preenchem a partir do zero
function encherAneis(raiz){
  if(movReduzido()) return;
  raiz.querySelectorAll('.anel .valor').forEach(c=>{
    const final = c.style.strokeDasharray; if(!final) return;
    c.style.transition = 'none'; c.style.strokeDasharray = '0 100'; c.getBoundingClientRect();
    c.style.transition = ''; requestAnimationFrame(()=>requestAnimationFrame(()=>{ c.style.strokeDasharray = final; }));
  });
}

// Confete dourado: curto, só quando o resultado foi bom
function confete(){
  if(movReduzido()) return;
  const cv = $('#confete'); if(!cv || !cv.getContext) return;
  const cx = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight;
  const cores = ['#e6b450','#f0c96e','#f3e9d2','#3ccf8e','#ef6f9a','#4f9cf0'];
  const ps = Array.from({length:110}, ()=>({x:W/2+(Math.random()-.5)*W*.3, y:H*.42, vx:(Math.random()-.5)*13, vy:-Math.random()*13-5,
    r:Math.random()*7+4, a:Math.random()*6, va:(Math.random()-.5)*.35, c:cores[Math.random()*cores.length|0]}));
  const t0 = performance.now(); cv.hidden = false;
  const quadro = agora=>{
    const vida = 1-(agora-t0)/1900; cx.clearRect(0,0,W,H);
    for(const p of ps){
      p.vy += .36; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      cx.save(); cx.globalAlpha = Math.max(0,vida); cx.translate(p.x,p.y); cx.rotate(p.a);
      cx.fillStyle = p.c; cx.fillRect(-p.r/2, -p.r/4, p.r, p.r/2); cx.restore();
    }
    if(vida>0) requestAnimationFrame(quadro); else { cx.clearRect(0,0,W,H); cv.hidden = true; }
  };
  requestAnimationFrame(quadro);
}
function comemorar(){ confete(); vibrar('vitoria'); }

// Aviso flutuante (conquista nova, tarefa feita…)
let avisoTimer = null;
function avisar(html, ms=4200){
  const el = $('#toast'); if(!el) return;
  el.innerHTML = html; el.hidden = false; el.classList.remove('sai');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(()=>{ el.classList.add('sai'); setTimeout(()=>{ el.hidden = true; }, movReduzido()?0:320); }, ms);
}

// Blocos que aparecem ao chegar na tela durante a rolagem (atributo data-revela).
// data-revela="cascata": os filhos entram um depois do outro; "aneis": enche os anéis e conta os números.
const revelador = 'IntersectionObserver' in window ? new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  const el = e.target; el.classList.add('visto'); revelador.unobserve(el);
  if(el.dataset.revela==='aneis'){ encherAneis(el); contarNumeros(el); }
}), {threshold:0.1, rootMargin:'0px 0px -6% 0px'}) : null;
function revelar(raiz){
  raiz.querySelectorAll('[data-revela]').forEach(el=>{
    if(!revelador || movReduzido()){ el.classList.add('visto'); return; }
    [...el.children].forEach((c,i)=>c.style.setProperty('--i', i));
    revelador.observe(el);
  });
}
revelar(document);
// O bandoneon desenhado da tela Início: os botões acendem como se alguém tocasse
setInterval(()=>{
  if(typeof currentView==='undefined' || currentView!=='inicio' || movReduzido() || document.hidden) return;
  const bs = $$('#v-inicio .bando .caixa i'); bs.forEach(b=>b.classList.remove('on'));
  for(let k=0; k<1+rand(2); k++) pick(bs).classList.add('on');
}, 800);
