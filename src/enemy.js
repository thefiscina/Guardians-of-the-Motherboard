// src/enemy.js - Sistema de inimigos vírus
import { sliceGrid } from './sliceSheet.js';

export class Enemy {
    constructor(app, x, y, type = 'virus') {
        this.app = app;
        this.type = type;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 60;
        this.damage = 20;
        this.isAlive = true;
        this.attackCooldown = 0;
        this.attackDelay = 2000; // 2 segundos

        // Movimento
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.patrolDistance = 150;
        this.startX = x;
        this.velocity = { x: 0, y: 0 };
        this.gravity = 800;
        this.isGrounded = false;

        // Estados
        this.state = 'patrol'; // patrol, chase, attack, dead
        this.alertRange = 120;
        this.attackRange = 50;

        // Animação
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        this.animations = {};

        this.createSprite(x, y);
    }

    async createSprite(x, y) {
        try {
            // Carregar sprite do vírus
            const virusTexture = await PIXI.Assets.load('assets/sprites/virus.png');

            // Medidas corretas baseadas nas informações fornecidas:
            // Cada frame: 324x324px
            // Primeiro frame posição: x=358px, y=425px (incluindo espaço em branco)
            const frameWidth = 324;
            const frameHeight = 324;
            const startX = 358;
            const startY = 425;

            console.log(`Virus texture size: ${virusTexture.width}x${virusTexture.height}`);
            console.log(`Frame size: ${frameWidth}x${frameHeight}`);
            console.log(`Starting position: ${startX}, ${startY}`);

            // Criar todas as 8 texturas com as posições corretas
            const allFrames = [];
            for (let i = 0; i < 8; i++) {
                const frameX = startX + (i * frameWidth);
                const rect = new PIXI.Rectangle(frameX, startY, frameWidth, frameHeight);
                allFrames.push(new PIXI.Texture(virusTexture.baseTexture, rect));
                console.log(`Frame ${i}: x=${frameX}, y=${startY}, w=${frameWidth}, h=${frameHeight}`);
            }

            // Separar frames por direção
            this.animations = {
                walkRight: [allFrames[0], allFrames[1], allFrames[2], allFrames[3]], // Frames 0-3
                walkLeft: [allFrames[4], allFrames[5], allFrames[6], allFrames[7]],  // Frames 4-7
                idle: [allFrames[0]] // Frame inicial como idle
            };

            this.sprite = new PIXI.AnimatedSprite(this.animations.idle);
            this.sprite.anchor.set(0.5, 1.0);
            this.sprite.animationSpeed = 0.12; // Velocidade de animação

            // Configurar tamanho do sprite (reduzir do tamanho original 324px)
            const targetSize = 64; // Tamanho final do vírus no jogo
            const scale = targetSize / frameWidth;
            this.sprite.scale.set(scale);

            this.sprite.play();

        } catch (error) {
            console.warn('Não foi possível carregar virus.png, usando placeholder:', error);
            // Fallback para sprite gráfico
            this.sprite = new PIXI.Graphics();
            this.sprite.beginFill(0xff4444);
            this.sprite.drawRect(-24, -24, 48, 48);
            this.sprite.endFill();

            // Adicionar "olhos" ao vírus
            this.sprite.beginFill(0xff0000);
            this.sprite.drawCircle(-12, -12, 4);
            this.sprite.drawCircle(12, -12, 4);
            this.sprite.endFill();

            // Simular animações para o fallback
            this.animations = {
                walkRight: [this.sprite],
                walkLeft: [this.sprite],
                idle: [this.sprite]
            };
        }

        this.sprite.x = x;
        this.sprite.y = y;

        // Criar barra de vida
        this.healthBar = new PIXI.Container();
        this.healthBarBg = new PIXI.Graphics();
        this.healthBarFill = new PIXI.Graphics();

        this.updateHealthBar();

        this.healthBar.addChild(this.healthBarBg);
        this.healthBar.addChild(this.healthBarFill);
        this.healthBar.y = -40;
        this.sprite.addChild(this.healthBar);

        this.app.stage.addChild(this.sprite);
    }

