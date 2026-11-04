/* ================== Idiomas: português, espanhol e inglês ================== */
// O app é escrito em português: os textos do index.html e do código continuam em pt.
// A tradução acontece na tela: um MutationObserver olha cada texto que aparece (inclusive os
// gerados pelo código) e troca pelo equivalente do dicionário TEXTOS (js/i18n-textos.js), que
// usa o texto em português como chave: {'Começar': ['Comenzar', 'Start'], ...}.
//  - Textos montados com variáveis usam modelos com {}: 'Rodada {}/10 · Acertos: {}'.
//    O que entra no lugar de cada {} também é traduzido, se estiver no dicionário.
//  - As lições têm tradução inteira em js/licoes-traducao.js.
//  - alert/confirm/prompt não passam pela página: no código use t('texto', valores...).
//  - Para conferir o que falta traduzir: python ferramentas/extrair_textos.py
const IDIOMAS = {
  pt: {nome:'Português', bandeira:'icones/bandeiras/br.svg', html:'pt-BR'},
  es: {nome:'Español',   bandeira:'icones/bandeiras/es.png', html:'es'},
  en: {nome:'English',   bandeira:'icones/bandeiras/gb.svg', html:'en'},
};
const COLUNA = {es:0, en:1}; // posição de cada idioma nas traduções do dicionário
if(!IDIOMAS[state.lang]) state.lang = 'pt';
// sem escolha explícita, quem usa inglês vê as notas em letras (C D E)
if(store.get('names', null)==null && state.lang==='en') state.names = 'en';

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EXATOS = new Map(), MODELOS = [];
for(const [pt, tr] of Object.entries(TEXTOS)){
  if(!pt.includes('{}')){ EXATOS.set(pt, tr); continue; }
  MODELOS.push({re: new RegExp('^' + pt.split('{}').map(escRe).join('(.*?)') + '$'), tr, peso: pt.replace(/\{\}/g,'').length});
}
MODELOS.sort((a,b)=>b.peso-a.peso); // modelos mais específicos primeiro

// Traduz um texto (já sem espaços sobrando). Devolve null se não houver tradução.
function traduzTexto(s, nivel=0){
  const c = COLUNA[state.lang]; if(c==null) return null;
  const e = EXATOS.get(s); if(e) return e[c];
  if(nivel>1) return null;
  for(const m of MODELOS){
    const g = s.match(m.re); if(!g) continue;
    let k = 1;
    return m.tr[c].replace(/\{\}/g, ()=>{ const v=g[k++]; return traduzTexto(v, nivel+1) ?? v; });
  }
  return null;
}
// Para o código: t('Esse é {}.', nota) devolve o texto no idioma atual com os {} preenchidos
function t(s, ...vals){
  let r = state.lang==='pt' ? s : (traduzTexto(s) ?? s);
  vals.forEach(v=>{ r = r.replace('{}', v); });
  return r;
}
// Letra da mão nos cartões de melodia a duas mãos
const maoLetra = h => ({pt:{left:'E',right:'D'}, es:{left:'I',right:'D'}, en:{left:'L',right:'R'}})[state.lang][h];

// ---------- Tradução dos textos da página ----------
const NAO_TRADUZIR = new Set(['SCRIPT','STYLE','TEXTAREA','CODE']);
const ATTRS = ['title','aria-label','alt','placeholder'];
// Cada nó guarda o original em pt (__pt) e o último valor que nós escrevemos (__tr). Se o código
// trocar o texto, o valor atual deixa de ser o nosso e passa a ser o novo original.
function traduzNo(n){
  const p = n.parentNode; if(!p || NAO_TRADUZIR.has(p.nodeName) || p.closest('[translate="no"]')) return;
  const atual = n.nodeValue;
  if(n.__tr !== atual) n.__pt = atual;
  const pt = n.__pt, chave = pt.replace(/\s+/g,' ').trim();
  let novo = pt;
  if(state.lang!=='pt' && /[A-Za-zÀ-ÿ]/.test(chave)){
    const tr = traduzTexto(chave);
    if(tr!=null) novo = pt.match(/^\s*/)[0] + tr + pt.match(/\s*$/)[0];
  }
  n.__tr = novo;
  if(novo!==atual) n.nodeValue = novo;
}
function traduzAttr(el, a){
  const atual = el.getAttribute(a); if(atual==null) return;
  el.__ptA = el.__ptA || {}; el.__trA = el.__trA || {};
  if(el.__trA[a] !== atual) el.__ptA[a] = atual;
  const pt = el.__ptA[a], tr = state.lang!=='pt' ? traduzTexto(pt.replace(/\s+/g,' ').trim()) : null;
  const novo = tr ?? pt; el.__trA[a] = novo;
  if(novo!==atual) el.setAttribute(a, novo);
}
function traduzArvore(raiz){
  if(raiz.nodeType===3){ traduzNo(raiz); return; }
  if(raiz.nodeType!==1 || NAO_TRADUZIR.has(raiz.nodeName)) return;
  ATTRS.forEach(a=>{ if(raiz.hasAttribute(a)) traduzAttr(raiz, a); });
  raiz.querySelectorAll(ATTRS.map(a=>`[${a}]`).join(',')).forEach(el=>ATTRS.forEach(a=>{ if(el.hasAttribute(a)) traduzAttr(el, a); }));
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  for(let n=w.nextNode(); n; n=w.nextNode()) traduzNo(n);
}
const observador = new MutationObserver(regs=>{
  for(const r of regs){
    if(r.type==='characterData') traduzNo(r.target);
    else if(r.type==='attributes') traduzAttr(r.target, r.attributeName);
    else r.addedNodes.forEach(traduzArvore);
  }
});

// ---------- Troca de idioma ----------
function montarBandeiras(){
  $('#langs').innerHTML = Object.entries(IDIOMAS).map(([k,L])=>
    `<button type="button" data-lang="${k}" class="${k===state.lang?'on':''}" title="${L.nome}" aria-label="${L.nome}" translate="no"><img src="${L.bandeira}" alt="" width="30" height="20"></button>`).join('');
}
$('#langs').addEventListener('click', e=>{ const b=e.target.closest('[data-lang]'); if(b) setLang(b.dataset.lang); });

function setLang(l){
  if(!IDIOMAS[l]) return;
  state.lang = l; store.set('lang', l);
  if(store.get('names', null)==null){ state.names = l==='en' ? 'en' : 'pt'; $('#namesSel').value = state.names; }
  aplicarIdioma();
  rerenderTextos(); // partes desenhadas pelo código (nomes de notas, lições, listas)
}
function aplicarIdioma(){
  document.documentElement.lang = IDIOMAS[state.lang].html;
  document.title = t('BanDoly: aprenda a tocar bandoneon online e grátis');
  montarBandeiras();
  traduzArvore(document.body);
}
