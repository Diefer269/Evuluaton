var config = {
    type: Phaser.AUTO,
    width: window.innerWidth, // Ajusta el ancho a la pantalla completa
    height: window.innerHeight, // Ajusta la altura a la pantalla completa
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

var score = 0;
var gameOver = false;
var cursors;
var game = new Phaser.Game(config);
var player, platforms, stars, bombs;
var leftButton, rightButton, upButton;
var moveDirection = null;
var questionText;
var questionNumberText;
var correctAnswer = "yes";
var currentQuestionIndex = 0;
var questions = [
    { question: "Los suelos arcillosos están formados por granos finos de color amarillento y retienen el agua formando charcos?", answer: "yes" },
    { question: "Existen cinco clasificaciones de suelo?", answer: "no" },
    { question: "Los cambisoles son suelos jóvenes con proceso inicial de acumulación de arcilla?", answer: "yes" },
    { question: "Los organismos vegetales no necesitan de un suelo fértil en el cual puedan alimentarse?", answer: "no" },
    { question: "Materia orgánica procedente de los restos de plantas y animales muertos?", answer: "yes" },
    { question: "Las plantas presentan una estructura corporal de solo tallos y raíces?", answer: "no" },
    { question: "El tallo es el órgano fundamental de todo tipo de plantas?", answer: "no" },
    { question: "Las plantas fabrican sus propios carbohidratos necesarios para crecer y mantenerse?", answer: "yes" },
    { question: "Las plantas se enfrentan a menudo a diversos problemas ambientales ocasionados por el ser humano?", answer: "no" },
    { question: "Las plantas son los seres vivos miembros del reino vegetal o phylum plantae?", answer: "yes" }
];
var shuffledQuestions;
var gameOverImage, darkOverlay, restartButton;

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('yesStar', 'assets/yesStar.png'); // Imagen para "Sí"
    this.load.image('noStar', 'assets/noStar.png');   // Imagen para "No"
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('restartButton', 'assets/restartButton.png'); // Imagen para el botón de reinicio
    this.load.image('gameOverImage', 'assets/gameOver.gif'); // Imagen personalizada de "Game Over"
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });

    // Cargar imágenes de los botones
    this.load.image('leftButton', 'assets/leftButton.png');
    this.load.image('rightButton', 'assets/rightButton.png');
    this.load.image('upButton', 'assets/upButton.png');
}

function create() {
    this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'sky'); // Centrar el fondo

    platforms = this.physics.add.staticGroup();
    platforms.create(window.innerWidth / 2, window.innerHeight - 32, 'ground').setScale(3, 2).refreshBody(); // Extiende el suelo en los laterales
    platforms.create(window.innerWidth * 0.8, window.innerHeight * 0.75, 'ground');
    platforms.create(window.innerWidth * 0.2, window.innerHeight * 0.5, 'ground');
    platforms.create(window.innerWidth / 2, window.innerHeight * 0.4, 'ground'); // Plataforma adicional en el medio
    platforms.create(window.innerWidth * 0.9, window.innerHeight * 0.3, 'ground');
    platforms.create(window.innerWidth * 0.1, window.innerHeight * 0.2, 'ground');
    platforms.create(window.innerWidth * 0.7, window.innerHeight * 0.6, 'ground');
    platforms.create(window.innerWidth * 0.5, window.innerHeight - 150, 'ground'); // Nueva plataforma movida más arriba

    player = this.physics.add.sprite(100, window.innerHeight - 200, 'dude');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.physics.add.collider(player, platforms);

    cursors = this.input.keyboard.createCursorKeys();

    // Barajar las preguntas
    shuffledQuestions = Phaser.Utils.Array.Shuffle(questions);

    // Texto del número de pregunta en la parte superior
    questionNumberText = this.add.text(16, 16, "Pregunta " + (currentQuestionIndex + 1) + ":", { 
        fontSize: '20px',
        fill: '#000000',
        fontFamily: '"Press Start 2P", cursive',
        wordWrap: { width: window.innerWidth - 40, useAdvancedWrap: true } 
    });

    // Texto de la pregunta
    questionText = this.add.text(16, 50, shuffledQuestions[currentQuestionIndex].question + "?", { 
        fontSize: '20px',
        fill: '#000000',
        fontFamily: '"Press Start 2P", cursive',
        wordWrap: { width: window.innerWidth - 40, useAdvancedWrap: true }  // Ajustar el ancho para que quepa en la pantalla vertical
    });

    // Crear las dos estrellas
    stars = this.physics.add.group();
    createStars();

    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    // Agregar botones de control en la parte inferior derecha
    leftButton = this.add.image(window.innerWidth - 150, window.innerHeight - 100, 'leftButton').setInteractive();
    leftButton.setScale(0.2);
    leftButton.on('pointerdown', () => moveDirection = 'left');
    leftButton.on('pointerup', () => moveDirection = null);

    rightButton = this.add.image(window.innerWidth - 50, window.innerHeight - 100, 'rightButton').setInteractive();
    rightButton.setScale(0.2);
    rightButton.on('pointerdown', () => moveDirection = 'right');
    rightButton.on('pointerup', () => moveDirection = null);

    upButton = this.add.image(window.innerWidth - 100, window.innerHeight - 150, 'upButton').setInteractive();
    upButton.setScale(0.2);
    upButton.on('pointerdown', () => moveDirection = 'up');
    upButton.on('pointerup', () => moveDirection = null);

    // Pantalla de fin de juego (oculta inicialmente)
    darkOverlay = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 0x000000, 0.7);
    darkOverlay.visible = false;

    gameOverImage = this.add.image(window.innerWidth / 2, window.innerHeight / 2 - 100, 'gameOverImage');
    gameOverImage.setScale(0.9);
    gameOverImage.visible = false;

    // Botón de reinicio (oculto inicialmente)
    restartButton = this.add.image(window.innerWidth / 2, window.innerHeight / 2 + 100, 'restartButton').setInteractive();
    restartButton.setScale(0.5);
    restartButton.visible = false;
    restartButton.on('pointerdown', restartGame, this);
}

