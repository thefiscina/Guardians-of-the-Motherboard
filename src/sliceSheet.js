// Corta uma spritesheet em grade (com margem e espaçamento opcionais)
export function sliceGrid(texture, {
    cols,
    rows,
    margin = 0,
    spacing = 0,
    pickRows = [0],      // quais linhas usar na ordem (0 = primeira)
    framesLimit = null,  // cortar no total de N frames (opcional)
}) {
    const bt = texture.baseTexture;
    const totalW = bt.width;
    const totalH = bt.height;

    // calcula o tamanho de cada frame pela grade + margin/spacing
    const frameW = Math.floor((totalW - margin * 2 - spacing * (cols - 1)) / cols);
    const frameH = Math.floor((totalH - margin * 2 - spacing * (rows - 1)) / rows);

    const frames = [];
    for (const r of pickRows) {
        for (let c = 0; c < cols; c++) {
            const x = margin + c * (frameW + spacing);
            const y = margin + r * (frameH + spacing);
            const rect = new PIXI.Rectangle(x, y, frameW, frameH);
            frames.push(new PIXI.Texture(bt, rect));
            if (framesLimit && frames.length >= framesLimit) return frames;
        }
    }
    return frames;
}
