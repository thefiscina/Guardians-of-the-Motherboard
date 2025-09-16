// src/player.js - Sistema completo do jogador
import { sliceGrid } from './sliceSheet.js';
import { MagicSystem } from './magic.js';

export class Player {
    constructor(app, callbacks = {}) {
        this.app = app;
        this.callbacks = callbacks;

        // Estados do jogador
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 200;
        this.jumpPower = 350;
        this.isGrounded = false;
        this.isAlive = true;
        this.invulnerable = false;
        this.invulnerabilityTime = 1500; // ms

        // Física
        this.velocity = { x: 0, y: 0 };
        this.gravity = 800;
        this.friction = 0.85;

        // Controles
        this.keys = { w: false, a: false, s: false, d: false };
        this.mousePos = { x: 0, y: 0 };

        // Animações
        this.currentAnimation = 'idle';
        this.facing = 1; // 1 = direita, -1 = esquerda
        this.animations = {};
        this.sprite = null;

        // Sistema de magia
        this.magicSystem = new MagicSystem(app, this);

        this.init();
    }

    async init() {
        await this.loadAnimations();
        this.setupControls();
        this.setupSprite();

        // Posição inicial
        this.sprite.x = this.app.renderer.width * 0.2;
        this.sprite.y = this.app.renderer.height * 0.7;

        this.app.stage.addChild(this.sprite);
    }

    async loadAnimations() {
        try {
            const runTexture = await PIXI.Assets.load('assets/sprites/herorun.png');

            // Criar diferentes animações do mesmo spritesheet
            // Como temos apenas o herorun.png, vamos simular outras animações
            const frames = sliceGrid(runTexture, {
                cols: 5,
                rows: 2,
                margin: 0,
                spacing: 8
            });

            // Distribuir frames para diferentes animações
            this.animations = {
                idle: [frames[0]], // Primeiro frame como idle
                run: frames.slice(0, 8), // Primeiros 8 frames para corrida
                jump: [frames[8] || frames[0]], // Frame de pulo
                crouch: [frames[9] || frames[0]], // Frame agachado
                attack: frames.slice(0, 3), // Primeiros 3 frames como ataque
                cast: frames.slice(3, 6) // Frames 3-5 como cast
            };

        } catch (error) {
            console.error('Erro ao carregar animações:', error);
            // Criar animação de fallback
            const fallbackTexture = PIXI.Texture.WHITE;
            this.animations = {
                idle: [fallbackTexture],
                run: [fallbackTexture],
                jump: [fallbackTexture],
                crouch: [fallbackTexture],
                attack: [fallbackTexture],
                cast: [fallbackTexture]
            };
        }
    }

    setupSprite() {
        this.sprite = new PIXI.AnimatedSprite(this.animations.idle);
        this.sprite.anchor.set(0.5, 1.0);
        this.sprite.animationSpeed = 0.15;
        this.sprite.roundPixels = true;
        this.sprite.play();

        // Configurar hitbox
        this.sprite.width = 48;
        this.sprite.height = 64;
    }

    setupControls() {
        // Controles de teclado
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Controles de mouse
        this.app.view.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.app.view.addEventListener('click', (e) => this.handleMouseClick(e));

        // Controles touch para mobile
        this.setupMobileControls();
    }

