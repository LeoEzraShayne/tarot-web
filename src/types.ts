export type Stage='question'|'spreads'|'shuffle'|'select'|'reveal'|'result';
export type Spread={id:string;name:string;cards:number;available:boolean;duration:number;positions:string[]};
export type RevealedCard={positionId:number;position:string;cardId:string;cardName:string;orientation:'upright'|'reversed'};
export type Section={position:string;cardId:string;cardName:string;orientation:string;keywords:string[];baseMeaning:string;contextualMeaning:string;relation:string;reflectionQuestion:string};
export type Interpretation={synthesis:string;relations:string[];sections:Section[];nextStep:string;confidence:{level:string;score:number;meaning:string;uncertainty:string};safety:string};
