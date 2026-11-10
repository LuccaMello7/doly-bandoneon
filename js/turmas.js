/* ================== Turmas (Professores → Turmas) ==================
   Um professor com conta cria uma turma e manda o link de convite (#turma=CÓDIGO). O aluno, também com conta
   (só maiores de 18 anos), aceita o convite escolhendo o nome que o professor vai ver. Daí em diante:
   - o professor manda a tarefa montada em "Mandar tarefa" para a turma inteira;
   - o aluno a recebe ao sincronizar e, enquanto estiver na turma, o professor vê o nome escolhido, os dias de
     prática e o resultado dos exercícios da tarefa (o "resumo"). Nada mais: nem e-mail, nem o resto do progresso.
   Banco: supabase/turmas.sql (tabelas turmas e turma_alunos, com regras de acesso por linha).
   O banco foi criado e testado pelo dono com duas contas em 2026-11-10: a aba está no menu. */
const TURMAS_LIGADAS = true;
let turmasProf = [], turmaAlunosProf = [], turmaAberta = null, turmasAluno = [], turmasErro = '';
const turmaLink = codigo => baseDoApp() + '#turma=' + codigo;
const usaTurmas = () => TURMAS_LIGADAS || store.get('turmasUso', false);

/* ---------- Aluno: o resumo que o professor vê ---------- */
function resumoParaTurma(turmaId){
  const dias = Object.keys(state.progress.days || {}).sort(), tf = tarefaGuardada();
  return {v:1, dias:dias.slice(-30), totalDias:dias.length,
    tarefa: tf && tf.turma===turmaId ? {em:tf.em, itens:tf.itens.map(x=>({ex:x.ex, feito:!!x.feito, vz:x.vz||0, rel:x.rel||null}))} : null};
}
// Chamada depois de cada sincronização da conta (js/conta.js): recebe a tarefa nova da turma e envia o resumo
async function sincronizarTurmas(){
  if(!sb || !contaUsuario || !usaTurmas()) return;
  const m = await sb.from('turma_alunos').select('turma_id,nome').eq('aluno_id', contaUsuario.id);
  if(m.error){ turmasErro = m.error.message || 'erro'; return; }
  if(!m.data.length){ turmasAluno = []; renderTurmasAluno(); return; }
  const tu = await sb.from('turmas').select('id,nome,professor_nome,tarefa,tarefa_em').in('id', m.data.map(x=>x.turma_id));
  if(tu.error) return;
  turmasAluno = tu.data.map(x=>({...x, meuNome:(m.data.find(y=>y.turma_id===x.id) || {}).nome || ''}));
  const vistas = store.get('turmaTarefaVista', {});
  for(const x of turmasAluno){ // tarefa nova da turma: entra no lugar da atual (uma dispensada não volta)
    if(x.tarefa && x.tarefa_em && x.tarefa_em > (vistas[x.id] || '')){
      vistas[x.id] = x.tarefa_em; store.set('turmaTarefaVista', vistas);
      if(receberTarefa(x.tarefa, {turma:x.id, em:x.tarefa_em})){ renderTarefa(); avisar(`<span>${t('Nova tarefa da turma {}.', escHtml(x.nome))}</span>`); }
    }
  }
  for(const x of turmasAluno) await sb.from('turma_alunos').update({resumo:resumoParaTurma(x.id), atualizado:new Date().toISOString()}).eq('turma_id', x.id).eq('aluno_id', contaUsuario.id);
  renderTurmasAluno();
}
function renderTurmasAluno(){
  const box = $('#contaTurmas'); box.hidden = !turmasAluno.length;
  $('#contaTurmasLista').innerHTML = turmasAluno.map(x=>`<div class="conta-linha"><div><b translate="no">${escHtml(x.nome)}</b><span>${x.professor_nome ? t('Professor(a): {}', escHtml(x.professor_nome)) + ' · ' : ''}${t('você aparece como {}', escHtml(x.meuNome))}</span></div>
    <button type="button" class="btn sec" data-turma-sair="${x.id}">${t('Sair da turma')}</button></div>`).join('');
}
$('#contaTurmasLista').addEventListener('click', async e=>{
  const b = e.target.closest('[data-turma-sair]'); if(!b || !sb || !contaUsuario) return;
  if(!confirm(t('Sair desta turma? O professor deixa de ver o seu nome, os seus dias de prática e os seus resultados.'))) return;
  const r = await sb.from('turma_alunos').delete().eq('turma_id', b.dataset.turmaSair).eq('aluno_id', contaUsuario.id);
  if(r.error){ avisar(`<span>${t('Não deu para sair agora. Confira a internet e tente de novo.')}</span>`); return; }
  const tf = tarefaGuardada(); if(tf && tf.turma===b.dataset.turmaSair){ delete tf.turma; delete tf.em; guardarTarefa(tf); }
  turmasAluno = turmasAluno.filter(x=>x.id!==b.dataset.turmaSair); renderTurmasAluno();
  avisar(`<span>${t('Você saiu da turma.')}</span>`);
});

