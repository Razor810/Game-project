// -----------------------------------------------------
// CANVAS & UI
// -----------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

// -----------------------------------------------------
// SPRITES
// -----------------------------------------------------
const playerImg = new Image();
playerImg.src = 'assets/images/player.png';

const obstacleImg = new Image();
obstacleImg.src = 'assets/images/enemy.png';

const coinImg = new Image();
coinImg.src = 'assets/images/coin.png';

const platformImg = new Image();
platformImg.src = 'assets/images/platform.png';

// -----------------------------------------------------
// GAME VARIABLES
// -----------------------------------------------------
const groundY = 260;
const gravity = 0.6;
const jumpForce = -11;

let speed = 4;
let spawnTimer = 0;
let running = true;
let score = 0;

const player = {
  x: 120,
  y: groundY - 60,
  w: 60,
  h: 60,
  vy: 0,
  onGround: true,
};

let obstacles = [];
let platforms = [];
let coins = [];

// -----------------------------------------------------
// COOKIE / HIGHSCORE
// -----------------------------------------------------
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function getCookie(name) {
  const cname = name + "=";
  const arr = decodeURIComponent(document.cookie).split(';');
  for (let c of arr) {
    c = c.trim();
    if (c.startsWith(cname)) return c.substring(cname.length);
  }
  return "";
}

function saveHighscore(value) {
  const high = parseInt(getCookie("highscore") || "0");
  if (value > high) setCookie("highscore", value, 365);
}

function getHighscore() {
  return parseInt(getCookie("highscore") || "0");
}

// -----------------------------------------------------
// GAME RESET
// -----------------------------------------------------
function resetGame() {
  player.y = groundY - player.h;
  player.vy = 0;
  player.onGround = true;

  obstacles = [];
  platforms = [];
  coins = [];

  spawnTimer = 0;
  score = 0;
  speed = 4;

  running = true;
  restartBtn.disabled = true;

  scoreEl.textContent = `Score: 0 | Highscore: ${getHighscore()}`;
}

// -----------------------------------------------------
// SPAWNERS
// -----------------------------------------------------
function spawnObstacle() {
  const w = Math.random() < 0.5 ? 40 : 50;
  const h = Math.random() < 0.5 ? 40 : 50;
  obstacles.push({
    x: canvas.width,
    y: groundY - h,
    w, h,
    img: obstacleImg
  });
}

function spawnPlatform() {
  const w = 200;
  const h = 80;
  const y = groundY - 30 - Math.random() * 80;

  const platform = { x: canvas.width, y, w, h, img: platformImg };
  platforms.push(platform);

  // coin above platform — 50% chance
  if (Math.random() < 0.5) {
    coins.push({
      x: platform.x + w / 2 - 15,
      y: platform.y - 30,
      w: 30, h: 30,
      img: coinImg,
      collected: false
    });
  }
}

// -----------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------
function getPlayerHitbox() {
  const m = 10;
  return {
    x: player.x + m,
    y: player.y + m,
    w: player.w - m * 2,
    h: player.h - m * 2
  };
}

function intersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// -----------------------------------------------------
// UPDATE LOGIC
// -----------------------------------------------------
function update() {
  if (!running) return;

  // score & speed
  score++;
  speed = 4 + score / 3000;
  scoreEl.textContent = `Score: ${score} | Highscore: ${getHighscore()} | Speed: ${speed.toFixed(2)}`;

  // physics
  player.vy += gravity;
  player.y += player.vy;

  // ground collision
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // spawning
  spawnTimer--;
  if (spawnTimer <= 0) {
    Math.random() < 0.5 ? spawnObstacle() : spawnPlatform();
    spawnTimer = 100 + Math.random() * 50;
  }

  // move entities
  for (let arr of [obstacles, platforms, coins]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      arr[i].x -= speed;
      if (arr[i].x + arr[i].w < 0) arr.splice(i, 1);
    }
  }

  // collisions
  const hit = getPlayerHitbox();

  // obstacle collision -> game over
  for (const o of obstacles) {
    if (intersect(hit, o)) {
      gameOver();
      return;
    }
  }

  // coin collection
  for (const c of coins) {
    if (!c.collected && intersect(hit, c)) {
      c.collected = true;
      score += 150;
    }
  }

  // platform landing
  for (const p of platforms) {
    const feet = player.y + player.h;
    const prevFeet = feet - player.vy;
    const overlapX = player.x + player.w > p.x && player.x < p.x + p.w;

    if (overlapX && player.vy >= 0 && prevFeet <= p.y && feet >= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }
}

// -----------------------------------------------------
// DRAW
// -----------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = '#02a6ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = '#04ff00';
  ctx.fillRect(0, groundY - 12, canvas.width, 50);

  // player
  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // obstacles
  for (const o of obstacles) {
    if (o.img.complete) ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
    else {
      ctx.fillStyle = '#f00';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  // platforms
  for (const p of platforms) {
    if (p.img.complete) ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
    else {
      ctx.fillStyle = '#7a4a25';
      ctx.fillRect(p.x, p.y, p.w, h);
    }
  }

  // coins
  for (const c of coins) {
    if (!c.collected) {
      if (c.img.complete) ctx.drawImage(c.img, c.x, c.y, c.w, c.h);
      else {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + c.w/2, c.y + c.h/2, c.w/2, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // game over overlay
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui';
    ctx.textAlign = 'center';

    ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 10);
    ctx.fillText('Highscore: ' + getHighscore(), canvas.width/2, canvas.height/2 + 30);
  }
}

// -----------------------------------------------------
// GAME OVER
// -----------------------------------------------------
function gameOver() {
  running = false;
  restartBtn.disabled = false;
  saveHighscore(score);
}

// -----------------------------------------------------
// LOOP
// -----------------------------------------------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// -----------------------------------------------------
// CONTROLS
// -----------------------------------------------------
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && running) {
    if (player.onGround || player.y > groundY - player.h - 5) {
      player.vy = jumpForce;
    }
  }
});

restartBtn.addEventListener('click', resetGame);

// -----------------------------------------------------
// START GAME
// -----------------------------------------------------
resetGame();
loop();
