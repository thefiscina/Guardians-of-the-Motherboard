/**
 * HUD - Interface do usuário
 * Gerencia elementos de UI, overlays e interações
 */

import { formatNumber, Storage } from './utils.js';

export class HUD {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.state = 'menu'; // menu, playing, paused, gameover
        this.isPaused = false;
        this.isMuted = false;
        this.score = 0;
        this.bestScore = 0;
        this.tier = 0;

        // Carregar melhor pontuação
        this.bestScore = Storage.get('bestScore', 0);
        this.isMuted = Storage.get('isMuted', false);

        this.updateMuteButton();
    }

    initElements() {
        // HUD elements
        this.elScore = document.getElementById('score');
        this.elBest = document.getElementById('best');
        this.elTier = document.getElementById('tier');

        // Overlay elements
        this.overlay = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.finalScore = document.getElementById('final-score');

        // Buttons
        this.btnRestart = document.getElementById('btn-restart');
        this.btnStart = document.getElementById('btn-start');
        this.btnLeft = document.getElementById('btn-left');
        this.btnRight = document.getElementById('btn-right');
        this.btnPause = document.getElementById('btn-pause');
        this.btnMute = document.getElementById('btn-mute');

        // Instructions
        this.instructions = document.getElementById('instructions');

        // Callbacks para eventos (será definido pelo main.js)
        this.onRestart = null;
        this.onStart = null;
        this.onPause = null;
        this.onResume = null;
        this.onMute = null;
        this.onInputLeft = null;
        this.onInputRight = null;
    }

    initEventListeners() {
        // Restart button
        this.btnRestart.addEventListener('click', () => {
            if (this.onRestart) this.onRestart();
        });

        // Start button
        this.btnStart.addEventListener('click', () => {
            if (this.onStart) this.onStart();
        });

        // Pause button
        this.btnPause.addEventListener('click', () => {
            this.togglePause();
        });

        // Mute button
        this.btnMute.addEventListener('click', () => {
            this.toggleMute();
        });

        // Control buttons - Touch events
        this.initControlEvents(this.btnLeft, 'left');
        this.initControlEvents(this.btnRight, 'right');

        // Hide instructions on first touch/click
        this.hideInstructionsOnStart();
    }

    initControlEvents(button, direction) {
        const callback = direction === 'left' ? this.onInputLeft : this.onInputRight;

        // Touch events
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (callback) callback(true);
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (callback) callback(false);
        }, { passive: false });

        // Mouse events (desktop)
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (callback) callback(true);
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            if (callback) callback(false);
        });

        button.addEventListener('mouseleave', (e) => {
            if (callback) callback(false);
        });
    }

    hideInstructionsOnStart() {
        const hideInstructions = () => {
            if (this.instructions && !this.instructions.classList.contains('hidden')) {
                this.instructions.classList.add('fade-out');
                setTimeout(() => {
                    this.instructions.classList.add('hidden');
                }, 500);
            }
        };

        // Hide on any touch/click
        document.addEventListener('touchstart', hideInstructions, { once: true });
        document.addEventListener('mousedown', hideInstructions, { once: true });
        document.addEventListener('keydown', hideInstructions, { once: true });
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.btnPause.textContent = '▶';
            if (this.onPause) this.onPause();
        } else {
            this.btnPause.textContent = '⏸';
            if (this.onResume) this.onResume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateMuteButton();
        Storage.set('isMuted', this.isMuted);

        if (this.onMute) this.onMute(this.isMuted);
    }

    updateMuteButton() {
        this.btnMute.textContent = this.isMuted ? '🔇' : '🔈';
    }

    setState(newState) {
        this.state = newState;

        switch (newState) {
            case 'menu':
                this.showMenu();
                break;
            case 'playing':
                this.hideOverlay();
                break;
            case 'paused':
                this.showPaused();
                break;
            case 'gameover':
                this.showGameOver();
                break;
        }
    }

    showMenu() {
        this.overlayTitle.textContent = 'Subida Infinita';
        this.finalScore.textContent = `Melhor pontuação: ${formatNumber(this.bestScore)}`;
        this.btnRestart.classList.add('hidden');
        this.btnStart.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
    }

    showPaused() {
        this.overlayTitle.textContent = 'Pausado';
        this.finalScore.textContent = `Pontuação atual: ${formatNumber(this.score)}`;
        this.btnRestart.classList.add('hidden');
        this.btnStart.classList.add('hidden');
        this.overlay.classList.remove('hidden');
    }

    showGameOver() {
        this.overlayTitle.textContent = 'Game Over';
        this.finalScore.textContent = `Pontuação: ${formatNumber(this.score)} | Melhor: ${formatNumber(this.bestScore)}`;
        this.btnRestart.classList.remove('hidden');
        this.btnStart.classList.add('hidden');
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
        this.isPaused = false;
        this.btnPause.textContent = '⏸';
    }

    updateScore(score) {
        this.score = score;
        this.elScore.textContent = `Score: ${formatNumber(score)}`;
    }

    updateBestScore(bestScore) {
        if (bestScore > this.bestScore) {
            this.bestScore = bestScore;
            Storage.set('bestScore', bestScore);
        }
        this.elBest.textContent = `Best: ${formatNumber(this.bestScore)}`;
    }

    updateTier(tier) {
        this.tier = tier;
        this.elTier.textContent = `Tier: ${tier}`;
    }

    // Feedback visual para dano
    showDamageEffect() {
        document.body.style.backgroundColor = '#dc2626';
        setTimeout(() => {
            document.body.style.backgroundColor = '';
        }, 100);
    }

    // Feedback visual para pontuação
    showScoreEffect(points, x, y) {
        const effect = document.createElement('div');
        effect.textContent = `+${points}`;
        effect.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      color: #4ade80;
      font-weight: bold;
      font-size: 18px;
      pointer-events: none;
      z-index: 1000;
      animation: scoreFloat 1s ease-out forwards;
    `;

        // Adicionar CSS da animação se não existir
        if (!document.getElementById('score-animation-style')) {
            const style = document.createElement('style');
            style.id = 'score-animation-style';
            style.textContent = `
        @keyframes scoreFloat {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
      `;
            document.head.appendChild(style);
        }

        document.body.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    // Performance monitor (debug)
    updatePerformance(fps, entityCounts) {
        if (!this.perfElement && window.DEBUG) {
            this.perfElement = document.createElement('div');
            this.perfElement.style.cssText = `
        position: absolute;
        top: 60px;
        left: 8px;
        color: #9ca3af;
        font-size: 12px;
        font-family: monospace;
        background: rgba(0,0,0,0.5);
        padding: 4px 8px;
        border-radius: 4px;
        pointer-events: none;
        z-index: 1000;
      `;
            document.body.appendChild(this.perfElement);
        }

        if (this.perfElement) {
            this.perfElement.innerHTML = `
        FPS: ${Math.round(fps)}<br>
        Platforms: ${entityCounts.platforms}<br>
        Enemies: ${entityCounts.enemies}<br>
        Bullets: ${entityCounts.bullets}
      `;
        }
    }

    // Vibração para mobile (se suportado)
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator && !this.isMuted) {
            navigator.vibrate(pattern);
        }
    }

    // Métodos para controle de input externo
    setInputCallbacks(callbacks) {
        this.onRestart = callbacks.onRestart;
        this.onStart = callbacks.onStart;
        this.onPause = callbacks.onPause;
        this.onResume = callbacks.onResume;
        this.onMute = callbacks.onMute;
        this.onInputLeft = callbacks.onInputLeft;
        this.onInputRight = callbacks.onInputRight;
    }

    // Métodos para acessibilidade
    announceScore(score) {
        if ('speechSynthesis' in window && window.ACCESSIBILITY) {
            const utterance = new SpeechSynthesisUtterance(`Pontuação: ${score}`);
            utterance.volume = 0.3;
            utterance.rate = 1.5;
            speechSynthesis.speak(utterance);
        }
    }

    announceGameOver() {
        if ('speechSynthesis' in window && window.ACCESSIBILITY) {
            const utterance = new SpeechSynthesisUtterance('Game Over');
            utterance.volume = 0.5;
            speechSynthesis.speak(utterance);
        }
    }
}

export default HUD;
