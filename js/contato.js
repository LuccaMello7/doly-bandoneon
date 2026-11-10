/* ================== Enviar sugestão ou reportar erro ================== */
// A mensagem pode ir pelo GitHub (abre uma "issue" já preenchida no repositório; pede uma conta gratuita)
// ou por e-mail (só aparece se CONTATO_EMAIL estiver preenchido). Também dá para copiar o texto.
// As informações técnicas ajudam a reproduzir um erro; o aluno pode desmarcar.
const CONTATO_EMAIL = 'contato@bandoly.app';
const REPOSITORIO = 'https://github.com/LuccaMello7/doly-bandoneon';
const TIPOS_SUGESTAO = {sugestao:'Sugestão', erro:'Erro', elogio:'Elogio'};
function textoSugestao(){
  const tipo = (new FormData($('#sugForm'))).get('tipo') || 'sugestao', msg = $('#sugTexto').value.trim();
  let corpo = msg || t('(sem mensagem)');
  if($('#sugTec').checked) corpo += '\n\n---\n' + [
    `${t('Aba aberta')}: ${currentView}`, `${t('Idioma')}: ${state.lang}`, `${t('Tela')}: ${innerWidth}×${innerHeight}`,
    `${t('Navegador')}: ${navigator.userAgent}`, `${t('Endereço')}: ${location.href.split('#')[0]}`,
  ].join('\n');
  return {titulo: `[${t(TIPOS_SUGESTAO[tipo])}] ${msg.split('\n')[0].slice(0, 70) || t('Mensagem pelo app')}`, corpo};
}
function abrirSugestao(){ $('#sugMsg').textContent = ''; $('#sugEmail').hidden = !CONTATO_EMAIL; $('#sugDialog').showModal(); setTimeout(()=>$('#sugTexto').focus(), 50); }
document.addEventListener('click', e=>{ if(e.target.closest('[data-sugestao]')){ e.preventDefault(); abrirSugestao(); } });
$('#sugGithub').onclick = ()=>{
  const {titulo, corpo} = textoSugestao();
  window.open(`${REPOSITORIO}/issues/new?title=${encodeURIComponent(titulo)}&body=${encodeURIComponent(corpo)}`, '_blank', 'noopener');
  $('#sugMsg').textContent = 'Abrimos o GitHub numa nova aba: confira o texto e toque em "Submit new issue". Obrigado!';
};
$('#sugEmail').onclick = ()=>{ const {titulo, corpo} = textoSugestao(); location.href = `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(corpo)}`; };
$('#sugCopiar').onclick = async ()=>{
  const {titulo, corpo} = textoSugestao();
  try{ await navigator.clipboard.writeText(titulo + '\n\n' + corpo); $('#sugMsg').textContent = 'Texto copiado.'; }catch(e){ $('#sugMsg').textContent = ''; }
};
$('#sugFechar').onclick = ()=>$('#sugDialog').close();
