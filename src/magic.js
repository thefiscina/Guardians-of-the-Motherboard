// src/magic.js - Sistema de ataques mágicos com poderes JavaScript
import { JavaScriptPowers } from './powers.js';

export class MagicSpell {
    constructor(app, x, y, direction, damage = 30, powerType = 'basic') {
        this.app = app;
        this.damage = damage;
        this.speed = 400;
        this.direction = direction;
        this.isActive = true;
        this.lifetime = 3000; // 3 segundos
        this.age = 0;
        this.powerType = powerType;

        this.createSprite(x, y);
    }

    createSprite(x, y) {
        // Criar projétil mágico visual baseado no tipo de poder
        this.sprite = new PIXI.Graphics();

        const colors = {
            basic: { core: 0x00ffff, ring: 0x88ffff },
            reduce: { core: 0xff6b35, ring: 0xff8c5a },
            map: { core: 0x4ecdc4, ring: 0x6ed4cc },
            filter: { core: 0x45b7d1, ring: 0x6bc5d8 },
            foreach: { core: 0xf7931e, ring: 0xf9a851 },
            find: { core: 0x9b59b6, ring: 0xb06fc7 },
            sort: { core: 0xe74c3c, ring: 0xed6a5a }
        };

        const color = colors[this.powerType] || colors.basic;

        // Núcleo brilhante
        this.sprite.beginFill(color.core);
        this.sprite.drawCircle(0, 0, 8);
        this.sprite.endFill();

        // Anel externo
        this.sprite.lineStyle(3, color.ring, 0.8);
        this.sprite.drawCircle(0, 0, 12);

        // Símbolo do poder no centro
        this.addPowerSymbol(color.core);

        this.sprite.x = x;
        this.sprite.y = y;

        // Efeito de brilho
        try {
            this.glowFilter = new PIXI.filters.GlowFilter({
                distance: 20,
                outerStrength: 3,
                innerStrength: 1,
                color: color.core,
                quality: 0.5
            });
            this.sprite.filters = [this.glowFilter];
        } catch (e) {
            // Fallback se filtros não estiverem disponíveis
        }

        this.app.stage.addChild(this.sprite);
        this.createTrail();
    }

    addPowerSymbol(color) {
        const symbols = {
            reduce: '∑',
            map: '→',
            filter: '⚡',
            foreach: '∀',
            find: '?',
            sort: '↕'
        };

        const symbol = symbols[this.powerType];
        if (symbol) {
            const text = new PIXI.Text(symbol, {
                fontFamily: 'monospace',
                fontSize: 12,
                fill: 0xffffff,
                fontWeight: 'bold'
            });
            text.anchor.set(0.5);
            this.sprite.addChild(text);
        }
    }

    createTrail() {
        this.trail = [];
        this.maxTrailLength = 8;
    }

    update(deltaTime) {
        if (!this.isActive) return;

        this.age += deltaTime * 1000;

        // Mover projétil
        this.sprite.x += this.direction.x * this.speed * deltaTime;
        this.sprite.y += this.direction.y * this.speed * deltaTime;

        // Animação de rotação
        this.sprite.rotation += deltaTime * 10;

        // Efeito de pulsação
        const pulse = 1 + Math.sin(this.age * 0.01) * 0.2;
        this.sprite.scale.set(pulse);

        // Atualizar trail
        this.updateTrail();

        // Verificar limites da tela
        if (this.sprite.x < -50 || this.sprite.x > this.app.renderer.width + 50 ||
            this.sprite.y < -50 || this.sprite.y > this.app.renderer.height + 50) {
            this.destroy();
            return;
        }

        // Verificar tempo de vida
        if (this.age >= this.lifetime) {
            this.destroy();
        }
    }

    updateTrail() {
        // Adicionar posição atual ao trail
        this.trail.unshift({ x: this.sprite.x, y: this.sprite.y });

        // Limitar tamanho do trail
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Desenhar trail (opcional - pode ser otimizado)
        // Por simplicidade, não implementamos o trail visual aqui
    }

    getBounds() {
        return {
            x: this.sprite.x - 12,
            y: this.sprite.y - 12,
            width: 24,
            height: 24
        };
    }

