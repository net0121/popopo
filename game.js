const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gravity = 0.5;
const keys = {};

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

const platforms = [
  { x: 0, y: 360, width: 800, height: 40 },
  { x: 200, y: 300, width: 100, height: 10 },
  { x: 400, y: 250, width: 100, height: 10 }
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
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Kirby
  ctx.fillStyle = kirby.color;
  ctx.beginPath();
  ctx.arc(kirby.x + kirby.width / 2, kirby.y + kirby.height / 2, kirby.width / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw platforms
  ctx.fillStyle = "green";
  platforms.forEach((p) => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
