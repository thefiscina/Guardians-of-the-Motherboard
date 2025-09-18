/**
 * Entidades do jogo com Object Pooling
 * Player, Platform, Enemy, Bullet e sistema de Pool para performance
 */

import { clamp, rand, randInt, chance, CONSTANTS, circleRectCollision, aabbCollision } from './utils.js';

/**
 * Sistema de Object Pooling para reutilizar objetos e evitar GC
 */
export class Pool {
    constructor(EntityClass, initialSize = 32) {
        this.EntityClass = EntityClass;
        this.available = [];
        this.inUse = [];

        // Pré-alocar objetos
        for (let i = 0; i < initialSize; i++) {
            this.available.push(new EntityClass());
        }
    }

    get() {
        let entity = this.available.pop();
        if (!entity) {
            entity = new this.EntityClass();
        }
        this.inUse.push(entity);
        entity.active = true;
        return entity;
    }

    release(entity) {
        entity.active = false;
        const index = this.inUse.indexOf(entity);
        if (index > -1) {
            this.inUse.splice(index, 1);
            this.available.push(entity);
        }
    }

    releaseAll() {
        for (const entity of this.inUse) {
            entity.active = false;
            this.available.push(entity);
        }
        this.inUse.length = 0;
    }

    getActiveCount() {
        return this.inUse.length;
    }

    getAvailableCount() {
        return this.available.length;
    }
}

/**
 * Player - personagem controlado pelo jogador
 */
export class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0; // velocidade horizontal
        this.vy = 0; // velocidade vertical
        this.w = CONSTANTS.PLAYER_SIZE;
        this.h = CONSTANTS.PLAYER_SIZE;
        this.onGround = false;
        this.lastJumpTime = 0;
        this.active = true;
        this.color = '#4ade80';
        this.blinkTimer = 0; // para efeito de dano
    }

    update(dt, input, physics, worldBounds) {
        const { acceleration, maxVelocityX, gravity, jumpVelocity } = physics;

        // Movimento horizontal baseado no input
        if (input.left && !input.right) {
            this.vx -= acceleration * dt;
        } else if (input.right && !input.left) {
            this.vx += acceleration * dt;
        } else {
            // Aplicar atrito quando não há input
            this.vx *= Math.pow(CONSTANTS.FRICTION, dt * 60);
        }

        // Limitar velocidade horizontal
        this.vx = clamp(this.vx, -maxVelocityX, maxVelocityX);

        // Gravidade
        this.vy += gravity * dt;

        // Aplicar velocidades
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wrap horizontal - teleporta para o lado oposto
        if (this.x < -this.w / 2) {
            this.x = worldBounds.width + this.w / 2;
        } else if (this.x > worldBounds.width + this.w / 2) {
            this.x = -this.w / 2;
        }

        // Reset ground state - será definido na colisão com plataformas
        this.onGround = false;

        // Atualizar timers
        this.blinkTimer = Math.max(0, this.blinkTimer - dt);
    }

    jump(velocity) {
        this.vy = -Math.abs(velocity); // Sempre para cima (negativo)
        this.onGround = false;
        this.lastJumpTime = performance.now();
    }

    takeDamage() {
        this.blinkTimer = 0.3; // Piscar por 300ms
    }

    getBounds() {
        return {
            x: this.x - this.w / 2,
            y: this.y - this.h / 2,
            w: this.w,
            h: this.h
        };
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Efeito de piscar quando toma dano
        if (this.blinkTimer > 0 && Math.floor(this.blinkTimer * 20) % 2) {
            ctx.globalAlpha = 0.3;
        }

        // Corpo do player (retângulo verde)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);

        // Olhos simples
        ctx.fillStyle = '#0e0f14';
        const eyeSize = 4;
        const eyeOffsetX = 6;
        const eyeOffsetY = 6;

        // Olho esquerdo
        ctx.fillRect(this.x - eyeOffsetX, this.y - eyeOffsetY, eyeSize, eyeSize);
        // Olho direito
        ctx.fillRect(this.x + eyeOffsetX - eyeSize, this.y - eyeOffsetY, eyeSize, eyeSize);

        // Boca simples (se estiver saltando)
        if (this.vy < -100) {
            ctx.fillStyle = '#0e0f14';
            ctx.fillRect(this.x - 3, this.y + 2, 6, 2);
        }

        ctx.restore();
    }
}

/**
 * Platform - plataformas onde o player pode saltar
 */
export class Platform {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.w = 80;
        this.h = CONSTANTS.PLATFORM_HEIGHT;
        this.vx = 0; // velocidade horizontal (para plataformas móveis)
        this.active = false;
        this.isMoving = false;
        this.color = '#60a5fa';
        this.type = 'normal'; // normal, moving, fragile
        this.moveRange = 100; // distância máxima de movimento
        this.originalX = 0; // posição inicial para plataformas móveis
    }

    init(x, y, width, isMoving = false, moveSpeed = 0) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.w = width;
        this.isMoving = isMoving;
        this.vx = isMoving ? moveSpeed : 0;
        this.active = true;

        if (isMoving) {
            this.type = 'moving';
            this.color = '#fbbf24';
        } else {
            this.type = 'normal';
            this.color = '#60a5fa';
        }
    }

    update(dt, worldBounds) {
        if (!this.active) return;

        if (this.isMoving) {
            this.x += this.vx * dt;

            // Inverter direção se sair do range
            const distanceFromOriginal = Math.abs(this.x - this.originalX);
            if (distanceFromOriginal > this.moveRange || this.x < 20 || this.x > worldBounds.width - 20) {
                this.vx *= -1;
            }
        }
    }

    getBounds() {
        return {
            x: this.x - this.w / 2,
            y: this.y - this.h / 2,
            w: this.w,
            h: this.h
        };
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);

        // Destacar plataformas móveis com borda
        if (this.isMoving) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
        }
    }
}

