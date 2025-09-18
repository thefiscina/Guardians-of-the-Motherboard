/**
 * Main - Bootstrap e loop principal do jogo
 * Gerencia canvas, input, resize, estados e integração de todos os sistemas
 */

import { DPR, debounce, throttle } from './utils.js';
import Game from './game.js';
import HUD from './hud.js';
import { audioManager, playJump, playDamage, playGameOver, setMuted } from './audio.js';

/* ===========================
   CHECKLIST RAPIDO (QA)
   - ✓ Resize/rotate ok
   - ✓ Touch e teclado ok
   - ✓ Auto-jump em plataformas
   - ✓ Score sobe por altura, cai ao cair
   - ✓ Tier muda a cada 20 pontos
   - ✓ Inimigos: contato e tiro
   - ✓ Game Over ao score negativo ou queda excessiva
   - ✓ Best Score salvo e mostrado
   - ✓ FPS estavel; sem "stutters"
   - ✓ Pause automatico background
 =========================== */

class GameApp {
    constructor() {
        // Canvas e contexto
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');

        // Sistemas principais
        this.game = null;
        this.hud = new HUD();

        // Estado do input
        this.input = {
            left: false,
            right: false,
            keys: new Set()
        };

        // Estado da aplicação
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        // Device pixel ratio para tela nitida
        this.dpr = DPR();

        // Touch zones para controle mobile
        this.touchZones = {
            left: { active: false, id: null },
            right: { active: false, id: null }
        };

        this.init();
    }

    async init() {
        console.log('GameApp: Initializing...');

        // Setup do canvas e resize
        this.setupCanvas();
        this.setupResize();

        // Setup do input
        this.setupKeyboard();
        this.setupTouch();

        // Setup do HUD
        this.setupHUD();

        // Setup do jogo
        this.setupGame();

        // Setup de eventos do sistema
        this.setupSystemEvents();

        // Carregar audio
        await this.setupAudio();

        // Iniciar o loop
        this.start();

        console.log('GameApp: Initialized successfully');
    }

    setupCanvas() {
        // Configurar canvas com device pixel ratio
        this.resizeCanvas();

        // Desabilitar context menu no canvas
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Configurações de renderização
        this.ctx.imageSmoothingEnabled = false; // Pixel art style
    }

    setupResize() {
        // Debounced resize handler
        const resizeHandler = debounce(() => {
            this.resizeCanvas();
            this.resizeGame();
        }, 100);

        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeHandler, 100); // Aguardar orientação completar
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Atualizar DPR
        this.dpr = DPR();

        // Definir tamanhos
        const width = rect.width;
        const height = rect.height;

        // Aplicar ao canvas
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.canvas.width = Math.floor(width * this.dpr);
        this.canvas.height = Math.floor(height * this.dpr);

        // Configurar contexto
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.imageSmoothingEnabled = false;

