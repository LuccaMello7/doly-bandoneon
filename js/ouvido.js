/* ================== Desafio: Ache pelo som (antes "Treino de ouvido") ================== */
// O app toca a nota de um botão e o aluno encontra o botão só pelo som, sem nomes nos botões.
// A direção do fole aparece na tela. Dez rodadas; depois de dois erros o botão certo é destacado.
// Ao errar, o app diz se a nota ouvida é mais aguda ou mais grave e toca de novo para comparar.
const eq = {round:0, score:0, dir:'open', hand:'right', answer:null, target:null, errors:0, active:false, hist:[]};
state.progress.ouvido = state.progress.ouvido ?? null;
const eOpts = {getDir:()=>eq.dir, onPress:(b,m,dir,k)=>earPress(b,m,k)};
const ekL = kb($('#ekLeft'),'left',eOpts), ekR = kb($('#ekRight'),'right',eOpts);
const NATURAIS = [0,2,4,5,7,9,11];

function earOuvir(){
  if(eq.target==null) return;
  playNote(eq.target, 0.9, eq.hand);
  const o = $('#eOnda'); o.classList.remove('toca'); void o.offsetWidth; o.classList.add('toca');
}
function earFeed(msg, cls=''){ const f=$('#eFeed'); f.className='feedback '+cls; f.textContent=msg; }
function nextEar(){
  ekL.clearMarks(); ekR.clearMarks();
  if(eq.round>=10){
    eq.active=false; $('#eReplay').disabled=true; $('#eDirPill').style.visibility='hidden'; menuPratica('e', false); placarBolinhas('e', eq.hist, eq.round, eq.score, false);
    earFeed(eq.score>=8 ? `Fim! ${eq.score}/10. Que ouvido!` : `Fim! ${eq.score}/10`, eq.score>=8?'ok':'');
    if(state.progress.ouvido==null || eq.score>state.progress.ouvido){ state.progress.ouvido=eq.score; saveProgress(); }
    logPractice('desafio');
    if(eq.score>=8) comemorar();
    return;
  }
  eq.hand = $('#eHand').value;
  eq.dir = $('#eDir').value==='rand' ? pick(['open','close']) : $('#eDir').value;
  const todas = $('#eNotas').value==='todas';
  const L = state.layout[eq.hand].filter(b=>todas || NATURAIS.includes(((b[eq.dir]%12)+12)%12));
  let b; do{ b = pick(L); }while(L.length>1 && b===eq.answer);
  Object.assign(eq, {answer:b, target:b[eq.dir], errors:0});
  ekL.setDim(eq.hand!=='left'); ekR.setDim(eq.hand!=='right'); ekL.refresh(); ekR.refresh();
  const p = $('#eDirPill'); p.style.visibility='visible'; p.className='dirpill '+eq.dir;
  p.textContent = `${dirLabel(eq.dir)} · ${maoNome(eq.hand)}`;
  placarBolinhas('e', eq.hist, eq.round, eq.score, true);
  earFeed('Escute e encontre o botão.');
  setTimeout(earOuvir, 350);
}
function earPress(b, m, k){
  if(!eq.active) return;
  if(k.hand!==eq.hand){ earFeed('Essa nota está na outra mão.', 'bad'); return; }
  if(m===eq.target){
    k.mark(b.id,'ok'); eq.score += eq.errors===0 ? 1 : 0; eq.hist.push(eq.errors===0 ? 'certa' : 'meia'); eq.round++; placarBolinhas('e', eq.hist, eq.round, eq.score, true);
    earFeed(eq.errors ? 'Achou! (não conta ponto por ter errado antes)' : `Certo! ${noteName(m)}`, 'ok');
    setTimeout(nextEar, 1000);
  } else {
    eq.errors++; k.mark(b.id,'bad');
    earFeed(`Esse é ${noteName(m)}. A nota que você ouviu é ${m<eq.target?'mais aguda':'mais grave'}.`, 'bad');
    if(eq.errors>=2) k.mark(eq.answer.id,'hint',0);
    setTimeout(earOuvir, 650); // toca de novo para comparar
  }
}
$('#eStart').onclick = ()=>{ ac(); Object.assign(eq, {round:0, score:0, active:true, answer:null, hist:[]}); $('#eReplay').disabled=false; menuPratica('e', true); nextEar(); };
function pararEar(){
  eq.active=false; ekL.clearMarks(); ekR.clearMarks(); ekL.setDim(false); ekR.setDim(false); ekL.refresh(); ekR.refresh();
  $('#eReplay').disabled=true; $('#eDirPill').style.visibility='hidden'; earFeed(''); $('#eHud').hidden = true; menuPratica('e', false);
}
$('#eParar').onclick = pararEar;
segmentar($('#eHand')); segmentar($('#eDir'), {rotulo:rotuloFole}); segmentar($('#eNotas'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'});
$('#eReplay').onclick = earOuvir;
