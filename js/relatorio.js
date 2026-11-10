/* ================== Relatórios recebidos (Professores → Relatórios) ==================
   O aluno manda um link (#relatorio=…) com o nome que digitou e o resultado de cada exercício. O professor abre
   e vê aqui a nota, as notas certas, o ritmo, o fole e o mapa nota a nota. Tudo vem dentro do link; os relatórios
   abertos ficam guardados só neste aparelho (store 'relatorios', que não vai para a conta).
   O que vem no link é de fora: limparRel só deixa passar números dentro da faixa, textos curtos e o mapa. */
const REL_MAX = 40;
const relatoriosGuardados = () => store.get('relatorios', []);
function limparRel(r){
  const num = (x, a, b) => Math.max(a, Math.min(b, Math.round(+x) || 0));
  const n = num(r.n, 1, 2000);
  return {ex:String(r.ex||'').slice(0, 40), tit:String(r.tit||'').slice(0, 80), niv:num(r.niv, 1, 7), modo:MODOS[r.modo] ? r.modo : 'praticar',
    vel:num(r.vel, 40, 120), de:num(r.de, 1, 5000), n, ok:num(r.ok, 0, n), ri:r.ri==null ? null : num(r.ri, 0, 100),
    fo:Array.isArray(r.fo) ? [num(r.fo[0], 0, 5000), num(r.fo[1], 1, 5000)] : null, seg:num(r.seg, 0, 86400), nota:num(r.nota, 0, 100),
    vz:num(r.vz||1, 1, 999), notas:String(r.notas||'').replace(/[^10fp]/g, '').slice(0, 2000), rec:String(r.rec||'').slice(0, 300)};
}
function lerRelatorio(codigo){
  const d = JSON.parse(b64url.de(codigo));
  if(!d || !Array.isArray(d.itens) || !d.itens.length) throw new Error('vazio');
  return {aluno:String(d.aluno||'').slice(0, 40), prof:String(d.prof||'').slice(0, 40),
    data:/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(d.data||'') ? d.data : '', itens:d.itens.slice(0, 8).map(limparRel)};
}
let relAberto = 0, relExemplo = false;
function abrirRelatorio(codigo){
  let rel; try{ rel = lerRelatorio(codigo); }catch(e){ avisar(`<span>${t('Este link de relatório está incompleto ou foi copiado pela metade.')}</span>`); return; }
  const chave = JSON.stringify(rel), lista = relatoriosGuardados().filter(x=>JSON.stringify(x)!==chave);
  lista.unshift(rel); store.set('relatorios', lista.slice(0, REL_MAX));
  history.replaceState(null, '', location.pathname + location.search); // recarregar a página não guarda de novo
  relAberto = 0; relExemplo = false; go('relatorios');
}

/* ---------- Desenho de um relatório (também usado nas turmas) ---------- */
const tituloRel = r => { const e = exercicioPorId(r.ex); return r.tit || (e ? t(e.titulo) : t('Exercício')); };
const mediaRel = rel => Math.round(rel.itens.reduce((a, r)=>a + r.nota, 0) / rel.itens.length);
const dataRel = iso => iso ? new Date(iso + 'Z').toLocaleString(IDIOMAS[state.lang].html, {dateStyle:'short', timeStyle:'short'}) : '';
const ESTADO_NOTA = {'1':'certa', '0':'nota errada', f:'fole errado', p:'não tocada'};
function itemRelHTML(r){
  const medida = (rotulo, valor, pct) => `<div class="rel-medida"><span>${rotulo}</span><b>${valor}</b><i class="rel-barra"><i style="width:${pct==null ? 0 : pct}%"></i></i></div>`;
  const erradas = [...r.notas].map((c, i)=>c!=='1' ? i + r.de : 0).filter(Boolean);
  const mapa = [...r.notas].map((c, i)=>`<i class="n-${c}" title="${t('Nota {}: {}', i + r.de, t(ESTADO_NOTA[c]))}">${(i + r.de) % 5 === 0 ? i + r.de : ''}</i>`).join('');
  const tem = c => r.notas.includes(c);
  return `<article class="rel-item">
    <div class="rel-item-cab"><div><span class="muted">${t('Nível {}', r.niv)} · ${t('Modo {}', t(MODOS[r.modo]))} · ${r.vel}%</span><h4>${escHtml(tituloRel(r))}</h4></div>
      <div class="rel-nota"><b>${r.nota}</b><span>%</span></div></div>
    <div class="rel-medidas">
      ${medida(t('Notas certas'), t('{} de {}', r.ok, r.n), Math.round(100 * r.ok / r.n))}
      ${medida(t('Ritmo'), r.ri==null ? t('não medido neste modo') : t('{}% no tempo', r.ri), r.ri)}
      ${medida(t('Direção do fole'), r.fo ? t('{} de {}', r.fo[0], r.fo[1]) : t('não avaliada'), r.fo ? Math.round(100 * r.fo[0] / r.fo[1]) : null)}
    </div>
    ${r.notas ? `<div class="rel-mapa" role="img" aria-label="${t('Mapa das notas, da primeira à última')}">${mapa}</div>
    <p class="rel-legenda"><span><i class="n-1"></i>${t('certa')}</span>${tem('0') ? `<span><i class="n-0"></i>${t('nota errada')}</span>` : ''}${tem('f') ? `<span><i class="n-f"></i>${t('fole errado')}</span>` : ''}${tem('p') ? `<span><i class="n-p"></i>${t('não tocada')}</span>` : ''}</p>` : ''}
    <ul class="rel-fatos"><li>${t('Tempo: {}', `${Math.floor(r.seg / 60)}:${String(r.seg % 60).padStart(2, '0')}`)}</li><li>${t('Tentativas: {}', r.vz)}</li>
      <li>${erradas.length ? t('Para revisar: notas {}', faixas(erradas)) : t('Nenhuma nota para revisar')}</li></ul>
    ${r.rec ? `<p class="ac-rec"><b>${t('O que o app recomendou ao aluno:')}</b> <span translate="no">${escHtml(r.rec)}</span></p>` : ''}
    ${exercicioPorId(r.ex) && !r.tit ? `<div class="row"><button type="button" class="btn sec" data-rel-ex="${escHtml(r.ex)}">${t('Mandar este exercício de novo')}</button></div>` : ''}
  </article>`;
}
function relatorioHTML(rel){
  const quem = rel.aluno || t('Aluno sem nome');
  return `<div class="rel-cab"><span class="conta-av peq" aria-hidden="true">${escHtml(quem.charAt(0).toUpperCase())}</span>
    <div><h3>${t('Relatório de {}', escHtml(quem))}</h3><p class="muted">${[dataRel(rel.data), rel.prof ? t('Tarefa de {}', escHtml(rel.prof)) : '', rel.itens.length>1 ? t('{} exercícios', rel.itens.length) : ''].filter(Boolean).join(' · ')}</p></div></div>
    ${rel.itens.map(itemRelHTML).join('')}`;
}

