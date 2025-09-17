#!/usr/bin/env node

/**
 * Script para otimizar imagens do jogo
 * Reduz o tamanho das imagens mantendo a qualidade visual
 * 
 * Uso: node optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configurações de otimização
const CONFIG = {
    // Diretórios para processar
    inputDirs: [
        './assets/sprites',
        './assets/banners',
        './assets/cenas',
        './assets/tilesets'
    ],

    // Diretório de backup (opcional)
    backupDir: './assets/backup',

    // Configurações por tipo de imagem
    optimization: {
        png: {
            quality: 85,
            compressionLevel: 8,
            progressive: true
        },
        jpg: {
            quality: 80,
            progressive: true,
            mozjpeg: true
        },
        webp: {
            quality: 85,
            effort: 6
        }
    },

    // Tamanho máximo em KB (se a imagem for maior, será redimensionada)
    maxSizeKB: 500,

    // Redimensionamento automático se necessário
    maxWidth: 2048,
    maxHeight: 2048
};

class ImageOptimizer {
    constructor() {
        this.stats = {
            processed: 0,
            errors: 0,
            originalSize: 0,
            optimizedSize: 0,
            savedBytes: 0
        };
    }

    /**
     * Inicializar otimizador
     */
    async init() {
        console.log('🎮 Otimizador de Imagens - Guardians of the Motherboard');
        console.log('================================================\n');

        // Verificar se sharp está instalado
        try {
            await sharp({ create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png().toBuffer();
        } catch (error) {
            console.error('❌ Sharp não está instalado!');
            console.log('📦 Instale com: npm install sharp');
            process.exit(1);
        }

        // Criar diretório de backup
        if (CONFIG.backupDir && !fs.existsSync(CONFIG.backupDir)) {
            fs.mkdirSync(CONFIG.backupDir, { recursive: true });
            console.log(`📁 Criado diretório de backup: ${CONFIG.backupDir}`);
        }
    }

    /**
     * Obter tamanho do arquivo em KB
     */
    getFileSizeKB(filePath) {
        const stats = fs.statSync(filePath);
        return Math.round(stats.size / 1024 * 100) / 100;
    }

    /**
     * Criar backup do arquivo original
     */
    async createBackup(filePath) {
        if (!CONFIG.backupDir) return;

        const fileName = path.basename(filePath);
        const backupPath = path.join(CONFIG.backupDir, fileName);

        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(filePath, backupPath);
        }
    }

    /**
     * Otimizar uma imagem individual
     */
    async optimizeImage(filePath) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            const originalSizeKB = this.getFileSizeKB(filePath);

            console.log(`🔄 Processando: ${path.basename(filePath)} (${originalSizeKB}KB)`);

            // Pular se já estiver pequeno o suficiente
            if (originalSizeKB <= 50) {
                console.log(`✅ Já otimizado: ${path.basename(filePath)}`);
                return;
            }

            // Criar backup
            await this.createBackup(filePath);

            // Carregar imagem
            let image = sharp(filePath);
            const metadata = await image.metadata();

            console.log(`   📐 Dimensões: ${metadata.width}x${metadata.height}`);

            // Redimensionar se necessário
            if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
                image = image.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
                console.log(`   🔄 Redimensionando para max ${CONFIG.maxWidth}x${CONFIG.maxHeight}`);
            }

            // Aplicar otimização baseada no formato
            let optimizedBuffer;

            switch (ext) {
                case '.png':
                    optimizedBuffer = await image
                        .png({
                            quality: CONFIG.optimization.png.quality,
                            compressionLevel: CONFIG.optimization.png.compressionLevel,
                            progressive: CONFIG.optimization.png.progressive
                        })
                        .toBuffer();
                    break;

                case '.jpg':
                case '.jpeg':
                    optimizedBuffer = await image
                        .jpeg({
                            quality: CONFIG.optimization.jpg.quality,
                            progressive: CONFIG.optimization.jpg.progressive,
                            mozjpeg: CONFIG.optimization.jpg.mozjpeg
                        })
                        .toBuffer();
                    break;

                default:
                    // Para outros formatos, converter para PNG otimizado
                    optimizedBuffer = await image
                        .png({
                            quality: CONFIG.optimization.png.quality,
                            compressionLevel: CONFIG.optimization.png.compressionLevel
                        })
                        .toBuffer();
                    break;
            }

            // Verificar se a otimização realmente reduziu o tamanho
            const optimizedSizeKB = Math.round(optimizedBuffer.length / 1024 * 100) / 100;

            if (optimizedSizeKB < originalSizeKB) {
                // Salvar arquivo otimizado
                fs.writeFileSync(filePath, optimizedBuffer);

                const savedKB = Math.round((originalSizeKB - optimizedSizeKB) * 100) / 100;
                const reduction = Math.round(((originalSizeKB - optimizedSizeKB) / originalSizeKB) * 100);

                console.log(`✅ Otimizado: ${originalSizeKB}KB → ${optimizedSizeKB}KB (${reduction}% menor)`);

                // Atualizar estatísticas
                this.stats.originalSize += originalSizeKB;
                this.stats.optimizedSize += optimizedSizeKB;
                this.stats.savedBytes += savedKB;
            } else {
                console.log(`⚠️  Sem melhoria: mantendo arquivo original`);
            }

            this.stats.processed++;

        } catch (error) {
            console.error(`❌ Erro ao processar ${filePath}:`, error.message);
            this.stats.errors++;
        }
    }

    /**
     * Encontrar todas as imagens nos diretórios especificados
     */
    findImages(dir) {
        const images = [];
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];

        if (!fs.existsSync(dir)) {
            console.warn(`⚠️  Diretório não encontrado: ${dir}`);
            return images;
        }

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Recursivamente buscar em subdiretórios
                images.push(...this.findImages(filePath));
            } else {
                const ext = path.extname(file).toLowerCase();
                if (imageExtensions.includes(ext)) {
                    images.push(filePath);
                }
            }
        }

        return images;
    }

    /**
     * Processar todas as imagens
     */
    async processAll() {
        const allImages = [];

        // Encontrar todas as imagens
        for (const dir of CONFIG.inputDirs) {
            const images = this.findImages(dir);
            allImages.push(...images);
        }

        if (allImages.length === 0) {
            console.log('📭 Nenhuma imagem encontrada para processar.');
            return;
        }

        console.log(`🖼️  Encontradas ${allImages.length} imagens para processar\n`);

        // Processar cada imagem
        for (let i = 0; i < allImages.length; i++) {
            const image = allImages[i];
            console.log(`[${i + 1}/${allImages.length}]`);
            await this.optimizeImage(image);
            console.log('');
        }
    }

    /**
     * Exibir relatório final
     */
    showReport() {
        console.log('\n🎯 RELATÓRIO DE OTIMIZAÇÃO');
        console.log('==========================');
        console.log(`📊 Imagens processadas: ${this.stats.processed}`);
        console.log(`❌ Erros: ${this.stats.errors}`);
        console.log(`💾 Tamanho original: ${Math.round(this.stats.originalSize)}KB`);
        console.log(`💾 Tamanho otimizado: ${Math.round(this.stats.optimizedSize)}KB`);
        console.log(`🎉 Espaço economizado: ${Math.round(this.stats.savedBytes)}KB`);

        if (this.stats.originalSize > 0) {
            const totalReduction = Math.round(((this.stats.savedBytes) / this.stats.originalSize) * 100);
            console.log(`📈 Redução total: ${totalReduction}%`);
        }

        console.log('\n✨ Otimização concluída!');

        if (CONFIG.backupDir) {
            console.log(`💼 Backups salvos em: ${CONFIG.backupDir}`);
        }
    }
}

// Função principal
async function main() {
    const optimizer = new ImageOptimizer();

    try {
        await optimizer.init();
        await optimizer.processAll();
        optimizer.showReport();
    } catch (error) {
        console.error('❌ Erro durante a otimização:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = ImageOptimizer;
