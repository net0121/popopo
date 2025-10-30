// Get the canvas and its 2D context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Variables ---
const gravity = 0.6;
let keys = {};
let scrollOffset = 0;
let player;
let platforms = [];

// --- Dynamic Canvas Sizing & Level Regeneration ---
// We must regenerate the level and player on resize because START_Y and LEVEL_HEIGHT_OFFSET depend on canvas.height
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Recalculate level parameters and objects
    const START_Y = canvas.height - 100; 
    const SCROLL_BOUNDARY_X = canvas.width * 0.4; 
    
    const levelData = createLevel(50, START_Y);
    player = levelData.player;
    platforms = levelData.platforms;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Set initial size and create objects

// --- Player (Kirby) Class ---
class Player {
    constructor(startX, startY) {
        this.position = { x: startX, y: startY }; 
        this.velocity = { x: 0, y: 0 };
        this.width = 32;
        this.height = 32;
        this.speed = 5;
        this.jumpForce = 14;
        this.onGround = false;
        this.isJumping = false;
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
        ctx.fillStyle = '#3a3a3a'; 
        ctx.fillRect(
            this.position.x - scrollOffset, 
            this.position.y,
            this.width,
            this.height
        );
    }
}

// --- Level Creation based on image outline ---
function createLevel(startX, startY) {
    // Offset to shift the whole level up/down so it sits nicely on the screen.
    // Based on the 'main floor' starting at y=450 in the world.
    const LEVEL_HEIGHT_OFFSET = startY - 450; 
    
    const player = new Player(startX, startY); 

    const platforms = [
        // Main bottom floor (starting at world y=450)
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
        
        // Global Death Plane / Bottom of World (Ensures player never falls infinitely)
        new Platform(-1000, canvas.height, 5000, 100), 
    ];
    
    return { player, platforms };
}

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
    }
}

// --- **ROBUST COLLISION DETECTION** (Fixed) ---
function checkCollisions() {
    player.onGround = false;

    // Get player's bounding box in WORLD coordinates
    const pXL = player.position.x + scrollOffset; // Player World Left
    const pXR = pXL + player.width;              // Player World Right
    const pYT = player.position.y;               // Player World Top (y is same as screen y)
    const pYB = pYT + player.height;             // Player World Bottom

    platforms.forEach(platform => {
        // Platform World Coordinates
        const platL = platform.position.x;
        const platR = platform.position.x + platform.width;
        const platT = platform.position.y;
        const platB = platform.position.y + platform.height;
        
        // Check if the player is generally overlapping the platform's bounds
        if (pXR > platL && pXL < platR && pYB > platT && pYT < platB) {
            
            // 1. Vertical Collision (Landing on top)
            // Check if the player was above the platform last frame (pYB - pVY < platT)
            // AND they are now touching/past the platform top (pYB >= platT)
            if (pYB - player.velocity.y < platT && player.velocity.y >= 0) {
                player.velocity.y = 0;
                player.position.y = platT - player.height; // Snap to the top
                player.onGround = true;
                return; // Stop checking for this frame
            }
            
            // 2. Vertical Collision (Hitting the bottom)
            // Check if the player was below the platform last frame (pYT - pVY >= platB)
            // AND they are now touching/past the platform bottom (pYT < platB)
            if (pYT - player.velocity.y >= platB && player.velocity.y < 0) {
                player.velocity.y = 0;
                player.position.y = platB; // Snap to the bottom
                return;
            }

            // 3. Horizontal Collision (Hitting the left side)
            if (pXR - player.velocity.x <= platL && player.velocity.x > 0) {
                 player.position.x = platL - player.width - scrollOffset; // Snap to the side
            }
            
            // 4. Horizontal Collision (Hitting the right side)
            if (pXL - player.velocity.x >= platR && player.velocity.x < 0) {
                 player.position.x = platR - scrollOffset; // Snap to the side
            }
        }
    });
}

// --- Scrolling Logic ---
function updateScrolling() {
    // Recalculate boundary on every frame (in case of dynamic window resize)
    const SCROLL_BOUNDARY_X = canvas.width * 0.4; 

    // Scroll Right
    if (player.velocity.x > 0 && player.position.x > SCROLL_BOUNDARY_X) {
        scrollOffset += player.velocity.x;
        player.position.x = SCROLL_BOUNDARY_X;
    } 
    // Scroll Left
    else if (player.velocity.x < 0 && scrollOffset > 0 && player.position.x < SCROLL_BOUNDARY_X) {
        scrollOffset += player.velocity.x; 
        player.position.x = SCROLL_BOUNDARY_X;
    }

    // Left edge limit (prevent scrolling past the start of the level)
    if (scrollOffset < 0) {
        scrollOffset = 0;
    }
    
    // Adjust player back to free movement if at start zone
    if (scrollOffset === 0 && player.position.x < SCROLL_BOUNDARY_X) {
        player.position.x += player.velocity.x;
    }

    // Keep player from moving off the absolute left edge of the screen when scrollOffset is 0
    if (player.position.x < 0) {
        player.position.x = 0;
    }
}

// --- Main Game Loop ---
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Handle player input
    handleInput();
    
    // 2. Update player physics
    player.update();

    // 3. Check collisions (must happen BEFORE scrolling updates the player's screen position if they hit a wall)
    checkCollisions();

    // 4. Handle camera/scrolling logic
    updateScrolling();

    // 5. Draw all game objects
    platforms.forEach(platform => {
        platform.draw();
    });

    player.draw();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game!
gameLoop();
