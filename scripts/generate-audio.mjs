import { mkdir, writeFile } from 'node:fs/promises';
const rate=44100,out=new URL('../site/audio/',import.meta.url);await mkdir(out,{recursive:true});
let seed=0x71a207;const noise=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return((seed>>>0)/2147483648)-1};
function make(seconds,design){const samples=new Float32Array(Math.round(rate*seconds));const addNoise=(start,duration,amp,color=.8)=>{let filtered=0;for(let i=Math.floor(start*rate),end=Math.min(samples.length,i+duration*rate);i<end;i++){filtered=filtered*color+noise()*(1-color);const t=(i/rate-start)/duration,env=Math.sin(Math.PI*Math.min(1,t))**1.4;samples[i]+=filtered*amp*env}};const click=(time,amp=.12)=>{const start=Math.floor(time*rate);for(let j=0;j<700&&start+j<samples.length;j++){const env=Math.exp(-j/100);samples[start+j]+=(noise()*.7+Math.sin(j*.27)*.3)*amp*env}};const tone=(time,duration,freq,amp=.025)=>{const start=Math.floor(time*rate);for(let j=0;j<duration*rate&&start+j<samples.length;j++){const env=Math.sin(Math.PI*j/(duration*rate))**1.8;samples[start+j]+=Math.sin(2*Math.PI*freq*j/rate)*amp*env}};design({addNoise,click,tone});let peak=.001;for(const v of samples)peak=Math.max(peak,Math.abs(v));const scale=Math.min(1,.52/peak);const pcm=Buffer.alloc(samples.length*2);samples.forEach((v,i)=>pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v*scale))*32767),i*2));return wav(pcm,rate)}
function wav(pcm,sampleRate){const b=Buffer.alloc(44+pcm.length);b.write('RIFF',0);b.writeUInt32LE(36+pcm.length,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(pcm.length,40);pcm.copy(b,44);return b}
const sounds={
  'shuffle-soft':[2.05,({addNoise,click})=>{for(let i=0;i<18;i++){addNoise(.12+i*.082,.16,.095,.76);click(.16+i*.083,.035)}addNoise(1.68,.27,.07,.9);click(1.91,.1)}],
  'deck-cut':[.36,({addNoise,click})=>{addNoise(.01,.19,.08,.88);click(.08,.12);click(.27,.16)}],
  'card-lift':[.13,({addNoise,click})=>{addNoise(0,.12,.028,.78);click(.085,.018)}],
  'card-place':[.29,({addNoise,click})=>{addNoise(.02,.2,.045,.9);click(.18,.13);click(.205,.05)}],
  'card-reveal':[.52,({addNoise,click,tone})=>{addNoise(.01,.34,.065,.8);click(.28,.045);tone(.18,.32,329.63,.016);tone(.22,.27,493.88,.009)}],
  'reading-ready':[.92,({tone,addNoise})=>{tone(.02,.82,392,.028);tone(.08,.75,493.88,.018);tone(.14,.7,587.33,.012);addNoise(.03,.7,.008,.96)}]
};
for(const [name,[seconds,design]] of Object.entries(sounds))await writeFile(new URL(`${name}.wav`,out),make(seconds,design));
console.log(`Generated ${Object.keys(sounds).length} original WAV cues.`);
