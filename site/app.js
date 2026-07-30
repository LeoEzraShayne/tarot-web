const STORAGE_KEY = 'tarot-ritual-v1';
const positions = ['Background', 'Core', 'Guidance'];
const major = [
  ['00-TheFool','The Fool','new beginnings'],['01-TheMagician','The Magician','resourceful action'],['02-TheHighPriestess','The High Priestess','inner knowing'],['03-TheEmpress','The Empress','nurturing growth'],['04-TheEmperor','The Emperor','structure and boundaries'],['05-TheHierophant','The Hierophant','shared tradition'],['06-TheLovers','The Lovers','values and choice'],['07-TheChariot','The Chariot','directed will'],['08-Strength','Strength','gentle courage'],['09-TheHermit','The Hermit','quiet reflection'],['10-WheelOfFortune','Wheel of Fortune','changing cycles'],['11-Justice','Justice','truth and responsibility'],['12-TheHangedMan','The Hanged Man','a changed perspective'],['13-Death','Death','transition and release'],['14-Temperance','Temperance','patient integration'],['15-TheDevil','The Devil','examining attachment'],['16-TheTower','The Tower','necessary disruption'],['17-TheStar','The Star','renewal and trust'],['18-TheMoon','The Moon','uncertainty and intuition'],['19-TheSun','The Sun','clarity and vitality'],['20-Judgement','Judgement','honest reckoning'],['21-TheWorld','The World','completion and wholeness']
];
const suitThemes = { Cups:'feeling and connection', Wands:'energy and initiative', Swords:'thought and communication', Pentacles:'resources and grounded action' };
const ranks = {1:'Ace',11:'Page',12:'Knight',13:'Queen',14:'King'};
const deck = [
  ...major.map(([file,name,theme]) => ({id:file,name,theme,url:`/site/assets/cards/${file}.png`})),
  ...Object.keys(suitThemes).flatMap(suit => Array.from({length:14},(_,i) => { const n=i+1; return {id:`${suit}${String(n).padStart(2,'0')}`,name:`${ranks[n] ?? n} of ${suit}`,theme:suitThemes[suit],url:`/site/assets/cards/${suit}${String(n).padStart(2,'0')}.png`}; }))
];

const freshState = () => ({status:'question',question:'What should I understand about my next chapter?',spread:'three',seed:null,order:[],orientations:{},selected:[],muted:localStorage.getItem('tarot-muted')==='true'});
let state = loadState(); let busy = false; let hoverAt = 0;

function loadState(){ try { const saved=JSON.parse(sessionStorage.getItem(STORAGE_KEY)); if(saved?.version!==1)return freshState();const restored={...freshState(),...saved};if(restored.status==='shuffling')restored.status='selecting';if(restored.status==='revealing')restored.status='complete';return restored; } catch { return freshState(); } }
function saveState(){ sessionStorage.setItem(STORAGE_KEY,JSON.stringify({...state,version:1})); }
function hashText(text){ let h=2166136261; for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)} return h>>>0; }
function randomFrom(seed){ let x=seed||1; return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}; }
function shuffled(seed){ const rng=randomFrom(seed), ids=deck.map((_,i)=>i); for(let i=ids.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]} return {ids,orientations:Object.fromEntries(ids.map(id=>[id,rng()<.32?'reversed':'upright']))}; }

const audio = {
  muted:state.muted, volume:.62, unlocked:false, cache:new Map(), active:new Set(), ctx:null,
  cues:{shuffle:'/site/audio/shuffle-soft.wav',cut:'/site/audio/deck-cut.wav',lift:'/site/audio/card-lift.wav',place:'/site/audio/card-place.wav',reveal:'/site/audio/card-reveal.wav',ready:'/site/audio/reading-ready.wav'},
  preload(){ Object.entries(this.cues).forEach(([key,src])=>{const a=new Audio();a.preload='auto';a.src=src;a.volume=this.volume*(key==='lift'?.28:key==='ready'?.72:1);a.load();this.cache.set(key,a)}); },
  unlock(){this.unlocked=true; if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); this.ctx.resume?.();},
  play(cue){if(this.muted||!this.unlocked)return; const base=this.cache.get(cue); if(base){const a=new Audio(base.currentSrc||base.src);a.preload='auto';a.volume=base.volume;this.active.add(a);a.addEventListener('ended',()=>this.active.delete(a),{once:true});a.play().catch(()=>{this.active.delete(a);this.fallback(cue)});}else this.fallback(cue);},
  fallback(cue){if(!this.ctx)return;const now=this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='sine';osc.frequency.value=cue==='ready'?392:cue==='reveal'?330:150;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(cue==='lift'?.008:.018,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+(cue==='ready'?.7:.16));osc.connect(gain).connect(this.ctx.destination);osc.start(now);osc.stop(now+1)},
  setMuted(value){this.muted=value;state.muted=value;localStorage.setItem('tarot-muted',String(value));if(value)this.stopAll();saveState();renderSound()},setVolume(value){this.volume=value},stopAll(){this.active.forEach(a=>{a.pause();a.currentTime=0});this.active.clear()}
};
window.tarotAudio=audio;

