// Contra "clickjacking": o BanDoly não funciona dentro de um quadro (iframe) de outro site, onde um botão
// invisível por cima poderia enganar o clique. O GitHub Pages não deixa mandar o cabeçalho frame-ancestors,
// então a proteção é feita aqui. Aberto do computador (file:, testes e capturas) ou pelo próprio site, segue normal.
(function(){
  if(window.top === window.self || location.protocol === 'file:') return;
  var mesmo = false;
  try{ mesmo = window.top.location.hostname === location.hostname; }catch(e){}
  if(mesmo) return;
  document.documentElement.style.visibility = 'hidden';
  try{ window.top.location.replace(location.href); }catch(e){}
  document.addEventListener('DOMContentLoaded', function(){
    // sem innerHTML: o endereço pode trazer qualquer coisa depois do #
    var a = document.createElement('a');
    a.href = location.href; a.target = '_top'; a.rel = 'noopener'; a.textContent = 'bandoly.app';
    a.style.cssText = 'display:block;padding:24px;font:600 18px system-ui,sans-serif;color:#b997ff';
    document.body.replaceChildren(a);
    document.documentElement.style.visibility = '';
  });
})();