    setupMobileControls() {
        const mobileControls = document.getElementById('mobile-controls');
        if (!mobileControls) return;

        // D-pad
        const dpadButtons = mobileControls.querySelectorAll('.dpad button');
        dpadButtons.forEach(btn => {
            const key = btn.dataset.key;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[key] = true;
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[key] = false;
            });
        });

        // Botão de ação
        const actionBtn = mobileControls.querySelector('.btn-action');
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.castSpell();
            });
        }
    }

    handleKey(e, pressed) {
        const key = e.key.toLowerCase();
        if (key in this.keys) {
            this.keys[key] = pressed;
            e.preventDefault();
        }

        // Ações especiais
        if (pressed) {
            switch (key) {
                case ' ':
                case 'w':
                    this.jump();
                    e.preventDefault();
                    break;
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.app.view.getBoundingClientRect();
        const scaleX = this.app.renderer.width / rect.width;
        const scaleY = this.app.renderer.height / rect.height;

        this.mousePos.x = (e.clientX - rect.left) * scaleX;
        this.mousePos.y = (e.clientY - rect.top) * scaleY;
    }

    handleMouseClick(e) {
        e.preventDefault();
        this.castSpell();
    }

    jump() {
        if (this.isGrounded && this.isAlive) {
            this.velocity.y = -this.jumpPower;
            this.isGrounded = false;
            this.setAnimation('jump');
        }
    }

    castSpell() {
        if (!this.isAlive) return;

        this.setAnimation('cast');

        // Calcular direção para o mouse
        const dx = this.mousePos.x - this.sprite.x;
        const dy = this.mousePos.y - this.sprite.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
            const direction = { x: dx / length, y: dy / length };
            this.magicSystem.castSpell(this.sprite.x, this.sprite.y - 32, direction);
        }

        // Virar personagem na direção do cast
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }

    takeDamage(amount) {
        if (!this.isAlive || this.invulnerable) return;

        this.health = Math.max(0, this.health - amount);

        if (this.callbacks.onHealthChange) {
            this.callbacks.onHealthChange(this.health);
        }

        if (this.health <= 0) {
            this.die();
        } else {
            this.makeInvulnerable();
        }
    }

    makeInvulnerable() {
        this.invulnerable = true;

        // Efeito visual de piscar
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            this.sprite.alpha = this.sprite.alpha === 1 ? 0.5 : 1;
            blinkCount++;

            if (blinkCount >= 10) {
                clearInterval(blinkInterval);
                this.sprite.alpha = 1;
                this.invulnerable = false;
            }
        }, this.invulnerabilityTime / 10);
    }

    die() {
        this.isAlive = false;
        this.setAnimation('idle');

        if (this.callbacks.onPlayerDeath) {
            this.callbacks.onPlayerDeath();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);

        if (this.callbacks.onHealthChange) {
            this.callbacks.onHealthChange(this.health);
        }
    }

    setAnimation(animName) {
        if (this.currentAnimation === animName || !this.animations[animName]) return;

        this.currentAnimation = animName;
        this.sprite.textures = this.animations[animName];
        this.sprite.gotoAndPlay(0);

        // Ajustar velocidade da animação
        switch (animName) {
            case 'run':
                this.sprite.animationSpeed = 0.2;
                break;
            case 'attack':
            case 'cast':
                this.sprite.animationSpeed = 0.3;
                break;
            default:
                this.sprite.animationSpeed = 0.15;
        }
    }

    checkCollision(rect) {
        const playerBounds = this.getBounds();
        return (playerBounds.x < rect.x + rect.width &&
            playerBounds.x + playerBounds.width > rect.x &&
            playerBounds.y < rect.y + rect.height &&
            playerBounds.y + playerBounds.height > rect.y);
    }

    getBounds() {
        return {
            x: this.sprite.x - this.sprite.width / 2,
            y: this.sprite.y - this.sprite.height,
            width: this.sprite.width,
            height: this.sprite.height
        };
    }

    checkGroundCollision(groundY) {
        const bounds = this.getBounds();
        if (bounds.y + bounds.height >= groundY && this.velocity.y >= 0) {
            this.sprite.y = groundY;
            this.velocity.y = 0;
            this.isGrounded = true;
            return true;
        }
        return false;
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        // Aplicar movimento horizontal
        let targetVelX = 0;
        if (this.keys.a) targetVelX -= this.speed;
        if (this.keys.d) targetVelX += this.speed;

        this.velocity.x = targetVelX;

        // Aplicar gravidade
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // Agachar
        const crouching = this.keys.s && this.isGrounded;

        // Atualizar posição
        this.sprite.x += this.velocity.x * deltaTime;
        this.sprite.y += this.velocity.y * deltaTime;

        // Limites da tela
        const bounds = this.getBounds();
        if (bounds.x < 0) this.sprite.x = this.sprite.width / 2;
        if (bounds.x + bounds.width > this.app.renderer.width) {
            this.sprite.x = this.app.renderer.width - this.sprite.width / 2;
        }

        // Escolher animação
        this.updateAnimation(crouching);

        // Virar sprite
        if (this.velocity.x < 0) this.facing = -1;
        if (this.velocity.x > 0) this.facing = 1;
        this.sprite.scale.x = Math.abs(this.sprite.scale.x) * this.facing;

        // Atualizar sistema de magia
        this.magicSystem.update(deltaTime);
    }

    updateAnimation(crouching) {
        if (crouching) {
            this.setAnimation('crouch');
        } else if (!this.isGrounded) {
            this.setAnimation('jump');
        } else if (Math.abs(this.velocity.x) > 10) {
            this.setAnimation('run');
        } else {
            this.setAnimation('idle');
        }
    }

    destroy() {
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }

        if (this.magicSystem) {
            this.magicSystem.destroy();
        }

        // Remover event listeners
        window.removeEventListener('keydown', this.handleKey);
        window.removeEventListener('keyup', this.handleKey);
    }
}