function startShuffle(seed=hashText(`${state.question}|${state.spread}`)){
  if(state.status!=='ready-to-shuffle')throw new Error('Shuffle is not allowed in this state');
  const result=shuffled(seed);state.seed=seed;state.order=result.ids;state.orientations=result.orientations;state.selected=[];state.status='shuffling';saveState();return [...state.order];
}
function selectCard(deckIndex){
  if(state.status!=='selecting'||busy) return false; const cardIndex=state.order[deckIndex]; if(cardIndex===undefined||state.selected.some(x=>x.cardIndex===cardIndex)||state.selected.length>=3)return false;
  state.selected.push({deckIndex,cardIndex,orientation:state.orientations[cardIndex]}); if(state.selected.length===3)state.status='cards-placed';saveState();return true;
}
function unselectCard(cardIndex){if(!['selecting','cards-placed'].includes(state.status)||busy)return false;state.selected=state.selected.filter(x=>x.cardIndex!==cardIndex);state.status='selecting';saveState();return true}
function beginReveal(){if(state.status!=='cards-placed'||state.selected.length!==3||busy)return false;state.status='revealing';saveState();return true}
window.tarotSession={startShuffle,selectCard,unselectCard,beginReveal,getState:()=>structuredClone(state)};

function setStage(stage){ document.querySelectorAll('[data-stage]').forEach(el=>{const show=el.dataset.stage===stage;el.hidden=!show;el.classList.toggle('active',show)}); document.body.dataset.state=stage; const index={question:0,'spread-selection':1,'ready-to-shuffle':2,shuffling:2,selecting:3,'cards-placed':3,revealing:4,complete:4}[stage]??0;document.querySelectorAll('.journey i').forEach((el,i)=>el.classList.toggle('active',i<=index)); }
function renderSound(){const button=document.querySelector('[data-action="sound"]');button.querySelector('.sound-label').textContent=audio.muted?'SOUND OFF':'SOUND ON';button.querySelector('.sound-icon').textContent=audio.muted?'○':'◖';button.setAttribute('aria-label',audio.muted?'Turn sound on':'Turn sound off')}
function render(){
  const displayStatus=state.status==='shuffling'?'ready-to-shuffle':state.status==='cards-placed'?'selecting':state.status;
  setStage(displayStatus);renderSound();document.querySelector('#question').value=state.question;document.querySelector('#question-count').textContent=state.question.length;document.querySelector('#ritual-question').textContent=`“${state.question}”`;
  if(['selecting','cards-placed'].includes(state.status)) renderSelection(); if(state.status==='revealing') renderReveal(); if(state.status==='complete')renderResults();
}
function makeFan(){const fan=document.querySelector('#card-fan');fan.innerHTML='';for(let i=0;i<24;i++){const btn=document.createElement('button');btn.className='fan-card';btn.style.setProperty('--i',i);btn.dataset.deckIndex=i;btn.setAttribute('aria-label',`Choose card ${i+1}`);btn.innerHTML='<img src="/site/assets/card-back-heritage.png" alt="" />';btn.addEventListener('pointerenter',()=>{if(Date.now()-hoverAt>100){audio.play('lift');hoverAt=Date.now()}});fan.append(btn)}}
function renderSelection(){
  if(!document.querySelector('.fan-card'))makeFan(); const chosen=new Set(state.selected.map(x=>x.deckIndex));document.querySelectorAll('.fan-card').forEach(btn=>btn.classList.toggle('chosen',chosen.has(Number(btn.dataset.deckIndex))));
  document.querySelectorAll('.place-slot').forEach((slot,i)=>{
    const pick=state.selected[i], renderedCard=slot.dataset.cardIndex;
    if(pick&&renderedCard!==String(pick.cardIndex)){slot.classList.add('filled');slot.dataset.cardIndex=pick.cardIndex;slot.innerHTML=`<img src="/site/assets/card-back-heritage.png" alt="Selected card for ${positions[i]}" />`;}
    if(!pick&&renderedCard!==undefined){slot.classList.remove('filled');delete slot.dataset.cardIndex;slot.innerHTML=`<span>${['I','II','III'][i]}</span><b>${positions[i].toUpperCase()}</b>`;}
  });
  const n=state.selected.length;document.querySelector('#selection-number').textContent=n;document.querySelector('#selection-hint').textContent=n===3?'Your cards are ready':`Choose your ${['first','second','third'][n]} card`;document.querySelector('[data-action="reveal"]').disabled=n!==3;
}
function renderReveal(){const table=document.querySelector('#reveal-table');table.innerHTML=state.selected.map((pick,i)=>{const card=deck[pick.cardIndex];return `<article class="reveal-card" data-reveal-index="${i}"><div class="flip-inner"><div class="flip-face flip-back"><img src="/site/assets/card-back-heritage.png" alt="Card back" /></div><div class="flip-face flip-front ${pick.orientation==='reversed'?'reversed':''}"><img src="${card.url}" alt="${card.name}${pick.orientation==='reversed'?', reversed':''}" /></div></div><div class="reveal-label"><h3>${card.name}</h3><p>${positions[i].toUpperCase()} · ${pick.orientation.toUpperCase()}</p></div></article>`}).join('')}
function cardMeaning(card,orientation,position){const reversed=orientation==='reversed';return reversed?`In ${position.toLowerCase()}, ${card.theme} may feel delayed, internal, or ready for reconsideration.`:`In ${position.toLowerCase()}, notice how ${card.theme} is already present in the situation.`}
function renderResults(){const readings=state.selected.map((pick,i)=>{const card=deck[pick.cardIndex];return{pick,card,position:positions[i],roman:['I','II','III'][i],meaning:cardMeaning(card,pick.orientation,positions[i])}});document.querySelector('#result-cards').innerHTML=readings.map(({pick,card,position,roman})=>`<article class="result-card"><div class="position">${roman} · ${position.toUpperCase()}</div><img class="${pick.orientation==='reversed'?'reversed':''}" src="${card.url}" alt="${card.name}" /><h3>${card.name}</h3><div class="keywords">${pick.orientation.toUpperCase()} · ${card.theme.toUpperCase()}</div></article>`).join('');document.querySelector('#card-meanings').innerHTML=readings.map(({pick,card,position,roman,meaning})=>`<article class="card-meaning"><span>${roman} · ${position.toUpperCase()}</span><h4>${card.name} <em>${pick.orientation}</em></h4><p>${meaning}</p></article>`).join('')}
async function runReveal(){busy=true;renderReveal();const cards=[...document.querySelectorAll('.reveal-card')];for(let i=0;i<cards.length;i++){document.querySelector('#reveal-status').textContent=`Revealing the ${positions[i].toLowerCase()}…`;audio.play('reveal');cards[i].classList.add('flipped');await wait(reducedMotion()?30:1100)}audio.play('ready');document.querySelector('#reveal-status').textContent='Take a moment with what you see.';await wait(reducedMotion()?50:2000);state.status='complete';saveState();busy=false;render()}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('click',async event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;audio.unlock();
  if(action==='home'){state=freshState();saveState();render()}
  if(action==='sound'){audio.setMuted(!audio.muted)}
  if(action==='begin'){const input=document.querySelector('#question');state.question=input.value.trim();if(state.question.length<8){input.focus();return}state.status='spread-selection';saveState();render()}
  if(action==='continue'){state.status='ready-to-shuffle';saveState();render()}
  if(action==='shuffle'&&!busy){busy=true;startShuffle();render();audio.play('shuffle');await wait(reducedMotion()?80:1750);audio.play('cut');await wait(reducedMotion()?20:450);state.status='selecting';saveState();busy=false;makeFan();render()}
  if(action==='reveal'&&beginReveal()){render();runReveal()}
  if(action==='restart'){state=freshState();saveState();render()}
});
document.querySelector('#question').addEventListener('input',event=>{state.question=event.target.value;document.querySelector('#question-count').textContent=state.question.length;saveState()});
document.querySelector('#card-fan').addEventListener('click',event=>{const card=event.target.closest('.fan-card');if(!card)return;if(selectCard(Number(card.dataset.deckIndex))){audio.play('place');renderSelection()}});
document.querySelector('.placed-cards').addEventListener('click',event=>{const slot=event.target.closest('.place-slot');const pick=state.selected[Number(slot?.dataset.slot)];if(pick&&unselectCard(pick.cardIndex)){audio.play('lift');renderSelection()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stopAll()});
audio.preload();render();
