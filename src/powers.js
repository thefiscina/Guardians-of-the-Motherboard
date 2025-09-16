// src/powers.js - Sistema de poderes JavaScript
export class JavaScriptPowers {
    constructor() {
        this.availablePowers = [
            {
                id: 'reduce',
                name: 'Reduce',
                level: 1,
                description: 'Reduz inimigos a um único valor compactado',
                manaCost: 25,
                cooldown: 2000,
                color: 0xff6b35,
                effect: 'area_damage',
                damage: 50,
                range: 100,
                functionality: 'Combina múltiplos inimigos em um só, causando dano em área'
            },
            {
                id: 'map',
                name: 'Map',
                level: 2,
                description: 'Transforma inimigos aplicando uma função de dano',
                manaCost: 20,
                cooldown: 1500,
                color: 0x4ecdc4,
                effect: 'transform_damage',
                damage: 40,
                range: 80,
                functionality: 'Aplica transformação de dano a cada inimigo individualmente'
            },
            {
                id: 'filter',
                name: 'Filter',
                level: 3,
                description: 'Filtra inimigos fracos, removendo-os instantaneamente',
                manaCost: 30,
                cooldown: 3000,
                color: 0x45b7d1,
                effect: 'instant_kill_weak',
                damage: 999,
                range: 120,
                functionality: 'Remove inimigos com menos de 30% de vida'
            },
            {
                id: 'foreach',
                name: 'ForEach',
                level: 4,
                description: 'Executa dano em cada inimigo sequencialmente',
                manaCost: 35,
                cooldown: 2500,
                color: 0xf7931e,
                effect: 'sequential_damage',
                damage: 35,
                range: 150,
                functionality: 'Ataca cada inimigo um por vez com delay visual'
            },
            {
                id: 'find',
                name: 'Find',
                level: 5,
                description: 'Encontra e marca o inimigo mais forte para dano crítico',
                manaCost: 20,
                cooldown: 4000,
                color: 0x9b59b6,
                effect: 'find_and_mark',
                damage: 80,
                range: 200,
                functionality: 'Localiza inimigo com mais vida e aplica dano crítico'
            },
            {
                id: 'sort',
                name: 'Sort',
                level: 6,
                description: 'Reorganiza inimigos por vida e causa dano em cascata',
                manaCost: 40,
                cooldown: 3500,
                color: 0xe74c3c,
                effect: 'cascade_damage',
                damage: 30,
                range: 180,
                functionality: 'Ordena inimigos por vida e causa dano crescente'
            }
        ];

        this.unlockedPowers = ['reduce']; // Primeiro poder desbloqueado
        this.currentPower = 'reduce';
        this.lastCastTime = 0;

        // Sistema de voz
        this.speechSynth = window.speechSynthesis;
        this.voices = [];
        this.loadVoices();
    }

    loadVoices() {
        this.voices = this.speechSynth.getVoices();
        if (this.voices.length === 0) {
            // Aguardar carregar vozes
            this.speechSynth.onvoiceschanged = () => {
                this.voices = this.speechSynth.getVoices();
            };
        }
    }

    speakPowerName(powerName) {
        if (!this.speechSynth) return;

        const utterance = new SpeechSynthesisUtterance(powerName);

        // Configurar voz (preferir inglês)
        const englishVoice = this.voices.find(voice =>
            voice.lang.includes('en') && voice.name.includes('Google')
        ) || this.voices.find(voice => voice.lang.includes('en'));

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.rate = 1.2;
        utterance.pitch = 1.1;
        utterance.volume = 0.7;

        this.speechSynth.speak(utterance);
    }

    getCurrentPower() {
        return this.availablePowers.find(power => power.id === this.currentPower);
    }

    switchPower() {
        const unlockedPowerIds = this.availablePowers
            .filter(power => this.unlockedPowers.includes(power.id))
            .map(power => power.id);

        const currentIndex = unlockedPowerIds.indexOf(this.currentPower);
        const nextIndex = (currentIndex + 1) % unlockedPowerIds.length;

        this.currentPower = unlockedPowerIds[nextIndex];

        // Falar nome do novo poder
        const power = this.getCurrentPower();
        this.speakPowerName(power.name);

        return power;
    }

    canCast() {
        const now = Date.now();
        const power = this.getCurrentPower();

        return (now - this.lastCastTime) >= power.cooldown;
    }

    castPower(player, enemies, targetX, targetY) {
        if (!this.canCast()) return false;

        const power = this.getCurrentPower();
        this.lastCastTime = Date.now();

        // Falar nome do poder
        this.speakPowerName(power.name);

        // Executar efeito do poder
        this.executePowerEffect(power, player, enemies, targetX, targetY);

        return true;
    }

    executePowerEffect(power, player, enemies, targetX, targetY) {
        switch (power.effect) {
            case 'area_damage':
                this.executeReduce(power, enemies, targetX, targetY);
                break;
            case 'transform_damage':
                this.executeMap(power, enemies, targetX, targetY);
                break;
            case 'instant_kill_weak':
                this.executeFilter(power, enemies, targetX, targetY);
                break;
            case 'sequential_damage':
                this.executeForEach(power, enemies, targetX, targetY);
                break;
            case 'find_and_mark':
                this.executeFind(power, enemies, targetX, targetY);
                break;
            case 'cascade_damage':
                this.executeSort(power, enemies, targetX, targetY);
                break;
        }
    }

