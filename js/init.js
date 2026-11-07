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
  const tm = h.match(/^teoria-(\d+)$/);
  if(tm && TEORIA[tm[1]-1]){ abrirTeoria(tm[1]-1); return; }
  if(m && LESSONS[m[1]-1]){ curLesson = m[1]-1; renderLesson(); go('licoes'); }
  else if(/^[a-z]+$/.test(h) && $('#v-'+h)) go(h);
}
abrirPeloEndereco();
// Aviso "não substitui um professor": inteiro na primeira visita; nas outras, uma linha só ("Ler o aviso" abre)
{ const visto = store.get('avisoProfVisto', false);
  $$('.aviso-curto').forEach(a=>{ if(visto) a.classList.add('recolhido'); const b = a.querySelector('.aviso-ler'); if(b) b.onclick = ()=>a.classList.remove('recolhido'); });
  if(!visto) store.set('avisoProfVisto', true); }
// Desafios: o Começar de cada um muda para "Recomeçar" ao começar e volta ao trocar de desafio (js/desafios.js)
['#fStart','#sStart','#eStart','#pStart'].forEach(id=>$(id).addEventListener('click', botoesDesafio));
$$('[data-ch]').forEach(b=>b.addEventListener('click', ()=>setTimeout(botoesDesafio)));
// o som gravado (3,3 MB) é baixado no primeiro toque ou tecla (js/ajustes.js): quem só visita a página não baixa
window.addEventListener('hashchange', abrirPeloEndereco);
observador.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTRS});

// PWA: funciona offline e pode ser instalado (só quando servido por http/https, ex.: GitHub Pages)
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register(RAIZ+'sw.js');
let installPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); installPrompt=e; $('#installBtn').style.display='inline-block'; });
$('#installBtn').onclick=async()=>{ if(!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; $('#installBtn').style.display='none'; };
// Convite para instalar, na tela Início: a partir da 2ª vez que a pessoa abre o app, se ainda não instalou e
// não disse "Agora não". No Android o botão abre a instalação do navegador; no iPhone não existe esse
// botão, então o cartão ensina o caminho (Compartilhar → Adicionar à Tela de Início).
const aberturas = store.get('aberturas', 0) + 1; store.set('aberturas', aberturas);
const instalado = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true;
const ehIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
function convidarInstalar(){
  if(instalado() || store.get('instalarNao', false) || aberturas<2) return;
  if(!installPrompt && !ehIOS) return;
  $('#instalarSim').hidden = !installPrompt; $('#instalarIos').hidden = !!installPrompt; $('#instalarTxt').hidden = !installPrompt;
  $('#instalarNao').textContent = installPrompt ? 'Agora não' : 'Entendi';
  $('#instalarCard').hidden = false;
}
window.addEventListener('beforeinstallprompt', ()=>setTimeout(convidarInstalar));
window.addEventListener('appinstalled', ()=>{ $('#instalarCard').hidden = true; });
if(ehIOS) convidarInstalar();
$('#instalarSim').onclick = async()=>{ if(!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; $('#instalarCard').hidden = true; };
$('#instalarNao').onclick = ()=>{ store.set('instalarNao', true); $('#instalarCard').hidden = true; };