    destroy() {
        this.isActive = false;

        // Criar efeito de explosão
        this.createExplosion();

        // Remover sprite
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
    }

    createExplosion() {
        // Efeito visual simples de explosão
        const explosion = new PIXI.Graphics();
        explosion.beginFill(0x00ffff, 0.6);
        explosion.drawCircle(0, 0, 20);
        explosion.endFill();

        explosion.x = this.sprite.x;
        explosion.y = this.sprite.y;

        this.app.stage.addChild(explosion);

        // Animação de explosão
        let scale = 0.1;
        let alpha = 1;

        const animate = () => {
            scale += 0.3;
            alpha -= 0.1;

            explosion.scale.set(scale);
            explosion.alpha = alpha;

            if (alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                if (explosion.parent) {
                    explosion.parent.removeChild(explosion);
                }
            }
        };

        animate();
    }
}

export class MagicSystem {
    constructor(app, player) {
        this.app = app;
        this.player = player;
        this.spells = [];
        this.lastCastTime = 0;
        this.castCooldown = 300; // 300ms entre feitiços
        this.mana = 100;
        this.maxMana = 100;
        this.manaRegenRate = 20; // mana por segundo
        this.spellManaCost = 15;

        // Sistema de poderes JavaScript
        this.powers = new JavaScriptPowers();
        this.isPowerMode = false; // false = feitiço normal, true = poder JavaScript
    }

    toggleMode() {
        this.isPowerMode = !this.isPowerMode;
        const mode = this.isPowerMode ? 'JavaScript Powers' : 'Normal Magic';

        // Mostrar feedback visual
        this.showModeChange(mode);

        return this.isPowerMode;
    }

    showModeChange(mode) {
        // Criar texto temporário para mostrar mudança de modo
        const text = new PIXI.Text(mode, {
            fontFamily: 'monospace',
            fontSize: 16,
            fill: 0x00ff88,
            stroke: 0x000000,
            strokeThickness: 2
        });

        text.anchor.set(0.5);
        text.x = this.app.renderer.width / 2;
        text.y = 100;
        text.alpha = 0;

        this.app.stage.addChild(text);

        // Animação de fade in/out
        let fadeIn = true;
        let alpha = 0;

        const animate = () => {
            if (fadeIn) {
                alpha += 0.05;
                if (alpha >= 1) {
                    fadeIn = false;
                    setTimeout(() => fadeIn = false, 1000); // Esperar 1 segundo
                }
            } else {
                alpha -= 0.03;
            }

            text.alpha = Math.max(0, alpha);

            if (alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                if (text.parent) {
                    text.parent.removeChild(text);
                }
            }
        };

        animate();
    }

    switchPower() {
        if (this.isPowerMode) {
            return this.powers.switchPower();
        }
        return null;
    }

    canCastSpell() {
        const now = Date.now();

        if (this.isPowerMode) {
            const currentPower = this.powers.getCurrentPower();
            return (now - this.lastCastTime >= this.castCooldown) &&
                (this.mana >= currentPower.manaCost) &&
                this.powers.canCast();
        } else {
            return (now - this.lastCastTime >= this.castCooldown) &&
                (this.mana >= this.spellManaCost);
        }
    }

    castSpell(x, y, direction, enemies = []) {
        if (!this.canCastSpell()) return false;

        if (this.isPowerMode) {
            // Usar poder JavaScript
            const currentPower = this.powers.getCurrentPower();
            this.mana = Math.max(0, this.mana - currentPower.manaCost);
            this.lastCastTime = Date.now();

            // Calcular posição do alvo
            const targetX = x + direction.x * 100;
            const targetY = y + direction.y * 100;

            // Executar poder
            this.powers.castPower(this.player, enemies, targetX, targetY);

            // Criar efeito visual de poder
            this.createPowerEffect(targetX, targetY, currentPower);

        } else {
            // Feitiço normal
            this.mana = Math.max(0, this.mana - this.spellManaCost);
            this.lastCastTime = Date.now();

            const spell = new MagicSpell(this.app, x, y, direction, 30, 'basic');
            this.spells.push(spell);

            this.playCastSound();
        }

        return true;
    }

