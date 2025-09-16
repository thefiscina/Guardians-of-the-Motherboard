// src/hudSprites.js - Sistema de sprites do HUD em pixel art
import * as PIXI from 'https://cdn.skypack.dev/pixi.js@7.3.3';

/**
 * ========================================
 * SISTEMA DE SPRITES DO HUD - DOCUMENTAÇÃO
 * ========================================
 * 
 * Este arquivo gerencia todas as sprites do HUD em pixel art de 64x64px.
 * 
 * ESTRUTURA DA SPRITESHEET:
 * - Arquivo: assets/sprites/hud_sprites.png
 * - Cada ícone: 64x64 pixels
 * - Organização: grade linha por linha, esquerda para direita
 * 
 * COMO USAR:
 * 
 * 1. Importar as funções:
 *    import { HUDSprites, loadHUDSprites } from './hudSprites.js';
 * 
 * 2. Carregar as sprites (uma vez no início):
 *    await loadHUDSprites();
 * 
 * 3. Usar as sprites:
 *    const pauseButton = new PIXI.Sprite(HUDSprites.pause);
 *    app.stage.addChild(pauseButton);
 * 
 * ÍCONES DISPONÍVEIS:
 * - Setas: arrowUp, arrowDown, arrowLeft, arrowRight
 * - Magia: castMagic
 * - Poderes JS: reduce, map, filter, forEach, find, sort
 * - Controles: settings, pause, continue
 * 
 * PARA ADICIONAR NOVOS ÍCONES:
 * 1. Adicione na spritesheet hud_sprites.png
 * 2. Atualize SPRITE_CONFIG.icons com a posição (row, col)
 * 3. Recarregue as sprites com loadHUDSprites()
 * 
 * ========================================
 */

/**
 * Objeto que contém todas as texturas dos ícones do HUD
 * Cada propriedade é uma PIXI.Texture recortada da spritesheet
 */
export let HUDSprites = {};

/**
 * Configuração da spritesheet do HUD
 * Define a posição de cada ícone na grade 64x64px
 */
const SPRITE_CONFIG = {
    // Tamanho de cada ícone
    iconSize: 64,

    // Mapeamento dos ícones (linha, coluna) - baseado em zero
    // Organize conforme a ordem real da sua spritesheet
    icons: {
        // Setas direcionais (primeira linha)
        arrowUp: { row: 0, col: 0 },
        arrowDown: { row: 0, col: 1 },
        arrowLeft: { row: 0, col: 2 },
        arrowRight: { row: 0, col: 3 },

        // Magia e poderes JavaScript (segunda linha)
        castMagic: { row: 1, col: 0 },
        reduce: { row: 1, col: 1 },
        map: { row: 1, col: 2 },
        filter: { row: 1, col: 3 },

        // Mais poderes JavaScript (terceira linha)
        forEach: { row: 2, col: 0 },
        find: { row: 2, col: 1 },
        sort: { row: 2, col: 2 },

        // Controles do jogo (terceira linha continuação)
        settings: { row: 2, col: 3 },

        // Controles de pausa (quarta linha)
        pause: { row: 3, col: 0 },
        continue: { row: 3, col: 1 }
    }
};

/**
 * Carrega e recorta a spritesheet do HUD
 * @returns {Promise<Object>} Objeto com todas as texturas recortadas
 */
