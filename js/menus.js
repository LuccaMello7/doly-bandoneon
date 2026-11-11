/* ================== Menus: botões lado a lado e resumo durante a prática ==================
   O mesmo jeito de escolher do Encontre a nota, usado em Melodias, Acordes e Teclado.
   segmentar(select): troca um <select> curto por botões lado a lado (controle segmentado). O <select> continua no
   lugar, escondido, e é ele que o resto do app lê e escuta: o botão só muda o valor e avisa com 'change'. Se as opções
   mudam (troca de idioma, de nomes das notas) os botões se refazem; se o código muda o valor, o botão aceso acompanha.
   menuChips(lista): monta os chips da barra de resumo que aparece no lugar do menu enquanto a música ou o treino rodam. */
const MENU_ENT = {38:'&amp;', 60:'&lt;', 62:'&gt;', 34:'&quot;'}; // & < > e aspas duplas, pelo código do caractere
const menuEsc = s => String(s).replace(/[&<>\x22]/g, c=>MENU_ENT[c.charCodeAt(0)]);
const VALOR_SELECT = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
function segmentar(sel, {rotulo=o=>menuEsc(o.textContent.trim()), classe=''}={}){
  if(!sel || sel.dataset.segmentado) return;
  sel.dataset.segmentado = '1'; sel.classList.add('menu-fonte'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
  const grupo = document.createElement('div');
  grupo.className = ('menu-seg ' + classe).trim(); grupo.setAttribute('role', 'radiogroup');
  const rot = sel.getAttribute('aria-label') || (sel.closest('.menu-grupo') && sel.closest('.menu-grupo').querySelector('.menu-rot') || {}).textContent;
  if(rot) grupo.setAttribute('aria-label', rot.trim());
  const marcar = ()=>grupo.querySelectorAll('[data-v]').forEach(b=>{
    const on = b.dataset.v===VALOR_SELECT.get.call(sel); b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
  });
  const desenhar = ()=>{
    grupo.innerHTML = [...sel.options].map(o=>`<button type="button" role="radio" data-v="${menuEsc(o.value)}" title="${menuEsc(o.textContent.trim())}">${rotulo(o)}</button>`).join('');
    marcar();
  };
  grupo.addEventListener('click', e=>{
    const b = e.target.closest('[data-v]'); if(!b || sel.disabled) return;
    if(VALOR_SELECT.get.call(sel)!==b.dataset.v){ VALOR_SELECT.set.call(sel, b.dataset.v); sel.dispatchEvent(new Event('change', {bubbles:true})); }
    marcar();
  });
  sel.addEventListener('change', marcar);
  // o código que muda o valor direto (sel.value = …) também acende o botão certo
  Object.defineProperty(sel, 'value', {configurable:true, get(){ return VALOR_SELECT.get.call(this); }, set(v){ VALOR_SELECT.set.call(this, v); marcar(); }});
  new MutationObserver(desenhar).observe(sel, {childList:true, subtree:true, characterData:true});
  sel.after(grupo); desenhar();
  return grupo;
}
// Bolinhas da direção do fole dentro dos botões (azul = abrindo, laranja = fechando)
const rotuloFole = o => `<i class="menu-ponto ${menuEsc(o.value)}" aria-hidden="true"></i>${menuEsc(o.textContent.trim())}`;
// "Menor (m)" vira o símbolo grande e o nome pequeno embaixo
const rotuloSimbolo = o => {
  const txt = o.textContent.trim(), m = txt.match(/^(.*?)\s*\(([^)]+)\)$/);
  return m ? `<b>${menuEsc(m[2])}</b><small>${menuEsc(m[1])}</small>` : `<b>${menuEsc(txt)}</b>`;
};
function menuChips(lista){
  return lista.filter(Boolean).map(([rot, valor])=>`<span class="menu-chip"><small>${menuEsc(rot)}</small>${menuEsc(valor)}</span>`).join('');
}
