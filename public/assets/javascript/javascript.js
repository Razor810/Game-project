// Pak het canvas en de teken-context
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// UI elementen voor score en restart-knop
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

// Laad de sprite-afbeelding van de speler
const playerImg = new Image();
playerImg.src = 'assets/images/player.png'; 

// Laad de obstakel-afbeelding
const obstacleImg = new Image();
obstacleImg.src = 'assets/images/enemy.png';

// Basis spelinstellingen
const groundY = 260;
const gravity = 0.6;
const jumpForce = -11;
let speed = 4;

const player = { 
  x: 120,
  y: groundY - 40,   // hoogte = grondY - player.h
  w: 60, h: 60,
  vy: 0,
  onGround: true,
};



// Variabelen voor spelstatus
let obstacles = [];
let spawnTimer = 0;
let running = true;
let score = 0;

// ---------------- COOKIE FUNCTIES ----------------
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  const expires = "expires="+ d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}
function getCookie(name) {
  const cname = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(cname) === 0) {
      return c.substring(cname.length, c.length);
    }
  }
  return "";
}
function saveHighscore(score) {
  const highscore = parseInt(getCookie("highscore") || "0", 10);
  if (score > highscore) {
    setCookie("highscore", score, 365);
  }
}
function getHighscore() {
  return parseInt(getCookie("highscore") || "0", 10);
}

// ---------------- SPELFUNCTIES ----------------
function resetGame() {
  player.y = groundY - player.h; // onderkant op de grond
  player.vy = 0;
  player.onGround = true;
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  speed = 4;
  running = true;
  restartBtn.disabled = true;
  scoreEl.textContent = 'Score: 0 | Highscore: ' + getHighscore();
}


function spawnObstacle() {
  const w = Math.random() < 9.0 ? 40 : 50;
  const h = Math.random() < 9.0 ? 40 : 50;
  obstacles.push({
    x: canvas.width + 20,
    y: groundY - h,
    w,
    h,
    img: obstacleImg
  });
}

function getPlayerHitbox() {
  const margin = 10;
  return {
    x: player.x + margin,
    y: player.y + margin,
    w: player.w - margin * 2,
    h: player.h - margin * 2
  };
}

function update() {
  if (!running) return;

  score += 1;
  speed = 4 + (score / 3000);

  scoreEl.textContent = 'Score: ' + score + 
                        ' | Highscore: ' + getHighscore() + 
                        ' | Speed: ' + speed.toFixed(2);

  player.vy += gravity;
  player.y += player.vy;

  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  spawnTimer--;
  if (spawnTimer <= 0) {
    spawnObstacle();
    const base = Math.max(60, 140 - Math.floor(score / 200));
    spawnTimer = base + Math.floor(Math.random() * 40);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed;
    if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
  }

  const hitbox = getPlayerHitbox();
  for (const o of obstacles) {
    if (hitbox.x < o.x + o.w &&
        hitbox.x + hitbox.w > o.x &&
        hitbox.y < o.y + o.h &&
        hitbox.y + hitbox.h > o.y) {
      gameOver();
      break;
    }
  }
}

function gameOver() {
  running = false;
  restartBtn.disabled = false;
  saveHighscore(score);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#02a6ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#04ff00';
  ctx.fillRect(0, groundY, canvas.width, 40);

  if (playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  for (const o of obstacles) {
    if (o.img && o.img.complete) {
      ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
    } else {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Highscore: ' + getHighscore(), canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ---------------- CONTROLS ----------------
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && running) {
    if (player.onGround || player.y > groundY - player.h - 5) {
      player.vy = jumpForce;
    }
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
});

resetGame();
loop();
