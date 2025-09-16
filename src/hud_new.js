// src/hud.js - Interface do usuário do jogo
export class GameHUD {
    constructor(gameData) {
        this.gameData = gameData;
        this.hudElement = null;
        this.isVisible = true;
        this.currentPower = null;
        this.powerMode = false; // false = magia normal, true = poderes JS

        this.init();
    }

    init() {
        this.createHUDElement();
        this.updateInitialValues();
    }

    createHUDElement() {
        // Remover HUD existente se houver
        const existingHUD = document.querySelector('.game-hud');
        if (existingHUD) {
            existingHUD.remove();
        }

        // Criar container principal do HUD
        this.hudElement = document.createElement('div');
        this.hudElement.className = 'game-hud';

        this.hudElement.innerHTML = `
            <div class="hud-left">
                <div class="stat-group">
                    <div class="stat-label">VIDA</div>
                    <div class="stat-bar">
                        <div class="stat-bar-bg"></div>
                        <div class="stat-bar-fill health-fill" id="health-fill"></div>
                        <div class="stat-text" id="health-text">100/100</div>
                    </div>
                </div>
                
                <div class="stat-group">
                    <div class="stat-label">MANA</div>
                    <div class="stat-bar">
                        <div class="stat-bar-bg"></div>
                        <div class="stat-bar-fill mana-fill" id="mana-fill"></div>
                        <div class="stat-text" id="mana-text">100/100</div>
                    </div>
                </div>
                
                <div class="power-info" id="power-info">
                    <div class="power-mode" id="power-mode">MAGIC MODE</div>
                    <div class="current-power" id="current-power">Normal Spell</div>
                    <div class="power-hint">Q: Alternar | E: Trocar</div>
                </div>
            </div>
            
            <div class="hud-center">
                <div class="level-title" id="level-title">LEVEL 1</div>
                <div class="objectives">
                    <div class="objective" id="enemies-objective">
                        Vírus: <span id="enemies-count">0/10</span>
                    </div>
                    <div class="objective" id="timer-objective">
                        Tempo: <span id="timer-text">3:00</span>
                    </div>
                </div>
            </div>
            
            <div class="hud-right">
                <div class="score-display">
                    <div class="score-label">PONTUAÇÃO</div>
                    <div class="score-value" id="score-text">0</div>
                </div>
                
                <div class="controls-hint">
                    <div class="control-line">WASD: Mover</div>
                    <div class="control-line">Mouse: Atacar</div>
                    <div class="control-line">Q/E: Poderes</div>
                </div>
            </div>
        `;

        document.body.appendChild(this.hudElement);
        this.addHUDStyles();
    }

    updateInitialValues() {
        if (this.gameData) {
            this.updateStats(this.gameData.player?.health || 100, this.gameData.player?.mana || 100);
            this.updateScore(this.gameData.score || 0);
            this.updateEnemyCount(0, this.gameData.level?.enemyTarget || 10);
            this.updateTimer(this.gameData.level?.timeLimit || 180);
        }
    }

    updateStats(health, mana) {
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        const manaFill = document.getElementById('mana-fill');
        const manaText = document.getElementById('mana-text');

        if (healthFill && healthText) {
            const healthPercent = Math.max(0, Math.min(100, health));
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = `${Math.floor(health)}/100`;
        }

        if (manaFill && manaText) {
            const manaPercent = Math.max(0, Math.min(100, mana));
            manaFill.style.width = `${manaPercent}%`;
            manaText.textContent = `${Math.floor(mana)}/100`;
        }
    }

    updateScore(score) {
        const scoreText = document.getElementById('score-text');
        if (scoreText) {
            scoreText.textContent = score.toString();
        }
    }

    updateEnemyCount(current, total) {
        const enemiesCount = document.getElementById('enemies-count');
        if (enemiesCount) {
            enemiesCount.textContent = `${current}/${total}`;
        }
    }

    updateTimer(timeInSeconds) {
        const timerText = document.getElementById('timer-text');
        if (timerText) {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updatePowerInfo(powerMode, currentPower) {
        this.powerMode = powerMode;
        this.currentPower = currentPower;

        const powerModeEl = document.getElementById('power-mode');
        const currentPowerEl = document.getElementById('current-power');

        if (powerModeEl) {
            powerModeEl.textContent = powerMode ? 'JS POWER MODE' : 'MAGIC MODE';
            powerModeEl.className = powerMode ? 'power-mode power-mode-active' : 'power-mode';
        }

        if (currentPowerEl) {
            if (powerMode && currentPower) {
                currentPowerEl.textContent = currentPower.name || 'Normal Spell';
            } else {
                currentPowerEl.textContent = 'Normal Spell';
            }
        }
    }

    show() {
        if (this.hudElement) {
            this.hudElement.style.display = 'flex';
            this.isVisible = true;
        }
    }

    hide() {
        if (this.hudElement) {
            this.hudElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    destroy() {
        if (this.hudElement) {
            this.hudElement.remove();
        }
    }

    addHUDStyles() {
        if (document.getElementById('hud-styles')) return;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'hud-styles';
        styleSheet.textContent = `
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
                display: flex;
                flex-direction: column;
                gap: 10px;
                background: rgba(0, 0, 0, 0.8);
                padding: 15px;
                border: 2px solid #00ff00;
                border-radius: 5px;
                backdrop-filter: blur(5px);
            }

            .stat-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .stat-label {
                color: #00ff00;
                font-size: 8px;
                text-align: center;
            }

            .stat-bar {
                position: relative;
                width: 120px;
                height: 12px;
                border: 1px solid #00ff00;
                background: rgba(0, 0, 0, 0.5);
            }

            .stat-bar-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.1);
            }

            .stat-bar-fill {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                transition: width 0.3s ease;
            }

            .health-fill {
                background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00);
            }

            .mana-fill {
                background: linear-gradient(90deg, #0000ff, #00ffff);
            }

            .stat-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 6px;
                text-shadow: 1px 1px 0 black;
            }

            .power-info {
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #ffff00;
                background: rgba(255, 255, 0, 0.1);
                text-align: center;
            }

            .power-mode {
                color: #ffff00;
                font-size: 8px;
                margin-bottom: 5px;
            }

            .power-mode-active {
                color: #ff00ff;
                animation: pulse 1s infinite;
            }

            .current-power {
                color: white;
                font-size: 7px;
                margin-bottom: 5px;
            }

            .power-hint {
                color: #888;
                font-size: 6px;
            }

            .level-title {
                color: #00ff00;
                font-size: 12px;
                text-align: center;
                margin-bottom: 10px;
            }

            .objectives {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .objective {
                color: white;
                font-size: 8px;
                text-align: center;
            }

            .score-display {
                text-align: center;
                margin-bottom: 15px;
            }

            .score-label {
                color: #00ff00;
                font-size: 8px;
                margin-bottom: 5px;
            }

            .score-value {
                color: #ffff00;
                font-size: 14px;
            }

            .controls-hint {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }

            .control-line {
                color: #888;
                font-size: 6px;
                text-align: center;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @media (max-width: 768px) {
                .game-hud {
                    flex-direction: column;
                    gap: 10px;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                }

                .hud-left, .hud-right, .hud-center {
                    width: 100%;
                    padding: 10px;
                }

                .stat-bar {
                    width: 100px;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}