export async function loadHUDSprites() {
    try {
        console.log('Carregando HUD spritesheet...');

        // Carregar a spritesheet principal
        const hudTexture = await PIXI.Assets.load('assets/sprites/hud_sprites.png');

        console.log('HUD spritesheet carregada:', {
            width: hudTexture.width,
            height: hudTexture.height
        });

        // Objeto temporário para armazenar as texturas
        const sprites = {};

        // Recortar cada ícone da spritesheet
        Object.entries(SPRITE_CONFIG.icons).forEach(([iconName, position]) => {
            // Calcular posição em pixels
            const x = position.col * SPRITE_CONFIG.iconSize;
            const y = position.row * SPRITE_CONFIG.iconSize;

            // Criar retângulo de recorte
            const rect = new PIXI.Rectangle(
                x,
                y,
                SPRITE_CONFIG.iconSize,
                SPRITE_CONFIG.iconSize
            );

            // Criar textura recortada
            const croppedTexture = new PIXI.Texture(hudTexture.baseTexture, rect);

            // Armazenar no objeto
            sprites[iconName] = croppedTexture;

            console.log(`Ícone '${iconName}' recortado:`, {
                position: `(${x}, ${y})`,
                size: `${SPRITE_CONFIG.iconSize}x${SPRITE_CONFIG.iconSize}`
            });
        });

        // Atualizar o objeto exportado
        HUDSprites = sprites;

        console.log('Todas as sprites do HUD foram carregadas:', Object.keys(sprites));

        return sprites;

    } catch (error) {
        console.error('Erro ao carregar HUD sprites:', error);

        // Fallback: criar texturas vazias para evitar erros
        const fallbackSprites = {};
        Object.keys(SPRITE_CONFIG.icons).forEach(iconName => {
            fallbackSprites[iconName] = PIXI.Texture.WHITE;
        });

        HUDSprites = fallbackSprites;
        return fallbackSprites;
    }
}

/**
 * Cria um sprite PIXI a partir de um ícone do HUD
 * @param {string} iconName - Nome do ícone (ex: 'pause', 'arrowUp')
 * @param {Object} options - Opções de configuração do sprite
 * @returns {PIXI.Sprite} Sprite configurado
 */
export function createHUDSprite(iconName, options = {}) {
    const {
        scale = 1,
        anchor = { x: 0.5, y: 0.5 },
        position = { x: 0, y: 0 },
        interactive = false,
        buttonMode = false
    } = options;

    // Verificar se o ícone existe
    if (!HUDSprites[iconName]) {
        console.warn(`Ícone '${iconName}' não encontrado. Ícones disponíveis:`, Object.keys(HUDSprites));
        return new PIXI.Sprite(PIXI.Texture.WHITE);
    }

    // Criar sprite
    const sprite = new PIXI.Sprite(HUDSprites[iconName]);

    // Configurar propriedades
    sprite.anchor.set(anchor.x, anchor.y);
    sprite.scale.set(scale);
    sprite.position.set(position.x, position.y);
    sprite.interactive = interactive;
    sprite.buttonMode = buttonMode;

    return sprite;
}

/**
 * Lista todos os ícones disponíveis
 * @returns {Array<string>} Array com nomes dos ícones
 */
export function getAvailableIcons() {
    return Object.keys(SPRITE_CONFIG.icons);
}

/**
 * Obtém informações sobre um ícone específico
 * @param {string} iconName - Nome do ícone
 * @returns {Object|null} Informações do ícone ou null se não encontrado
 */
export function getIconInfo(iconName) {
    const config = SPRITE_CONFIG.icons[iconName];
    if (!config) return null;

    return {
        name: iconName,
        row: config.row,
        col: config.col,
        x: config.col * SPRITE_CONFIG.iconSize,
        y: config.row * SPRITE_CONFIG.iconSize,
        width: SPRITE_CONFIG.iconSize,
        height: SPRITE_CONFIG.iconSize,
        texture: HUDSprites[iconName] || null
    };
}

/**
 * Função utilitária para adicionar novos ícones facilmente
 * Use esta função se precisar adicionar ícones programaticamente
 * @param {string} iconName - Nome do novo ícone
 * @param {number} row - Linha na spritesheet (baseado em zero)
 * @param {number} col - Coluna na spritesheet (baseado em zero)
 */
export function addIcon(iconName, row, col) {
    SPRITE_CONFIG.icons[iconName] = { row, col };

    // Se a spritesheet já foi carregada, recortar o novo ícone
    if (Object.keys(HUDSprites).length > 0) {
        console.log(`Adicionando novo ícone '${iconName}' em (${row}, ${col})`);
        // Recarregar sprites seria necessário aqui
        console.warn('Para adicionar ícones após carregamento, recarregue as sprites com loadHUDSprites()');
    }
}
