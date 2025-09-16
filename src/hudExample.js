// src/hudExample.js - Exemplo de uso das HUD sprites
import { HUDSprites, loadHUDSprites, createHUDSprite } from './hudSprites.js';

/**
 * Exemplo de como usar as HUD sprites no jogo
 * Esta função demonstra o carregamento e uso das sprites
 */
export async function demonstrateHUDSprites(app) {
    try {
        console.log('=== DEMONSTRAÇÃO HUD SPRITES ===');

        // 1. Carregar todas as sprites do HUD
        await loadHUDSprites();

        // 2. Criar container para os exemplos
        const exampleContainer = new PIXI.Container();
        exampleContainer.name = 'HUD_Examples';
        app.stage.addChild(exampleContainer);

        // 3. Exemplo básico: botão de pausa
        console.log('Criando botão de pausa...');
        const pauseButton = new PIXI.Sprite(HUDSprites.pause);
        pauseButton.anchor.set(0.5);
        pauseButton.position.set(100, 100);
        pauseButton.scale.set(0.8); // 80% do tamanho original
        pauseButton.interactive = true;
        pauseButton.buttonMode = true;

        // Adicionar eventos ao botão
        pauseButton.on('pointerdown', () => {
            console.log('Botão de pausa pressionado!');
            pauseButton.scale.set(0.7); // Efeito visual de clique
        });

        pauseButton.on('pointerup', () => {
            pauseButton.scale.set(0.8); // Voltar ao tamanho normal
        });

        exampleContainer.addChild(pauseButton);

        // 4. Exemplo com função utilitária: setas direcionais
        console.log('Criando setas direcionais...');
        const arrows = [
            { name: 'arrowUp', x: 200, y: 80 },
            { name: 'arrowDown', x: 200, y: 140 },
            { name: 'arrowLeft', x: 170, y: 110 },
            { name: 'arrowRight', x: 230, y: 110 }
        ];

        arrows.forEach(arrow => {
            const sprite = createHUDSprite(arrow.name, {
                scale: 0.6,
                position: { x: arrow.x, y: arrow.y },
                interactive: true,
                buttonMode: true
            });

            sprite.on('pointerdown', () => {
                console.log(`Seta ${arrow.name} pressionada!`);
            });

            exampleContainer.addChild(sprite);
        });

        // 5. Exemplo: poderes JavaScript
        console.log('Criando ícones de poderes JavaScript...');
        const jsPowers = ['reduce', 'map', 'filter', 'forEach', 'find', 'sort'];
        jsPowers.forEach((power, index) => {
            const sprite = createHUDSprite(power, {
                scale: 0.5,
                position: {
                    x: 350 + (index % 3) * 80,
                    y: 80 + Math.floor(index / 3) * 80
                },
                interactive: true,
                buttonMode: true
            });

            sprite.on('pointerdown', () => {
                console.log(`Poder ${power} ativado!`);
            });

            exampleContainer.addChild(sprite);
        });

        // 6. Exemplo: botão de magia
        console.log('Criando botão de magia...');
        const magicButton = createHUDSprite('castMagic', {
            scale: 1.0,
            position: { x: 600, y: 100 },
            interactive: true,
            buttonMode: true
        });

        magicButton.on('pointerdown', () => {
            console.log('Magia lançada!');
            // Efeito de rotação
            magicButton.rotation += 0.1;
        });

        exampleContainer.addChild(magicButton);

        // 7. Adicionar texto explicativo
        const instructionText = new PIXI.Text('HUD Sprites Demo\nClique nos ícones!', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center'
        });
        instructionText.position.set(10, 10);
        exampleContainer.addChild(instructionText);

        console.log('=== DEMONSTRAÇÃO CONCLUÍDA ===');
        console.log('Sprites disponíveis:', Object.keys(HUDSprites));

        return exampleContainer;

    } catch (error) {
        console.error('Erro na demonstração das HUD sprites:', error);
    }
}

/**
 * Remove a demonstração da tela
 */
export function removeHUDDemo(app) {
    const demo = app.stage.getChildByName('HUD_Examples');
    if (demo) {
        app.stage.removeChild(demo);
        demo.destroy({ children: true });
        console.log('Demonstração HUD removida');
    }
}
