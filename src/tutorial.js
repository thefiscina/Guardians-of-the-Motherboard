// src/tutorial.js - Sistema de tutorial interativo
export class Tutorial {
    constructor(app, onComplete) {
        this.app = app;
        this.onComplete = onComplete;
        this.container = new PIXI.Container();
        this.currentStep = 0;
        this.isActive = true;

        this.steps = [
            {
                title: "BEM-VINDO, GUARDIÃO!",
                text: "Você foi escolhido para proteger a motherboard dos vírus maliciosos.\\n\\nUse WASD para se mover pela motherboard.",
                action: "movement",
                requirement: "Mova-se usando as teclas WASD"
            },
            {
                title: "SALTE PELAS PLATAFORMAS",
                text: "Pressione W ou ESPAÇO para pular.\\n\\nExplore as plataformas da motherboard!",
                action: "jump",
                requirement: "Pule usando W ou ESPAÇO"
            },
            {
                title: "ATAQUES MÁGICOS",
                text: "Clique com o mouse para lançar feitiços mágicos.\\n\\nMire nos vírus para destruí-los!",
                action: "cast",
                requirement: "Lance um feitiço clicando com o mouse"
            },
            {
                title: "AGACHE-SE",
                text: "Pressione S para se agachar e evitar ataques.\\n\\nMantenha-se vivo para proteger a motherboard!",
                action: "crouch",
                requirement: "Agache-se pressionando S"
            }
        ];

        this.completedActions = new Set();
        this.init();
    }

    init() {
        this.createOverlay();
        this.createInstructions();
        this.setupEventListeners();
        this.showCurrentStep();

        this.app.stage.addChild(this.container);
    }

    createOverlay() {
        // Fundo semi-transparente
        this.overlay = new PIXI.Graphics();
        this.overlay.beginFill(0x000000, 0.7);
        this.overlay.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
        this.overlay.endFill();
        this.overlay.interactive = true;

        this.container.addChild(this.overlay);
    }

    createInstructions() {
        // Container principal das instruções
        this.instructionBox = new PIXI.Graphics();
        this.instructionBox.beginFill(0x1a2332);
        this.instructionBox.lineStyle(3, 0x00ff88);
        this.instructionBox.drawRoundedRect(0, 0, 500, 250, 10);
        this.instructionBox.endFill();

        this.instructionBox.x = (this.app.renderer.width - 500) / 2;
        this.instructionBox.y = (this.app.renderer.height - 250) / 2;

        // Título
        this.titleText = new PIXI.Text('', {
            fontFamily: 'monospace',
            fontSize: 20,
            fill: 0x00ff88,
            fontWeight: 'bold',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 460
        });
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = 250;
        this.titleText.y = 30;

        // Texto de instrução
        this.instructionText = new PIXI.Text('', {
            fontFamily: 'monospace',
            fontSize: 14,
            fill: 0xffffff,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 460,
            lineHeight: 20
        });
        this.instructionText.anchor.set(0.5, 0);
        this.instructionText.x = 250;
        this.instructionText.y = 80;

        // Texto de requisito
        this.requirementText = new PIXI.Text('', {
            fontFamily: 'monospace',
            fontSize: 12,
            fill: 0xffff88,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 460,
            fontStyle: 'italic'
        });
        this.requirementText.anchor.set(0.5, 0);
        this.requirementText.x = 250;
        this.requirementText.y = 180;

        // Botão de pular
        this.skipButton = this.createButton("PULAR TUTORIAL", 400, 210, () => {
            this.completeTutorial();
        });

        // Indicador de progresso
        this.progressText = new PIXI.Text('', {
            fontFamily: 'monospace',
            fontSize: 10,
            fill: 0xaaaaaa,
            align: 'center'
        });
        this.progressText.anchor.set(0.5, 0);
        this.progressText.x = 250;
        this.progressText.y = 15;

        this.instructionBox.addChild(this.titleText);
        this.instructionBox.addChild(this.instructionText);
        this.instructionBox.addChild(this.requirementText);
        this.instructionBox.addChild(this.skipButton);
        this.instructionBox.addChild(this.progressText);

        this.container.addChild(this.instructionBox);
    }

