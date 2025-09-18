/**
 * Audio - Sistema de áudio para o jogo
 * Wrapper para Web Audio API com fallback para HTML5 Audio
 */

import { Storage } from './utils.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.5;
        this.isMuted = Storage.get('isMuted', false);
        this.sounds = new Map();
        this.musicVolume = 0.3;
        this.sfxVolume = 0.7;
        this.isInitialized = false;

        // Tentar inicializar Web Audio API
        this.initializeAudioContext();
    }

    initializeAudioContext() {
        try {
            // Web Audio API para melhor controle
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;

            // Resumir contexto após user gesture (necessário no Chrome)
            document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true });
            document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });

            this.isInitialized = true;
            console.log('AudioManager: Web Audio API initialized');
        } catch (error) {
            console.warn('AudioManager: Web Audio API not available, using HTML5 Audio', error);
            this.isInitialized = false;
        }
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioManager: Audio context resumed');
            });
        }
    }

    /**
     * Carrega um arquivo de áudio
     */
    async loadSound(name, url, options = {}) {
        if (this.isMuted) return; // Não carregar se mutado

        try {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.preload = 'auto';
            audio.volume = (options.volume || 1) * this.sfxVolume * this.masterVolume;

            return new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => {
                    this.sounds.set(name, {
                        audio,
                        options: { ...options, type: 'sfx' }
                    });
                    resolve(audio);
                });

                audio.addEventListener('error', (e) => {
                    console.warn(`AudioManager: Failed to load ${name}:`, e);
                    reject(e);
                });

                audio.src = url;
            });
        } catch (error) {
            console.warn(`AudioManager: Error loading sound ${name}:`, error);
        }
    }

    /**
     * Reproduz um som
     */
    playSound(name, options = {}) {
        if (this.isMuted) return;

        const soundData = this.sounds.get(name);
        if (!soundData) {
            // Tentar criar som procedural se não encontrar
            this.playProceduralSound(name, options);
            return;
        }

        try {
            const { audio } = soundData;
            audio.currentTime = 0; // Reset para permitir sons sobrepostos
            audio.volume = (options.volume || 1) * this.sfxVolume * this.masterVolume;

            const playPromise = audio.play();
            if (playPromise) {
                playPromise.catch(error => {
                    console.warn(`AudioManager: Error playing ${name}:`, error);
                });
            }
        } catch (error) {
            console.warn(`AudioManager: Error playing sound ${name}:`, error);
        }
    }

    /**
     * Cria sons procedurais usando Web Audio API
     */
    playProceduralSound(type, options = {}) {
        if (this.isMuted || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            oscillator.connect(gain);
            gain.connect(this.masterGain);

            const volume = (options.volume || 0.3) * this.sfxVolume;
            const duration = options.duration || 0.1;

            switch (type) {
                case 'jump':
                    // Som de pulo - frequência ascendente
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(220, now);
                    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.1);
                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                    oscillator.stop(now + 0.15);
                    break;

                case 'damage':
                    // Som de dano - ruído descendente
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(150, now);
                    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                    oscillator.stop(now + 0.2);
                    break;

                case 'shoot':
                    // Som de tiro - pulso rápido
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                    gain.gain.setValueAtTime(volume * 0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                    oscillator.stop(now + 0.05);
                    break;

                case 'gameover':
                    // Som de game over - sequência descendente
                    this.playGameOverSequence(now, volume);
                    return; // Não iniciar oscillator aqui

                case 'coin':
                case 'score':
                    // Som de pontuação - arpejo ascendente
                    this.playScoreSequence(now, volume);
                    return;

                default:
                    // Som genérico
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, now);
                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
                    oscillator.stop(now + duration);
                    break;
            }

            oscillator.start(now);
        } catch (error) {
            console.warn('AudioManager: Error creating procedural sound:', error);
        }
    }

    playGameOverSequence(startTime, volume) {
        const frequencies = [330, 294, 262, 220];
        const noteDuration = 0.3;

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            oscillator.connect(gain);
            gain.connect(this.masterGain);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, startTime);

            const noteStart = startTime + index * noteDuration;
            const noteEnd = noteStart + noteDuration;

            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(volume, noteStart + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, noteEnd);

            oscillator.start(noteStart);
            oscillator.stop(noteEnd);
        });
    }

    playScoreSequence(startTime, volume) {
        const frequencies = [523, 659, 784]; // C5, E5, G5
        const noteDuration = 0.1;

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            oscillator.connect(gain);
            gain.connect(this.masterGain);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, startTime);

            const noteStart = startTime + index * noteDuration;
            const noteEnd = noteStart + noteDuration;

            gain.gain.setValueAtTime(volume * 0.3, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.01, noteEnd);

            oscillator.start(noteStart);
            oscillator.stop(noteEnd);
        });
    }

    /**
     * Define o estado de mute
     */
    setMuted(muted) {
        this.isMuted = muted;
        Storage.set('isMuted', muted);

        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : this.masterVolume;
        }

        // Atualizar volume de todos os sons HTML5
        for (const [name, soundData] of this.sounds) {
            if (soundData.audio) {
                soundData.audio.volume = muted ? 0 :
                    (soundData.options.volume || 1) * this.sfxVolume * this.masterVolume;
            }
        }
    }

    /**
     * Define o volume master
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));

        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.value = this.masterVolume;
        }

        // Atualizar volume de todos os sons HTML5
        for (const [name, soundData] of this.sounds) {
            if (soundData.audio && !this.isMuted) {
                soundData.audio.volume =
                    (soundData.options.volume || 1) * this.sfxVolume * this.masterVolume;
            }
        }
    }

    /**
     * Para todos os sons
     */
    stopAllSounds() {
        for (const [name, soundData] of this.sounds) {
            if (soundData.audio) {
                soundData.audio.pause();
                soundData.audio.currentTime = 0;
            }
        }
    }

    /**
     * Métodos de conveniência para sons do jogo
     */
    playJump() {
        this.playProceduralSound('jump', { volume: 0.4 });
    }

    playDamage() {
        this.playProceduralSound('damage', { volume: 0.6 });
    }

    playShoot() {
        this.playProceduralSound('shoot', { volume: 0.3 });
    }

    playGameOver() {
        this.playProceduralSound('gameover', { volume: 0.5 });
    }

    playScore() {
        this.playProceduralSound('score', { volume: 0.4 });
    }

    /**
     * Carrega sons externos (URLs de CDN)
     */
    async loadExternalSounds() {
        const soundUrls = {
            // Exemplo de sons de freesound.org ou similar (URLs ficam aqui)
            // 'jump': 'https://example.com/jump.mp3',
            // 'damage': 'https://example.com/damage.mp3',
        };

        const loadPromises = Object.entries(soundUrls).map(([name, url]) => {
            return this.loadSound(name, url).catch(error => {
                console.warn(`Failed to load external sound ${name}:`, error);
            });
        });

        try {
            await Promise.allSettled(loadPromises);
            console.log('AudioManager: External sounds loaded');
        } catch (error) {
            console.warn('AudioManager: Some external sounds failed to load:', error);
        }
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.stopAllSounds();

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.sounds.clear();
    }
}

// Instância global (singleton)
export const audioManager = new AudioManager();

// Exportar métodos de conveniência
export const playJump = () => audioManager.playJump();
export const playDamage = () => audioManager.playDamage();
export const playShoot = () => audioManager.playShoot();
export const playGameOver = () => audioManager.playGameOver();
export const playScore = () => audioManager.playScore();
export const setMuted = (muted) => audioManager.setMuted(muted);
export const setMasterVolume = (volume) => audioManager.setMasterVolume(volume);

export default audioManager;
