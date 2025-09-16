// src/level.js - Sistema de nível e plataformas
import { Player } from './player.js';
import { EnemyManager } from './enemy.js';

export class GameLevel {
    constructor(app, gameData, callbacks = {}) {
        this.app = app;
        this.gameData = gameData;
        this.callbacks = callbacks;

        // Configurações do nível
        this.groundY = app.renderer.height - 80;
        this.platforms = [];
        this.isPaused = false;

        // Componentes do jogo
        this.player = null;
        this.enemyManager = null;
        this.levelContainer = new PIXI.Container();
        this.backgroundContainer = new PIXI.Container();
        this.foregroundContainer = new PIXI.Container();

        // Objetivos do nível
        this.requiredEnemiesDefeated = 10;
        this.timeLimit = 180000; // 3 minutos em ms
        this.currentTime = 0;

        this.init();
    }

    async init() {
        // Configurar containers
        this.app.stage.addChild(this.backgroundContainer);
        this.app.stage.addChild(this.levelContainer);
        this.app.stage.addChild(this.foregroundContainer);

        // Criar background
        await this.createBackground();

        // Criar plataformas
        this.createPlatforms();

        // Criar jogador
        this.player = new Player(this.app, {
            onHealthChange: this.callbacks.onHealthChange,
            onPlayerDeath: this.callbacks.onPlayerDeath
        });

        // Aguardar inicialização completa do player
        await this.waitForPlayerInit();

        // Conectar o player ao nível para acesso aos inimigos
        this.player.setLevel(this);

        // Criar gerenciador de inimigos
        this.enemyManager = new EnemyManager(this.app, this);
        this.gameData.totalEnemies = this.requiredEnemiesDefeated;

        // Spawnar inimigos iniciais
        await this.spawnInitialEnemies();

        // Mostrar texto "LEVEL 1"
        this.showLevelText();

        // Iniciar loop do jogo
        this.startGameLoop();
    }

    async waitForPlayerInit() {
        // Aguardar até que o sprite do player seja criado
        return new Promise((resolve) => {
            const checkPlayer = () => {
                if (this.player && this.player.sprite) {
                    resolve();
                } else {
                    setTimeout(checkPlayer, 50);
                }
            };
            checkPlayer();
        });
    }

    async createBackground() {
        // Criar fundo degradê
        const bg = new PIXI.Graphics();
        bg.beginFill(0x0b1020);
        bg.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
        bg.endFill();

        // Adicionar linhas de circuito como decoração
        bg.lineStyle(1, 0x00ff88, 0.3);
        for (let i = 0; i < 10; i++) {
            const y = Math.random() * this.app.renderer.height;
            bg.moveTo(0, y);
            bg.lineTo(this.app.renderer.width, y);
        }

        for (let i = 0; i < 15; i++) {
            const x = Math.random() * this.app.renderer.width;
            bg.moveTo(x, 0);
            bg.lineTo(x, this.app.renderer.height);
        }

        this.backgroundContainer.addChild(bg);

        // Tentar carregar o tileset
        try {
            const tilesetTexture = await PIXI.Assets.load('assets/tilesets/motherboard_16x16.png');
            this.createTiledBackground(tilesetTexture);
        } catch (error) {
            console.warn('Não foi possível carregar o tileset:', error);
        }
    }

    createTiledBackground(tilesetTexture) {
        // Criar sprites do tileset para um cenário mais elaborado
        const tileSize = 16;
        const tilesX = Math.ceil(this.app.renderer.width / tileSize);
        const tilesY = Math.ceil(this.app.renderer.height / tileSize);

        // Criar diferentes variações de tiles do tileset
        const tileVariations = [];
        const cols = Math.floor(tilesetTexture.width / tileSize);
        const rows = Math.floor(tilesetTexture.height / tileSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const rect = new PIXI.Rectangle(col * tileSize, row * tileSize, tileSize, tileSize);
                tileVariations.push(new PIXI.Texture(tilesetTexture.baseTexture, rect));
            }
        }

