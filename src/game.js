// src/game.js - Sistema principal de estados do jogo
import { runCutscene } from './cutscene.js';
import { GameLevel } from './level.js';
import { Tutorial } from './tutorial.js';
import { GameHUD } from './hud.js';

export class Game {
    constructor() {
        this.app = null;
        this.currentState = 'loading';
        this.bgm = null;
        this.level = null;
        this.tutorial = null;
        this.hud = null;
        this.gameData = {
            playerHealth: 100,
            maxHealth: 100,
            score: 0,
            level: 1,
            enemiesDefeated: 0,
            totalEnemies: 0
        };

        this.init();
    }

    async init() {
        // Criar aplicação PIXI
        this.app = new PIXI.Application({
            width: 1024,
            height: 576,
            backgroundColor: 0x0b1020,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        // Adicionar canvas ao container
        const gameContainer = document.getElementById('game-container');
        const canvas = this.app.view;
        canvas.id = 'game-canvas';
        gameContainer.appendChild(canvas);

        // Configurar responsividade
        this.setupResponsive();

        // Pré-carregar assets
        await this.loadAssets();

        // Esconder tela de loading
        this.hideLoadingScreen();

        // Iniciar com cutscene
        this.startCutscene();
    }

    setupResponsive() {
        const resize = () => {
            const container = document.getElementById('game-container');
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            // Manter aspect ratio 16:9
            const gameRatio = 1024 / 576;
            const containerRatio = containerWidth / containerHeight;

            let newWidth, newHeight;

            if (containerRatio > gameRatio) {
                newHeight = containerHeight;
                newWidth = newHeight * gameRatio;
            } else {
                newWidth = containerWidth;
                newHeight = newWidth / gameRatio;
            }

            this.app.view.style.width = newWidth + 'px';
            this.app.view.style.height = newHeight + 'px';
        };

        window.addEventListener('resize', resize);
        resize();
    }

    async loadAssets() {
        const loadingProgress = document.querySelector('.loading-progress');
        const assets = [
            'assets/cenas/cena1.png',
            'assets/sprites/herorun.png',
            'assets/tilesets/motherboard_16x16.png',
            'assets/audio/cutscene_theme.mp3'
        ];

        let loaded = 0;
        const updateProgress = () => {
            loaded++;
            const progress = (loaded / assets.length) * 100;
            loadingProgress.style.width = progress + '%';
        };

        // Simular carregamento progressivo
        for (const asset of assets) {
            try {
                await PIXI.Assets.load(asset);
            } catch (error) {
                console.warn(`Falha ao carregar ${asset}:`, error);
            }
            updateProgress();
        }

        // Aguardar um pouco para mostrar 100%
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    startCutscene() {
        this.currentState = 'cutscene';
        runCutscene(this.app, (result) => {
            this.bgm = result.bgm;
            this.startTutorial();
        }, { keepMusic: true });
    }

    startTutorial() {
        this.currentState = 'tutorial';
        this.tutorial = new Tutorial(this.app, () => {
            this.startGameplay();
        });
    }

    startGameplay() {
        this.currentState = 'playing';

        // Criar HUD
        this.hud = new GameHUD(this.gameData);

        // Criar nível
        this.level = new GameLevel(this.app, this.gameData, {
            hud: this.hud, // Passar o HUD para o nível
            onPlayerDeath: () => this.showGameOver(),
            onLevelComplete: () => this.showVictory(),
            onHealthChange: (health) => {
                this.gameData.playerHealth = health;
                this.hud.updateStats(health, this.gameData.playerMana || 100);
            },
            onScoreChange: (score) => {
                this.gameData.score = score;
                this.hud.updateScore(score);
            },
            onEnemyDefeated: () => {
                this.gameData.enemiesDefeated++;
                this.gameData.score += 100; // Pontos por inimigo
                this.hud.updateEnemyCount(this.gameData.enemiesDefeated, this.gameData.totalEnemies);
                this.hud.updateScore(this.gameData.score);
            }
        });

        // Configurar música de background
        if (this.bgm) {
            this.bgm.volume = 0.3;
        }
    }

    showGameOver() {
        this.currentState = 'game-over';
        this.showOverlay('GAME OVER', 'Você foi derrotado pelos vírus!', [
            { text: 'TENTAR NOVAMENTE', action: () => this.restartGame() },
            { text: 'MENU PRINCIPAL', action: () => this.returnToMenu() }
        ]);
    }

    showVictory() {
        this.currentState = 'victory';

        // Ativar animação de vitória no jogador
        if (this.level && this.level.player) {
            this.level.player.startVictoryAnimation();
        }

        this.showOverlay('VITÓRIA!', `Parabéns! Você protegeu a motherboard!\\n\\nPontuação: ${this.gameData.score}\\nInimigos derrotados: ${this.gameData.enemiesDefeated}`, [
            { text: 'JOGAR NOVAMENTE', action: () => this.restartGame() },
            { text: 'MENU PRINCIPAL', action: () => this.returnToMenu() }
        ]);
    }

    showOverlay(title, message, buttons = []) {
        // Criar overlay DOM
        const overlay = document.createElement('div');
        overlay.className = 'game-overlay visible';

        const content = document.createElement('div');
        content.className = 'overlay-content';

        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        content.appendChild(titleEl);

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.whiteSpace = 'pre-line';
        content.appendChild(messageEl);

        const buttonsContainer = document.createElement('div');
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                overlay.remove();
                btn.action();
            });
            buttonsContainer.appendChild(button);
        });
        content.appendChild(buttonsContainer);

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Fechar com ESC
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', closeHandler);
                if (buttons.length > 0) buttons[0].action();
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    restartGame() {
        // Limpar estado atual
        this.cleanup();

        // Resetar dados do jogo
        this.gameData = {
            playerHealth: 100,
            maxHealth: 100,
            score: 0,
            level: 1,
            enemiesDefeated: 0,
            totalEnemies: 0
        };

        // Reiniciar
        this.startGameplay();
    }

    returnToMenu() {
        this.cleanup();
        this.startCutscene();
    }

    cleanup() {
        // Parar animação de vitória se estiver ativa
        if (this.level && this.level.player) {
            this.level.player.stopVictoryAnimation();
        }

        // Limpar nível atual
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }

        // Limpar tutorial
        if (this.tutorial) {
            this.tutorial.destroy();
            this.tutorial = null;
        }

        // Limpar HUD
        if (this.hud) {
            this.hud.destroy();
            this.hud = null;
        }

        // Limpar stage
        this.app.stage.removeChildren();
    }

    pause() {
        if (this.currentState === 'playing' && this.level) {
            this.level.pause();
        }
    }

    resume() {
        if (this.currentState === 'playing' && this.level) {
            this.level.resume();
        }
    }
}

// Inicializar jogo quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
