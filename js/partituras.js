/* ================== Academia · Minhas músicas (as partituras importadas) ================== */
// O usuário importa uma partitura (MusicXML ou MIDI) e ela vira um exercício do nível 7 da
// Academia. A transcrição usa o mesmo caminho das melodias: a partitura vira o formato de texto
// (melodyFromScore, em musicxml.js), e fingerMelody escolhe o botão e a direção do fole de cada
// nota. Pausas e durações vêm da partitura. As partituras ficam salvas neste navegador
// (store 'acadPartituras': [{id, titulo, desc, texto}]).

/* ---------- MIDI ---------- */
// Lê um arquivo MIDI (formato 0 ou 1) e devolve o mesmo formato de parseMusicXML:
// {title, tempo, parts:[{name, notes:[{start, dur, midi, staff}], measures, staves}]}.
// MIDI não tem pautas: notas a partir do Dó central vão para a pauta 1 e as mais graves para a
// pauta 2, o que permite escolher "Duas mãos". Os tempos são arredondados para semicolcheias.
function parseMidi(buf){
  const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  const MTHD = 0x4d546864, MTRK = 0x4d54726b; // "MThd" e "MTrk": início do arquivo e de cada faixa
  if(u.length < 14 || dv.getUint32(0)!==MTHD) throw new Error(t('Isso não parece um arquivo MIDI.'));
  const ntr = dv.getUint16(10), div = dv.getUint16(12);
  if(div & 0x8000) throw new Error(t('MIDI com tempo em SMPTE não é suportado.'));
  let p = 8 + dv.getUint32(4), tempo = null, num = 4, den = 4, title = null;
  const faixas = [], q16 = x => Math.round(x / div * 4) / 4; // ticks → tempos, em semicolcheias
  for(let k=0; k<ntr && p+8<=u.length; k++){
    if(dv.getUint32(p)!==MTRK) break;
    let q = p + 8; const fim = Math.min(u.length, q + dv.getUint32(p+4)); p = fim;
    let tick = 0, corrente = 0, nome = null; const ligadas = {}, notas = [];
    const vlq = () => { let v = 0, b; do { b = u[q++]; v = (v<<7) | (b & 0x7f); } while(b & 0x80 && q<fim); return v; };
    while(q < fim){
      tick += vlq();
      let st = u[q];
      if(st & 0x80){ q++; if(st < 0xf0) corrente = st; } else st = corrente; // "running status"
      if(st===0xff){
        const tipo = u[q++], l = vlq(), d = u.subarray(q, q+l); q += l;
        if(tipo===0x51 && tempo==null && l>=3) tempo = Math.round(60000000 / ((d[0]<<16) | (d[1]<<8) | d[2]));
        else if(tipo===0x58 && tick===0 && l>=2){ num = d[0]; den = 2 ** d[1]; }
        else if(tipo===0x03) nome = new TextDecoder().decode(d).trim();
        else if(tipo===0x2f) break;
        continue;
      }
      if(st===0xf0 || st===0xf7){ q += vlq(); continue; }
      const hi = st & 0xf0, canal = st & 0x0f, a = u[q++], b = (hi===0xc0 || hi===0xd0) ? 0 : u[q++];
      if(canal===9) continue; // canal 10: percussão
      const chave = canal*128 + a;
      if(hi===0x90 && b>0) (ligadas[chave] = ligadas[chave] || []).push(tick);
      else if(hi===0x80 || (hi===0x90 && b===0)){
        const ini = ligadas[chave] && ligadas[chave].shift();
        if(ini!=null) notas.push({ini, fim:tick, midi:a, canal});
      }
    }
    if(k===0 && nome) title = nome;
    // uma parte por canal usado na faixa
    for(const c of [...new Set(notas.map(n=>n.canal))]){
      const ns = notas.filter(n=>n.canal===c).map(n=>{
        const start = q16(n.ini); return {start, dur:Math.max(0.25, q16(n.fim) - start), midi:n.midi};
      }).filter(n=>n.dur>0);
      if(ns.length) faixas.push({nome:nome, canal:c, notes:ns});
    }
  }
  if(!faixas.length) throw new Error(t('Nenhuma nota encontrada no arquivo MIDI.'));
  const porCompasso = num * 4 / den;
  const parts = faixas.map((f,i)=>{
    const fimMusica = Math.max(...f.notes.map(n=>n.start+n.dur)), measures = [];
    for(let x=0; x < fimMusica + 1e-6; x += porCompasso) measures.push(x);
    measures.push(measures[measures.length-1] + porCompasso);
    const notes = f.notes.map(n=>({...n, staff: n.midi>=60 ? 1 : 2}));
    const duasPautas = notes.some(n=>n.staff===1) && notes.some(n=>n.staff===2);
    if(!duasPautas) notes.forEach(n=>n.staff = 1);
    const nome = (f.nome || t('Faixa {}', i+1)) + (faixas.filter(g=>g.nome===f.nome).length>1 ? ` (${t('canal {}', f.canal+1)})` : '');
    return {name:nome, notes, measures, staves: duasPautas ? 2 : 1, midi:true};
  });
  return {title: title || t('Partitura importada'), tempo, parts};
}

