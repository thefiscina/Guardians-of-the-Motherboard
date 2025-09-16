import { runCutscene } from './cutscene.js';

const app = new PIXI.Application({
    background: '#0b1020',
    resizeTo: window,
    antialias: true,
});
document.getElementById('game').appendChild(app.view);

function startGame() {
    console.log('Jogo iniciado!');
    // ...inicialize aqui seu gameplay
}

runCutscene(app, startGame);
