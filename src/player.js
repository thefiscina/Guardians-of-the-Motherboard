// src/player.js - Sistema completo do jogador
import { sliceGrid } from './sliceSheet.js';
import { MagicSystem } from './magic.js';

export class Player {
    constructor(app, callbacks = {}) {
        this.app = app;
        this.callbacks = callbacks;
        this.level = null; // Será definido pelo nível

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

        // Sistema de idle
        this.idleTimer = 0;
        this.idleThreshold = 2000; // 2 segundos
        this.isIdle = false;
        this.isVictory = false;
        this.lastActionTime = Date.now();

        // Controle de animação de idle
        this.idleAnimationPhase = 0; // 0: não iniciado, 1: primeira sequência, 2: loop
        this.idleFrameIndex = 0;

        // Sistema de magia
        this.magicSystem = new MagicSystem(app, this);

        this.init();
    }

    setLevel(level) {
        this.level = level;
    }

    async init() {
        try {
            await this.loadAnimations();
            this.setupControls();
            this.setupSprite();

            if (this.sprite) {
                // Posição inicial
                this.sprite.x = this.app.renderer.width * 0.2;
                this.sprite.y = this.app.renderer.height * 0.7;

                this.app.stage.addChild(this.sprite);
            }
        } catch (error) {
            console.error('Erro na inicialização do player:', error);
        }
    }

    async loadAnimations() {
        try {
            const runTexture = await PIXI.Assets.load('assets/sprites/herorun.png');

            // Carregar animação de idle/stand
            let standTexture;
            try {
                standTexture = await PIXI.Assets.load('assets/sprites/hero_stand.png');
            } catch (error) {
                console.warn('hero_stand.png não encontrado, usando herorun como fallback');
                standTexture = runTexture;
            }

            // Criar frames de corrida
            const runFrames = sliceGrid(runTexture, {
                cols: 5,
                rows: 2,
                margin: 0,
                spacing: 8
            });

            // Criar frames de idle/stand
            const standFrames = sliceGrid(standTexture, {
                cols: 4, // Assumindo 4 colunas, ajuste se necessário
                rows: 1, // Assumindo 1 linha, ajuste se necessário
                margin: 0,
                spacing: 0
            });

            // Distribuir frames para diferentes animações
            this.animations = {
                idle: [runFrames[0]], // Primeiro frame de corrida como idle básico
                run: runFrames.slice(0, 8), // Primeiros 8 frames para corrida
                jump: [runFrames[8] || runFrames[0]], // Frame de pulo
                crouch: [runFrames[9] || runFrames[0]], // Frame agachado
                attack: runFrames.slice(0, 3), // Primeiros 3 frames como ataque
                cast: runFrames.slice(3, 6), // Frames 3-5 como cast

                // Animações de idle com hero_stand.png
                idleStand: standFrames, // Todos os frames de hero_stand
                victory: standFrames // Mesmos frames para vitória
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
                cast: [fallbackTexture],
                idleStand: [fallbackTexture],
                victory: [fallbackTexture]
            };
        }
    }