/* ---------- A tela ---------- */
// Um relatório inventado, só para o professor ver como é antes de receber o primeiro
const REL_EXEMPLO = {aluno:'Ana', prof:'', data:'', itens:[
  {ex:'n3-escada', tit:'', niv:3, modo:'desafio', vel:70, de:1, n:16, ok:13, ri:77, fo:[15, 16], seg:74, nota:79, vz:3, notas:'1111101111f11p11', rec:''}]};
function renderRelatorios(){
  const lista = relatoriosGuardados(); relAberto = Math.min(relAberto, Math.max(0, lista.length - 1));
  $('#relLista').innerHTML = lista.map((rel, i)=>`<li class="${i===relAberto && !relExemplo ? 'on' : ''}"><button type="button" data-rel="${i}">
      <span class="conta-av peq" aria-hidden="true">${escHtml((rel.aluno || '?').charAt(0).toUpperCase())}</span>
      <span class="rel-li-txt"><b translate="no">${escHtml(rel.aluno || t('Aluno sem nome'))}</b><small>${escHtml(rel.itens.length>1 ? t('{} exercícios', rel.itens.length) : tituloRel(rel.itens[0]))} · ${dataRel(rel.data)}</small></span>
      <span class="rel-li-nota">${mediaRel(rel)}%</span></button>
      <button type="button" class="pr-tirar" data-rel-apagar="${i}" aria-label="${t('Apagar este relatório')}"><svg aria-hidden="true"><use href="#i-x"/></svg></button></li>`).join('');
  $('#relVazio').hidden = lista.length > 0; $('#relListaBox').hidden = !lista.length;
  const rel = relExemplo ? REL_EXEMPLO : lista[relAberto];
  $('#relDetalhe').hidden = !rel;
  $('#relDetalhe').innerHTML = rel ? (relExemplo ? `<p class="rel-aviso-exemplo">${t('Exemplo: os números abaixo são inventados, só para mostrar como é um relatório.')}</p>` : '') + relatorioHTML(rel) : '';
}
$('#relLista').addEventListener('click', e=>{
  const ap = e.target.closest('[data-rel-apagar]');
  if(ap){ const l = relatoriosGuardados(); l.splice(+ap.dataset.relApagar, 1); store.set('relatorios', l); relAberto = 0; renderRelatorios(); return; }
  const b = e.target.closest('[data-rel]'); if(b){ relAberto = +b.dataset.rel; relExemplo = false; renderRelatorios(); $('#relDetalhe').scrollIntoView({block:'nearest', behavior: movReduzido() ? 'auto' : 'smooth'}); }
});
$('#relVerExemplo').onclick = ()=>{ relExemplo = true; renderRelatorios(); };
// "Mandar este exercício de novo": abre Mandar tarefa com o exercício já escolhido
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-rel-ex]'); if(!b) return;
  go('professor'); $('#prEx').value = b.dataset.relEx; $('#prEx').onchange(); $('#prExs .on') && $('#prExs .on').scrollIntoView({block:'nearest'});
});
ganchosAba.push(v=>{ if(v==='relatorios'){ if(relatoriosGuardados().length) relExemplo = false; renderRelatorios(); } });
