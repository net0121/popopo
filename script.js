// Get the canvas and its 2D context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

// --- Game Variables ---
const gravity = 0.6;
let keys = {};

// --- Player (Kirby) Class ---
class Player {
    constructor() {
        this.position = { x: 100, y: 400 };
        this.velocity = { x: 0, y: 0 };
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.jumpForce = 15;
        this.isJumping = false;
    }

    // Draw Kirby on the canvas
    draw() {
        ctx.fillStyle = 'pink';
        ctx.beginPath();
        ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    // Update player's position and velocity
    update() {
        // Horizontal movement
        this.position.x += this.velocity.x;

        // Apply gravity
        this.velocity.y += gravity;
        this.position.y += this.velocity.y;
        
        // Prevent falling through the bottom of the canvas
        if (this.position.y + this.height + this.velocity.y >= canvas.height) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height;
            this.isJumping = false;
        }
    }
}

// --- Platform Class ---
class Platform {
    constructor(x, y, width, height) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

// --- Game Objects ---
const player = new Player();
const platforms = [
    new Platform(0, 550, 300, 50),      // First floor
    new Platform(400, 450, 200, 30),    // Floating platform
    new Platform(200, 350, 150, 30),    // Higher platform
    new Platform(650, 250, 100, 30)     // Highest platform
];

// --- Input Handling ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handleInput() {
    // Left and Right movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velocity.x = -player.speed;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velocity.x = player.speed;
    } else {
        player.velocity.x = 0;
    }

    // Jumping
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !player.isJumping) {
        player.velocity.y = -player.jumpForce;
        player.isJumping = true;
    }
}

// --- Collision Detection ---
function checkCollisions() {
    platforms.forEach(platform => {
        // Check for collision on top of the platform
        if (
            player.position.y + player.height <= platform.position.y &&
            player.position.y + player.height + player.velocity.y >= platform.position.y &&
            player.position.x + player.width >= platform.position.x &&
            player.position.x <= platform.position.x + platform.width
        ) {
            player.velocity.y = 0;
            player.position.y = platform.position.y - player.height;
            player.isJumping = false;
        }
    });
}

// --- Main Game Loop ---
function gameLoop() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Handle player input
    handleInput();
    
    // Update and draw platforms
    platforms.forEach(platform => {
        platform.draw();
    });

    // Update player, check collisions, and draw
    player.update();
    checkCollisions();
    player.draw();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game!
gameLoop();
