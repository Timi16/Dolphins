let score = 0;
let isGameOver = false;
let isPaused = false;
let timeRemaining = 30;
let lastTime = performance.now();
let isTimeFrozen = false;
let activeElements = 0;
const maxElements = 12;

const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const pauseBtn = document.getElementById('pause-btn');
const menuOverlay = document.querySelector('.menu-overlay');
const finalScoreSpan = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const exitGameBtn = document.getElementById('exit-game');

function getSpawnRate() {
  const width = window.innerWidth;
  if (width < 768) return 1000;
  if (width < 1024) return 800;
  return 600;
}

function getRandomVelocity() {
  const width = window.innerWidth;
  const speedMultiplier = width < 768 ? 1 : 2;
  
  return {
    x: (Math.random() - 0.5) * speedMultiplier,
    y: Math.random() * speedMultiplier + 1
  };
}

function createGameElement(type) {
  if (isGameOver || isPaused || activeElements >= maxElements) return;

  const element = document.createElement('div');
  element.className = 'game-element';
  
  // Set element type and appearance
  if (type === 'dolphin') {
    element.innerHTML = '🐬';
    element.classList.add('dolphin');
  } else if (type === 'bomb') {
    element.innerHTML = '💣';
    element.classList.add('bomb');
  } else if (type === 'special') {
    element.innerHTML = '⭐';
    element.classList.add('special');
  }

  // Spawn elements along the top
  const rect = gameContainer.getBoundingClientRect();
  const leftPosition = Math.random() * (rect.width - 40);
  
  element.style.left = `${leftPosition}px`;
  element.style.top = '0px';

  element.velocity = getRandomVelocity();

  element.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGameOver && !isPaused && !isTimeFrozen) {
      if (type === 'dolphin') {
        score += 2;
        element.classList.add('caught');
        playSound('dolphin');
      } else if (type === 'bomb') {
        score = Math.max(0, score - 3);
        element.classList.add('exploded');
        playSound('bomb');
      } else if (type === 'special') {
        activateFreeze();
        score += 5;
        playSound('special');
      }
      scoreElement.textContent = `Score: ${score}`;
      activeElements--;
      setTimeout(() => element.remove(), 200);
    }
  });

  activeElements++;
  gameContainer.appendChild(element);
}

function activateFreeze() {
  isTimeFrozen = true;
  gameContainer.classList.add('frozen');
  
  const elements = document.querySelectorAll('.game-element');
  elements.forEach(el => {
    el.dataset.savedVelocityX = el.velocity.x;
    el.dataset.savedVelocityY = el.velocity.y;
    el.velocity = { x: 0, y: 0 };
  });

  setTimeout(() => {
    isTimeFrozen = false;
    gameContainer.classList.remove('frozen');
    document.querySelectorAll('.game-element').forEach(el => {
      el.velocity = {
        x: parseFloat(el.dataset.savedVelocityX) || 0,
        y: parseFloat(el.dataset.savedVelocityY) || 0
      };
      delete el.dataset.savedVelocityX;
      delete el.dataset.savedVelocityY;
    });
  }, 3000);
}

function playSound(type) {
  // Create audio elements for game sounds
  const sounds = {
    dolphin: new Audio('path/to/dolphin-sound.mp3'),
    bomb: new Audio('path/to/explosion-sound.mp3'),
    special: new Audio('path/to/powerup-sound.mp3')
  };
  
  const sound = sounds[type];
  if (sound) {
    sound.volume = 0.3;
    sound.play().catch(() => {}); // Catch and ignore autoplay restrictions
}
}

function updateElementPositions() {
  if (isPaused || isTimeFrozen) return;
  
  const elements = document.querySelectorAll('.game-element');
  const rect = gameContainer.getBoundingClientRect();
  
  elements.forEach(element => {
    const elementRect = element.getBoundingClientRect();
    let x = parseFloat(element.style.left) || 0;
    let y = parseFloat(element.style.top) || 0;
    
    x += element.velocity.x;
    y += element.velocity.y;
    
    if (x <= 0 || x + elementRect.width >= rect.width) {
      element.velocity.x *= -1;
      x = x <= 0 ? 0 : rect.width - elementRect.width;
    }
    
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    if (y > rect.height) {
      activeElements--;
      element.remove();
    }
  });
}

function gameLoop(currentTime) {
  if (!isGameOver && !isPaused) {
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= getSpawnRate()) {
      // 70% chance for dolphin, 20% for bomb, 10% for special
      const rand = Math.random();
      if (rand < 0.7) {
        createGameElement('dolphin');
      } else if (rand < 0.9) {
        createGameElement('bomb');
      } else {
        createGameElement('special');
      }
      lastTime = currentTime;
    }
    
    updateElementPositions();
    requestAnimationFrame(gameLoop);
  }
}

function clearElements() {
  const elements = document.querySelectorAll('.game-element');
  elements.forEach(element => element.remove());
  activeElements = 0;
}

function updateTimer() {
  if (isPaused) return;
  
  if (timeRemaining > 0) {
    timeRemaining--;
    timerElement.textContent = `Time: ${timeRemaining}s`;
    
    if (timeRemaining <= 10) {
      timerElement.classList.add('warning');
    }
    
    if (timeRemaining === 0) {
      endGame();
    }
  }
}

function endGame() {
  isGameOver = true;
  clearElements();
  finalScoreSpan.textContent = score;
  menuOverlay.style.display = 'flex';
  saveGameScore(score);
}

function resetGame() {
  score = 0;
  isGameOver = false;
  isPaused = false;
  timeRemaining = 30;
  lastTime = performance.now();
  
  scoreElement.textContent = 'Score: 0';
  timerElement.textContent = 'Time: 30s';
  timerElement.classList.remove('warning');
  pauseBtn.classList.remove('paused');
  menuOverlay.style.display = 'none';
  
  requestAnimationFrame(gameLoop);
}

function togglePause() {
  isPaused = !isPaused;
  pauseBtn.classList.toggle('paused');
  
  if (!isPaused) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

// Initialize game
const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
if (!username || !token) {
    window.location.href = 'home.html';
}

// Start game loop and timer
requestAnimationFrame(gameLoop);
setInterval(updateTimer, 1000);

// Event listeners
playAgainBtn.addEventListener('click', resetGame);
pauseBtn.addEventListener('click', togglePause);
exitGameBtn.addEventListener('click', () => {
  window.location.href = 'home.html';
});

async function saveGameScore(gameScore) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('Authentication token not found');
    return;
  }

  try {
    const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/update-game-score', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        gameScore
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Server error');
    }

    localStorage.setItem('score', data.newScore.toString());
    return data.newScore;

  } catch (error) {
    console.error('Error saving score:', error);
    throw error;
  }
}