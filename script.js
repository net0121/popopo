// Get the canvas and its 2D context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Dynamic Canvas Sizing ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Set initial size

// --- Game Variables ---
const gravity = 0.6;
let keys = {};
let scrollOffset = 0; // The distance the camera has moved
// Keep player roughly centered horizontally
const SCROLL_BOUNDARY_X = canvas.width * 0.4; 
// Set player's starting Y based on a calculated ratio
const START_Y = canvas.height - 100; 
const START_X = 50;

// --- Player (Kirby) Class ---
class Player {
    constructor(startX, startY) {
        this.position = { x: startX, y: startY }; 
        this.velocity = { x: 0, y: 0 };
        this.width = 32;
        this.height = 32;
        this.speed = 5;
        this.jumpForce = 14;
        this.isJumping = false;
        this.onGround = false;
    }

    draw() {
        ctx.fillStyle = 'pink';
        ctx.beginPath();
        ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.velocity.y += gravity;
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
        
        // Limit player's vertical speed (terminal velocity)
        if (this.velocity.y > 15) this.velocity.y = 15;
    }
}

// --- Platform Class ---
class Platform {
    constructor(x, y, width, height) {
        this.position = { x, y }; // WORLD coordinates
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = '#3a3a3a'; // Dark color for the "black" level outline
        ctx.fillRect(
            this.position.x - scrollOffset, // Scrolling effect
            this.position.y,
            this.width,
            this.height
        );
    }
}

// --- Level Creation based on image outline (Adjusted for screen size) ---

// Platforms are defined relative to a large starting scale, ensuring they span a long distance.
const LEVEL_HEIGHT_OFFSET = canvas.height - 500; // Offset to shift the whole level up/down

function createLevel() {
    // Red start point in the image is approximately (50, 450)
    const player = new Player(START_X, START_Y); 

    const platforms = [
        // Main bottom floor (starting at y=450 in the world)
        new Platform(0, 450 + LEVEL_HEIGHT_OFFSET, 300, 50),

        // Platform 2 (Stair step up)
        new Platform(350, 400 + LEVEL_HEIGHT_OFFSET, 150, 50),

        // Platform 3 (Higher gap)
        new Platform(550, 330 + LEVEL_HEIGHT_OFFSET, 200, 50),

        // Platform 4 (The high L-shaped platform)
        new Platform(800, 250 + LEVEL_HEIGHT_OFFSET, 300, 50),
        new Platform(1050, 0 + LEVEL_HEIGHT_OFFSET, 50, 250), // Vertical part
        
        // Platform 5 (The long bridge after the drop)
        new Platform(1200, 350 + LEVEL_HEIGHT_OFFSET, 600, 50),
        
        // Add a long solid ground platform to stop the player from falling off the bottom forever
        // This acts as the "bottom of the world" collision.
        new Platform(-1000, canvas.height, 5000, 100), // Very wide platform at the very bottom
    ];
    
    return { player, platforms };
}

const { player, platforms } = createLevel();

// --- Input Handling ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handleInput() {
    // Horizontal Movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.velocity.x = -player.speed;
    } else if (keys['ArrowRight'] || keys['KeyD']) {
        player.velocity.x = player.speed;
    } else {
        player.velocity.x = 0;
    }

    // Jumping
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
        player.velocity.y = -player.jumpForce;
        player.onGround = false;
        player.isJumping = true; 
    }
}

// --- Collision Detection (Improved for precision) ---
function checkCollisions() {
    player.onGround = false;

    platforms.forEach(platform => {
        // Platform World Coordinates
        const pX = platform.position.x;
        const pY = platform.position.y;
        const pW = platform.width;
        
        // Player's Bounding Box and next Y position
        const pL = player.position.x + scrollOffset; // Player's WORLD Left
        const pR = player.position.x + player.width + scrollOffset; // Player's WORLD Right
        const pB = player.position.y + player.height; // Player's CURRENT Bottom
        const pVY = player.velocity.y;

        // Vertical Collision: Landing on top of a platform
        // 1. Is the player currently above the platform? (pB <= pY)
        // 2. Will the player's bottom intersect or pass the platform top next frame? (pB + pVY >= pY)
        // 3. Does the player overlap horizontally with the platform? (pR > pX && pL < pX + pW)
        if (
            pB <= pY && 
            pB + pVY >= pY && 
            pR > pX && 
            pL < pX + pW 
        ) {
            // Collision detected! Stop vertical movement and place player exactly on top
            player.velocity.y = 0;
            player.position.y = pY - player.height;
            player.onGround = true;
            player.isJumping = false;
        }
    });
}

// --- Scrolling Logic ---
function updateScrolling() {
    // Scroll Right: Player is moving right AND past the scroll boundary (left of center)
    if (player.velocity.x > 0 && player.position.x > SCROLL_BOUNDARY_X) {
        scrollOffset += player.velocity.x;
        player.position.x = SCROLL_BOUNDARY_X; // Fix player's screen position
    } 
    // Scroll Left: Player is moving left AND scrollOffset is positive AND player is left of center
    else if (player.velocity.x < 0 && scrollOffset > 0 && player.position.x < SCROLL_BOUNDARY_X) {
        scrollOffset += player.velocity.x; 
        player.position.x = SCROLL_BOUNDARY_X; // Fix player's screen position
    }

    // Limit scrollOffset to prevent scrolling past the level start (left side)
    if (scrollOffset < 0) {
        scrollOffset = 0;
    }
    
    // Adjust player's screen position back if they are within the start zone and the world is not scrolling
    if (scrollOffset === 0 && player.position.x < SCROLL_BOUNDARY_X) {
        player.position.x += player.velocity.x;
    }

    // Keep player from moving off the left edge of the screen when scrollOffset is 0
    if (scrollOffset === 0 && player.position.x < 0) {
        player.position.x = 0;
    }
}

// --- Main Game Loop ---
function gameLoop() {
    // Clear the canvas for the next frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Handle player input
    handleInput();
    
    // 2. Update player physics
    player.update();

    // 3. Handle camera/scrolling logic
    updateScrolling();

    // 4. Check collisions with level geometry
    checkCollisions();

    // 5. Draw all game objects (platforms first, then player)
    platforms.forEach(platform => {
        platform.draw();
    });

    player.draw();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game!
gameLoop();
