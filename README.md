# Guardian of the Motherboard

## 🎮 Sobre o Jogo

**Guardian of the Motherboard** é um jogo de plataforma 2D desenvolvido em JavaScript com PixiJS. O jogador controla um guardião que deve proteger a motherboard de vírus maliciosos usando ataques mágicos.

## 🚀 Como Jogar

### Controles PC:
- **WASD**: Movimento (W para pular)
- **ESPAÇO**: Pular alternativo
- **Mouse**: Mirar e atacar com magia
- **S**: Agachar (enquanto no chão)

### Controles Mobile:
- **D-pad virtual**: Movimento
- **Botão MAGIA**: Ataques mágicos

### Objetivo:
- Elimine 10 vírus para completar o nível
- Evite tomar dano dos inimigos
- Gerencie sua mana para ataques mágicos
- Complete o nível antes do tempo acabar (3 minutos)

## 🛠️ Instalação

1. Faça o download de todos os arquivos
2. Abra o arquivo `index.html` em um navegador moderno
3. O jogo carregará automaticamente

**Requisitos:**
- Navegador com suporte a ES6 modules
- Conexão com internet (para carregar PixiJS via CDN)

## 📁 Estrutura do Projeto

```
jogo/
├── index.html          # Arquivo principal
├── style.css          # Estilos CSS
├── src/               # Código fonte JavaScript
│   ├── main.js        # Ponto de entrada
│   ├── game.js        # Sistema principal do jogo
│   ├── player.js      # Lógica do jogador
│   ├── enemy.js       # Sistema de inimigos
│   ├── level.js       # Gerenciamento de níveis
│   ├── tutorial.js    # Tutorial interativo
│   ├── magic.js       # Sistema de magia
│   ├── hud.js         # Interface do usuário
│   ├── cutscene.js    # Sistema de cutscenes
│   └── sliceSheet.js  # Utilitário para spritesheets
└── assets/            # Assets do jogo
    ├── sprites/       # Sprites dos personagens
    ├── cenas/         # Imagens das cutscenes
    ├── audio/         # Música e efeitos sonoros
    ├── tilesets/      # Tiles para cenários
    └── banners/       # Imagens promocionais
```

## 🎯 Funcionalidades

### ✅ Implementadas:
- **Cutscene inicial** com música de fundo
- **Tutorial interativo** com instruções passo-a-passo
- **Sistema de player** completo com múltiplas animações
- **Inimigos vírus** com IA básica (patrulha, perseguição, ataque)
- **Sistema de magia** com projéteis e efeitos visuais
- **Física de plataforma** com gravidade e colisões
- **HUD completo** mostrando vida, mana, pontuação e objetivos
- **Sistema de níveis** com plataformas e obstáculos
- **Telas de vitória/derrota** com opções de reiniciar
- **Suporte mobile** com controles touch
- **Design responsivo** que funciona em diferentes resoluções

### 🎮 Mecânicas de Jogo:
- **Sistema de vida** com invulnerabilidade temporária após dano
- **Sistema de mana** que regenera automaticamente
- **Pontuação** baseada em inimigos derrotados
- **Timer** com limite de 3 minutos por nível
- **Detecção de colisão** precisa entre jogador, inimigos e projéteis
- **Física realista** com gravidade e atrito

## 🎨 Arte e Design

- **Estilo pixel art** com fonte retro "Press Start 2P"
- **Tema cyberpunk** com cores neon (verde ciano)
- **Interface minimalista** com elementos funcionais
- **Efeitos visuais** como brilhos e partículas nos feitiços
- **Animações fluidas** do personagem e inimigos

## 🔊 Áudio

- **Música de fundo** durante cutscene (continua no jogo)
- **Efeitos sonoros** sintéticos para ataques mágicos
- **Volume balanceado** para não interferir na gameplay

## 📱 Compatibilidade

### Desktop:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Mobile:
- ✅ iOS Safari 13+
- ✅ Chrome Mobile 80+
- ✅ Samsung Internet 11+

## 🐛 Solução de Problemas

### Problemas Comuns:

**O jogo não carrega:**
- Verifique a conexão com internet (necessária para PixiJS)
- Certifique-se que JavaScript está habilitado
- Teste em um navegador diferente

**Controles não funcionam:**
- No mobile, use os botões virtuais na tela
- Certifique-se que o foco está na janela do jogo
- Recarregue a página se necessário

**Performance baixa:**
- Feche outras abas do navegador
- Teste em um dispositivo mais potente
- Verifique se há atualizações do navegador

**Áudio não funciona:**
- Alguns navegadores bloqueiam autoplay de áudio
- Clique na tela para permitir reprodução de áudio
- Verifique se o volume do dispositivo está ligado

## 🚀 Desenvolvimento

### Tecnologias Utilizadas:
- **PixiJS 7.3.3** - Engine gráfica 2D
- **JavaScript ES6+** - Lógica do jogo
- **HTML5 Canvas** - Renderização
- **CSS3** - Interface e responsividade
- **Web Audio API** - Efeitos sonoros

### Arquitetura:
- **Modular**: Cada sistema em arquivo separado
- **Orientada a eventos**: Callbacks para comunicação entre sistemas
- **Estado centralizado**: GameData gerencia informações globais
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## 📈 Próximas Melhorias

Sugestões para versões futuras:
- [ ] Múltiplos níveis com dificuldade crescente
- [ ] Mais tipos de inimigos com comportamentos únicos
- [ ] Sistema de power-ups e upgrades
- [ ] Trilha sonora mais elaborada
- [ ] Sprites customizados para todas as animações
- [ ] Sistema de save/load de progresso
- [ ] Leaderboard local de pontuações
- [ ] Mais efeitos visuais e partículas

## 👥 Créditos

- **Desenvolvimento**: Assistente AI
- **Sprites**: herorun.png (fornecido pelo usuário)
- **Música**: cutscene_theme.mp3 (fornecido pelo usuário)
- **Font**: Press Start 2P (Google Fonts)
- **Engine**: PixiJS (pixi.js.org)

---

**Desenvolvido com ❤️ para demonstrar as capacidades do desenvolvimento de jogos web moderno.**
