/* ================== Posicionamento das mãos ================== */
// Desenho esquemático das duas mãos (vistas pelo dorso), usado pelo instrutor da Academia.
// No bandoneon os botões são tocados pelos dedos 2 a 5. Os polegares não tocam botões: o
// direito fica na alavanca da válvula de ar e o esquerdo apoiado na caixa. Por isso o polegar
// aparece separado e apagado.
// Dedos: 1 polegar, 2 indicador, 3 médio, 4 anelar, 5 mínimo (a numeração pode ser trocada em DEDOS).
const DEDOS = {1:'Polegar', 2:'Indicador', 3:'Médio', 4:'Anelar', 5:'Mínimo'};
const FUNCAO_POLEGAR = {right:'válvula de ar', left:'apoio na caixa'};

// Desenha uma mão. lado = 'left' | 'right'. A esquerda é o espelho da direita.
function maoSVG(lado){
  const W = 120, x = v => lado==='left' ? W - v : v;
  // [dedo, x do centro, comprimento]
  const dedos = [[2,38,48],[3,54,54],[4,70,50],[5,85,40]];
  let s = `<svg class="mao" viewBox="0 0 ${W} 140" role="img" aria-label="${t(lado==='left'?'Mão esquerda':'Mão direita')}">`;
  s += `<rect class="palma" x="${lado==='left'?W-95:25}" y="62" width="70" height="60" rx="20"/>`;
  for(const [d, cx, len] of dedos){
    s += `<g class="dedo" data-dedo="${d}"><rect x="${x(cx)-7}" y="${66-len}" width="14" height="${len+6}" rx="7"/>`
       + `<text x="${x(cx)}" y="${60-len+18}">${d}</text></g>`;
  }
  // polegar: fora do teclado, com a função escrita embaixo
  s += `<g class="dedo polegar" data-dedo="1"><rect x="${x(6)-(lado==='left'?18:0)}" y="84" width="18" height="34" rx="9" transform="rotate(${lado==='left'?25:-25} ${x(15)} 100)"/>`
     + `<text x="${x(15)}" y="104">1</text></g>`;
  s += `<text class="legenda" x="${W/2}" y="136">${t('1 = {}', t(FUNCAO_POLEGAR[lado]))}</text></svg>`;
  return s;
}

// Componente com as duas mãos. destacar() recebe, para cada mão, o dedo atual e o próximo
// (null = dedo ainda não definido; a mão inteira fica acesa).
const maos = {
  el: null,
  montar(el){
    this.el = el;
    el.innerHTML = ['left','right'].map(l=>`<figure class="mao-box" data-mao="${l}">${maoSVG(l)}<figcaption>${t(l==='left'?'Mão esquerda':'Mão direita')}</figcaption></figure>`).join('');
  },
  destacar(info){
    if(!this.el) return;
    for(const lado of ['left','right']){
      const box = this.el.querySelector(`[data-mao="${lado}"]`), i = info[lado] || {};
      box.classList.toggle('ativa', !!i.ativa);
      box.classList.toggle('sem-dedo', !!i.ativa && i.atual==null);
      box.classList.toggle('proxima', !i.ativa && !!i.proximaMao);
      box.querySelectorAll('.dedo').forEach(g=>{
        const d = +g.dataset.dedo;
        g.classList.toggle('atual', i.atual===d);
        g.classList.toggle('proximo', i.proximo===d && i.atual!==d);
      });
    }
  },
};