/* ---------- Guardar e remover ---------- */
// Confere a transcrição: quantas notas e quantas ficaram fora da extensão do bandoneon
function estatisticasTexto(texto){
  const m = parseMelody(texto); buildTimeline(m); fingerMelody(m);
  const notas = m.notes.filter(n=>!n.rest);
  return {notas: notas.length, fora: notas.filter(n=>n.error || !n.btn).length};
}
function salvarPartitura(titulo, texto, origem){
  const est = estatisticasTexto(texto);
  if(!est.notas) throw new Error(t('Nenhuma nota encontrada na partitura.'));
  const id = 'p-' + Date.now().toString(36);
  const desc = t('{} notas · {}', est.notas, origem);
  store.set('acadPartituras', [...minhasPartituras(), {id, titulo, desc, texto}]);
  carregarExercicio(id);
  return est;
}
function removerPartitura(id){
  const p = minhasMusicas().find(x=>x.id===id); if(!p) return;
  if(!confirm(t('Remover "{}" das suas músicas?', p.titulo))) return;
  if(p.origem==='melodia'){ store.set('melodies', customMelodies().filter(x=>x.id!==id)); delete state.progress.melodies[id]; }
  else store.set('acadPartituras', minhasPartituras().filter(x=>x.id!==id));
  delete state.progress.academia[id]; saveProgress();
  if(acad.ex && acad.ex.id===id){
    const resto = minhasMusicas();
    carregarExercicio(resto.length ? resto[0].id : 'n1-direita');
  }
  acad.nivel = 7; store.set('acadNivel', 7); renderAcadNiveis(); renderAcadLista(); renderMelList();
}

