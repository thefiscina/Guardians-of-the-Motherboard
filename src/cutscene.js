// cutscene.js — compatível com Pixi v7.3.3
export function runCutscene(app, onComplete = () => { }) {
    const CONFIG = {
        imagePath: 'assets/cenas/cena1.png', // sprite gigante 2x3
        cols: 2,
        rows: 3,
        panelDuration: 2200,
        fadeDuration: 450,
        bgColor: 0x0b1020,
        audio: { src: 'assets/audio/cutscene_theme.mp3', volume: 0.5, loop: false },
        ui: { hintDelay: 900, hintText: 'Tap/Click para avançar — ESC para pular' },
    };

    const scene = new PIXI.Container();
    const bg = new PIXI.Graphics().beginFill(CONFIG.bgColor).drawRect(0, 0, 1, 1).endFill();
    bg.scale.set(app.renderer.width, app.renderer.height);
    scene.addChild(bg);

    const hintStyle = new PIXI.TextStyle({
        fill: 0xcdd6f4, fontSize: 14,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
        dropShadow: true, dropShadowColor: '#000', dropShadowDistance: 2,
    });
    const hint = new PIXI.Text('', hintStyle);
    hint.alpha = 0; hint.anchor.set(0.5, 1);
    hint.position.set(app.renderer.width / 2, app.renderer.height - 16);
    scene.addChild(hint);

    const panelContainer = new PIXI.Container();
    scene.addChild(panelContainer);

    let audio;
    try {
        audio = new Audio(CONFIG.audio.src);
        audio.volume = CONFIG.audio.volume;
        audio.loop = CONFIG.audio.loop;
    } catch { }

    let panels = [];
    let index = -1;
    let currentSprite = null;
    let elapsed = 0;
    let phase = 'idle';
    let running = true;
    let interacted = false;

    function layout() {
        bg.scale.set(app.renderer.width, app.renderer.height);
        if (currentSprite) {
            const margin = 24;
            const availW = app.renderer.width - margin * 2;
            const availH = app.renderer.height - margin * 2 - 24;
            const s = Math.min(availW / currentSprite.texture.width, availH / currentSprite.texture.height);
            currentSprite.scale.set(s);
            currentSprite.position.set(
                (app.renderer.width - currentSprite.width) / 2,
                (app.renderer.height - 24 - currentSprite.height) / 2
            );
            hint.position.set(app.renderer.width / 2, app.renderer.height - 12);
        }
    }
    window.addEventListener('resize', layout);

    function fadeTo(target, duration) {
        const start = currentSprite.alpha;
        const delta = target - start;
        const t0 = performance.now();
        return new Promise((resolve) => {
            function step() {
                const t = (performance.now() - t0) / duration;
                if (t >= 1) { currentSprite.alpha = target; resolve(); return; }
                currentSprite.alpha = start + delta * t;
                requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
    }

    function showHint() {
        hint.text = CONFIG.ui.hintText;
        const t0 = performance.now();
        (function step() {
            const t = Math.min(1, (performance.now() - t0) / 300);
            hint.alpha = t;
            if (t < 1) requestAnimationFrame(step);
        })();
    }

    async function nextPanel() {
        index++;
        if (index >= panels.length) { endCutscene(); return; }
        panelContainer.removeChildren();
        currentSprite = new PIXI.Sprite(panels[index]);
        currentSprite.alpha = 0;
        panelContainer.addChild(currentSprite);
        layout();
        phase = 'fadingIn';
        await fadeTo(1, CONFIG.fadeDuration);
        phase = 'showing';
        elapsed = 0;
    }

    function endCutscene() {
        running = false;
        app.ticker.remove(tick);
        window.removeEventListener('resize', layout);
        app.stage.removeChild(scene);
        try { audio && (audio.pause(), audio.currentTime = 0); } catch { }
        onComplete();
    }

    function userInteractAdvance() {
        interacted = true;
        try { if (audio && audio.paused) audio.play().catch(() => { }); } catch { }
        if (phase === 'showing') {
            phase = 'fadingOut';
            fadeTo(0, CONFIG.fadeDuration).then(nextPanel);
        }
    }
    function userSkipAll() { interacted = true; endCutscene(); }

    scene.interactive = true;
    scene.on('pointerdown', userInteractAdvance);
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') userSkipAll(); else userInteractAdvance();
    });

    function tick() {
        if (!running || !currentSprite) return;
        elapsed += app.ticker.deltaMS;
        if (phase === 'showing' && elapsed >= CONFIG.panelDuration) {
            phase = 'fadingOut';
            fadeTo(0, CONFIG.fadeDuration).then(nextPanel);
        }
    }

    // ---- Loader seguro (evita undefined.baseTexture / resource.canvas) ----
    PIXI.Assets.load(CONFIG.imagePath)
        .then((tex) => {
            // Alguns CDNs retornam BaseTexture; outros retornam Texture.
            const texture = tex instanceof PIXI.Texture ? tex : new PIXI.Texture(tex);
            if (!texture.baseTexture || !texture.baseTexture.valid) {
                // Garante validação antes de usar dimensões
                return new Promise((resolve) => {
                    texture.baseTexture.once('loaded', () => resolve(texture));
                });
            }
            return texture;
        })
        .then((texture) => {
            const fullW = texture.width;
            const fullH = texture.height;
            const panelW = Math.floor(fullW / CONFIG.cols);
            const panelH = Math.floor(fullH / CONFIG.rows);

            for (let r = 0; r < CONFIG.rows; r++) {
                for (let c = 0; c < CONFIG.cols; c++) {
                    const frame = new PIXI.Rectangle(c * panelW, r * panelH, panelW, panelH);
                    panels.push(new PIXI.Texture(texture.baseTexture, frame));
                }
            }

            app.stage.addChild(scene);
            layout();
            try { audio && audio.play().catch(() => { }); } catch { }
            nextPanel().then(() => {
                app.ticker.add(tick);
                setTimeout(showHint, CONFIG.ui.hintDelay);
            });
        })
        .catch((err) => {
            console.error('Falha ao carregar cena1.png:', err);
            endCutscene(); // não trava o jogo — segue pro gameplay
        });
}