    updateHealthBar() {
        const width = 30;
        const height = 4;

        this.healthBarBg.clear();
        this.healthBarBg.beginFill(0x333333);
        this.healthBarBg.drawRect(-width / 2, 0, width, height);
        this.healthBarBg.endFill();

        this.healthBarFill.clear();
        const healthPercent = this.health / this.maxHealth;
        const fillColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;

        this.healthBarFill.beginFill(fillColor);
        this.healthBarFill.drawRect(-width / 2, 0, width * healthPercent, height);
        this.healthBarFill.endFill();

        // Esconder barra se estiver com vida cheia
        this.healthBar.visible = this.health < this.maxHealth;
    }

    takeDamage(amount) {
        if (!this.isAlive || !this.sprite) return;

        this.health -= amount;
        this.updateHealthBar();

        // Efeito visual de dano
        this.sprite.tint = 0xff8888;
        setTimeout(() => {
            if (this.sprite) this.sprite.tint = 0xffffff;
        }, 150);

        if (this.health <= 0) {
            this.die();
        } else {
            // Ficar alerta quando tomar dano
            this.state = 'chase';
        }
    }

    die() {
        if (!this.isAlive || !this.sprite) return;

        this.isAlive = false;
        this.state = 'dead';

        // Animação de morte
        const deathTween = {
            alpha: this.sprite.alpha,
            scale: this.sprite.scale.x,
            rotation: this.sprite.rotation
        };

        const animate = () => {
            if (!this.sprite) return; // Verificação adicional durante a animação

            deathTween.alpha *= 0.95;
            deathTween.scale *= 0.98;
            deathTween.rotation += 0.1;

            this.sprite.alpha = deathTween.alpha;
            this.sprite.scale.set(deathTween.scale);
            this.sprite.rotation = deathTween.rotation;

            if (deathTween.alpha > 0.1) {
                requestAnimationFrame(animate);
            } else {
                this.destroy();
            }
        };

        animate();
    }

    update(deltaTime, player) {
        if (!this.isAlive || !this.sprite || !player || !player.sprite) return;

        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime * 1000);

        // Calcular distância até o jogador
        const dx = player.sprite.x - this.sprite.x;
        const dy = player.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Máquina de estados
        switch (this.state) {
            case 'patrol':
                this.patrol(deltaTime);
                if (distance < this.alertRange) {
                    this.state = 'chase';
                }
                break;

            case 'chase':
                this.chase(deltaTime, player);
                if (distance > this.alertRange * 1.5) {
                    this.state = 'patrol';
                } else if (distance < this.attackRange) {
                    this.state = 'attack';
                }
                break;

            case 'attack':
                this.attack(deltaTime, player);
                if (distance > this.attackRange * 1.2) {
                    this.state = 'chase';
                }
                break;
        }