/* ---------- Importar ---------- */
let acScore = null, acArquivo = '';
function acMsg(txt, cls=''){ const m = $('#acImpMsg'); m.className = 'feedback ' + cls; m.textContent = txt; }
async function lerPartitura(arquivo){
  const buf = await arquivo.arrayBuffer(), u8 = new Uint8Array(buf);
  if(u8[0]===0x4d && u8[1]===0x54 && u8[2]===0x68 && u8[3]===0x64) return parseMidi(buf);   // "MThd"
  const texto = (u8[0]===0x50 && u8[1]===0x4b) ? await unzipMxl(buf) : new TextDecoder().decode(u8); // .mxl é um ZIP
  return parseMusicXML(texto);
}
$('#acImportar').onclick = () => {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.mxl,.musicxml,.xml,.mid,.midi';
  i.onchange = async () => {
    const f = i.files[0]; if(!f) return;
    acMsg('');
    try { acScore = await lerPartitura(f); acArquivo = f.name; }
    catch(e){ acScore = null; $('#acImp').hidden = true; acMsg(`${f.name}: ${e.message}`, 'bad'); return; }
    $('#acImp').hidden = false;
    $('#acImpInfo').innerHTML = `<b>${escHtml(acScore.title)}</b> · ${escHtml(f.name)}${acScore.tempo ? ` · ${acScore.tempo} BPM` : ''}`;
    const juntas = juntarDuasPartes(acScore);
    $('#acImpParte').innerHTML = acScore.parts.map((p,k)=>`<option value="${k}">${escHtml(p.name)}${p.juntas ? '' : ` (${t('{} notas', p.notes.length)})`}</option>`).join('');
    // MIDI com melodia e baixo em faixas separadas: começa com as duas mãos
    $('#acImpParte').value = String(juntas!=null && acScore.parts[0].midi ? juntas : Math.max(0, acScore.parts.findIndex(p=>p.notes.length)));
    acPautas();
  };
  i.click();
};
// Com duas ou mais partes (ex.: MIDI com melodia e baixo em faixas separadas), acrescenta uma
// opção que junta duas delas: a mais aguda na mão direita e a mais grave na esquerda.
function juntarDuasPartes(score){
  const com = score.parts.filter(p=>p.notes.length && !p.juntas);
  if(com.length < 2) return null;
  const media = p => p.notes.reduce((s,n)=>s+n.midi, 0) / p.notes.length;
  const [a, b] = com.slice(0, 2).sort((x,y)=>media(y)-media(x)); // a = mais aguda
  score.parts.push({name: t('Duas mãos: {} → direita, {} → esquerda', a.name, b.name), juntas:true, staves:2, midi:a.midi,
    notes: [...a.notes.map(n=>({...n, staff:1})), ...b.notes.map(n=>({...n, staff:2}))],
    measures: a.measures.length >= b.measures.length ? a.measures : b.measures});
  return score.parts.length - 1;
}
// Opções de pauta da parte escolhida (mesma lógica do importador de Melodias)
function acPautas(){
  const p = acScore.parts[+$('#acImpParte').value], ops = [];
  if(p.juntas){ $('#acImpPauta').innerHTML = `<option value="hands">${t('Duas mãos')}</option>`; acPautaPadrao(); return; }
  const nomePauta = k => p.staves<2 ? '' : p.midi ? (k===1 ? t('notas agudas (a partir do Dó central)') : t('notas graves')) : (k===1 ? t('superior') : k===p.staves ? t('inferior') : '');
  for(let k=1; k<=p.staves; k++){ const n = nomePauta(k); ops.push(`<option value="${k}">${k}${n ? ` (${n})` : ''}</option>`); }
  if(p.staves>1){
    ops.push(`<option value="hands">${t('Duas mãos (de cima → direita, de baixo → esquerda)')}</option>`);
    ops.push(`<option value="all">${t('Todas numa mão só')}</option>`);
  }
  $('#acImpPauta').innerHTML = ops.join('');
  if(p.midi && p.staves>1) $('#acImpPauta').value = 'all'; // MIDI: a separação no Dó central é só uma sugestão
  acPautaPadrao();
}
function acPautaPadrao(){
  const st = $('#acImpPauta').value, p = acScore.parts[+$('#acImpParte').value];
  const grave = p.staves>1 && st===String(p.staves);
  $('#acImpMao').value = grave ? 'left' : 'right'; $('#acImpLinha').value = grave ? 'low' : 'high';
  $('#acImpMao').disabled = $('#acImpLinha').disabled = st==='hands';
}
$('#acImpParte').onchange = acPautas;
$('#acImpPauta').onchange = acPautaPadrao;
$('#acImpCancelar').onclick = () => { $('#acImp').hidden = true; acScore = null; acMsg(''); };
$('#acImpGo').onclick = () => {
  try {
    const r = melodyFromScore(acScore, {part:+$('#acImpParte').value, staff:$('#acImpPauta').value,
      pick:$('#acImpLinha').value, hand:$('#acImpMao').value, fitOctave:$('#acImpOitava').checked});
    const est = salvarPartitura(acScore.title, r.text, acArquivo);
    $('#acImp').hidden = true; acScore = null;
    acMsg(t('{} notas transcritas para os botões.', est.notas)
      + (r.shift ? ' ' + t('A música foi deslocada {} oitava(s) para caber na mão.', (r.shift>0?'+':'') + r.shift/12) : '')
      + (est.fora ? ' ' + t('{} notas ficaram fora da extensão do bandoneon e serão puladas.', est.fora) : '')
      + ' ' + t('Veja a transcrição ou comece no modo Aprender.'), est.fora ? '' : 'ok');
    abrirTranscricao(true);
  } catch(e){ acMsg(e.message, 'bad'); }
};
// (As melodias de Melodias já aparecem aqui sozinhas: veja minhasMusicas em js/academia.js)

