import { access } from 'node:fs/promises';
const required = ['index.html','site/styles.css','site/app.js','site/assets/card-back-heritage.png','site/assets/cards/00-TheFool.png','site/audio/shuffle-soft.wav','site/audio/deck-cut.wav','site/audio/card-lift.wav','site/audio/card-place.wav','site/audio/card-reveal.wav','site/audio/reading-ready.wav'];
await Promise.all(required.map(file => access(new URL(`../${file}`, import.meta.url))));
console.log(`Visual prototype ready: ${required.length} required files verified.`);