    executeReduce(power, enemies, targetX, targetY) {
        // Reduce: Combina inimigos em área em um só
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.sprite.x - targetX, 2) +
                Math.pow(enemy.sprite.y - targetY, 2)
            );
            return distance <= power.range && enemy.isAlive;
        });

        if (affectedEnemies.length > 1) {
            // Causar dano baseado no número de inimigos
            const totalDamage = power.damage * affectedEnemies.length;
            affectedEnemies[0].takeDamage(totalDamage);

            // Remover outros inimigos
            for (let i = 1; i < affectedEnemies.length; i++) {
                affectedEnemies[i].takeDamage(999);
            }

            this.createPowerEffect(targetX, targetY, power.color, 'REDUCED!');
        }
    }

    executeMap(power, enemies, targetX, targetY) {
        // Map: Aplica transformação a cada inimigo
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.sprite.x - targetX, 2) +
                Math.pow(enemy.sprite.y - targetY, 2)
            );
            return distance <= power.range && enemy.isAlive;
        });

        affectedEnemies.forEach(enemy => {
            enemy.takeDamage(power.damage);
        });

        this.createPowerEffect(targetX, targetY, power.color, 'MAPPED!');
    }

    executeFilter(power, enemies, targetX, targetY) {
        // Filter: Remove inimigos fracos
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.sprite.x - targetX, 2) +
                Math.pow(enemy.sprite.y - targetY, 2)
            );
            return distance <= power.range && enemy.isAlive;
        });

        const weakEnemies = affectedEnemies.filter(enemy =>
            enemy.health / enemy.maxHealth < 0.3
        );

        weakEnemies.forEach(enemy => {
            enemy.takeDamage(999);
        });

        this.createPowerEffect(targetX, targetY, power.color, 'FILTERED!');
    }

    executeForEach(power, enemies, targetX, targetY) {
        // ForEach: Ataque sequencial
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.sprite.x - targetX, 2) +
                Math.pow(enemy.sprite.y - targetY, 2)
            );
            return distance <= power.range && enemy.isAlive;
        });

        affectedEnemies.forEach((enemy, index) => {
            setTimeout(() => {
                if (enemy.isAlive) {
                    enemy.takeDamage(power.damage);
                    this.createMiniEffect(enemy.sprite.x, enemy.sprite.y, power.color);
                }
            }, index * 200);
        });

        this.createPowerEffect(targetX, targetY, power.color, 'FOR EACH!');
    }

    executeFind(power, enemies, targetX, targetY) {
        // Find: Encontra inimigo mais forte
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.sprite.x - targetX, 2) +
                Math.pow(enemy.sprite.y - targetY, 2)
            );
            return distance <= power.range && enemy.isAlive;
        });

        if (affectedEnemies.length > 0) {
            const strongestEnemy = affectedEnemies.reduce((strongest, current) =>
                current.health > strongest.health ? current : strongest
            );

            strongestEnemy.takeDamage(power.damage);
            this.createPowerEffect(strongestEnemy.sprite.x, strongestEnemy.sprite.y, power.color, 'FOUND!');
        }
    }

    executeSort(power, enemies, targetX, targetY) {
        // Sort: Ordena e causa dano cascata
        const affectedEnemies = enemies.filter(enemy => {
            const distance = Math.sqrt(
                Math.pow(enemy.sprite.x - targetX, 2) +
                Math.pow(enemy.sprite.y - targetY, 2)
            );
            return distance <= power.range && enemy.isAlive;
        });

        // Ordenar por vida (menor para maior)
        const sortedEnemies = affectedEnemies.sort((a, b) => a.health - b.health);

        sortedEnemies.forEach((enemy, index) => {
            const cascadeDamage = power.damage + (index * 10);
            setTimeout(() => {
                if (enemy.isAlive) {
                    enemy.takeDamage(cascadeDamage);
                }
            }, index * 150);
        });

        this.createPowerEffect(targetX, targetY, power.color, 'SORTED!');
    }

    createPowerEffect(x, y, color, text) {
        // Placeholder para efeito visual - será implementado no magic.js
        console.log(`Power effect at (${x}, ${y}): ${text}`);
    }

    createMiniEffect(x, y, color) {
        // Placeholder para mini efeito visual
        console.log(`Mini effect at (${x}, ${y})`);
    }

    unlockPower(level) {
        const powerToUnlock = this.availablePowers.find(power => power.level === level);
        if (powerToUnlock && !this.unlockedPowers.includes(powerToUnlock.id)) {
            this.unlockedPowers.push(powerToUnlock.id);
            this.speakPowerName(`New power unlocked: ${powerToUnlock.name}`);
            return powerToUnlock;
        }
        return null;
    }

    getUnlockedPowers() {
        return this.availablePowers.filter(power =>
            this.unlockedPowers.includes(power.id)
        );
    }
}
