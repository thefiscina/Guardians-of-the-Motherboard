/**
 * Game - Lógica principal do jogo
 * Gerencia estados, colisões, geração de mundo, pontuação e dificuldade
 */

import { Player, Platform, Enemy, Bullet, Pool, Collision } from './entities.js';
import { rand, randInt, chance, clamp, CONSTANTS, Storage } from './utils.js';

export class Game {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;

        // Estados do jogo
        this.state = 'menu'; // menu, playing, paused, gameover

        // Entidades principais
        this.player = new Player();

        // Object pools para performance
        this.platformPool = new Pool(Platform, 80);
        this.enemyPool = new Pool(Enemy, 40);
        this.bulletPool = new Pool(Bullet, 60);

        // Arrays de entidades ativas
        this.platforms = [];
        this.enemies = [];
        this.bullets = [];

        // Sistema de pontuação e progressão
        this.score = 100; // Começar com 100 pontos
        this.bestScore = Storage.get('bestScore', 0);
        this.maxHeightReached = 0; // Maior altura (menor Y) alcançada
        this.tier = 0;
        this.nextTierScore = CONSTANTS.POINTS_PER_TIER;

        // Sistema de câmera
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.cameraSpeed = 8;

        // Sistema de geração de mundo
        this.lastPlatformY = 0;
        this.generationHeight = -2000; // Gerar plataformas até esta altura

        // Timers e estados
        this.damageTimer = 0;
        this.fallPenaltyTimer = 0;
        this.difficultyParams = this.calculateDifficultyParams(0);

        // Eventos e callbacks
        this.onScoreChange = null;
        this.onGameOver = null;
        this.onPlayerDamage = null;

