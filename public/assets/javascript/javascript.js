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

const groundImg = new Image();
groundImg.src = 'assets/images/ground.png';

// -----------------------------------------------------
// GAME VARIABLES
// -----------------------------------------------------
const groundY = 200;
const gravity = 0.6;
const jumpForce = -11;

let speed = 4;
let spawnTimer = 0;
let running = true;
let score = 0;
let timeCounter = 0; 


const player = {
  x: 120,
  y: groundY -60,
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
  player.y = groundY - player.h;  // Dit regelt automatisch waar de player start
  // ...existing code...


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
  const y = groundY - 30 - Math.random() * 50;

  const platform = { x: canvas.width, y, w, h, img: platformImg };
  platforms.push(platform);

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
function getHitbox(obj, margin = 12, offsetY = 0) {
  return {
    x: obj.x + margin,
    y: obj.y + margin + offsetY,
    w: obj.w - margin / 2,
    h: obj.h - margin / 2
  };
}


function getPlayerHitbox() {
  return getHitbox(player, 12);
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

  // laat een aparte teller oplopen voor snelheid
  if (!window.timeCounter) window.timeCounter = 0;
  window.timeCounter++;

  // snelheid gebaseerd op tijd, niet op score
  speed = 4 + window.timeCounter / 3000;

  // UI bijwerken
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
    spawnTimer = 80 + Math.random() * 50;
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
    if (intersect(hit, getHitbox(o, 4, 85))) {
      gameOver();
      return;
    }
  }

  // In de update functie, pas ook de coin margin aan:
  // coin collection
  for (const c of coins) {
    if (!c.collected && intersect(hit, getHitbox(c, 4))) {
      c.collected = true;
      score += 150;
    }
  }

  // obstacle collision -> game over
  for (const o of obstacles) {
    if (intersect(hit, getHitbox(o, 8))) {
      gameOver();
      return;
    }
  }

  // platform landing (alleen van bovenaf)
for (const p of platforms) {
  const feet = player.y + player.h;
  const prevFeet = feet - player.vy;

  const overlapX = player.x + player.w > p.x && player.x < p.x + p.w;
  const comingFromAbove = prevFeet <= p.y && feet >= p.y;

  if (overlapX && comingFromAbove && player.vy >= 0) {
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

  // achtergrond
  ctx.fillStyle = '#02a6ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // vaste grond (niet scrollend)
  if (groundImg.complete) {
    const y = groundY;
    const gh = canvas.height - groundY;
    ctx.drawImage(groundImg, 0, y, canvas.width, gh);
  } else {
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  }

  // obstacles
  for (const o of obstacles) {
    if (o.img.complete) ctx.drawImage(o.img, o.x, o.y + 85, o.w, o.h); // +6 = visuele correctie

    else {
      ctx.fillStyle = '#f00';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  // speler
if (playerImg.complete) {
  ctx.drawImage(playerImg, player.x, player.y + 80, player.w, player.h);
} else {
  ctx.fillStyle = '#0f0';
  ctx.fillRect(player.x, player.y, player.w, player.h);
}


  // platforms
  for (const p of platforms) {
    if (p.img.complete) ctx.drawImage(p.img, p.x, p.y + 40, p.w, p.h); // +4 = visuele correctie

    else {
      ctx.fillStyle = '#7a4a25';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  }

  // coins
  for (const c of coins) {
    if (!c.collected) {
      if (c.img.complete) ctx.drawImage(c.img, c.x, c.y + 60, c.w, c.h); // +6 = visuele correctie

      else {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
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

  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 30);
  ctx.fillText('Highscore: '+ getHighscore(), canvas.width / 2, canvas.height / 2 + 60);
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