        // Criar padrão de fundo com tiles
        for (let x = 0; x < tilesX; x++) {
            for (let y = 0; y < tilesY; y++) {
                // Densidade baseada na posição
                let probability = 0.1; // Base

                // Mais denso no chão
                if (y > tilesY * 0.8) probability = 0.4;
                // Circuitos esparsos no meio
                else if (y > tilesY * 0.3) probability = 0.15;
                // Raro no topo
                else probability = 0.05;

                if (Math.random() < probability) {
                    const tileIndex = Math.floor(Math.random() * tileVariations.length);
                    const tile = new PIXI.Sprite(tileVariations[tileIndex]);

                    tile.width = tileSize;
                    tile.height = tileSize;
                    tile.x = x * tileSize;
                    tile.y = y * tileSize;
                    tile.alpha = 0.4;
                    tile.tint = 0x00ff88;

                    this.backgroundContainer.addChild(tile);
                }
            }
        }

        // Adicionar linhas de conexão para simular circuitos
        this.createCircuitLines();
    }

    createCircuitLines() {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(1, 0x00ff88, 0.3);

        // Linhas horizontais
        for (let i = 0; i < 8; i++) {
            const y = (this.app.renderer.height / 8) * i;
            graphics.moveTo(0, y);
            graphics.lineTo(this.app.renderer.width, y);

            // Adicionar "nós" nos circuitos
            for (let j = 0; j < 15; j++) {
                const x = (this.app.renderer.width / 15) * j;
                if (Math.random() < 0.3) {
                    graphics.beginFill(0x00ff88, 0.5);
                    graphics.drawCircle(x, y, 2);
                    graphics.endFill();
                }
            }
        }

        // Linhas verticais
        for (let i = 0; i < 12; i++) {
            const x = (this.app.renderer.width / 12) * i;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.app.renderer.height);
        }

        this.backgroundContainer.addChild(graphics);
    }

    createPlatforms() {
        // Chão principal com visual de motherboard
        const ground = this.createTiledPlatform(0, this.groundY, this.app.renderer.width, 80, true);
        this.platforms.push(ground);

        // Plataformas flutuantes com design de circuitos
        const platforms = [
            { x: 200, y: 450, width: 150, height: 20 },
            { x: 450, y: 380, width: 120, height: 20 },
            { x: 700, y: 320, width: 150, height: 20 },
            { x: 100, y: 300, width: 100, height: 20 },
            { x: 800, y: 450, width: 120, height: 20 },
        ];

        platforms.forEach(platform => {
            const p = this.createTiledPlatform(platform.x, platform.y, platform.width, platform.height, false);
            this.platforms.push(p);
        });
    }

    createTiledPlatform(x, y, width, height, isGround = false) {
        const container = new PIXI.Container();

        // Base da plataforma
        const platform = new PIXI.Graphics();
        const baseColor = isGround ? 0x1a4d1a : 0x1a2332;

        platform.beginFill(baseColor);
        platform.drawRect(0, 0, width, height);
        platform.endFill();

        // Borda tecnológica
        platform.lineStyle(2, 0x00ff88, 0.8);
        platform.drawRect(0, 0, width, height);

        // Adicionar padrão de circuito na superfície
        if (isGround) {
            platform.lineStyle(1, 0x00ff88, 0.6);
            for (let i = 0; i < width; i += 32) {
                platform.moveTo(i, 0);
                platform.lineTo(i + 16, 8);
                platform.lineTo(i + 32, 0);
            }
        }

        container.addChild(platform);
        container.x = x;
        container.y = y;

        this.levelContainer.addChild(container);

        return {
            x: x,
            y: y,
            width: width,
            height: height,
            sprite: container
        };
    }

    async spawnInitialEnemies() {
        // Spawnar alguns inimigos iniciais
        await this.enemyManager.spawnEnemy(800, 400);
        await this.enemyManager.spawnEnemy(150, 400);
        await this.enemyManager.spawnEnemy(600, 300);
    }

    showLevelText() {
        const levelText = new PIXI.Text('LEVEL 1', {
            fontFamily: 'monospace',
            fontSize: 48,
            fill: 0x00ff88,
            stroke: 0x000000,
            strokeThickness: 4,
            align: 'center'
        });

        levelText.anchor.set(0.5);
        levelText.x = this.app.renderer.width / 2;
        levelText.y = this.app.renderer.height / 2 - 100;

        this.foregroundContainer.addChild(levelText);

        // Animação de entrada
        levelText.alpha = 0;
        levelText.scale.set(0.5);

        const animateIn = () => {
            levelText.alpha += 0.02;
            levelText.scale.x += 0.01;
            levelText.scale.y += 0.01;

            if (levelText.alpha < 1) {
                requestAnimationFrame(animateIn);
            } else {
                // Aguardar e depois fazer fade out
                setTimeout(() => {
                    const animateOut = () => {
                        levelText.alpha -= 0.02;
                        if (levelText.alpha > 0) {
                            requestAnimationFrame(animateOut);
                        } else {
                            this.foregroundContainer.removeChild(levelText);
                        }
                    };
                    animateOut();
                }, 2000);
            }
        };

        animateIn();
    }

    startGameLoop() {
        let lastTime = performance.now();

        const gameLoop = (currentTime) => {
            if (this.isPaused) {
                lastTime = currentTime;
                requestAnimationFrame(gameLoop);
                return;
            }

            const deltaTime = Math.min(0.033, (currentTime - lastTime) / 1000);
            lastTime = currentTime;

            this.update(deltaTime);
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    update(deltaTime) {
        if (this.isPaused) return;

        // Atualizar timer
        this.currentTime += deltaTime * 1000;

        // Atualizar HUD com tempo restante
        if (this.callbacks.hud) {
            this.callbacks.hud.updateTimer(this.getRemainingTime());
        }

        // Verificar limite de tempo
        if (this.currentTime >= this.timeLimit) {
            this.callbacks.onPlayerDeath?.();
            return;
        }

        // Atualizar jogador
        if (this.player && this.player.isAlive) {
            this.player.update(deltaTime);
            this.checkPlayerCollisions();

            // Atualizar stats no HUD (vida e mana)
            if (this.callbacks.hud && this.player.magicSystem) {
                const health = this.player.health;
                const mana = this.player.magicSystem.mana;
                this.callbacks.hud.updateStats(health, mana);
            }
        }

        // Atualizar inimigos
        if (this.enemyManager && this.player) {
            this.enemyManager.update(deltaTime, this.player);

            // Verificar colisões dos feitiços com inimigos
            if (this.player.magicSystem) {
                this.enemyManager.checkSpellCollisions(this.player.magicSystem.spells);
            }
        }

        // Verificar condições de vitória
        this.checkVictoryConditions();
    }

    checkPlayerCollisions() {
        // Verificar se o player e sprite existem
        if (!this.player || !this.player.sprite) {
            return;
        }

        // Verificar colisão com plataformas
        let onGround = false;

        this.platforms.forEach(platform => {
            if (this.player.checkCollision(platform)) {
                // Verificar se está caindo na plataforma
                if (this.player.velocity.y >= 0 &&
                    this.player.sprite.y - this.player.sprite.height < platform.y + 10) {

                    this.player.sprite.y = platform.y;
                    this.player.velocity.y = 0;
                    this.player.isGrounded = true;
                    onGround = true;
                }
            }
        });

        // Verificar chão principal
        if (!onGround) {
            this.player.checkGroundCollision(this.groundY);
        }

        // Verificar se caiu do mapa
        if (this.player.sprite.y > this.app.renderer.height + 100) {
            this.player.takeDamage(this.player.health); // Morte instantânea
        }
    }

    checkVictoryConditions() {
        // Verificar se derrotou inimigos suficientes
        if (this.gameData.enemiesDefeated >= this.requiredEnemiesDefeated) {
            this.callbacks.onLevelComplete?.();
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    getRemainingTime() {
        return Math.max(0, this.timeLimit - this.currentTime);
    }

    getProgress() {
        return {
            enemiesDefeated: this.gameData.enemiesDefeated,
            totalEnemies: this.requiredEnemiesDefeated,
            timeRemaining: this.getRemainingTime(),
            timeLimit: this.timeLimit
        };
    }

    destroy() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        if (this.enemyManager) {
            this.enemyManager.destroy();
            this.enemyManager = null;
        }

        // Limpar containers
        this.backgroundContainer.removeChildren();
        this.levelContainer.removeChildren();
        this.foregroundContainer.removeChildren();

        if (this.backgroundContainer.parent) {
            this.backgroundContainer.parent.removeChild(this.backgroundContainer);
        }
        if (this.levelContainer.parent) {
            this.levelContainer.parent.removeChild(this.levelContainer);
        }
        if (this.foregroundContainer.parent) {
            this.foregroundContainer.parent.removeChild(this.foregroundContainer);
        }
    }
}