/* ---------- Aluno: aceitar o convite (#turma=CÓDIGO) ---------- */
function abrirConviteTurma(codigo){
  codigo = String(codigo).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16); if(!codigo) return;
  store.set('turmaConvite', codigo);
  history.replaceState(null, '', location.pathname + location.search);
  contaPronta.then(conviteTurmaPendente);
}
async function conviteTurmaPendente(){
  const codigo = store.get('turmaConvite', ''); if(!codigo) return;
  if(!contaUsuario){ go('conta'); contaMsg(t('Entre na conta para participar da turma. Depois de entrar, o convite abre sozinho.')); return; }
  const r = await sb.rpc('ver_turma', {p_codigo:codigo}), tu = r.data && r.data[0];
  if(r.error || !tu){ store.set('turmaConvite', ''); avisar(`<span>${t('Este convite de turma não existe mais. Peça um link novo ao professor.')}</span>`); return; }
  const meta = contaUsuario.user_metadata || {};
  $('#turmaConviteTit').textContent = t('Entrar na turma {}?', tu.nome);
  $('#turmaConviteProf').textContent = tu.professor_nome ? t('Professor(a): {}', tu.professor_nome) : '';
  $('#turmaConviteNome').value = store.get('alunoNome', '') || String(meta.full_name || meta.name || '').trim().split(/\s+/)[0] || '';
  $('#turmaConviteMsg').textContent = '';
  if(!$('#turmaConvite').open) $('#turmaConvite').showModal();
}
$('#turmaConviteForm').onsubmit = async e=>{
  e.preventDefault();
  const nome = $('#turmaConviteNome').value.trim(), codigo = store.get('turmaConvite', '');
  if(!nome){ $('#turmaConviteMsg').textContent = t('Escreva o nome que o professor vai ver.'); return; }
  const r = await sb.rpc('entrar_na_turma', {p_codigo:codigo, p_nome:nome});
  if(r.error){
    const m = r.error.message || '';
    $('#turmaConviteMsg').textContent = /professor da turma/.test(m) ? t('Esta turma é sua: quem entra pelo convite são os alunos.')
      : /turma cheia/.test(m) ? t('Esta turma está cheia. Fale com o professor.') : t('Não deu para entrar agora. Confira a internet e tente de novo.');
    return;
  }
  store.set('turmaConvite', ''); store.set('turmasUso', true); if(!store.get('alunoNome', '')) store.set('alunoNome', nome);
  $('#turmaConvite').close(); contarUso('turma-entrou');
  avisar(`<span>${t('Pronto, você entrou na turma. As tarefas do professor vão aparecer aqui.')}</span>`);
  await sincronizarTurmas(); go('estudo');
};
$('#turmaConviteNao').onclick = ()=>{ store.set('turmaConvite', ''); $('#turmaConvite').close(); };