/**
 * Enemy - inimigos que patrulham plataformas
 */
export class Enemy {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.w = CONSTANTS.ENEMY_SIZE;
        this.h = CONSTANTS.ENEMY_SIZE;
        this.vx = 30; // velocidade de patrulha
        this.type = 'touch'; // touch ou shooter
        this.shootCooldown = 0;
        this.active = false;
        this.platformRef = null; // referência à plataforma que patrulha
        this.patrolRange = 80; // distância de patrulha
        this.originalX = 0;
        this.health = 1;
    }

    init(x, y, type = 'touch', platform = null) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.type = type;
        this.platformRef = platform;
        this.active = true;
        this.vx = rand(-40, 40);
        this.shootCooldown = rand(0.5, 2); // Delay inicial aleatório

        if (platform) {
            this.patrolRange = Math.min(platform.w * 0.8, 80);
        }
    }

    update(dt, worldBounds) {
        if (!this.active) return;

        // Movimento de patrulha
        this.x += this.vx * dt;

        // Limites de patrulha baseados na plataforma
        if (this.platformRef) {
            const leftLimit = this.platformRef.x - this.patrolRange / 2;
            const rightLimit = this.platformRef.x + this.patrolRange / 2;

            if (this.x <= leftLimit || this.x >= rightLimit) {
                this.vx *= -1;
                this.x = clamp(this.x, leftLimit, rightLimit);
            }
        } else {
            // Limites do mundo se não tem plataforma de referência
            if (this.x < 20 || this.x > worldBounds.width - 20) {
                this.vx *= -1;
            }
        }

        // Atualizar cooldown de tiro
        this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    }

    canShoot() {
        return this.type === 'shooter' && this.shootCooldown <= 0;
    }

    shoot() {
        if (this.canShoot()) {
            this.shootCooldown = rand(1, 2.5); // Próximo tiro em 1-2.5 segundos
            return true;
        }
        return false;
    }

    getBounds() {
        return {
            x: this.x - this.w / 2,
            y: this.y - this.h / 2,
            w: this.w,
            h: this.h
        };
    }

    draw(ctx) {
        if (!this.active) return;

        const color = this.type === 'touch' ? '#f87171' : '#fbbf24';

        ctx.fillStyle = color;
        ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);

        // Indicador visual do tipo
        if (this.type === 'shooter') {
            // Desenhar "canhão"
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(this.x - 2, this.y - this.h / 2 - 3, 4, 3);
        } else {
            // Desenhar "espinhos"
            ctx.fillStyle = '#dc2626';
            const spikeSize = 3;
            ctx.fillRect(this.x - spikeSize, this.y - this.h / 2 - spikeSize, spikeSize * 2, spikeSize);
        }
    }
}

/**
 * Bullet - projéteis disparados pelos inimigos
 */
export class Bullet {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.r = CONSTANTS.BULLET_RADIUS;
        this.active = false;
        this.damage = 10;
        this.lifetime = 5; // segundos antes de desaparecer
        this.age = 0;
    }

    init(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.vx = velocityX;
        this.vy = velocityY;
        this.active = true;
        this.age = 0;
    }

    update(dt, worldBounds) {
        if (!this.active) return;

        // Movimento
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Envelhecimento
        this.age += dt;

        // Desativar se muito antigo ou fora dos limites
        if (this.age > this.lifetime ||
            this.x < -50 || this.x > worldBounds.width + 50 ||
            this.y > worldBounds.height + 200) {
            this.active = false;
        }
    }

    getBounds() {
        return {
            x: this.x - this.r,
            y: this.y - this.r,
            w: this.r * 2,
            h: this.r * 2
        };
    }

    getCircle() {
        return {
            x: this.x,
            y: this.y,
            r: this.r
        };
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Efeito de fade baseado na idade
        const alpha = Math.max(0.3, 1 - (this.age / this.lifetime));
        ctx.globalAlpha = alpha;

        // Desenhar projétil
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();

        // Borda mais escura
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * Particle - partículas para efeitos visuais
 */
export class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 1;
        this.maxLife = 1;
        this.size = 2;
        this.color = '#ffffff';
        this.active = false;
    }

    init(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt; // gravidade nas partículas
        this.life -= dt;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

// Exportar classes e funções de colisão
export const Collision = {
    // Player vs Platform (top collision for jumping)
    playerPlatform: (player, platform) => {
        const playerBounds = player.getBounds();
        const platformBounds = platform.getBounds();

        // Verificar se o player está caindo (vy > 0) e colidindo com o topo da plataforma
        const isAbove = player.y < platform.y;
        const isOverlapping = playerBounds.x < platformBounds.x + platformBounds.w &&
            playerBounds.x + playerBounds.w > platformBounds.x;
        const isLanding = player.vy >= 0 &&
            playerBounds.y + playerBounds.h >= platformBounds.y - 5 &&
            playerBounds.y + playerBounds.h <= platformBounds.y + platformBounds.h;

        return isAbove && isOverlapping && isLanding;
    },

    // Generic AABB collision
    aabb: (entity1, entity2) => {
        const bounds1 = entity1.getBounds();
        const bounds2 = entity2.getBounds();
        return aabbCollision(bounds1, bounds2);
    },

    // Circle vs Rectangle (para bullets vs player)
    circleRect: (circle, rect) => {
        const circleBounds = circle.getCircle ? circle.getCircle() : circle;
        const rectBounds = rect.getBounds ? rect.getBounds() : rect;
        return circleRectCollision(circleBounds, rectBounds);
    }
};

export default {
    Pool, Player, Platform, Enemy, Bullet, Particle, Collision
};
