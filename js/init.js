/* ================== Inicialização ================== */
// Carregado por último: aqui todas as funções dos outros arquivos já existem.
loadMelody(BUILTIN_MELODIES[0].id);
renderLesson();
renderProgress();

// Idioma: traduz a página e passa a traduzir tudo o que o código escrever depois
aplicarIdioma();
sugerirIdioma();
observador.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS});

// PWA: funciona offline e pode ser instalado (só quando servido por http/https, ex.: GitHub Pages)
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register(RAIZ+'sw.js');
let installPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); installPrompt=e; $('#installBtn').style.display='inline-block'; });
$('#installBtn').onclick=async()=>{ if(!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; $('#installBtn').style.display='none'; };
