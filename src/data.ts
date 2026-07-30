import type{Spread}from'./types';
export const spreads:Spread[]=[
{id:'general-reflection',name:'General Reflection',cards:3,available:true,duration:3,positions:['Background','Core','Guidance']},
{id:'relationship-reflection',name:'Relationship Reflection',cards:3,available:true,duration:3,positions:['Your Perspective','Shared Dynamic','Healthy Next Step']},
{id:'work-direction',name:'Work & Direction',cards:3,available:true,duration:3,positions:['Current Reality','Friction','Practical Next Step']},
{id:'decision-clarity',name:'Decision Clarity',cards:3,available:true,duration:3,positions:['What Matters','What Complicates','Next Step']},
{id:'daily-reflection',name:'Daily Reflection',cards:1,available:false,duration:1,positions:[]},{id:'single-focus',name:'Single Focus',cards:1,available:false,duration:1,positions:[]},
{id:'past-present-next',name:'Past, Present & Next',cards:3,available:false,duration:3,positions:[]},{id:'mind-body-spirit',name:'Mind, Body & Spirit',cards:3,available:false,duration:3,positions:[]},{id:'creative-block',name:'Creative Block',cards:3,available:false,duration:3,positions:[]},
{id:'relationship-check-in',name:'Relationship Check-in',cards:6,available:false,duration:7,positions:[]},{id:'whole-self',name:'Whole Self',cards:6,available:false,duration:7,positions:[]},{id:'seasonal-review',name:'Seasonal Review',cards:6,available:false,duration:7,positions:[]},
{id:'celtic-cross-classic',name:'Celtic Cross (Classic)',cards:10,available:false,duration:12,positions:[]},{id:'celtic-cross-reflective',name:'Celtic Cross (Reflective)',cards:10,available:false,duration:12,positions:[]}
];
const major=['00-TheFool','01-TheMagician','02-TheHighPriestess','03-TheEmpress','04-TheEmperor','05-TheHierophant','06-TheLovers','07-TheChariot','08-Strength','09-TheHermit','10-WheelOfFortune','11-Justice','12-TheHangedMan','13-Death','14-Temperance','15-TheDevil','16-TheTower','17-TheStar','18-TheMoon','19-TheSun','20-Judgement','21-TheWorld'];
const suits=['Wands','Cups','Swords','Pentacles'];export const cardImages=[...major,...suits.flatMap(s=>Array.from({length:14},(_,i)=>`${s}${String(i+1).padStart(2,'0')}`))].map(x=>`/assets/cards/${x}.png`);
