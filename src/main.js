// src/main.js - Ponto de entrada do jogo
import './game.js';

// ===== EXEMPLO DE USO DAS HUD SPRITES =====
// Descomente as linhas abaixo para testar as HUD sprites

/*
import { HUDSprites, loadHUDSprites } from './hudSprites.js';

// Exemplo de uso das HUD sprites
async function exemploHUDSprites() {
    // Criar aplicação PIXI básica para teste
    const app = new PIXI.Application({
        width: 800,
        height: 600,
        backgroundColor: 0x1099bb
    });
    document.body.appendChild(app.view);
    
    // Carregar as sprites do HUD
    await loadHUDSprites();
    
    // Exemplo: criar botão de pausa
    const pauseButton = new PIXI.Sprite(HUDSprites.pause);
    pauseButton.anchor.set(0.5);
    pauseButton.position.set(100, 100);
    pauseButton.interactive = true;
    pauseButton.buttonMode = true;
    
    pauseButton.on('pointerdown', () => {
        console.log('Pause button clicked!');
    });
    
    app.stage.addChild(pauseButton);
    
    // Exemplo: criar setas direcionais
    const arrowUp = new PIXI.Sprite(HUDSprites.arrowUp);
    arrowUp.position.set(200, 50);
    app.stage.addChild(arrowUp);
    
    // Exemplo: criar ícone de poder reduce
    const reduceIcon = new PIXI.Sprite(HUDSprites.reduce);
    reduceIcon.position.set(300, 100);
    app.stage.addChild(reduceIcon);
}

// Chame a função para testar
// exemploHUDSprites();
*/

// Tratamento de erros globais
window.addEventListener('error', (e) => {
    console.error('Erro no jogo:', e.error);

    // Mostrar mensagem amigável ao usuário
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: monospace;
        text-align: center;
        z-index: 9999;
    `;
    errorDiv.innerHTML = `
        <h3>Ops! Algo deu errado.</h3>
        <p>Tente recarregar a página.</p>
        <button onclick="location.reload()" style="
            background: #00ff88;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        ">Recarregar</button>
    `;

    document.body.appendChild(errorDiv);
});

// Verificação de compatibilidade
if (!window.PIXI) {
    console.error('PixiJS não foi carregado. Verifique sua conexão com a internet.');
}
