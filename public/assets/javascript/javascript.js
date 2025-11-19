const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

const groundY = 260;
const gravity = 0.8;
const jumpForce = -12;
const speed = 6;

const player = { x: 80, y: groundY - 40, w: 40, h: 40, vy: 0, onGround: true, color: 'aqua' };
let obstacles = [];
let spawnTimer = 0;
let running = true;
let score = 0;

// ✅ Cookie helpers
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

// ✅ Highscore functies
function saveHighscore(score) {
  const highscore = parseInt(getCookie("highscore") || "0", 10);
  if (score > highscore) {
    setCookie("highscore", score, 365); // 1 jaar bewaren
  }
}

function getHighscore() {
  return parseInt(getCookie("highscore") || "0", 10);
}

function resetGame() {
  player.y = groundY - player.h;
  player.vy = 0;
  player.onGround = true;
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  running = true;
  restartBtn.disabled = true;
  scoreEl.textContent = 'Score: 0 | Highscore: ' + getHighscore();
}

function spawnObstacle() {
  const w = Math.random() < 0.5 ? 30 : 50;
  const h = Math.random() < 0.5 ? 40 : 60;
  obstacles.push({ x: canvas.width + 20, y: groundY - h, w, h, color: '#FF5252' });
}

function update() {
  if (!running) return;

  score += 1;
  scoreEl.textContent = 'Score: ' + score + ' | Highscore: ' + getHighscore();

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
    const base = Math.max(40, 120 - Math.floor(score / 100));
    spawnTimer = base + Math.floor(Math.random() * 40);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed;
    if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
  }

  for (const o of obstacles) {
    if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
      gameOver();
      break;
    }
  }
}

function gameOver() {
  running = false;
  restartBtn.disabled = false;
  saveHighscore(score); // ✅ highscore opslaan
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2e2e2e';
  ctx.fillRect(0, groundY, canvas.width, 4);

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  for (const o of obstacles) {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
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

// Jump event
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && player.onGround && running) {
    player.vy = jumpForce;
  }
});

// Restart button
restartBtn.addEventListener('click', () => {
  resetGame();
});

// Start game
resetGame();
loop();