        // Aplicar física
        this.updatePhysics(deltaTime);
    }

    patrol(deltaTime) {
        // Movimento de patrulha
        const targetX = this.startX + (this.direction * this.patrolDistance);

        if (Math.abs(this.sprite.x - targetX) < 5) {
            this.direction *= -1;
        }

        this.velocity.x = this.direction * this.speed * 0.5;
    }

    chase(deltaTime, player) {
        // Perseguir o jogador
        const dx = player.sprite.x - this.sprite.x;

        if (Math.abs(dx) > 10) {
            this.velocity.x = (dx > 0 ? 1 : -1) * this.speed;
        } else {
            this.velocity.x = 0;
        }
    }

    attack(deltaTime, player) {
        // Parar para atacar
        this.velocity.x = 0;

        if (this.attackCooldown <= 0) {
            // Realizar ataque
            this.performAttack(player);
            this.attackCooldown = this.attackDelay;
        }
    }

    performAttack(player) {
        // Efeito visual de ataque
        this.sprite.tint = 0xffaaaa;
        setTimeout(() => {
            if (this.sprite) this.sprite.tint = 0xffffff;
        }, 200);

        // Verificar se o jogador está próximo o suficiente
        const dx = player.sprite.x - this.sprite.x;
        const dy = player.sprite.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.attackRange) {
            player.takeDamage(this.damage);
        }
    }

    updatePhysics(deltaTime) {
        // Aplicar gravidade
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // Atualizar posição
        this.sprite.x += this.velocity.x * deltaTime;
        this.sprite.y += this.velocity.y * deltaTime;

        // Atualizar animação baseada na direção e movimento
        if (this.sprite && this.animations) {
            if (Math.abs(this.velocity.x) > 5) { // Se está se movendo
                if (this.velocity.x > 0) {
                    // Movendo para a direita - usar frames 0-3
                    if (this.sprite.textures !== this.animations.walkRight) {
                        this.sprite.textures = this.animations.walkRight;
                        this.sprite.play();
                    }
                } else {
                    // Movendo para a esquerda - usar frames 4-7
                    if (this.sprite.textures !== this.animations.walkLeft) {
                        this.sprite.textures = this.animations.walkLeft;
                        this.sprite.play();
                    }
                }
            } else {
                // Parado - usar frame idle
                if (this.sprite.textures !== this.animations.idle) {
                    this.sprite.textures = this.animations.idle;
                    this.sprite.gotoAndStop(0);
                }
            }
        }
    }

    checkGroundCollision(groundY) {
        if (this.sprite.y >= groundY - 16 && this.velocity.y >= 0) {
            this.sprite.y = groundY - 16;
            this.velocity.y = 0;
            this.isGrounded = true;
            return true;
        }
        this.isGrounded = false;
        return false;
    }

    checkCollision(rect) {
        const bounds = this.getBounds();
        return (bounds.x < rect.x + rect.width &&
            bounds.x + bounds.width > rect.x &&
            bounds.y < rect.y + rect.height &&
            bounds.y + bounds.height > rect.y);
    }

    getBounds() {
        return {
            x: this.sprite.x - 16,
            y: this.sprite.y - 16,
            width: 32,
            height: 32
        };
    }

    destroy() {
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
    }
}

export class EnemyManager {
    constructor(app, level) {
        this.app = app;
        this.level = level;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnDelay = 8000; // 8 segundos
        this.maxEnemies = 5;
        this.spawnPositions = [
            { x: 100, y: 400 },
            { x: 924, y: 400 },
            { x: 200, y: 300 },
            { x: 824, y: 300 }
        ];
    }

    async spawnEnemy(x, y) {
        if (this.enemies.length >= this.maxEnemies) return;

        const enemy = new Enemy(this.app, x, y);

        // Aguardar a criação do sprite antes de adicionar ao array
        await this.waitForEnemySprite(enemy);

        this.enemies.push(enemy);

        return enemy;
    }

    async waitForEnemySprite(enemy) {
        // Aguardar até que o sprite do enemy seja criado
        return new Promise((resolve) => {
            const checkSprite = () => {
                if (enemy.sprite) {
                    resolve();
                } else {
                    setTimeout(checkSprite, 50);
                }
            };
            checkSprite();
        });
    }

    async spawnRandomEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        const pos = this.spawnPositions[Math.floor(Math.random() * this.spawnPositions.length)];
        await this.spawnEnemy(pos.x, pos.y);
    }

    update(deltaTime, player) {
        // Atualizar timer de spawn
        this.spawnTimer += deltaTime * 1000;
        if (this.spawnTimer >= this.spawnDelay) {
            this.spawnRandomEnemy();
            this.spawnTimer = 0;
        }

        // Atualizar todos os inimigos
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            if (enemy.isAlive) {
                enemy.update(deltaTime, player);

                // Verificar colisão com o chão
                enemy.checkGroundCollision(this.level.groundY);

            } else {
                // Remover inimigo morto
                this.enemies.splice(i, 1);

                // Notificar que um inimigo foi derrotado
                if (this.level.callbacks && this.level.callbacks.onEnemyDefeated) {
                    this.level.callbacks.onEnemyDefeated();
                }
            }
        }
    }

    checkSpellCollisions(spells) {
        spells.forEach(spell => {
            this.enemies.forEach(enemy => {
                if (enemy.isAlive && enemy.checkCollision(spell.getBounds())) {
                    enemy.takeDamage(spell.damage);
                    spell.destroy();
                }
            });
        });
    }

    getAliveEnemies() {
        return this.enemies.filter(enemy => enemy.isAlive);
    }

    getTotalEnemies() {
        return this.enemies.length;
    }

    destroy() {
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
    }
}
