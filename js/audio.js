/* ================== Áudio ================== */
let AC=null, master=null;
function ac(){
  if(!AC){
    AC = new (window.AudioContext||window.webkitAudioContext)();
    const comp = AC.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=4;
    master = AC.createGain(); master.gain.value=state.volume/100;
    master.connect(comp).connect(AC.destination);
  }
  if(AC.state==='suspended') AC.resume();
  return AC;
}
const freq = m => state.tuning*Math.pow(2,(m-69)/12);
const voices = {};

// Amostras reais: sons/bandoneon.js (gerado do SoundFont por ferramentas/sf2_para_js.py)
const SF = window.BANDONEON_SF || null, sfBuffers = [];
const SF_REF_A = 443; // afinação medida das amostras (Lá ≈ 443 Hz)
const useSamples = () => SF && state.sound!=='synth';
function sfBuffer(i){
  if(!sfBuffers[i]){
    const s=SF.samples[i], bin=atob(s.data), u8=new Uint8Array(bin.length);
    for(let k=0;k<bin.length;k++) u8[k]=bin.charCodeAt(k);
    const pcm=new Int16Array(u8.buffer), buf=AC.createBuffer(1,pcm.length,s.rate), ch=buf.getChannelData(0);
    for(let k=0;k<pcm.length;k++) ch[k]=pcm[k]/32768*s.gain;
    sfBuffers[i]=buf;
  }
  return sfBuffers[i];
}
// Prepara todas as amostras aos poucos (sem travar a página) logo no primeiro toque
let sfPreloading=false;
function preloadSamples(onProgress){
  if(!SF || sfPreloading) return; sfPreloading=true; ac();
  let i=0;
  const next=()=>{ if(i>=SF.samples.length){ onProgress&&onProgress(i,i); return; }
    sfBuffer(i++); onProgress&&onProgress(i,SF.samples.length); setTimeout(next,0); };
  next();
}
function sfZone(midi){
  return SF.zones.find(z=>midi>=z.lo && midi<=z.hi)
      || SF.zones.reduce((a,b)=>Math.abs(midi-b.root)<Math.abs(midi-a.root)?b:a);
}
function makeSampleVoice(midi, peak, t0){
  const c=ac(), z=sfZone(midi), s=SF.samples[z.s], src=c.createBufferSource();
  src.buffer=sfBuffer(z.s);
  src.playbackRate.value=Math.pow(2,(midi-z.root+z.tune/100)/12)*state.tuning/SF_REF_A;
  if(z.loop){ src.loop=true; src.loopStart=s.loopStart/s.rate; src.loopEnd=s.loopEnd/s.rate; }
  const out=c.createGain(); out.gain.value=0;
  src.connect(out).connect(master); src.start(t0);
  out.gain.setTargetAtTime(peak*Math.pow(10,-z.atten/20), t0, 0.006);
  return {oscs:[src], out};
}
function makeReed(midi, hand, peak, t0){
  if(useSamples()) return makeSampleVoice(midi, peak, t0);
  // Simula duas lengüetas (palhetas) afinadas em oitava, como no bandoneon
  const c=ac(), f=freq(midi);
  const out=c.createGain(); out.gain.value=0;
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=Math.min(4200,f*7); lp.Q.value=0.8;
  const vib=c.createOscillator(); vib.frequency.value=5.2; const vg=c.createGain(); vg.gain.value=2.5; vib.connect(vg);
  const oscs=[vib];
  const mk=(type,fr,det,g)=>{ const o=c.createOscillator(); o.type=type; o.frequency.value=fr; o.detune.value=det; vg.connect(o.detune);
    const gg=c.createGain(); gg.gain.value=g; o.connect(gg).connect(lp); oscs.push(o); };
  mk('sawtooth',f,-5,0.45); mk('square',f,4,0.2);
  mk('sawtooth', hand==='left'?f/2:f*2, 3, hand==='left'?0.35:0.2);
  lp.connect(out).connect(master);
  oscs.forEach(o=>o.start(t0));
  out.gain.setTargetAtTime(peak, t0, 0.025);
  return {oscs,out};
}
function startVoice(key, midi, hand){
  stopVoice(key,true);
  voices[key] = makeReed(midi, hand, 0.16, ac().currentTime);
}
function stopVoice(key, fast){
  const v=voices[key]; if(!v) return; delete voices[key];
  const t=ac().currentTime;
  v.out.gain.cancelScheduledValues(t); v.out.gain.setTargetAtTime(0,t,fast?0.005:0.045);
  v.oscs.forEach(o=>o.stop(t+0.4));
}
function playNote(midi, dur=0.7, hand, t0, peak=0.16){
  const c=ac(); t0=t0??c.currentTime; hand = hand || (midi<57?'left':'right');
  const v=makeReed(midi, hand, peak, t0);
  v.out.gain.setTargetAtTime(0, t0+dur, 0.05);
  v.oscs.forEach(o=>o.stop(t0+dur+0.5));
}
