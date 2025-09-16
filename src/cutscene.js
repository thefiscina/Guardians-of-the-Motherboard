// src/cutscene.js
export function runCutscene(app, onComplete = () => { }, opts = {}) {
    const CONFIG = {
        imagePath: 'assets/cenas/cena1.png', // 6 quadros (2x3)
        cols: 2,
        rows: 3,
        panelDuration: 2200,
        fadeDuration: 450,
        bgColor: 0x0b1020,
        audioSrc: 'assets/audio/cutscene_theme.mp3',
        keepMusic: opts.keepMusic ?? true,
    };

    const scene = new PIXI.Container();
    const bg = new PIXI.Graphics().beginFill(CONFIG.bgColor).drawRect(0, 0, 1, 1).endFill();
    bg.scale.set(app.renderer.width, app.renderer.height);
    scene.addChild(bg);

    const panelContainer = new PIXI.Container();
    scene.addChild(panelContainer);

    let audio;
    try {
        audio = new Audio(CONFIG.audioSrc);
        audio.volume = 0.5;
        audio.loop = true; // deixa como BGM
        audio.play().catch(() => { });
    } catch { }

    let panels = [];
    let index = -1;
    let currentSprite = null;
    let elapsed = 0;
    let phase = 'idle';
    let running = true;

    function layout() {
        bg.scale.set(app.renderer.width, app.renderer.height);
        if (!currentSprite) return;
        const margin = 24;
        const availW = app.renderer.width - margin * 2;
        const availH = app.renderer.height - margin * 2;
        const s = Math.min(availW / currentSprite.texture.width, availH / currentSprite.texture.height);
        currentSprite.scale.set(s);
        currentSprite.position.set(
            (app.renderer.width - currentSprite.width) / 2,
            (app.renderer.height - currentSprite.height) / 2
        );
    }
    window.addEventListener('resize', layout);

    function fadeTo(target, duration) {
        const start = currentSprite.alpha;
        const delta = target - start;
        const t0 = performance.now();
        return new Promise((resolve) => {
            function step() {
                const t = Math.min(1, (performance.now() - t0) / duration);
                currentSprite.alpha = start + delta * t;
                if (t < 1) requestAnimationFrame(step);
                else resolve();
            }
            requestAnimationFrame(step);
        });
    }

    async function nextPanel() {
        index++;
        if (index >= panels.length) { endCutscene(); return; }
        panelContainer.removeChildren();
        currentSprite = new PIXI.Sprite(panels[index]);
        currentSprite.alpha = 0;
        panelContainer.addChild(currentSprite);
        layout();
        await fadeTo(1, CONFIG.fadeDuration);
        phase = 'showing';
        elapsed = 0;
    }

    function endCutscene() {
        running = false;
        app.ticker.remove(tick);
        window.removeEventListener('resize', layout);
        app.stage.removeChild(scene);
        // NÃO pausa a música se keepMusic = true
        if (!CONFIG.keepMusic && audio) {
            try { audio.pause(); audio.currentTime = 0; } catch { }
        }
        onComplete({ bgm: audio });
    }

    function tick() {
        if (!running || !currentSprite) return;
        elapsed += app.ticker.deltaMS;
        if (phase === 'showing' && elapsed >= CONFIG.panelDuration) {
            phase = 'fadingOut';
            fadeTo(0, CONFIG.fadeDuration).then(nextPanel);
        }
    }

    scene.interactive = true;
    scene.on('pointerdown', () => {
        if (phase === 'showing') {
            phase = 'fadingOut';
            fadeTo(0, CONFIG.fadeDuration).then(nextPanel);
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') endCutscene();
        else if (phase === 'showing') {
            phase = 'fadingOut';
            fadeTo(0, CONFIG.fadeDuration).then(nextPanel);
        }
    });

    PIXI.Assets.load(CONFIG.imagePath)
        .then(tex => (tex instanceof PIXI.Texture ? tex : new PIXI.Texture(tex)))
        .then(texture => {
            const fullW = texture.width, fullH = texture.height;
            const pw = Math.floor(fullW / CONFIG.cols);
            const ph = Math.floor(fullH / CONFIG.rows);
            for (let r = 0; r < CONFIG.rows; r++) {
                for (let c = 0; c < CONFIG.cols; c++) {
                    const rect = new PIXI.Rectangle(c * pw, r * ph, pw, ph);
                    panels.push(new PIXI.Texture(texture.baseTexture, rect));
                }
            }
            app.stage.addChild(scene);
            nextPanel().then(() => app.ticker.add(tick));
        })
        .catch(err => { console.error('Falha cutscene:', err); endCutscene(); });
}