        this.reset();
    }

    /**
     * Reinicia o jogo para um novo round
     */
    reset() {
        // Limpar entidades ativas
        this.platforms.length = 0;
        this.enemies.length = 0;
        this.bullets.length = 0;

        // Devolver todos os objetos aos pools
        this.platformPool.releaseAll();
        this.enemyPool.releaseAll();
        this.bulletPool.releaseAll();

        // Resetar player
        this.player.reset();
        this.player.x = this.width / 2;
        this.player.y = this.height - 100;

        // Resetar progressão
        this.score = 100; // Começar com 100 pontos
        this.maxHeightReached = this.player.y;
        this.tier = 0;
        this.nextTierScore = CONSTANTS.POINTS_PER_TIER;
        this.difficultyParams = this.calculateDifficultyParams(0);

        // Resetar câmera
        this.cameraY = 0;
        this.targetCameraY = 0;

        // Resetar timers
        this.damageTimer = 0;
        this.fallPenaltyTimer = 0;

        // Gerar mundo inicial
        this.lastPlatformY = this.player.y + 40;
        this.generateInitialPlatforms();
        this.generationHeight = this.lastPlatformY - this.height * 3;

        // Definir estado
        this.state = 'playing';
    }

    /**
     * Calcula parâmetros de dificuldade baseado no tier atual - TUNED
     */
    calculateDifficultyParams(tier) {
        return {
            // Física do player - progressão suave
            gravity: CONSTANTS.GRAVITY + tier * 60,
            jumpVelocity: CONSTANTS.JUMP_VELOCITY + tier * 15,
            acceleration: CONSTANTS.PLAYER_ACCELERATION + tier * 80,
            maxVelocityX: CONSTANTS.MAX_VELOCITY_X + tier * 12,

            // Geração de plataformas - aumento gradual de dificuldade
            platformGapY: CONSTANTS.PLATFORM_GAP_Y + tier * 6,
            platformWidthMin: Math.max(50, CONSTANTS.MIN_PLATFORM_WIDTH - tier * 2),
            platformWidthMax: Math.max(70, CONSTANTS.MAX_PLATFORM_WIDTH - tier * 4),
            movingPlatformChance: Math.min(0.4, 0.15 + tier * 0.025), // Começar com 15% e aumentar

            // Inimigos - spawn mais conservador
            enemySpawnChance: Math.min(0.28, CONSTANTS.ENEMY_SPAWN_CHANCE + tier * 0.02),
            shooterRatio: Math.min(0.6, CONSTANTS.SHOOTER_CHANCE + tier * 0.05),
            bulletSpeed: CONSTANTS.BULLET_SPEED + tier * 20,
            enemyMoveSpeed: 35 + tier * 6,

            // Penalidades - mais forgiving
            fallPenaltyRate: CONSTANTS.FALL_PENALTY_PER_SEC + tier * 1,
            damageAmount: CONSTANTS.ENEMY_DAMAGE + tier * 1.5
        };
    }

    /**
     * Gera plataformas iniciais para começar o jogo
     */
    generateInitialPlatforms() {
        const startY = this.player.y + 40;

        // Primeira plataforma grande logo abaixo do player - agora também se move horizontalmente
        this.spawnPlatform(this.width / 2, startY, 120, 'horizontal', 25);

        let currentY = startY;

        // Gerar 15-20 plataformas iniciais com dificuldade progressiva
        for (let i = 0; i < 18; i++) {
            currentY -= rand(50, 70); // Gap menor no início

            const x = rand(60, this.width - 60);
            const width = rand(80, 120);

            // TODAS as plataformas se movem - determinar tipo de movimento
            let platformType = 'horizontal'; // Padrão horizontal
            let moveSpeed = 0;

            const typeRoll = Math.random();
            if (typeRoll < 0.6) { // 60% chance de horizontal
                platformType = 'horizontal';
                moveSpeed = chance(0.5) ? rand(20, 40) : -rand(20, 40);
            } else if (typeRoll < 0.85) { // 25% chance de vertical
                platformType = 'vertical';
                moveSpeed = chance(0.5) ? rand(15, 30) : -rand(15, 30);
            } else { // 15% chance de explosiva
                platformType = 'explosive';
            }

            this.spawnPlatform(x, currentY, width, platformType, moveSpeed);
        }

        this.lastPlatformY = currentY;
    }    /**
     * Cria uma nova plataforma
     */
    spawnPlatform(x, y, width, platformType = 'normal', moveSpeed = 0) {
        const platform = this.platformPool.get();
        platform.init(x, y, width, platformType, moveSpeed);
        this.platforms.push(platform);

        // Chance de spawnar inimigo na plataforma (reduzida para plataformas móveis e explosivas)
        let enemyChance = this.difficultyParams.enemySpawnChance;
        if (platformType === 'horizontal' || platformType === 'vertical') {
            enemyChance *= 0.6;
        } else if (platformType === 'explosive') {
            enemyChance *= 0.3; // Muito baixa chance em plataformas explosivas
        }

        if (chance(enemyChance)) {
            this.spawnEnemy(x, y - 25, platform);
        }

        return platform;
    }

    /**
     * Cria um novo inimigo
     */
    spawnEnemy(x, y, platform = null) {
        const enemy = this.enemyPool.get();
        const isShooter = chance(this.difficultyParams.shooterRatio);
        enemy.init(x, y, isShooter ? 'shooter' : 'touch', platform);
        enemy.vx = rand(-this.difficultyParams.enemyMoveSpeed, this.difficultyParams.enemyMoveSpeed);
        this.enemies.push(enemy);

        return enemy;
    }

    /**
     * Cria um projétil
     */
    spawnBullet(x, y, targetX, targetY) {
        const bullet = this.bulletPool.get();

        // Calcular direção para o alvo (geralmente o player)
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const speed = this.difficultyParams.bulletSpeed;
            bullet.init(x, y, (dx / distance) * speed, (dy / distance) * speed);
        } else {
            // Fallback: atirar para baixo
            bullet.init(x, y, 0, this.difficultyParams.bulletSpeed);
        }

        this.bullets.push(bullet);
        return bullet;
    }

    /**
     * Gera novas plataformas acima da área visível
     */
    generatePlatforms() {
        // Continuar gerando enquanto não temos plataformas suficientes acima
        while (this.lastPlatformY > this.generationHeight) {
            const gap = rand(
                this.difficultyParams.platformGapY * 0.8,
                this.difficultyParams.platformGapY * 1.3
            );

            this.lastPlatformY -= gap;

            const x = rand(60, this.width - 60);
            const width = rand(
                this.difficultyParams.platformWidthMin,
                this.difficultyParams.platformWidthMax
            );

            // TODAS as plataformas se movem - determinar tipo de movimento
            let platformType = 'horizontal'; // Padrão horizontal
            let moveSpeed = 0;

            const horizontalChance = 0.6; // 60% horizontais
            const verticalChance = 0.25;  // 25% verticais
            const explosiveChance = Math.min(0.15, 0.05 + this.tier * 0.01); // 15% explosivas, aumenta com dificuldade

            const typeRoll = Math.random();
            if (typeRoll < horizontalChance) {
                platformType = 'horizontal';
                moveSpeed = chance(0.5) ? rand(25, 45) : -rand(25, 45);
            } else if (typeRoll < horizontalChance + verticalChance) {
                platformType = 'vertical';
                moveSpeed = chance(0.5) ? rand(20, 35) : -rand(20, 35);
            } else if (typeRoll < horizontalChance + verticalChance + explosiveChance) {
                platformType = 'explosive';
            } else {
                // Fallback para horizontal se não encaixar em nenhuma categoria
                platformType = 'horizontal';
                moveSpeed = chance(0.5) ? rand(25, 45) : -rand(25, 45);
            } this.spawnPlatform(x, this.lastPlatformY, width, platformType, moveSpeed);
        }

        // Ajustar altura de geração baseada na câmera
        this.generationHeight = this.cameraY - this.height * 2;
    }

    /**
     * Atualiza o jogo por um frame
     */
    update(deltaTime, input) {
        if (this.state !== 'playing') return;

        const dt = deltaTime;

        // Atualizar player
        this.updatePlayer(dt, input);

        // Atualizar entidades
        this.updatePlatforms(dt);
        this.updateEnemies(dt);
        this.updateBullets(dt);

        // Verificar colisões
        this.checkCollisions();

        // Atualizar câmera
        this.updateCamera(dt);

        // Gerar novas plataformas
        this.generatePlatforms();

        // Atualizar pontuação
        this.updateScore(dt);

        // Limpar entidades fora da tela
        this.cleanupEntities();

        // Verificar game over
        this.checkGameOver();

        // Atualizar timers
        this.damageTimer = Math.max(0, this.damageTimer - dt);
    }

    updatePlayer(dt, input) {
        const worldBounds = { width: this.width, height: this.height };
        this.player.update(dt, input, this.difficultyParams, worldBounds);
    }

    updatePlatforms(dt) {
        const worldBounds = { width: this.width, height: this.height };
        const playerPos = { x: this.player.x, y: this.player.y };

        for (const platform of this.platforms) {
            platform.update(dt, worldBounds, playerPos);
        }
    }

    updateEnemies(dt) {
        const worldBounds = { width: this.width, height: this.height };

        for (const enemy of this.enemies) {
            enemy.update(dt, worldBounds);

            // Inimigos atiradores disparam no player
            if (enemy.canShoot() && enemy.shoot()) {
                this.spawnBullet(enemy.x, enemy.y, this.player.x, this.player.y);
            }
        }
    }

    updateBullets(dt) {
        const worldBounds = { width: this.width, height: this.height };
        for (const bullet of this.bullets) {
            bullet.update(dt, worldBounds);
        }
    }

    checkCollisions() {
        // Player vs Platforms (jumping)
        for (const platform of this.platforms) {
            if (platform.active && Collision.playerPlatform(this.player, platform)) {
                this.player.y = platform.y - platform.h / 2 - this.player.h / 2;
                this.player.onGround = true;
                this.player.jump(this.difficultyParams.jumpVelocity);

                // Marcar plataforma explosiva como pisada
                if (platform.type === 'explosive') {
                    platform.stepOn();
                }

                break; // Só uma plataforma por frame
            }
        }

        // Player vs Enemies (damage)
        if (this.damageTimer <= 0) {
            for (const enemy of this.enemies) {
                if (enemy.active && Collision.aabb(this.player, enemy)) {
                    this.takeDamage(this.difficultyParams.damageAmount);
                    break;
                }
            }
        }

        // Player vs Bullets (damage)
        if (this.damageTimer <= 0) {
            for (const bullet of this.bullets) {
                if (bullet.active && Collision.circleRect(bullet, this.player)) {
                    this.takeDamage(this.difficultyParams.damageAmount);
                    bullet.active = false; // Bullet é consumido
                    break;
                }
            }
        }
    }

    takeDamage(amount) {
        this.score = Math.max(0, this.score - amount);
        this.damageTimer = CONSTANTS.DAMAGE_COOLDOWN;
        this.player.takeDamage();

        if (this.onPlayerDamage) {
            this.onPlayerDamage(amount);
        }
    }

    updateCamera(dt) {
        // Validar dt para evitar valores inválidos
        if (!isFinite(dt) || dt <= 0) return;

        // Câmera segue o player quando ele sobe
        if (this.player.y < this.cameraY + this.height * 0.3) {
            this.targetCameraY = this.player.y - this.height * 0.3;
        }

        // Suavizar movimento da câmera com proteção contra valores não finitos
        const cameraSpeed = this.cameraSpeed || 8;
        const deltaMove = (this.targetCameraY - this.cameraY) * cameraSpeed * dt;

        if (isFinite(deltaMove)) {
            this.cameraY += deltaMove;
        }

        // Garantir que cameraY sempre seja finito
        if (!isFinite(this.cameraY)) {
            this.cameraY = 0;
        }
        if (!isFinite(this.targetCameraY)) {
            this.targetCameraY = 0;
        }
    }

    updateScore(dt) {
        // Pontuação baseada na altura máxima alcançada
        if (this.player.y < this.maxHeightReached) {
            this.maxHeightReached = this.player.y;
            const newScore = Math.floor((-this.maxHeightReached) / CONSTANTS.SCORE_PER_HEIGHT);

            if (newScore > this.score) {
                this.score = newScore;

                if (this.onScoreChange) {
                    this.onScoreChange(this.score);
                }
            }
        }

        // Penalidade por queda
        const safeCameraY = isFinite(this.cameraY) ? this.cameraY : 0;
        const safeHeight = isFinite(this.height) && this.height > 0 ? this.height : 600;
        const fallThreshold = safeCameraY + safeHeight * 0.8;
        if (this.player.y > fallThreshold) {
            this.fallPenaltyTimer += dt;

            if (this.fallPenaltyTimer >= 1) { // A cada segundo
                const penalty = Math.floor(this.difficultyParams.fallPenaltyRate);
                this.score = Math.max(0, this.score - penalty);
                this.fallPenaltyTimer = 0;

                if (this.onScoreChange) {
                    this.onScoreChange(this.score);
                }
            }
        } else {
            this.fallPenaltyTimer = 0;
        }

        // Atualizar tier de dificuldade
        const newTier = Math.floor(this.score / CONSTANTS.POINTS_PER_TIER);
        if (newTier !== this.tier) {
            this.tier = newTier;
            this.difficultyParams = this.calculateDifficultyParams(this.tier);
            this.nextTierScore = (this.tier + 1) * CONSTANTS.POINTS_PER_TIER;

            // Feedback visual para mudança de tier
            if (this.onScoreChange) {
                this.onScoreChange(this.score);
            }
        }
    }

    cleanupEntities() {
        const safeCameraY = isFinite(this.cameraY) ? this.cameraY : 0;
        const safeHeight = isFinite(this.height) ? this.height : 600;

        const cleanupY = safeCameraY + safeHeight + 500;
        const cleanupTopY = safeCameraY - 1000;

        // Remover plataformas fora da tela
        this.platforms = this.platforms.filter(platform => {
            if (!platform.active || platform.y > cleanupY || platform.y < cleanupTopY) {
                this.platformPool.release(platform);
                return false;
            }
            return true;
        });

        // Remover inimigos fora da tela
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.active || enemy.y > cleanupY || enemy.y < cleanupTopY) {
                this.enemyPool.release(enemy);
                return false;
            }
            return true;
        });

        // Remover balas fora da tela ou inativas
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.active) {
                this.bulletPool.release(bullet);
                return false;
            }
            return true;
        });
    }

    checkGameOver() {
        // Game over se o score for negativo ou se o player cair muito
        const safeCameraY = isFinite(this.cameraY) ? this.cameraY : 0;
        const safeHeight = isFinite(this.height) && this.height > 0 ? this.height : 600;
        const fallLimit = safeCameraY + safeHeight * 1.5; // Limite mais generoso

        if (this.score < 0 || this.player.y > fallLimit) {
            this.gameOver();
        }
    }

    gameOver() {
        if (this.state === 'gameover') return;

        this.state = 'gameover';

        // Atualizar melhor pontuação
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            Storage.set('bestScore', this.bestScore);
        }

        if (this.onGameOver) {
            this.onGameOver(this.score, this.bestScore);
        }
    }

    /**
     * Desenha o jogo
     */
    draw(ctx) {
        ctx.save();

        // Validar cameraY antes de aplicar transformação
        const safeCameraY = isFinite(this.cameraY) ? this.cameraY : 0;

        // Aplicar transformação da câmera
        ctx.translate(0, -safeCameraY);

        // Fundo gradiente
        this.drawBackground(ctx);

        // Desenhar entidades
        this.drawPlatforms(ctx);
        this.drawEnemies(ctx);
        this.drawBullets(ctx);
        this.drawPlayer(ctx);

        // Efeitos visuais
        this.drawEffects(ctx);

        ctx.restore();
    }

    drawBackground(ctx) {
        // Garantir que os valores da câmera sejam finitos
        const safeCameraY = isFinite(this.cameraY) ? this.cameraY : 0;
        const safeHeight = isFinite(this.height) ? this.height : 600;

        const gradient = ctx.createLinearGradient(0, safeCameraY, 0, safeCameraY + safeHeight);

        // Cores baseadas na altura (mais escuro conforme sobe)
        const altitude = Math.max(0, -safeCameraY / 1000);
        const darkFactor = Math.min(0.8, altitude * 0.1);

        gradient.addColorStop(0, `hsl(220, 25%, ${Math.max(5, 15 - darkFactor * 10)}%)`);
        gradient.addColorStop(1, `hsl(220, 30%, ${Math.max(8, 25 - darkFactor * 15)}%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, safeCameraY, this.width, safeHeight);

        // Estrelas no fundo em altitudes altas
        if (altitude > 2) {
            this.drawStars(ctx, altitude);
        }
    }

    drawStars(ctx, altitude) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.8, (altitude - 2) * 0.2)})`;

        // Padrão pseudo-aleatório de estrelas baseado na posição da câmera
        const starDensity = 0.0005;
        const areaHeight = this.height;
        const areaTop = isFinite(this.cameraY) ? this.cameraY : 0;

        for (let y = Math.floor(areaTop / 100) * 100; y < areaTop + areaHeight; y += 100) {
            for (let x = 0; x < this.width; x += 100) {
                // Hash simples para posições consistentes
                const hash = ((x * 73 + y * 37) % 1000) / 1000;
                if (hash < starDensity * 100) {
                    const starX = x + (hash * 100) % 100;
                    const starY = y + ((hash * 137) % 100);
                    ctx.fillRect(starX, starY, 1, 1);
                }
            }
        }
    }

    drawPlatforms(ctx) {
        for (const platform of this.platforms) {
            platform.draw(ctx);
        }
    }

    drawEnemies(ctx) {
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
    }

    drawBullets(ctx) {
        for (const bullet of this.bullets) {
            bullet.draw(ctx);
        }
    }

    drawPlayer(ctx) {
        this.player.draw(ctx);
    }

    drawEffects(ctx) {
        const safeCameraY = isFinite(this.cameraY) ? this.cameraY : 0;
        const safeHeight = isFinite(this.height) ? this.height : 600;

        // Indicador de zona de queda (vermelho na parte inferior)
        const fallZone = safeCameraY + safeHeight * 0.8;
        if (this.player.y > fallZone) {
            const intensity = Math.min(1, (this.player.y - fallZone) / 100);
            ctx.fillStyle = `rgba(220, 38, 38, ${intensity * 0.3})`;
            ctx.fillRect(0, fallZone, this.width, safeHeight);
        }

        // Indicador de dano
        if (this.damageTimer > 0) {
            const intensity = this.damageTimer / CONSTANTS.DAMAGE_COOLDOWN;
            ctx.fillStyle = `rgba(239, 68, 68, ${intensity * 0.2})`;
            ctx.fillRect(0, safeCameraY, this.width, safeHeight);
        }
    }

    // Getters para estatísticas
    getEntityCounts() {
        return {
            platforms: this.platforms.length,
            enemies: this.enemies.length,
            bullets: this.bullets.length
        };
    }

    getScore() {
        return this.score;
    }

    getBestScore() {
        return this.bestScore;
    }

    getTier() {
        return this.tier;
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = newState;
    }

    // Setters para callbacks
    setCallbacks(callbacks) {
        this.onScoreChange = callbacks.onScoreChange;
        this.onGameOver = callbacks.onGameOver;
        this.onPlayerDamage = callbacks.onPlayerDamage;
    }
}

export default Game;