    createPowerEffect(x, y, power) {
        // Efeito visual para poderes JavaScript
        const effect = new PIXI.Graphics();

        // Círculo de poder
        effect.beginFill(power.color, 0.3);
        effect.drawCircle(0, 0, power.range);
        effect.endFill();

        // Borda brilhante
        effect.lineStyle(4, power.color, 0.8);
        effect.drawCircle(0, 0, power.range);

        effect.x = x;
        effect.y = y;
        effect.alpha = 0;

        // Texto do poder
        const powerText = new PIXI.Text(power.name.toUpperCase(), {
            fontFamily: 'monospace',
            fontSize: 20,
            fill: power.color,
            stroke: 0x000000,
            strokeThickness: 3,
            fontWeight: 'bold'
        });
        powerText.anchor.set(0.5);
        powerText.y = -power.range - 30;
        effect.addChild(powerText);

        this.app.stage.addChild(effect);

        // Animação do efeito
        let scale = 0.1;
        let alpha = 0;
        let growing = true;

        const animate = () => {
            if (growing) {
                scale += 0.05;
                alpha += 0.1;
                if (scale >= 1.2) {
                    growing = false;
                }
            } else {
                alpha -= 0.05;
                scale += 0.02;
            }

            effect.scale.set(scale);
            effect.alpha = Math.max(0, alpha);

            if (alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                if (effect.parent) {
                    effect.parent.removeChild(effect);
                }
            }
        };

        animate();
    } playCastSound() {
        // Placeholder para efeito sonoro
        // Poderia carregar um arquivo de áudio aqui
        try {
            // Criar som sintético simples
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Áudio não disponível
        }
    }

    update(deltaTime) {
        // Regenerar mana
        this.mana = Math.min(this.maxMana, this.mana + this.manaRegenRate * deltaTime);

        // Atualizar feitiços ativos
        for (let i = this.spells.length - 1; i >= 0; i--) {
            const spell = this.spells[i];

            if (spell.isActive) {
                spell.update(deltaTime);
            } else {
                this.spells.splice(i, 1);
            }
        }
    }

    getManaPercent() {
        return this.mana / this.maxMana;
    }

    getActiveSpells() {
        return this.spells.filter(spell => spell.isActive);
    }

    clearAllSpells() {
        this.spells.forEach(spell => spell.destroy());
        this.spells = [];
    }

    destroy() {
        this.clearAllSpells();
    }
}

// Sistema de partículas para efeitos visuais aprimorados
export class ParticleSystem {
    constructor(app) {
        this.app = app;
        this.particles = [];
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
    }

    createParticle(x, y, options = {}) {
        const particle = {
            sprite: new PIXI.Graphics(),
            x: x,
            y: y,
            vx: (options.vx || 0) + (Math.random() - 0.5) * 100,
            vy: (options.vy || 0) + (Math.random() - 0.5) * 100,
            life: options.life || 1000,
            maxLife: options.life || 1000,
            size: options.size || 2,
            color: options.color || 0x00ffff,
            gravity: options.gravity || 0
        };

        particle.sprite.beginFill(particle.color);
        particle.sprite.drawCircle(0, 0, particle.size);
        particle.sprite.endFill();
        particle.sprite.x = x;
        particle.sprite.y = y;

        this.container.addChild(particle.sprite);
        this.particles.push(particle);

        return particle;
    }

    createExplosion(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 50 + Math.random() * 100;

            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 500 + Math.random() * 500,
                size: 1 + Math.random() * 3,
                color: Math.random() > 0.5 ? 0x00ffff : 0xffffff,
                gravity: 100
            });
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Atualizar física
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += particle.gravity * deltaTime;

            // Atualizar vida
            particle.life -= deltaTime * 1000;

            // Atualizar visual
            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
            particle.sprite.alpha = particle.life / particle.maxLife;

            // Remover se morreu
            if (particle.life <= 0) {
                this.container.removeChild(particle.sprite);
                this.particles.splice(i, 1);
            }
        }
    }

    destroy() {
        this.particles.forEach(particle => {
            this.container.removeChild(particle.sprite);
        });
        this.particles = [];

        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
}
