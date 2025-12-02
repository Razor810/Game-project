// CANVAS & UI
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

// SPRITES
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

const enemyFlyingImg = new Image();
enemyFlyingImg.src = 'assets/images/flyingenemy.png';

// GAME VARIABLES
const groundY = 200;
const gravity = 0.6;
const jumpForce = -11;

let speed = 4;
let spawnTimer = 0;
let running = true;
let score = 500;

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

// COOKIE / HIGHSCORE
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

// GAME RESET
function resetGame() {
  player.x = 120;
  player.y = groundY - player.h;
  player.vy = 0;
  player.onGround = true;

  obstacles = [];
  platforms = [];
  coins = [];

  spawnTimer = 0;
  score = 0;
  speed = 4;
  window.timeCounter = 0;

  running = true;
  restartBtn.disabled = true;

  scoreEl.textContent = `Score: 0 | Highscore: ${getHighscore()}`;
}

// SPAWNERS
function spawnObstacle() {
  const w = Math.random() < 0.5 ? 40 : 50;
  const h = Math.random() < 0.5 ? 40 : 50;
  obstacles.push({
    x: canvas.width,
    y: groundY - h,
    w, h,
    img: obstacleImg,
    type: "ground"
  });
}

function spawnEnemy() {
  let type;
  if (score < 500) {
    type = "ground";
  } else if (score < 3000) {
    type = Math.random() < 0.5 ? "ground" : "flying";
  } else {
    type = Math.random() < 0.3 ? "ground" : "flying";
  }

  if (type === "ground") {
    const w = 50, h = 50;
    obstacles.push({
      x: canvas.width,
      y: groundY - h,
      w, h,
      img: obstacleImg,
      type: "ground"
    });
  } else {
    const w = 50, h = 50;
    const y = groundY - 120 - Math.random() * 50;
    obstacles.push({
      x: canvas.width,
      y,
      w, h,
      img: enemyFlyingImg,
      type: "flying",
      vy: Math.random() < 0.5 ? 1 : -1
    });
  }
}

function spawnPlatform() {
  const w = 200;
  const h = 80;
  const y = groundY - 30 - Math.random() * 50;

  const platform = { x: canvas.width, y, w, h, img: platformImg, type: "platform" };
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

// HELPER FUNCTIONS
function getHitbox(obj, margin = 12, offsetY = 0) {
  return {
    x: obj.x + margin,
    y: obj.y + margin + offsetY,
    w: obj.w - margin * 2,
    h: obj.h - margin * 2
  };
}
function getPlayerHitbox() {
  // Speler wordt getekend met +80; hitbox krijgt dezelfde offset
  return getHitbox(player, 12, 80);
}
function intersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// UPDATE LOGIC
function update() {
  if (!running) return;

  if (!window.timeCounter) window.timeCounter = 0;
  window.timeCounter++;

  // snelheid gebaseerd op tijd
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
    const spawnChoice = Math.random();
    if (spawnChoice < 0.4) {
      spawnPlatform();
    } else {
      spawnEnemy();
    }
    // spawnTimer verkorten naarmate score stijgt
    const difficultyFactor = Math.max(20, 80 - score / 50);
    spawnTimer = difficultyFactor + Math.random() * 30;
  }

  // move obstacles (incl. flying gedrag)
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;

    if (o.type === "flying") {
      o.y += o.vy;
      // vliegbereik
      if (o.y < groundY - 180 || o.y > groundY - 80) {
        o.vy *= -1;
      }
    }

    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // move platforms
  for (let i = platforms.length - 1; i >= 0; i--) {
    platforms[i].x -= speed;
    if (platforms[i].x + platforms[i].w < 0) platforms.splice(i, 1);
  }

  // move coins
  for (let i = coins.length - 1; i >= 0; i--) {
    coins[i].x -= speed;
    if (coins[i].x + coins[i].w < 0) coins.splice(i, 1);
  }

  // collisions
  const playerHB = getPlayerHitbox();

  // obstacle collision -> game over (offset afhankelijk van type)
  for (const o of obstacles) {
    const yOffset = o.type === "ground" ? 85 : 0; // zelfde als draw
    const obstacleHB = getHitbox(o, 4, yOffset);
    if (intersect(playerHB, obstacleHB)) {
      gameOver();
      return;
    }
  }

  // coin collection (coins worden getekend met +60)
  for (const c of coins) {
    if (!c.collected) {
      const coinHB = getHitbox(c, 4, 60);
      if (intersect(playerHB, coinHB)) {
        c.collected = true;
        score += 150;
      }
    }
  }

  // platform landing (platforms worden getekend met +40, maar landing gebruikt de logische y)
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

// DRAW
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
    const yOffset = o.type === "ground" ? 85 : 0;
    if (o.img.complete) {
      ctx.drawImage(o.img, o.x, o.y + yOffset, o.w, o.h);
    } else {
      ctx.fillStyle = '#f00';
      ctx.fillRect(o.x, o.y + yOffset, o.w, o.h);
    }
  }

  // speler (+80)
  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y + 80, player.w, player.h);
  } else {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y + 80, player.w, player.h);
  }

  // platforms (+40)
  for (const p of platforms) {
    if (p.img.complete) {
      ctx.drawImage(p.img, p.x, p.y + 40, p.w, p.h);
    } else {
      ctx.fillStyle = '#7a4a25';
      ctx.fillRect(p.x, p.y + 40, p.w, p.h);
    }
  }

  // coins (+60)
  for (const c of coins) {
    if (!c.collected) {
      if (c.img.complete) {
        ctx.drawImage(c.img, c.x, c.y + 60, c.w, c.h);
      } else {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2 + 60, c.w / 2, 0, Math.PI * 2);
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
    ctx.fillText('Highscore: ' + getHighscore(), canvas.width / 2, canvas.height / 2 + 60);
  }
}

// GAME OVER
function gameOver() {
  running = false;
  restartBtn.disabled = false;
  saveHighscore(score);
}

// LOOP
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// CONTROLS
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && running) {
    if (player.onGround) {
      player.vy = jumpForce;
    }
  }
});

restartBtn.addEventListener('click', resetGame);

// START GAME
resetGame();
loop();