        console.log(`Canvas resized: ${width}x${height} (${this.canvas.width}x${this.canvas.height})`);
    }

    resizeGame() {
        if (this.game) {
            this.game.width = this.canvas.clientWidth;
            this.game.height = this.canvas.clientHeight;
        }
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.input.keys.add(e.code);

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = true;
                    e.preventDefault();
                    break;
                case 'KeyP':
                case 'Space':
                    this.handlePause();
                    e.preventDefault();
                    break;
                case 'KeyM':
                    this.handleMute();
                    e.preventDefault();
                    break;
                case 'KeyR':
                    if (this.game && this.game.getState() === 'gameover') {
                        this.restartGame();
                    }
                    e.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.input.keys.delete(e.code);

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = false;
                    break;
            }
        });
    }

    setupTouch() {
        const gameRoot = document.getElementById('game-root');

        // Touch start
        gameRoot.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        // Touch move
        gameRoot.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        // Touch end
        gameRoot.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // Touch cancel
        gameRoot.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    handleTouchStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Ignorar toques na area da UI (topo e bottom)
            if (y < 80 || y > rect.height - 120) continue;

            // Determinar zona de toque
            if (x < centerX * 0.9) {
                // Zona esquerda
                this.touchZones.left.active = true;
                this.touchZones.left.id = touch.identifier;
                this.input.left = true;
            } else if (x > centerX * 1.1) {
                // Zona direita
                this.touchZones.right.active = true;
                this.touchZones.right.id = touch.identifier;
                this.input.right = true;
            }
        }
    }

    handleTouchMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const id = touch.identifier;

            // Atualizar zona baseada na posição atual
            if (this.touchZones.left.id === id) {
                if (x > centerX) {
                    // Moveu para a direita
                    this.touchZones.left.active = false;
                    this.touchZones.left.id = null;
                    this.input.left = false;

                    this.touchZones.right.active = true;
                    this.touchZones.right.id = id;
                    this.input.right = true;
                }
            } else if (this.touchZones.right.id === id) {
                if (x < centerX) {
                    // Moveu para a esquerda
                    this.touchZones.right.active = false;
                    this.touchZones.right.id = null;
                    this.input.right = false;

                    this.touchZones.left.active = true;
                    this.touchZones.left.id = id;
                    this.input.left = true;
                }
            }
        }
    }

    handleTouchEnd(e) {
        for (const touch of e.changedTouches) {
            const id = touch.identifier;

            if (this.touchZones.left.id === id) {
                this.touchZones.left.active = false;
                this.touchZones.left.id = null;
                this.input.left = false;
            }

            if (this.touchZones.right.id === id) {
                this.touchZones.right.active = false;
                this.touchZones.right.id = null;
                this.input.right = false;
            }
        }
    }

    setupHUD() {
        // Configurar callbacks do HUD
        this.hud.setInputCallbacks({
            onRestart: () => this.restartGame(),
            onStart: () => this.startGame(),
            onPause: () => this.pauseGame(),
            onResume: () => this.resumeGame(),
            onMute: (muted) => this.handleMute(muted),
            onInputLeft: (active) => { this.input.left = active; },
            onInputRight: (active) => { this.input.right = active; }
        });
    }

    setupGame() {
        // Criar instancia do jogo
        this.game = new Game(this.canvas.clientWidth, this.canvas.clientHeight);

        // Configurar callbacks do jogo
        this.game.setCallbacks({
            onScoreChange: (score) => {
                this.hud.updateScore(score);
                this.hud.updateBestScore(this.game.getBestScore());
                this.hud.updateTier(this.game.getTier());
            },
            onGameOver: (score, bestScore) => {
                this.hud.updateBestScore(bestScore);
                this.hud.setState('gameover');
                playGameOver();
            },
            onPlayerDamage: (damage) => {
                this.hud.showDamageEffect();
                this.hud.vibrate([50, 100, 50]);
                playDamage();
            }
        });

        // Configurar estado inicial
        this.hud.setState('menu');
    }

    setupSystemEvents() {
        // Pause quando perde foco
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.autoPause();
            }
        });

        // Pause quando janela perde foco
        window.addEventListener('blur', () => {
            this.autoPause();
        });

        // Debug keys (apenas em desenvolvimento)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.DEBUG = true;

            window.addEventListener('keydown', (e) => {
                if (e.code === 'KeyF') {
                    console.log('FPS:', this.fps);
                    console.log('Entity counts:', this.game?.getEntityCounts());
                    e.preventDefault();
                }
            });
        }
    }

    async setupAudio() {
        try {
            // Inicializar audio manager
            await audioManager.loadExternalSounds();
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Audio setup failed:', error);
        }
    }

    // Métodos de controle do jogo
    startGame() {
        if (this.game) {
            this.game.reset();
            this.hud.setState('playing');
            this.hud.updateScore(100); // Começar com 100 pontos
            this.hud.updateTier(0);
        }
    }

    restartGame() {
        this.startGame();
    }

    pauseGame() {
        if (this.game && this.game.getState() === 'playing') {
            this.game.setState('paused');
            this.hud.setState('paused');
        }
    }

    resumeGame() {
        if (this.game && this.game.getState() === 'paused') {
            this.game.setState('playing');
            this.hud.setState('playing');
            this.lastFrameTime = performance.now(); // Reset delta time
        }
    }

    autoPause() {
        if (this.game && this.game.getState() === 'playing') {
            this.pauseGame();
        }
    }

    handlePause() {
        if (!this.game) return;

        const state = this.game.getState();
        if (state === 'playing') {
            this.pauseGame();
        } else if (state === 'paused') {
            this.resumeGame();
        }
    }

    handleMute(forcedState = null) {
        const newMutedState = forcedState !== null ? forcedState : !this.hud.isMuted;
        setMuted(newMutedState);
        this.hud.isMuted = newMutedState;
        this.hud.updateMuteButton();
    }

    // Loop principal
    start() {
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop = (currentTime) => {
        if (!this.isRunning) return;

        // Calcular delta time
        const deltaTime = Math.min(0.033, (currentTime - this.lastFrameTime) / 1000);
        this.lastFrameTime = currentTime;

        // Atualizar FPS counter
        this.updateFPS(currentTime);

        // Update
        this.update(deltaTime);

        // Render
        this.render();

        // Proximo frame
        requestAnimationFrame(this.gameLoop);
    }

    updateFPS(currentTime) {
        this.frameCount++;

        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;

            // Mostrar performance se debug ativo
            if (window.DEBUG && this.game) {
                this.hud.updatePerformance(this.fps, this.game.getEntityCounts());
            }
        }
    }

    update(deltaTime) {
        if (!this.game) return;

        // Atualizar jogo
        this.game.update(deltaTime, this.input);
    }

    render() {
        if (!this.game) return;

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

        // Desenhar jogo
        this.game.draw(this.ctx);

        // Desenhar overlay de debug
        if (window.DEBUG) {
            this.drawDebugOverlay();
        }
    }

    drawDebugOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        this.ctx.font = '12px monospace';

        const lines = [
            `FPS: ${this.fps}`,
            `State: ${this.game.getState()}`,
            `Score: ${this.game.getScore()}`,
            `Tier: ${this.game.getTier()}`,
            `Input: L:${this.input.left} R:${this.input.right}`,
        ];

        lines.forEach((line, index) => {
            this.ctx.fillText(line, 10, 20 + index * 15);
        });

        this.ctx.restore();
    }
}

// Inicializar aplicação quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GameApp();
    });
} else {
    new GameApp();
}

// Exportar para debug global
if (window.DEBUG) {
    window.GameApp = GameApp;
}
