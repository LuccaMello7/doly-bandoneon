/* ================== Ajustes ================== */
$('#namesSel').value=state.names;
$('#tuneSel').value=String(state.tuning);
$('#volSel').value=state.volume;
// o som gravado é baixado depois que o app abriu (audio.js): enquanto isso, o seletor mostra que está chegando
$('#soundSel').value=state.sound;
if(!SF) $('#soundStatus').textContent='Baixando o som do bandoneon…';
document.addEventListener('sons-prontos', ()=>{
  if(SF){ $('#soundStatus').textContent=''; return; }
  $('#soundSel').value='synth'; $('#soundSel').disabled=true; $('#soundStatus').textContent='Arquivo sons/bandoneon.js não encontrado: usando som sintetizado.';
});

const testSound=()=>{ ac(); [60,64,67,72].forEach((m,i)=>playNote(m,0.5,'right',AC.currentTime+i*0.25)); };
$('#soundSel').onchange=e=>{ state.sound=e.target.value; store.set('sound',state.sound); testSound(); };
$('#tuneSel').onchange=e=>{ state.tuning=+e.target.value; store.set('tuning',state.tuning); testSound(); };
$('#volSel').oninput=e=>{ state.volume=+e.target.value; store.set('volume',state.volume); if(master) master.gain.value=state.volume/100; };
$('#volSel').onchange=testSound;
$('#testSound').onclick=testSound;
// Animações (reduzidas também quando o sistema pede) e vibração no celular (movimento.js)
$('#movSel').value=mov.pref; $('#vibSel').value=mov.vib?'1':'0';
$('#movSel').onchange=e=>{ mov.pref=e.target.value; store.set('movimento',mov.pref); aplicarMovimento(); };
$('#vibSel').onchange=e=>{ mov.vib=e.target.value==='1'; store.set('vibracao',mov.vib); vibrar('ok'); };

// Pré-carrega as amostras no primeiro gesto do usuário (o navegador só libera o áudio depois de um toque)
// Se o som gravado demora a chegar (internet lenta), um aviso discreto no topo mostra o progresso: até lá
// as notas saem com o som sintetizado e, sem o aviso, parece que o app tem um som diferente ou nenhum.
let somAviso=null, somTimer=0, somPronto=false;
function somStatus(txt){
  if(somPronto) return;
  if(!somAviso){ somAviso=document.createElement('div'); somAviso.className='som-carregando'; somAviso.setAttribute('role','status'); document.body.appendChild(somAviso); }
  somAviso.innerHTML=`<span class="som-roda" aria-hidden="true"></span><span>${txt}</span>`;
}
function somAcabou(){
  somPronto=true; clearTimeout(somTimer);
  const a=somAviso; somAviso=null; if(!a) return;
  a.classList.add('sai'); setTimeout(()=>a.remove(), 400);
}
const firstGesture=()=>{
  document.removeEventListener('pointerdown',firstGesture,true); document.removeEventListener('keydown',firstGesture,true);
  somTimer=setTimeout(()=>somStatus('Carregando o som do bandoneon…'), 500); // rápido (já no cache): nem aparece
  carregarSons().then(sf=>{
    if(!sf){ somAcabou(); return; }
    preloadSamples((i,n)=>{
      $('#soundStatus').textContent = i<n ? `Carregando sons… ${i}/${n}` : 'Sons carregados.';
      if(i>=n) somAcabou(); else if(somAviso) somStatus(`Preparando o som… ${Math.round(100*i/n)}%`);
    });
  });
};
document.addEventListener('pointerdown',firstGesture,true); document.addEventListener('keydown',firstGesture,true);

// Backup de tudo o que o app guarda no navegador (chaves "bandoneon.*").
// O identificador 'escola-de-bandoneon' vem do nome antigo do app e foi mantido para aceitar backups antigos.
const PREFIX='bandoneon.';
const appKeys=()=>Object.keys(localStorage).filter(k=>k.startsWith(PREFIX));
$('#backupExport').onclick=()=>{
  const data={}; appKeys().forEach(k=>data[k.slice(PREFIX.length)]=localStorage.getItem(k));
  const blob=new Blob([JSON.stringify({app:'escola-de-bandoneon', versao:1, criado:new Date().toISOString(), dados:data},null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`backup-bandoly-${new Date().toISOString().slice(0,10)}.json`; a.click();
};
$('#backupImport').onclick=()=>{
  const i=document.createElement('input'); i.type='file'; i.accept='.json,application/json';
  i.onchange=async()=>{
    try{
      const b=JSON.parse(await i.files[0].text());
      if(b.app!=='escola-de-bandoneon' || typeof b.dados!=='object') throw 0;
      if(!confirm(t('Importar este backup? Os dados atuais deste navegador serão substituídos.'))) return;
      appKeys().forEach(k=>localStorage.removeItem(k));
      Object.entries(b.dados).forEach(([k,v])=>localStorage.setItem(PREFIX+k,v));
      location.reload();
    }catch(e){ alert(t('Arquivo de backup inválido.')); }
  };
  i.click();
};
$('#backupReset').onclick=()=>{
  if(!confirm(t('Apagar todo o progresso, as melodias criadas e as alterações no mapa? Isso não pode ser desfeito (a menos que você tenha um backup).'))) return;
  appKeys().forEach(k=>localStorage.removeItem(k)); location.reload();
};

// Acessibilidade: mensagens de retorno são anunciadas por leitores de tela
$$('.feedback, #keyInfo, #melStat, #fScore, #sScore, #rStats').forEach(e=>e.setAttribute('aria-live','polite'));
