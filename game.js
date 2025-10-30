const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gravity = 0.5;
const keys = {};
const camera = { x: 0 };

const kirby = {
  x: 50,
  y: 300,
  width: 40,
  height: 40,
  color: "pink",
  dx: 0,
  dy: 0,
  speed: 3,
  jumpPower: -10,
  grounded: false
};

// Level layout based on image
const platforms = [
  { x: 0, y: 360, width: 40, height: 40 },
  { x: 50, y: 320, width: 40, height: 80 },
  { x: 100, y: 280, width: 40, height: 120 },
  { x: 150, y: 240, width: 40, height: 160 },
  { x: 200, y: 200, width: 40, height: 200 },
  { x: 250, y: 240, width: 40, height: 160 },
  { x: 300, y: 280, width: 40, height: 120 },
  { x: 350, y: 320, width: 40, height: 80 },
  { x: 400, y: 360, width: 40, height: 40 },
  { x: 450, y: 320, width: 40, height: 80 },
  { x: 500, y: 280, width: 40, height: 120 },
  { x: 550, y: 240, width: 40, height: 160 },
  { x: 600, y: 200, width: 40, height: 200 },
  { x: 650, y: 240, width: 40, height: 160 },
  { x: 700, y: 280, width: 40, height: 120 },
  { x: 750, y: 320, width: 40, height: 80 },
  { x: 800, y: 360, width: 40, height: 40 }
];

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function update() {
  // Horizontal movement
  if (keys["ArrowRight"]) kirby.dx = kirby.speed;
  else if (keys["ArrowLeft"]) kirby.dx = -kirby.speed;
  else kirby.dx = 0;

  // Jump
  if (keys["Space"] && kirby.grounded) {
    kirby.dy = kirby.jumpPower;
    kirby.grounded = false;
  }

  // Apply gravity
  kirby.dy += gravity;

  // Move Kirby
  kirby.x += kirby.dx;
  kirby.y += kirby.dy;

  // Collision detection
  kirby.grounded = false;
  platforms.forEach((p) => {
    if (
      kirby.x < p.x + p.width &&
      kirby.x + kirby.width > p.x &&
      kirby.y < p.y + p.height &&
      kirby.y + kirby.height > p.y
    ) {
      // Collision from top
      if (kirby.dy > 0 && kirby.y + kirby.height - kirby.dy <= p.y) {
        kirby.y = p.y - kirby.height;
        kirby.dy = 0;
        kirby.grounded = true;
      }
    }
  });

  // Camera follows Kirby
  camera.x = kirby.x - canvas.width / 2 + kirby.width / 2;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Translate camera
  ctx.save();
  ctx.translate(-camera.x, 0);

  // Draw platforms
  ctx.fillStyle = "green";
  platforms.forEach((p) => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });

  // Draw Kirby
  ctx.fillStyle = kirby.color;
  ctx.beginPath();
  ctx.arc(kirby.x + kirby.width / 2, kirby.y + kirby.height / 2, kirby.width / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
