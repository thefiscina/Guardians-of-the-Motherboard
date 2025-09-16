// src/main.js - Ponto de entrada do jogo
import './game.js';

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
