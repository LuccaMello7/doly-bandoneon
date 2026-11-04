// Service worker: guarda o app no aparelho para funcionar offline.
// Estratégia "rede primeiro": online sempre pega a versão mais nova; offline usa o cache.
// Ao adicionar um arquivo novo ao index.html, inclua-o em ARQUIVOS (os testes conferem).
const CACHE = 'bandoly-v13'; // mudar o nome apaga o cache antigo na ativação
const ARQUIVOS = [
  "./",
  "css/app.css",
  "fontes/nunito-latin.woff2",
  "fontes/nunito-latin-ext.woff2",
  "favicon.ico",
  "icones/icone-192.png",
  "icones/icone-512.png",
  "icones/logo-cabecalho.png",
  "imagens/doly/disco.jpg",
  "imagens/doly/disco-posteiros.jpg",
  "imagens/doly/lp-posteiros.jpg",
  "imagens/doly/tafona.jpg",
  "imagens/doly/estudio.jpg",
  "imagens/doly/grupo.jpg",
  "imagens/doly/juventude.jpg",
  "imagens/doly/medalha-2001.jpg",
  "imagens/doly/palco.jpg",
  "index.html",
  "es/index.html",
  "en/index.html",
  "doly-costa/",
  "es/doly-costa/",
  "en/doly-costa/",
  "licoes/",
  "es/licoes/",
  "en/licoes/",
  "js/ajustes.js",
  "js/atalhos.js",
  "js/audio.js",
  "js/base.js",
  "js/desafios.js",
  "js/escalas.js",
  "js/fole.js",
  "js/movimento.js", "js/ouvido.js", "js/cascata.js", "js/trilha.js", "js/init.js",
  "icones/bandeiras/gb.svg",
  "icones/bandeiras/es.png",
  "icones/bandeiras/br.svg",
  "js/licoes-traducao.js",
  "js/i18n.js",
  "js/i18n-textos.js",
  "js/licoes.js",
  "js/melodias.js",
  "js/microfone.js",
  "js/acordes.js",
  "js/maos.js",
  "js/academia.js",
  "js/partituras.js",
  "js/rotina.js",
  "js/musicxml.js",
  "js/navegacao.js",
  "js/ritmo.js",
  "js/teclado.js",
  "manifest.webmanifest",
  "sons/bandoneon.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if(r.ok){ const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}))
  );
});