/* ---------- Transcrição: cada nota com o seu botão ---------- */
// Tabela com todas as notas e pausas do exercício: início, nota, mão, fole e duração.
// Clicar numa nota acende o botão no teclado.
let transcricaoNotas = [];
function acadTranscricao(){
  const box = $('#acTranscricao'); if(!box || box.hidden || !acad.ex) return;
  if(acad.ex.gerar){ box.innerHTML = `<p class="muted">${t('Este exercício é sorteado a cada rodada, então não tem uma transcrição fixa.')}</p>`; return; }
  const m = parseMelody(acad.ex.texto); buildTimeline(m); fingerMelody(m);
  transcricaoNotas = m.notes.slice().sort((a,b)=>a.t-b.t || (a.hand===b.hand ? 0 : a.hand==='right' ? -1 : 1));
  const tempo = x => +(x+1).toFixed(2), dur = b => t('{} tempo(s)', +b.toFixed(2));
  const linhas = transcricaoNotas.map((n,i)=>{
    const mao = t(n.hand==='left' ? 'Esquerda' : 'Direita');
    if(n.rest) return `<tr class="pausa"><td>${tempo(n.t)}</td><td>${t('Pausa')}</td><td>${mao}</td><td>–</td><td>${dur(n.beats)}</td></tr>`;
    if(n.error || !n.btn) return `<tr class="fora"><td>${tempo(n.t)}</td><td>${noteName(n.midi)}</td><td>${mao}</td><td colspan="2">${t('fora da extensão: será pulada')}</td></tr>`;
    return `<tr data-i="${i}" tabindex="0"><td>${tempo(n.t)}</td><td><b>${noteName(n.midi)}</b></td><td>${mao}</td>`
      + `<td><span class="dirpill ${n.dir}">${dirLabel(n.dir)}</span></td><td>${dur(n.beats)}</td></tr>`;
  }).join('');
  box.innerHTML = `<h3>${t('Transcrição para o bandoneon')}</h3>`
    + `<p class="muted">${t('Cada nota com a mão, a direção do fole e a duração. Clique numa nota para ver o botão no teclado.')}</p>`
    + `<div class="ac-tab-wrap"><table class="ac-tab"><thead><tr><th>${t('Início (tempo)')}</th><th>${t('Nota')}</th><th>${t('Mão')}</th><th>${t('Fole')}</th><th>${t('Duração')}</th></tr></thead><tbody>${linhas}</tbody></table></div>`;
}
function mostrarBotaoDaNota(tr){
  const n = transcricaoNotas[+tr.dataset.i]; if(!n || !n.btn) return;
  $$('#acTranscricao tr.on').forEach(x=>x.classList.remove('on')); tr.classList.add('on');
  akL.clearMarks(); akR.clearMarks();
  if(acad.dir!==n.dir) acadSetDir(n.dir); // mostra o botão na direção certa do fole
  akOf(n.hand).mark(n.btn.id, 'guia', 0);
}
$('#acTranscricao').addEventListener('click', e=>{ const tr = e.target.closest('tr[data-i]'); if(tr) mostrarBotaoDaNota(tr); });
// teclado: Enter ou Espaço numa linha da tabela
$('#acTranscricao').addEventListener('keydown', e=>{ const tr = e.target.closest('tr[data-i]'); if(tr && (e.keyCode===13 || e.keyCode===32)){ e.preventDefault(); e.stopPropagation(); mostrarBotaoDaNota(tr); } });
function abrirTranscricao(abrir){
  $('#acTranscricao').hidden = !abrir; $('#acTranscricaoBtn').setAttribute('aria-expanded', abrir);
  acadTranscricao();
}
$('#acTranscricaoBtn').onclick = () => abrirTranscricao($('#acTranscricao').hidden);


renderAcadLista();
