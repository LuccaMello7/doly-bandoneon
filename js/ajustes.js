/* ================== Ajustes ================== */
$('#namesSel').value=state.names;
$('#tuneSel').value=String(state.tuning);
$('#volSel').value=state.volume;
if(!SF){ $('#soundSel').value='synth'; $('#soundSel').disabled=true; $('#soundStatus').textContent='Arquivo sons/bandoneon.js não encontrado: usando som sintetizado.'; }
else $('#soundSel').value=state.sound;

const testSound=()=>{ ac(); [60,64,67,72].forEach((m,i)=>playNote(m,0.5,'right',AC.currentTime+i*0.25)); };
$('#soundSel').onchange=e=>{ state.sound=e.target.value; store.set('sound',state.sound); testSound(); };
$('#tuneSel').onchange=e=>{ state.tuning=+e.target.value; store.set('tuning',state.tuning); testSound(); };
$('#volSel').oninput=e=>{ state.volume=+e.target.value; store.set('volume',state.volume); if(master) master.gain.value=state.volume/100; };
$('#volSel').onchange=testSound;
$('#testSound').onclick=testSound;

// Pré-carrega as amostras no primeiro gesto do usuário (o navegador só libera o áudio depois de um toque)
const firstGesture=()=>{
  document.removeEventListener('pointerdown',firstGesture,true); document.removeEventListener('keydown',firstGesture,true);
  preloadSamples((i,n)=>{ $('#soundStatus').textContent = i<n ? `Carregando sons… ${i}/${n}` : 'Sons carregados.'; });
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
