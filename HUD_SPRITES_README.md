# Sistema de HUD Sprites - Guia de Uso

Este sistema gerencia sprites de interface do usuário (HUD) em pixel art de 64x64 pixels.

## 📁 Arquivos

- `src/hudSprites.js` - Sistema principal de sprites
- `src/hudExample.js` - Exemplos de uso
- `assets/sprites/hud_sprites.png` - Spritesheet com todos os ícones

## 🎮 Ícones Disponíveis

### Setas Direcionais
- `arrowUp` - Seta para cima
- `arrowDown` - Seta para baixo
- `arrowLeft` - Seta para esquerda
- `arrowRight` - Seta para direita

### Magia e Poderes
- `castMagic` - Ícone de lançar magia
- `reduce` - Poder JavaScript reduce
- `map` - Poder JavaScript map
- `filter` - Poder JavaScript filter
- `forEach` - Poder JavaScript forEach
- `find` - Poder JavaScript find
- `sort` - Poder JavaScript sort

### Controles do Jogo
- `settings` - Configurações
- `pause` - Pausar jogo
- `continue` - Continuar jogo

## 🚀 Como Usar

### 1. Importar o Sistema

```javascript
import { HUDSprites, loadHUDSprites, createHUDSprite } from './hudSprites.js';
```

### 2. Carregar as Sprites (uma vez no início)

```javascript
async function init() {
    await loadHUDSprites();
    // Agora todas as sprites estão disponíveis em HUDSprites
}
```

### 3. Usar as Sprites

#### Método Simples:
```javascript
// Criar sprite diretamente
const pauseButton = new PIXI.Sprite(HUDSprites.pause);
pauseButton.position.set(100, 100);
app.stage.addChild(pauseButton);
```

#### Método com Função Utilitária:
```javascript
// Usar função helper para configuração avançada
const arrowUp = createHUDSprite('arrowUp', {
    scale: 0.8,
    position: { x: 200, y: 50 },
    interactive: true,
    buttonMode: true
});

arrowUp.on('pointerdown', () => {
    console.log('Seta pressionada!');
});

app.stage.addChild(arrowUp);
```

### 4. Criar Botões Interativos

```javascript
const magicButton = new PIXI.Sprite(HUDSprites.castMagic);
magicButton.anchor.set(0.5);
magicButton.position.set(400, 300);
magicButton.interactive = true;
magicButton.buttonMode = true;

// Efeitos visuais
magicButton.on('pointerover', () => {
    magicButton.scale.set(1.1);
});

magicButton.on('pointerout', () => {
    magicButton.scale.set(1.0);
});

magicButton.on('pointerdown', () => {
    console.log('Magia lançada!');
});

app.stage.addChild(magicButton);
```

## 🔧 Configuração da Spritesheet

### Estrutura da Spritesheet

A spritesheet `hud_sprites.png` deve estar organizada em uma grade:

```
Linha 0: [arrowUp] [arrowDown] [arrowLeft] [arrowRight]
Linha 1: [castMagic] [reduce] [map] [filter]
Linha 2: [forEach] [find] [sort] [settings]
Linha 3: [pause] [continue] [...]
```

### Adicionar Novos Ícones

1. **Adicione o ícone na spritesheet** mantendo o tamanho 64x64px
2. **Atualize a configuração** em `SPRITE_CONFIG.icons`:

```javascript
const SPRITE_CONFIG = {
    icons: {
        // Ícones existentes...
        
        // Novo ícone na linha 3, coluna 2
        newIcon: { row: 3, col: 2 }
    }
};
```

3. **Recarregue as sprites**:

```javascript
await loadHUDSprites();
// Agora HUDSprites.newIcon está disponível
```

## 🛠️ Funções Utilitárias

### `getAvailableIcons()`
Retorna lista de todos os ícones disponíveis:
```javascript
const icons = getAvailableIcons();
console.log(icons); // ['arrowUp', 'arrowDown', ...]
```

### `getIconInfo(iconName)`
Obtém informações detalhadas sobre um ícone:
```javascript
const info = getIconInfo('pause');
console.log(info);
// { name: 'pause', row: 3, col: 0, x: 0, y: 192, width: 64, height: 64 }
```

### `createHUDSprite(iconName, options)`
Cria sprite com configurações avançadas:
```javascript
const sprite = createHUDSprite('reduce', {
    scale: 0.5,
    anchor: { x: 0.5, y: 0.5 },
    position: { x: 100, y: 100 },
    interactive: true,
    buttonMode: true
});
```

## 📝 Exemplo Completo

```javascript
import { HUDSprites, loadHUDSprites } from './hudSprites.js';

async function createGameHUD(app) {
    // Carregar sprites
    await loadHUDSprites();
    
    // Container do HUD
    const hudContainer = new PIXI.Container();
    
    // Botão de pausa
    const pauseBtn = new PIXI.Sprite(HUDSprites.pause);
    pauseBtn.position.set(50, 50);
    pauseBtn.interactive = true;
    pauseBtn.on('pointerdown', () => {
        console.log('Jogo pausado!');
    });
    
    // Setas de movimento
    const arrows = [
        { sprite: HUDSprites.arrowUp, x: 100, y: 150 },
        { sprite: HUDSprites.arrowDown, x: 100, y: 200 },
        { sprite: HUDSprites.arrowLeft, x: 50, y: 175 },
        { sprite: HUDSprites.arrowRight, x: 150, y: 175 }
    ];
    
    arrows.forEach(arrow => {
        const sprite = new PIXI.Sprite(arrow.sprite);
        sprite.position.set(arrow.x, arrow.y);
        sprite.scale.set(0.7);
        hudContainer.addChild(sprite);
    });
    
    hudContainer.addChild(pauseBtn);
    app.stage.addChild(hudContainer);
    
    return hudContainer;
}
```

## ⚠️ Notas Importantes

- Cada ícone deve ter exatamente 64x64 pixels
- A spritesheet deve estar em `assets/sprites/hud_sprites.png`
- Chame `loadHUDSprites()` antes de usar qualquer sprite
- Para melhor performance, carregue as sprites uma vez no início do jogo
- Use `createHUDSprite()` para configurações avançadas
- Use `new PIXI.Sprite(HUDSprites.iconName)` para uso simples
