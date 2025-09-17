# 🖼️ Otimizador de Imagens - Guardians of the Motherboard

Ferramenta Node.js para otimizar automaticamente todas as imagens do jogo, reduzindo o tamanho dos arquivos mantendo a qualidade visual.

## 📋 Pré-requisitos

- Node.js 14.0.0 ou superior
- npm (geralmente vem com Node.js)

## 🚀 Instalação

1. **Instalar dependências:**
```bash
npm install
```

Ou manualmente:
```bash
npm install sharp --save-dev
```

## 🎮 Como Usar

### Comando Básico
```bash
node optimize-images.js
```

Ou usando npm:
```bash
npm run optimize
```

### Exemplo de Saída
```
🎮 Otimizador de Imagens - Guardians of the Motherboard
================================================

📁 Criado diretório de backup: ./assets/backup

🖼️  Encontradas 6 imagens para processar

[1/6]
🔄 Processando: virus.png (2227KB)
   📐 Dimensões: 2952x1620
✅ Otimizado: 2227KB → 485KB (78% menor)

[2/6]
🔄 Processando: herorun.png (1004KB)
   📐 Dimensões: 1920x1080
✅ Otimizado: 1004KB → 267KB (73% menor)

🎯 RELATÓRIO DE OTIMIZAÇÃO
==========================
📊 Imagens processadas: 6
❌ Erros: 0
💾 Tamanho original: 8453KB
💾 Tamanho otimizado: 2103KB
🎉 Espaço economizado: 6350KB
📈 Redução total: 75%

✨ Otimização concluída!
💼 Backups salvos em: ./assets/backup
```

## ⚙️ Configuração

O script pode ser personalizado editando as configurações no arquivo `optimize-images.js`:

```javascript
const CONFIG = {
    // Diretórios para processar
    inputDirs: [
        './assets/sprites',
        './assets/banners', 
        './assets/cenas',
        './assets/tilesets'
    ],
    
    // Qualidade da compressão (0-100)
    optimization: {
        png: { quality: 85 },
        jpg: { quality: 80 },
        webp: { quality: 85 }
    },
    
    // Tamanho máximo por arquivo
    maxSizeKB: 500,
    
    // Dimensões máximas
    maxWidth: 2048,
    maxHeight: 2048
};
```

## 🛠️ Funcionalidades

### ✅ **Otimização Inteligente**
- Compressão PNG com `sharp`
- Qualidade JPEG otimizada
- Redimensionamento automático se necessário
- Preserva proporções das imagens

### 🔒 **Backup Automático**
- Cria backup dos arquivos originais
- Nunca perde suas imagens originais
- Localizado em `./assets/backup/`

### 📊 **Relatórios Detalhados**
- Mostra tamanho antes/depois
- Percentual de redução
- Estatísticas completas
- Log de cada arquivo processado

### 🎯 **Otimização por Tipo**
- **PNG**: Compressão lossless otimizada
- **JPEG**: Qualidade balanceada
- **Outros formatos**: Conversão automática para PNG

### 🚀 **Performance**
- Processa múltiplos diretórios
- Busca recursiva em subpastas
- Pula arquivos já otimizados
- Rápido e eficiente

## 📁 Estrutura de Diretórios

```
jogo/
├── assets/
│   ├── sprites/        ← Processado
│   ├── banners/        ← Processado
│   ├── cenas/          ← Processado
│   ├── tilesets/       ← Processado
│   └── backup/         ← Backups criados aqui
├── optimize-images.js  ← Script principal
└── package.json        ← Dependências
```

## 🎯 Resultados Esperados

- **Redução de 60-80%** no tamanho dos arquivos
- **Mantém qualidade visual** para o jogo
- **Carregamento mais rápido** no navegador
- **Menos uso de banda** para download
- **Melhor performance** do PIXI.js

## ⚠️ Notas Importantes

1. **Backups**: Os arquivos originais são salvos em `./assets/backup/`
2. **Qualidade**: As configurações balanceiam tamanho vs qualidade
3. **Spritesheet**: Funciona perfeitamente com spritesheets animados
4. **Reversível**: Você pode restaurar os originais a qualquer momento

## 🔧 Solução de Problemas

### Erro: "Sharp não está instalado"
```bash
npm install sharp --save-dev
```

### Erro: "Diretório não encontrado"
Verifique se está executando na pasta raiz do projeto que contém a pasta `assets/`.

### Imagem não otimizada
Alguns arquivos já pequenos (< 50KB) são pulados automaticamente.

## 📦 Scripts NPM Disponíveis

```bash
npm run optimize        # Otimizar todas as imagens
npm run install-deps    # Instalar dependências
```

---

**Developed for Guardians of the Motherboard** 🎮✨