/* ---------- Professor: as turmas ---------- */
async function carregarTurmasProf(){
  if(!sb || !contaUsuario) return renderTurmas();
  $('#tuMsg').textContent = '';
  const r = await sb.from('turmas').select('id,nome,professor_nome,codigo,tarefa,tarefa_em,criada').eq('professor_id', contaUsuario.id).order('criada');
  if(r.error){ turmasErro = 'banco'; turmasProf = []; return renderTurmas(); }
  turmasErro = ''; turmasProf = r.data;
  if(turmasProf.length){
    const a = await sb.from('turma_alunos').select('turma_id,aluno_id,nome,resumo,atualizado,entrou_em').in('turma_id', turmasProf.map(x=>x.id)).order('nome');
    turmaAlunosProf = a.error ? [] : a.data;
  } else turmaAlunosProf = [];
  if(!turmasProf.some(x=>x.id===turmaAberta)) turmaAberta = turmasProf.length ? turmasProf[0].id : null;
  renderTurmas();
}
// os últimos 7 dias (do mais antigo para hoje): praticou ou não
function ultimos7(dias){
  const tem = new Set(dias || []), r = [];
  for(let i = 6; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); r.push(tem.has(dayKey(d))); }
  return r;
}
const nAlunos = n => n===1 ? t('1 aluno') : t('{} alunos', n);
const tituloDados = d => !d ? '' : d.itens ? t('{} exercícios', d.itens.length) : (d.titulo || (exercicioPorId(d.ex) ? t(exercicioPorId(d.ex).titulo) : t('Exercício')));
function alunoTurmaHTML(a, tu){
  const res = a.resumo || {}, sete = ultimos7(res.dias), tf = res.tarefa && tu.tarefa_em && res.tarefa.em===tu.tarefa_em ? res.tarefa : null;
  const feitos = tf ? tf.itens.filter(x=>x.feito) : [], rels = feitos.filter(x=>x.rel);
  const estado = !tu.tarefa ? '' : !tf ? t('ainda não abriu a tarefa')
    : t('{} de {} feitos', feitos.length, tf.itens.length) + (rels.length ? ' · ' + Math.round(rels.reduce((s, x)=>s + (+x.rel.nota||0), 0) / rels.length) + '%' : '');
  return `<li><span class="conta-av peq" aria-hidden="true">${escHtml(a.nome.charAt(0).toUpperCase())}</span>
    <div class="tu-aluno"><b translate="no">${escHtml(a.nome)}</b><small>${estado}</small></div>
    <div class="tu-dias" role="img" aria-label="${t('Praticou em {} dos últimos 7 dias', sete.filter(Boolean).length)}" title="${t('Praticou em {} dos últimos 7 dias', sete.filter(Boolean).length)}">${sete.map(x=>`<i class="${x ? 'on' : ''}"></i>`).join('')}</div>
    <div class="tu-aluno-acoes">${rels.length ? `<button type="button" class="btn sec" data-tu-rel="${a.aluno_id}">${t('Ver relatório')}</button>` : ''}
      <button type="button" class="pr-tirar" data-tu-remover="${a.aluno_id}" aria-label="${t('Remover {} da turma', escHtml(a.nome))}"><svg aria-hidden="true"><use href="#i-x"/></svg></button></div></li>`;
}
function renderTurmas(){
  const dentro = !!contaUsuario;
  $('#tuFora').hidden = dentro; $('#tuDentro').hidden = !dentro;
  if(!dentro) return;
  $('#tuBanco').hidden = turmasErro !== 'banco';
  $('#tuLista').innerHTML = turmasProf.map(x=>`<li class="${x.id===turmaAberta ? 'on' : ''}"><button type="button" data-tu="${x.id}"><b translate="no">${escHtml(x.nome)}</b>
    <small>${nAlunos(turmaAlunosProf.filter(a=>a.turma_id===x.id).length)}</small></button></li>`).join('');
  const tu = turmasProf.find(x=>x.id===turmaAberta), det = $('#tuDetalhe');
  det.hidden = !tu; $('#tuSemTurma').hidden = !!tu || turmasErro === 'banco';
  if(!tu){ det.innerHTML = ''; return; }
  if(!$('#prEx').value) preencherExerciciosProfessor(); // a tarefa montada em Mandar tarefa (a aba pode nem ter sido aberta ainda)
  const alunos = turmaAlunosProf.filter(a=>a.turma_id===tu.id), montada = dadosTarefa();
  det.innerHTML = `<div class="tu-cab"><div><h3 translate="no">${escHtml(tu.nome)}</h3><p class="muted">${nAlunos(alunos.length)}</p></div>
      <div class="row"><button type="button" class="btn sec" id="tuAtualizar"><svg aria-hidden="true"><use href="#i-sinc"/></svg>${t('Atualizar')}</button><button type="button" class="conta-link" id="tuExcluir">${t('Excluir turma…')}</button></div></div>
    <div class="tu-bloco"><h4>${t('Convite')}</h4><p class="muted">${t('Mande este link aos alunos. Cada um entra com a própria conta e escolhe o nome que você vai ver.')}</p>
      <div class="tu-convite"><input type="text" readonly id="tuLink" value="${escHtml(turmaLink(tu.codigo))}" aria-label="${t('Link de convite')}"><button type="button" class="btn" id="tuCopiar">${t('Copiar')}</button><button type="button" class="btn sec" id="tuWhats">WhatsApp</button></div></div>
    <div class="tu-bloco"><h4>${t('Tarefa da turma')}</h4>
      <p class="muted">${tu.tarefa ? t('Enviada em {}: {}.', new Date(tu.tarefa_em).toLocaleDateString(IDIOMAS[state.lang].html), escHtml(tituloDados(tu.tarefa))) + (tu.tarefa.prazo ? ' ' + t('Entregar até {}.', dataCurta(tu.tarefa.prazo)) : '') : t('Nenhuma tarefa enviada ainda.')}</p>
      <p class="tu-montada">${t('Montada em Mandar tarefa: {}', escHtml(tituloDados(montada)))}</p>
      <div class="row"><button type="button" class="btn" id="tuMandar"><svg aria-hidden="true"><use href="#i-share"/></svg>${t('Mandar para a turma')}</button><button type="button" class="btn sec" data-go="professor">${t('Montar outra tarefa')}</button></div></div>
    <div class="tu-bloco"><h4>${t('Alunos')}</h4>
      ${alunos.length ? `<ul class="tu-alunos">${alunos.map(a=>alunoTurmaHTML(a, tu)).join('')}</ul><p class="muted tu-legenda">${t('As bolinhas são os últimos 7 dias, de seis dias atrás até hoje: acesa quando a pessoa praticou.')}</p>`
        : `<p class="muted">${t('Ninguém entrou ainda. Mande o link de convite.')}</p>`}</div>`;
  $('#tuAtualizar').onclick = carregarTurmasProf;
  $('#tuCopiar').onclick = async ()=>{ try{ await navigator.clipboard.writeText($('#tuLink').value); }catch(e){ $('#tuLink').select(); document.execCommand('copy'); } avisar(`<span>${t('Link de convite copiado.')}</span>`); };
  $('#tuWhats').onclick = ()=>window.open('https://wa.me/?text=' + encodeURIComponent(t('Entre na minha turma de bandoneon no BanDoly: {}', turmaLink(tu.codigo))), '_blank', 'noopener');
  $('#tuMandar').onclick = async ()=>{
    const d = dadosTarefa(); if(!d) return;
    if(tu.tarefa && !confirm(t('Mandar esta tarefa para a turma? Ela entra no lugar da tarefa atual.'))) return;
    const r = await sb.from('turmas').update({tarefa:d, tarefa_em:new Date().toISOString()}).eq('id', tu.id);
    if(r.error){ avisar(`<span>${t('Não deu para mandar agora. Confira a internet e tente de novo.')}</span>`); return; }
    contarUso('turma-tarefa'); avisar(`<span>${t('Tarefa enviada. Cada aluno a recebe ao abrir o app.')}</span>`); carregarTurmasProf();
  };
  $('#tuExcluir').onclick = async ()=>{
    if(!confirm(t('Excluir a turma "{}"? Os alunos saem dela e o que eles compartilhavam com você é apagado, sem volta.', tu.nome))) return;
    const r = await sb.from('turmas').delete().eq('id', tu.id);
    if(r.error){ avisar(`<span>${t('Não deu para excluir agora. Confira a internet e tente de novo.')}</span>`); return; }
    turmaAberta = null; carregarTurmasProf();
  };
}
$('#tuLista').addEventListener('click', e=>{ const b = e.target.closest('[data-tu]'); if(b){ turmaAberta = b.dataset.tu; renderTurmas(); } });
$('#tuDetalhe').addEventListener('click', async e=>{
  const tu = turmasProf.find(x=>x.id===turmaAberta); if(!tu) return;
  const v = e.target.closest('[data-tu-rel]');
  if(v){ // o relatório do aluno, com o mesmo desenho dos relatórios por link
    const a = turmaAlunosProf.find(x=>x.turma_id===tu.id && x.aluno_id===v.dataset.tuRel); if(!a) return;
    const itens = ((a.resumo.tarefa || {}).itens || []).filter(x=>x.rel).map(x=>limparRel({...x.rel, vz:x.vz||1}));
    $('#tuRelCorpo').innerHTML = relatorioHTML({aluno:a.nome, prof:'', data:String(a.atualizado||'').slice(0, 16), itens});
    $('#tuRel').showModal(); return;
  }
  const rm = e.target.closest('[data-tu-remover]');
  if(rm){
    const a = turmaAlunosProf.find(x=>x.turma_id===tu.id && x.aluno_id===rm.dataset.tuRemover); if(!a) return;
    if(!confirm(t('Remover {} da turma?', a.nome))) return;
    const r = await sb.from('turma_alunos').delete().eq('turma_id', tu.id).eq('aluno_id', a.aluno_id);
    if(r.error){ avisar(`<span>${t('Não deu para remover agora. Confira a internet e tente de novo.')}</span>`); return; }
    carregarTurmasProf();
  }
});
$('#tuRelFechar').onclick = ()=>$('#tuRel').close();
$('#tuNova').onsubmit = async e=>{
  e.preventDefault();
  const nome = $('#tuNome').value.trim(); if(!nome || !sb || !contaUsuario) return;
  const r = await sb.rpc('criar_turma', {p_nome:nome, p_professor:$('#prNome').value.trim() || store.get('profNome', '')});
  if(r.error){
    $('#tuMsg').textContent = /limite de turmas/.test(r.error.message || '') ? t('Você chegou ao limite de 20 turmas.') : t('Não deu para criar a turma agora. Confira a internet e tente de novo.');
    return;
  }
  $('#tuNome').value = ''; store.set('turmasUso', true); contarUso('turma-criada');
  turmaAberta = (Array.isArray(r.data) ? r.data[0] : r.data || {}).id || null;
  carregarTurmasProf();
};
$('#turmasAba').classList.toggle('desligada', !TURMAS_LIGADAS); // o menu mostra todas as abas da área: a classe vence
ganchosAba.push(v=>{ if(v==='turmas'){ renderTurmas(); contaPronta.then(carregarTurmasProf); } });
contaPronta.then(conviteTurmaPendente);