function update() {
    if (gameOver) {
        return;
    }

    if (moveDirection === 'left') {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (moveDirection === 'right') {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else if (moveDirection === 'up' && player.body.touching.down) {
        player.setVelocityY(-450);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-450);
    }
}

function createStars() {
    if (gameOver) {
        return;
    }

    stars.clear(true, true);

    var minX = 100;
    var maxX = window.innerWidth - 100;

    var starYesX = Phaser.Math.Between(minX, maxX);
    var starYesY = Phaser.Math.Between(100, window.innerHeight - 500);
    var starYes = stars.create(starYesX, starYesY, 'yesStar');
    starYes.setScale(0.1);
    starYes.answer = "yes";
    starYes.setBounce(0.5);
    starYes.setCollideWorldBounds(true);
    starYes.setVelocity(Phaser.Math.Between(-100, 100), 10); // Movimiento lateral con velocidad inicial

    var starNoX, starNoY;
    do {
        starNoX = Phaser.Math.Between(minX, maxX);
        starNoY = Phaser.Math.Between(100, window.innerHeight - 500);
    } while (Phaser.Math.Distance.Between(starYesX, starYesY, starNoX, starNoY) < 100);

    var starNo = stars.create(starNoX, starNoY, 'noStar');
    starNo.setScale(0.1);
    starNo.answer = "no";
    starNo.setBounce(0.5);
    starNo.setCollideWorldBounds(true);
    starNo.setVelocity(Phaser.Math.Between(-100, 100), 10); // Movimiento lateral con velocidad inicial
}

function collectStar(player, star) {
    if (star.answer === shuffledQuestions[currentQuestionIndex].answer) {
        star.disableBody(true, true);
        currentQuestionIndex++;
        if (currentQuestionIndex < shuffledQuestions.length) {
            questionNumberText.setText("Pregunta " + (currentQuestionIndex + 1) + ":"); // Actualiza el número de la pregunta
            questionText.setText(shuffledQuestions[currentQuestionIndex].question + "?");
            createBomb();
            createStars();
        } else {
            questionNumberText.setText("¡Has terminado!"); // Texto final cuando se terminan las preguntas
            questionText.setText("");
            this.physics.pause();
            gameOver = true;
            showGameOverScreen();
        }
    } else {
        player.setTint(0xff0000);
        player.anims.play('turn');
        gameOver = true;
        this.physics.pause();
        showGameOverScreen();
    }
}

function createBomb() {
    var x = (player.x < window.innerWidth / 2) ? Phaser.Math.Between(window.innerWidth / 2, window.innerWidth) : Phaser.Math.Between(0, window.innerWidth / 2);
    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
    showGameOverScreen();
}

function showGameOverScreen() {
    darkOverlay.visible = true;
    gameOverImage.visible = true;
    restartButton.visible = true;
}

function restartGame() {
    gameOver = false;
    currentQuestionIndex = 0;

    shuffledQuestions = Phaser.Utils.Array.Shuffle(questions);

    darkOverlay.visible = false;
    gameOverImage.visible = false;
    restartButton.visible = false;

    player.clearTint();
    player.anims.play('turn');
    player.setPosition(100, window.innerHeight - 200);
    this.physics.resume();

    questionNumberText.setText("Pregunta " + (currentQuestionIndex + 1) + ":");
    questionText.setText(shuffledQuestions[currentQuestionIndex].question + "?");
    createStars();
    bombs.clear(true, true);
}
