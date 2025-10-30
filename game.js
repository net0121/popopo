const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gravity = 0.5;
const keys = {};
const camera = { x: 0 };

const kirby = {
  x: 30, // Start inside pink box
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

// Define collision zones manually based on green bars in image
const platforms = [
  { x: 0, y: 360, width: 20, height: 40 },
  { x: 20, y: 320, width: 20, height: 80 },
  { x: 40, y: 280, width: 20, height: 120 },
  { x: 60, y: 240, width: 20, height: 160 },
  { x: 80, y: 200, width: 20, height: 200 },
  { x: 100, y: 240, width: 20, height: 160 },
  { x: 120, y: 280, width: 20, height: 120 },
  { x: 140, y: 320, width: 20, height: 80 },
  { x: 160, y: 360, width: 20, height: 40 },
  // Add more bars as needed based on image
];

const bgImage = new Image();
bgImage.src = "ground.png"; // Use actual image path

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

  // Draw background image
  ctx.drawImage(bgImage, 0, 0);

  // Draw platforms (invisible, used for collision)
  // Uncomment to visualize:
  // ctx.fillStyle = "rgba(0,255,0,0.3)";
  // platforms.forEach((p) => ctx.fillRect(p.x, p.y, p.width, p.height));

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

bgImage.onload = () => {
  gameLoop();
};