    setupSprite() {
        if (!this.animations.idle || this.animations.idle.length === 0) {
            console.error('Animações não carregadas para criar o sprite');
            return;
        }

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

    handleKey(event, isDown) {
        if (!this.isAlive) return;

        const key = event.key.toLowerCase();

        // Registrar ação para resetar timer de idle
        if (isDown) {
            this.registerAction();
        }

        if (key === 'w' || key === 'arrowup') this.keys.w = isDown;
        if (key === 'a' || key === 'arrowleft') this.keys.a = isDown;
        if (key === 's' || key === 'arrowdown') this.keys.s = isDown;
        if (key === 'd' || key === 'arrowright') this.keys.d = isDown;

        // Q - Alternar entre modo magia normal e poderes JS
        if (key === 'q' && isDown) {
            this.magicSystem.toggleMode();
            this.registerAction();
        }

        // E - Trocar poder atual (apenas no modo poderes)
        if (key === 'e' && isDown) {
            this.magicSystem.switchPower();
            this.registerAction();
        }

        // Pular
        if ((key === 'w' || key === ' ' || key === 'arrowup') && isDown && this.isGrounded) {
            this.jump();
        }
    }

    handleMouseMove(event) {
        const rect = this.app.view.getBoundingClientRect();
        this.mousePos.x = event.clientX - rect.left;
        this.mousePos.y = event.clientY - rect.top;

        // Registrar ação para resetar timer de idle
        this.registerAction();
    }

    handleMouseClick(event) {
        if (!this.isAlive) return;
        this.castSpell();
        this.registerAction();
    }

    registerAction() {
        this.lastActionTime = Date.now();
        this.idleTimer = 0;

        // Se estava em idle, voltar ao normal
        if (this.isIdle) {
            this.isIdle = false;
            this.idleAnimationPhase = 0;
            this.idleFrameIndex = 0;
        }
    }

    startVictoryAnimation() {
        this.isVictory = true;
        this.setAnimation('victory');
        this.registerAction(); // Para não entrar em idle durante a vitória
    }

    stopVictoryAnimation() {
        this.isVictory = false;
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

            // Passar lista de inimigos para o sistema de magia
            const enemies = this.level ? this.level.enemyManager.getAliveEnemies() : [];
            this.magicSystem.castSpell(this.sprite.x, this.sprite.y - 32, direction, enemies);
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
        if (!this.sprite || this.currentAnimation === animName || !this.animations[animName]) return;

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
            case 'idleStand':
                this.sprite.animationSpeed = 0.1; // Mais lenta para idle
                break;
            case 'victory':
                this.sprite.animationSpeed = 0.15; // Velocidade média para vitória
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
        if (!this.sprite) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        return {
            x: this.sprite.x - this.sprite.width / 2,
            y: this.sprite.y - this.sprite.height,
            width: this.sprite.width,
            height: this.sprite.height
        };
    }

    checkGroundCollision(groundY) {
        if (!this.sprite) return false;

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
        if (!this.isAlive || !this.sprite) return;

        // Verificar timer de idle (apenas se não estiver em vitória)
        if (!this.isVictory) {
            this.updateIdleTimer(deltaTime);
        }

        // Aplicar movimento horizontal
        let targetVelX = 0;
        if (this.keys.a) {
            targetVelX -= this.speed;
            this.registerAction();
        }
        if (this.keys.d) {
            targetVelX += this.speed;
            this.registerAction();
        }

        this.velocity.x = targetVelX;

        // Aplicar gravidade
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // Agachar
        const crouching = this.keys.s && this.isGrounded;
        if (crouching) {
            this.registerAction();
        }

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

    updateIdleTimer(deltaTime) {
        // Incrementar timer de idle
        this.idleTimer += deltaTime * 1000; // converter para milissegundos

        // Verificar se deve entrar em idle
        if (this.idleTimer >= this.idleThreshold && !this.isIdle && !this.isVictory) {
            // Verificar se não há movimento
            const isMoving = Math.abs(this.velocity.x) > 10 || this.keys.a || this.keys.d || this.keys.s;

            if (!isMoving && this.isGrounded) {
                this.startIdleAnimation();
            }
        }

        // Atualizar animação de idle se estiver ativa
        if (this.isIdle) {
            this.updateIdleAnimation(deltaTime);
        }
    }

    startIdleAnimation() {
        this.isIdle = true;
        this.idleAnimationPhase = 1; // Começar com a primeira sequência
        this.idleFrameIndex = 0;
        this.setAnimation('idleStand');
    }

    updateIdleAnimation(deltaTime) {
        if (!this.sprite || !this.animations.idleStand || this.animations.idleStand.length === 0) return;

        const frames = this.animations.idleStand;

        if (this.idleAnimationPhase === 1) {
            // Primeira sequência: frames 0 e 1 apenas uma vez
            if (this.idleFrameIndex < 2) {
                // Controlar velocidade da animação
                this.sprite.gotoAndPlay(this.idleFrameIndex);

                // Avançar frame a cada 500ms
                if (this.idleTimer % 500 < deltaTime * 1000) {
                    this.idleFrameIndex++;

                    if (this.idleFrameIndex >= 2) {
                        this.idleAnimationPhase = 2; // Passar para o loop
                        this.idleFrameIndex = 2; // Começar do frame 2
                    }
                }
            }
        } else if (this.idleAnimationPhase === 2) {
            // Loop: frames 2 em diante
            const loopFrames = frames.slice(2);
            if (loopFrames.length > 0) {
                const frameIndex = Math.floor((this.idleTimer / 300) % loopFrames.length);
                this.sprite.gotoAndPlay(frameIndex + 2);
            }
        }
    }

    updateAnimation(crouching) {
        // Se está em vitória, manter animação de vitória
        if (this.isVictory) {
            this.setAnimation('victory');
            return;
        }

        // Se está em idle, não mudar animação
        if (this.isIdle) {
            return;
        }

        // Lógica normal de animação
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
