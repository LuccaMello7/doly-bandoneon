/* ================== Inicialização ================== */
// Carregado por último: aqui todas as funções dos outros arquivos já existem.
loadMelody(BUILTIN_MELODIES[0].id);
renderLesson();
renderProgress();

// Idioma: traduz a página e passa a traduzir tudo o que o código escrever depois
aplicarIdioma();
sugerirIdioma();
// Links para outras páginas do site (ex.: doly-costa/): aberto do computador, sem servidor, a pasta precisa do index.html
if(location.protocol==='file:') $$('a[data-local][href$="/"]').forEach(a=>a.setAttribute('href', a.getAttribute('href')+'index.html'));
// Endereço com #licao-3 (vindo das páginas das lições) abre a lição; #teclado, #ritmo etc. abrem a aba
function abrirPeloEndereco(){
  const h = decodeURIComponent(location.hash.slice(1)), m = h.match(/^licao-(\d+)$/);
  if(h.startsWith('tarefa=')){ abrirTarefa(h.slice(7)); return; } // link de tarefa mandado pelo professor (js/professor.js)
  if(m && LESSONS[m[1]-1]){ curLesson = m[1]-1; renderLesson(); go('licoes'); }
  else if(/^[a-z]+$/.test(h) && $('#v-'+h)) go(h);
}
abrirPeloEndereco();
// o som gravado chega depois que a tela já respondeu (o primeiro toque usa o sintetizado se ainda não tiver chegado)
if(document.readyState==='complete') carregarSons(); else window.addEventListener('load', ()=>carregarSons());
window.addEventListener('hashchange', abrirPeloEndereco);
observador.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS});

// PWA: funciona offline e pode ser instalado (só quando servido por http/https, ex.: GitHub Pages)
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register(RAIZ+'sw.js');
let installPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); installPrompt=e; $('#installBtn').style.display='inline-block'; });
$('#installBtn').onclick=async()=>{ if(!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; $('#installBtn').style.display='none'; };
