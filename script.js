// Get the canvas and its 2D context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to match the CSS widescreen size
canvas.width = 960;
canvas.height = 540;

// --- Game Variables ---
const gravity = 0.6;
let keys = {};
let scrollOffset = 0; // The distance the camera has moved
const SCROLL_BOUNDARY = canvas.width / 2; // Keep player centered after this point

// --- Player (Kirby) Class ---
class Player {
    constructor(startX, startY) {
        // Red start point in the image is (approx) 50, 450
        this.position = { x: startX, y: startY }; 
        this.velocity = { x: 0, y: 0 };
        this.width = 32;
        this.height = 32;
        this.speed = 5;
        this.jumpForce = 14;
        this.isJumping = false;
        this.onGround = false;
    }

    // Draw Kirby on the canvas
    draw() {
        ctx.fillStyle = 'pink';
        ctx.beginPath();
        // Draw the player at their actual screen position (position.x is now screen x)
        ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    // Update player's position and velocity
    update() {
        // Apply vertical physics (gravity and movement)
        this.velocity.y += gravity;
        this.position.y += this.velocity.y;
        
        // Handle horizontal movement from input
        this.position.x += this.velocity.x;
        
        // Limit player's vertical speed
        if (this.velocity.y > 15) this.velocity.y = 15;
    }
}

// --- Platform Class ---
class Platform {
    constructor(x, y, width, height) {
        this.position = { x, y }; // These are WORLD coordinates
        this.width = width;
        this.height = height;
    }

    // Draw the platform relative to the camera's scroll offset
    draw() {
        ctx.fillStyle = '#3a3a3a'; // Dark color for the "black" level outline
        ctx.fillRect(
            this.position.x - scrollOffset, // Subtract the scroll offset for scrolling
            this.position.y,
            this.width,
            this.height
        );
    }
}

// --- Game Objects & Level Creation ---

// Based on the black shapes in the provided image (scaled up)
function createLevel(startX, startY) {
    const scale = 1; // You can adjust this scale factor for larger or smaller levels
    const player = new Player(startX * scale, startY * scale);

    const platforms = [
        // Main bottom floor (from x=0 to end of platform 1)
        new Platform(0 * scale, 500 * scale, 300 * scale, 50 * scale),

        // Platform 2 (Stair step up)
        new Platform(350 * scale, 450 * scale, 150 * scale, 50 * scale),

        // Platform 3 (Higher gap)
        new Platform(550 * scale, 380 * scale, 200 * scale, 50 * scale),

        // Platform 4 (The high L-shaped platform)
        new Platform(800 * scale, 300 * scale, 300 * scale, 50 * scale),
        new Platform(1050 * scale, 50 * scale, 50 * scale, 250 * scale), // Vertical part
        
        // Platform 5 (The long bridge after the drop)
        new Platform(1200 * scale, 400 * scale, 600 * scale, 50 * scale),
    ];
    
    return { player, platforms };
}

// Start player at the red dot location (e.g., x=50, y=450)
const { player, platforms } = createLevel(50, 450);

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
        player.isJumping = true; // Still useful for double jump logic later, but for now same as !onGround
    }
}

// --- Collision Detection ---
function checkCollisions() {
    player.onGround = false;

    platforms.forEach(platform => {
        // Platform World Coordinates (for collision logic)
        const pX = platform.position.x;
        const pY = platform.position.y;
        const pW = platform.width;
        const pH = platform.height;
        
        // Player's NEXT position and current size
        const pL = player.position.x;
        const pR = player.position.x + player.width;
        const pT = player.position.y;
        const pB = player.position.y + player.height;
        const pVY = player.velocity.y;
        const pVX = player.velocity.x;

        // 1. Vertical Collision (Landing on top of a platform)
        if (
            pB <= pY && // Bottom of player is above platform top
            pB + pVY >= pY && // Bottom of player will intersect or pass platform top next frame
            pR > pX && // Right side of player is past platform left side
            pL < pX + pW // Left side of player is before platform right side
        ) {
            // Collision detected! Stop vertical movement and place player exactly on top
            player.velocity.y = 0;
            player.position.y = pY - player.height;
            player.onGround = true;
            player.isJumping = false;
        }
        
        // *Advanced: Check for collision with sides or bottom of platform if needed*
        // (Skipped for simplicity, but would prevent walking through vertical walls)
    });
}

// --- Scrolling Logic ---
function updateScrolling() {
    // Only scroll right if the player is moving right AND past the scroll boundary (center of screen)
    if (player.velocity.x > 0 && player.position.x > SCROLL_BOUNDARY) {
        // Player's horizontal velocity is now used to move the world (scrollOffset)
        scrollOffset += player.velocity.x;
        player.position.x = SCROLL_BOUNDARY; // Fix player's screen position
    } 
    // Only scroll left if the player is moving left AND the current offset is greater than 0
    else if (player.velocity.x < 0 && scrollOffset > 0) {
        // Move the world back
        scrollOffset += player.velocity.x; 
        player.position.x = SCROLL_BOUNDARY; // Fix player's screen position
    }

    // If scrollOffset is less than 0, player is trying to move past the start of the level
    if (scrollOffset < 0) {
        scrollOffset = 0;
    }
    
    // Adjust player's screen position back if they are within the start zone
    if (scrollOffset === 0 && player.position.x < SCROLL_BOUNDARY) {
        player.position.x += player.velocity.x;
    }

    // Keep player from moving off the left edge of the screen when scrollOffset is 0
    if (player.position.x < 0) {
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
