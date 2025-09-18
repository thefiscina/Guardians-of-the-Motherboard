/**
 * Utilities para o jogo de subida infinita
 * Funções helper para matemática, DPR e manipulação de dados
 */

// Device Pixel Ratio para canvas nítido
export const DPR = () => Math.max(1, Math.min(3, window.devicePixelRatio || 1));

// Clamp - limita valor entre min e max
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Random entre min e max
export const rand = (min, max) => Math.random() * (max - min) + min;

// Random inteiro entre min e max (inclusive)
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Chance percentual (0-1) retorna true/false
export const chance = (probability) => Math.random() < probability;

// Lerp - interpolação linear
export const lerp = (a, b, t) => a + (b - a) * t;

// Distância entre dois pontos
export const distance = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

// Normaliza ângulo entre 0 e 2π
export const normalizeAngle = (angle) => {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
};

// Converte graus para radianos
export const toRadians = (degrees) => degrees * (Math.PI / 180);

// Converte radianos para graus
export const toDegrees = (radians) => radians * (180 / Math.PI);

// Map - mapeia valor de um range para outro
export const map = (value, inMin, inMax, outMin, outMax) => {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
};

// Easing functions para animações suaves
export const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
export const easeOutBounce = (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
};

// Debounce para eventos (como resize)
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle para limitar execução de funções
export const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Formatação de números para display
export const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

// Array shuffle (Fisher-Yates)
export const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Pick random element from array
export const pick = (array) => array[Math.floor(Math.random() * array.length)];

// Remove element from array by value
export const remove = (array, item) => {
    const index = array.indexOf(item);
    if (index > -1) array.splice(index, 1);
    return array;
};

// AABB (Axis-Aligned Bounding Box) collision detection
export const aabbCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y;
};

// Circle collision detection
export const circleCollision = (circle1, circle2) => {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.r + circle2.r);
};

// Circle vs Rectangle collision
export const circleRectCollision = (circle, rect) => {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);

    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;

    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;

    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
};

// Performance timing
export const Timer = {
    start: () => performance.now(),
    end: (startTime, label = 'Timer') => {
        const elapsed = performance.now() - startTime;
        console.log(`${label}: ${elapsed.toFixed(2)}ms`);
        return elapsed;
    }
};

// Local storage helper com fallback
export const Storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage set error:', e);
            return false;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Storage remove error:', e);
            return false;
        }
    }
};

// Color helper functions
export const Color = {
    // Convert hex to RGB
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    // RGB to hex
    rgbToHex: (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    // Blend two colors
    blend: (color1, color2, amount) => {
        const rgb1 = Color.hexToRgb(color1);
        const rgb2 = Color.hexToRgb(color2);
        if (!rgb1 || !rgb2) return color1;

        const r = Math.round(lerp(rgb1.r, rgb2.r, amount));
        const g = Math.round(lerp(rgb1.g, rgb2.g, amount));
        const b = Math.round(lerp(rgb1.b, rgb2.b, amount));

        return Color.rgbToHex(r, g, b);
    }
};

// Constants para o jogo - TUNED para gameplay equilibrado
export const CONSTANTS = {
    // Física - ajustada para controle responsivo
    GRAVITY: 1000,           // Reduzido para saltos mais fluidos
    JUMP_VELOCITY: 420,      // Ajustado para alcance das plataformas
    PLAYER_ACCELERATION: 1800, // Mais responsivo
    MAX_VELOCITY_X: 200,     // Velocidade máxima controlada
    FRICTION: 0.88,          // Mais atrito para paradas mais precisas

    // Mundo - dimensões otimizadas
    WORLD_WIDTH: 400,
    PLATFORM_HEIGHT: 12,
    MIN_PLATFORM_WIDTH: 70,  // Aumentado para ser mais forgiving
    MAX_PLATFORM_WIDTH: 130, // Balanceado
    PLATFORM_GAP_Y: 55,      // Gap menor para progressão mais suave

    // Gameplay - progressão equilibrada
    SCORE_PER_HEIGHT: 40,    // Mais score por progresso
    POINTS_PER_TIER: 25,     // Tier a cada 25 pontos para progressão gradual
    FALL_PENALTY_PER_SEC: 6, // Penalidade mais leve
    DAMAGE_COOLDOWN: 0.8,    // Cooldown maior para recovery

    // Inimigos - spawn e dificuldade balanceados
    ENEMY_SPAWN_CHANCE: 0.12, // Chance menor inicial
    SHOOTER_CHANCE: 0.25,     // Menos atiradores inicialmente
    BULLET_SPEED: 180,        // Velocidade menor para esquivar
    ENEMY_DAMAGE: 8,          // Dano menor para mais forgiveness

    // Visual
    PLAYER_SIZE: 28,
    ENEMY_SIZE: 20,
    BULLET_RADIUS: 3,

    // Performance
    MAX_PLATFORMS: 100,
    MAX_ENEMIES: 50,
    MAX_BULLETS: 100,
    CLEANUP_DISTANCE: 2000
};

export default {
    DPR, clamp, rand, randInt, chance, lerp, distance,
    normalizeAngle, toRadians, toDegrees, map,
    easeInOutQuad, easeOutBounce, debounce, throttle,
    formatNumber, shuffle, pick, remove,
    aabbCollision, circleCollision, circleRectCollision,
    Timer, Storage, Color, CONSTANTS
};
