// Pak het canvas en de teken-context
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// UI elementen voor score en restart-knop
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

// Laad de sprite-afbeelding
const playerImg = new Image();
playerImg.src = 'assets/images/New Piskel.png';


// Basis spelinstellingen
const groundY = 260;     // hoogte van de grondlijn
const gravity = 0.6;     // zwaartekracht (hoe snel je valt)
const jumpForce = -11;   // sprongkracht (negatief = omhoog)
let speed = 4;           // beginsnelheid van obstakels

// Speler object
const player = { 
  x: 120,
  y: groundY - 60,   // hoogte aanpassen zodat hij op de grond staat
  w: 60, h: 60,      // groter formaat (bijv. 80x80)
  vy: 0,
  onGround: true,
};


// Variabelen voor spelstatus
let obstacles = [];      // lijst met obstakels
let spawnTimer = 0;      // timer voor nieuwe obstakels
let running = true;      // is het spel bezig?
let score = 0;           // huidige score

// ---------------- COOKIE FUNCTIES VOOR HIGHSCORE ----------------

// Zet een cookie
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  const expires = "expires="+ d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Haal een cookie op
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

// Sla highscore op als huidige score hoger is
function saveHighscore(score) {
  const highscore = parseInt(getCookie("highscore") || "0", 10);
  if (score > highscore) {
    setCookie("highscore", score, 365); // 1 jaar bewaren
  }
}

// Haal highscore op
function getHighscore() {
  return parseInt(getCookie("highscore") || "0", 10);
}

// ---------------- SPELFUNCTIES ----------------

// Reset spel naar beginstand
function resetGame() {
  player.y = groundY - player.h;
  player.vy = 0;
  player.onGround = true;
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  speed = 4; // reset snelheid
  running = true;
  restartBtn.disabled = true;
  scoreEl.textContent = 'Score: 0 | Highscore: ' + getHighscore();
}

// Maak een nieuw obstakel
function spawnObstacle() {
  const w = Math.random() < 0.5 ? 30 : 45; // willekeurige breedte
  const h = Math.random() < 0.5 ? 40 : 50; // willekeurige hoogte
  obstacles.push({ x: canvas.width + 20, y: groundY - h, w, h, color: '#000000ff' });
}

// Update spelstatus (score, speler, obstakels)
function update() {
  if (!running) return;

  score += 1; // score loopt op

  // snelheid vloeiend verhogen met score
  speed = 4 + (score / 3000); 

  // update score tekst
  scoreEl.textContent = 'Score: ' + score + 
                        ' | Highscore: ' + getHighscore() + 
                        ' | Speed: ' + speed.toFixed(2);

  // zwaartekracht toepassen
  player.vy += gravity;
  player.y += player.vy;

  // check of speler op de grond staat
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  
  }
  function getPlayerHitbox() {
  const margin = 10; // marge rondom sprite
  return {
    x: player.x + margin,
    y: player.y + margin,
    w: player.w - margin * 4,
    h: player.h - margin * 2.5
  };
}


  // obstakels spawnen
  spawnTimer--;
  if (spawnTimer <= 0) {
    spawnObstacle();
    const base = Math.max(60, 140 - Math.floor(score / 200));
    spawnTimer = base + Math.floor(Math.random() * 40);
  }

  // obstakels bewegen
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= speed;
    if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
  }

  // botsing check
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

// Game over
function gameOver() {
  running = false;
  restartBtn.disabled = false;
  saveHighscore(score); // highscore opslaan
}

// Teken alles op canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // achtergrond
  ctx.fillStyle = '#02a6ffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grondlijn
  ctx.fillStyle = '#04ff00ff';
  ctx.fillRect(0, groundY, canvas.width, 40);

  // speler (teken sprite in plaats van blokje)
if (playerImg.complete) {
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
} else {
  // fallback: wit blokje als de afbeelding nog laadt
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
}


  // obstakels
  for (const o of obstacles) {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }

  // game over overlay
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

// Hoofdloop van het spel
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ---------------- CONTROLS ----------------

document.addEventListener('keydown', e => {
  // check of toets spatie of pijltje omhoog is
  if ((e.code === 'Space' || e.code === 'ArrowUp') && running) {
    // ook springen als je bijna op de grond bent
    if (player.onGround || player.y > groundY - player.h - 5) {
      player.vy = jumpForce;
    }
  }
});



// Restart knop
restartBtn.addEventListener('click', () => {
  resetGame();
});

// Start spel
resetGame();
loop();