    createButton(text, x, y, onClick) {
        const button = new PIXI.Container();

        const bg = new PIXI.Graphics();
        bg.beginFill(0x00ff88);
        bg.lineStyle(2, 0x00cc66);
        bg.drawRoundedRect(0, 0, 120, 30, 5);
        bg.endFill();

        const buttonText = new PIXI.Text(text, {
            fontFamily: 'monospace',
            fontSize: 10,
            fill: 0x000000,
            fontWeight: 'bold',
            align: 'center'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 60;
        buttonText.y = 15;

        button.addChild(bg);
        button.addChild(buttonText);
        button.x = x;
        button.y = y;
        button.interactive = true;
        button.buttonMode = true;

        button.on('pointerdown', onClick);
        button.on('pointerover', () => {
            bg.tint = 0xaaffaa;
            button.scale.set(1.05);
        });
        button.on('pointerout', () => {
            bg.tint = 0xffffff;
            button.scale.set(1);
        });

        return button;
    }

    setupEventListeners() {
        // Listeners para detectar ações do jogador
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);
        this.clickHandler = (e) => this.handleClick(e);

        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
        this.app.view.addEventListener('click', this.clickHandler);

        // Tracker de movimento
        this.keys = { w: false, a: false, s: false, d: false };
        this.hasJumped = false;
        this.hasCast = false;
        this.hasCrouched = false;
        this.hasMoved = false;
    }

    handleKeyDown(e) {
        if (!this.isActive) return;

        const key = e.key.toLowerCase();

        // Detectar movimento
        if (['w', 'a', 's', 'd'].includes(key)) {
            this.keys[key] = true;
            this.hasMoved = true;
            this.checkAction('movement');
        }

        // Detectar pulo
        if (key === 'w' || key === ' ') {
            this.hasJumped = true;
            this.checkAction('jump');
        }

        // Detectar agachar
        if (key === 's') {
            this.hasCrouched = true;
            this.checkAction('crouch');
        }

        // Pular tutorial com ESC
        if (key === 'escape') {
            this.completeTutorial();
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(key)) {
            this.keys[key] = false;
        }
    }

    handleClick(e) {
        if (!this.isActive) return;

        this.hasCast = true;
        this.checkAction('cast');
    }

    checkAction(actionType) {
        const currentStep = this.steps[this.currentStep];
        if (!currentStep || currentStep.action !== actionType) return;

        let completed = false;

        switch (actionType) {
            case 'movement':
                completed = this.hasMoved;
                break;
            case 'jump':
                completed = this.hasJumped;
                break;
            case 'cast':
                completed = this.hasCast;
                break;
            case 'crouch':
                completed = this.hasCrouched;
                break;
        }

        if (completed && !this.completedActions.has(actionType)) {
            this.completedActions.add(actionType);
            this.completeCurrentStep();
        }
    }

    showCurrentStep() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        this.titleText.text = step.title;
        this.instructionText.text = step.text;
        this.requirementText.text = step.requirement;
        this.progressText.text = `${this.currentStep + 1} / ${this.steps.length}`;

        // Animação de entrada
        this.instructionBox.alpha = 0;
        this.instructionBox.scale.set(0.8);

        const animate = () => {
            this.instructionBox.alpha += 0.05;
            this.instructionBox.scale.x += 0.01;
            this.instructionBox.scale.y += 0.01;

            if (this.instructionBox.alpha < 1) {
                requestAnimationFrame(animate);
            } else {
                this.instructionBox.scale.set(1);
            }
        };

        animate();
    }

    completeCurrentStep() {
        // Animação de sucesso
        this.instructionBox.tint = 0x88ff88;

        setTimeout(() => {
            this.instructionBox.tint = 0xffffff;
            this.nextStep();
        }, 500);
    }

    nextStep() {
        this.currentStep++;

        if (this.currentStep >= this.steps.length) {
            this.completeTutorial();
        } else {
            this.showCurrentStep();
        }
    }

    completeTutorial() {
        this.isActive = false;

        // Animação de saída
        const fadeOut = () => {
            this.container.alpha -= 0.05;

            if (this.container.alpha > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.destroy();
                this.onComplete();
            }
        };

        fadeOut();
    }

    destroy() {
        // Remover event listeners
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        this.app.view.removeEventListener('click', this.clickHandler);

        // Remover container
        if (this.container && this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
    }
}
