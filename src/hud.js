// src/hud.js - Interface do usuário do jogo
export class GameHUD {
    constructor(gameData) {
        this.gameData = gameData;
        this.hudContainer = document.createElement('div');
        this.hudContainer.className = 'game-hud';
        this.hudContainer.innerHTML = `
            <div class="hud-left">
                <div class="player-stats">
                    <div class="stat-item">
                        <span class="stat-label">VIDA:</span>
                        <div class="health-bar">
                            <div class="health-fill" id="health-fill"></div>
                        </div>
                        <span class="stat-value" id="health-text">100/100</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">MANA:</span>
                        <div class="mana-bar">
                            <div class="mana-fill" id="mana-fill"></div>
                        </div>
                        <span class="stat-value" id="mana-text">100/100</span>
                    </div>
                </div>
            </div>
            <div class="hud-center">
                <div class="level-info">
                    <h3 id="level-title">NÍVEL 1</h3>
                    <div class="objective">
                        <span id="enemies-count">0/10</span> Vírus Eliminados
                    </div>
                </div>
            </div>
            <div class="hud-right">
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">PONTUAÇÃO:</span>
                        <span class="stat-value" id="score-text">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">TEMPO:</span>
                        <span class="stat-value" id="timer-text">3:00</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.hudContainer);

        // Elementos do DOM
        this.elements = {
            healthFill: document.getElementById('health-fill'),
            healthText: document.getElementById('health-text'),
            manaFill: document.getElementById('mana-fill'),
            manaText: document.getElementById('mana-text'),
            levelTitle: document.getElementById('level-title'),
            enemiesCount: document.getElementById('enemies-count'),
            scoreText: document.getElementById('score-text'),
            timerText: document.getElementById('timer-text')
        };

        // Estados
        this.isVisible = true;
        this.flashingElements = new Set();

        this.init();
    }

    init() {
        // Adicionar estilos CSS específicos do HUD
        this.addHUDStyles();

        // Configurar valores iniciais
        this.updateHealth(this.gameData.playerHealth, this.gameData.maxHealth);
        this.updateMana(100, 100); // Valor inicial de mana
        this.updateScore(this.gameData.score);
        this.updateEnemies(this.gameData.enemiesDefeated, this.gameData.totalEnemies);

        // Iniciar timer
        this.startTimer();
    }

    addHUDStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .game-hud {
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                z-index: 50;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                pointer-events: none;
            }
            
            .hud-left, .hud-right, .hud-center {
                background: rgba(26, 35, 50, 0.95);
                border: 2px solid var(--border-color, #333);
                padding: 15px;
                border-radius: 8px;
                backdrop-filter: blur(5px);
            }
            
            .hud-center {
                text-align: center;
                min-width: 200px;
            }
            
            .player-stats, .game-stats {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
            }
            
            .stat-label {
                color: var(--accent-color, #00ff88);
                min-width: 50px;
            }
            
            .stat-value {
                color: white;
                font-weight: bold;
            }
            
            .health-bar, .mana-bar {
                width: 100px;
                height: 12px;
                background: rgba(51, 51, 51, 0.8);
                border: 1px solid var(--border-color, #333);
                border-radius: 6px;
                overflow: hidden;
                position: relative;
            }
            
            .health-fill, .mana-fill {
                height: 100%;
                border-radius: 5px;
                transition: width 0.3s ease, background-color 0.3s ease;
                position: relative;
            }
            
            .health-fill {
                background: linear-gradient(90deg, #00ff88, #00cc66);
                box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
            }
            
            .health-fill.low {
                background: linear-gradient(90deg, #ff4444, #cc0000);
                box-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
            }
            
            .health-fill.critical {
                background: linear-gradient(90deg, #ff0000, #990000);
                box-shadow: 0 0 12px rgba(255, 0, 0, 0.8);
                animation: critical-pulse 0.5s infinite alternate;
            }
            
            .mana-fill {
                background: linear-gradient(90deg, #0088ff, #0066cc);
                box-shadow: 0 0 8px rgba(0, 136, 255, 0.5);
            }
            
            @keyframes critical-pulse {
                from { opacity: 0.7; }
                to { opacity: 1; }
            }
            
            .level-info h3 {
                color: var(--accent-color, #00ff88);
                margin: 0 0 10px 0;
                font-size: 14px;
                text-shadow: 2px 2px 0 #000;
            }
            
            .objective {
                color: white;
                font-size: 9px;
                line-height: 1.4;
            }
            
            .flash {
                animation: flash-animation 0.3s ease-in-out;
            }
            
            @keyframes flash-animation {
                0%, 100% { background-color: transparent; }
                50% { background-color: rgba(255, 255, 255, 0.2); }
            }
            
            .warning {
                color: #ffff00 !important;
                animation: warning-pulse 1s infinite;
            }
            
            @keyframes warning-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            .danger {
                color: #ff4444 !important;
                animation: danger-pulse 0.5s infinite;
            }
            
            @keyframes danger-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            
            /* Responsivo para mobile */
            @media (max-width: 768px) {
                .game-hud {
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    font-size: 8px;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .hud-left, .hud-right, .hud-center {
                    padding: 10px;
                }
                
                .hud-center {
                    order: -1;
                }
                
                .player-stats, .game-stats {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .health-bar, .mana-bar {
                    width: 60px;
                    height: 10px;
                }
                
                .stat-item {
                    font-size: 7px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    updateHealth(current, max) {
        const percentage = (current / max) * 100;
        const healthFill = this.elements.healthFill;

        healthFill.style.width = `${percentage}%`;
        this.elements.healthText.textContent = `${current}/${max}`;

        // Aplicar classes baseadas na porcentagem de vida
        healthFill.classList.remove('low', 'critical');

        if (percentage <= 15) {
            healthFill.classList.add('critical');
            this.flashElement(this.elements.healthText, 'danger');
        } else if (percentage <= 30) {
            healthFill.classList.add('low');
            this.flashElement(this.elements.healthText, 'warning');
        } else {
            this.removeFlash(this.elements.healthText);
        }

        // Efeito de dano
        if (current < this.lastHealth) {
            this.flashElement(healthFill.parentElement, 'flash');
        }

        this.lastHealth = current;
    }

    updateMana(current, max) {
        const percentage = (current / max) * 100;

        this.elements.manaFill.style.width = `${percentage}%`;
        this.elements.manaText.textContent = `${Math.floor(current)}/${max}`;

        // Aviso de mana baixa
        if (percentage <= 20) {
            this.flashElement(this.elements.manaText, 'warning');
        } else {
            this.removeFlash(this.elements.manaText);
        }
    }

    updateScore(score) {
        this.elements.scoreText.textContent = score.toLocaleString();

        // Efeito de aumento de pontuação
        if (score > this.lastScore) {
            this.flashElement(this.elements.scoreText, 'flash');
        }

        this.lastScore = score;
    }

    updateEnemies(defeated, total) {
        this.elements.enemiesCount.textContent = `${defeated}/${total}`;

        // Progresso visual
        const percentage = (defeated / total) * 100;
        if (percentage >= 80) {
            this.elements.enemiesCount.style.color = '#00ff88';
        } else if (percentage >= 50) {
            this.elements.enemiesCount.style.color = '#ffff00';
        } else {
            this.elements.enemiesCount.style.color = '#ffffff';
        }

        // Efeito ao derrotar inimigo
        if (defeated > this.lastEnemiesDefeated) {
            this.flashElement(this.elements.enemiesCount, 'flash');
        }

        this.lastEnemiesDefeated = defeated;
    }

    updateTimer(timeRemaining) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        this.elements.timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Aviso de tempo
        if (timeRemaining <= 30000) { // 30 segundos
            this.flashElement(this.elements.timerText, 'danger');
        } else if (timeRemaining <= 60000) { // 1 minuto
            this.flashElement(this.elements.timerText, 'warning');
        } else {
            this.removeFlash(this.elements.timerText);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            // O timer será atualizado pelo GameLevel
        }, 1000);
    }

    flashElement(element, className) {
        if (!element) return;

        element.classList.remove('flash', 'warning', 'danger');

        if (className === 'flash') {
            element.classList.add('flash');
            setTimeout(() => {
                element.classList.remove('flash');
            }, 300);
        } else {
            element.classList.add(className);
            this.flashingElements.add(element);
        }
    }

    removeFlash(element) {
        if (!element) return;

        element.classList.remove('warning', 'danger');
        this.flashingElements.delete(element);
    }

    showMessage(text, duration = 3000, type = 'info') {
        const message = document.createElement('div');
        message.className = `hud-message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26, 35, 50, 0.95);
            color: white;
            padding: 20px 30px;
            border: 2px solid var(--accent-color, #00ff88);
            border-radius: 8px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            z-index: 100;
            animation: message-appear 0.3s ease-out;
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.animation = 'message-disappear 0.3s ease-in forwards';
            setTimeout(() => {
                if (message.parentElement) {
                    message.parentElement.removeChild(message);
                }
            }, 300);
        }, duration);
    }

    hide() {
        this.isVisible = false;
        this.hudContainer.style.display = 'none';
    }

    show() {
        this.isVisible = true;
        this.hudContainer.style.display = 'flex';
    }

    destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        if (this.hudContainer && this.hudContainer.parentElement) {
            this.hudContainer.parentElement.removeChild(this.hudContainer);
        }

        // Remover elementos piscando
        this.flashingElements.clear();
    }
}

// Adicionar animações CSS necessárias
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes message-appear {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    @keyframes message-disappear {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
`;
document.head.appendChild(messageStyles);
