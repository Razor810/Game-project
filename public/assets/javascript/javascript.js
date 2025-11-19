const emojis = ['🍕', '🚀', '🐶', '🎮', '🌈', '⚽','🍩','🔥'];
const board = document.getElementById('game-board');
const resetButton = document.getElementById('reset-button');

let firstCard = null;
let secondCard = null;
let lockBoard = false;

function setupGame() {
  board.innerHTML = '';
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  let cards = [...emojis, ...emojis].sort(() => 0.5 - Math.random());

  cards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.emoji = emoji;
    card.textContent = '❓';
    board.appendChild(card);

    card.addEventListener('click', () => {
      if (lockBoard || card.textContent !== '❓') return;

      card.textContent = emoji;

      if (!firstCard) {
        firstCard = card;
      } else {
        secondCard = card;
        lockBoard = true;

        if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
          firstCard = null;
          secondCard = null;
          lockBoard = false;
        } else {
          setTimeout(() => {
            firstCard.textContent = '❓';
            secondCard.textContent = '❓';
            firstCard = null;
            secondCard = null;
            lockBoard = false;
          }, 1000);
        }
      }
    });
  });
}

// Start het spel bij het laden
setupGame();

// Reset-knop activeren
resetButton.addEventListener('click', setupGame);

