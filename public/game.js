// Game state management
const gameState = {
  score: 0,
  timeRemaining: 30,
  isGameOver: false,
  isPaused: false,
  isTimeFrozen: false,
  lastFrameTime: 0,
  deltaTime: 0,
  spawnTimer: 0,
  freezeTimer: 0,
  entities: new Set(),
  maxEntities: 15
};

// Cached DOM elements
const dom = {
  container: document.getElementById('game-container'),
  score: document.getElementById('score'),
  timer: document.getElementById('timer'),
  pauseBtn: document.getElementById('pause-btn'),
  menuOverlay: document.querySelector('.menu-overlay'),
  finalScore: document.getElementById('final-score'),
  playAgainBtn: document.getElementById('play-again'),
  exitGameBtn: document.getElementById('exit-game')
};

// Entity class for game objects
class Entity {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 48;  // Base size for entities
    this.height = 48;
    this.element = null;
    this.points = this.getPoints();
    this.createDOMElement();
  }

  getPoints() {
    switch(this.type) {
      case 'dolphin': return 2;
      case 'bomb': return -3;
      case 'special': return 5;
      default: return 0;
    }
  }

  createDOMElement() {
    this.element = document.createElement('div');
    this.element.className = `game-element ${this.type}`;
    this.element.innerHTML = this.getEmoji();
    this.updatePosition();
    dom.container.appendChild(this.element);
  }

  getEmoji() {
    switch(this.type) {
      case 'dolphin': return '🐬';
      case 'bomb': return '💣';
      case 'special': return '⭐';
      default: return '';
    }
  }

  updatePosition() {
    if (!this.element) return;
    this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

  setVelocity() {
    const baseSpeed = gameState.isTimeFrozen ? 0 : 200; // pixels per second
    this.vx = (Math.random() - 0.5) * baseSpeed;
    this.vy = Math.random() * baseSpeed + 100;
  }

  update(deltaTime) {
    if (gameState.isTimeFrozen) return;
    
    const secondsFraction = deltaTime / 1000;
    this.x += this.vx * secondsFraction;
    this.y += this.vy * secondsFraction;

    // Boundary checking
    const bounds = dom.container.getBoundingClientRect();
    if (this.x <= 0 || this.x + this.width >= bounds.width) {
      this.vx *= -1;
      this.x = this.x <= 0 ? 0 : bounds.width - this.width;
    }

    if (this.y > bounds.height) {
      this.destroy();
      return false;
    }

    this.updatePosition();
    return true;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    gameState.entities.delete(this);
  }

  onClick() {
    if (gameState.isGameOver || gameState.isPaused) return;

    if (this.type === 'special') {
      activateFreeze();
      gameState.score += this.points;
      this.destroy();
    } else if (gameState.isTimeFrozen) {
      gameState.score += this.points * 2;
      this.element.classList.add(this.type === 'dolphin' ? 'caught' : 'exploded');
      setTimeout(() => this.destroy(), 200);
    }

    dom.score.textContent = `Score: ${gameState.score}`;
  }
}

// Spawn system
class SpawnSystem {
  static getSpawnPosition() {
    const bounds = dom.container.getBoundingClientRect();
    const margin = 50;
    return {
      x: margin + Math.random() * (bounds.width - 2 * margin),
      y: -50 // Start above the visible area
    };
  }

  static spawnWave() {
    if (gameState.entities.size >= gameState.maxEntities) return;

    const types = ['special', 'dolphin', 'dolphin', 'dolphin', 'bomb'];
    const spawnCount = Math.min(5, gameState.maxEntities - gameState.entities.size);

    for (let i = 0; i < spawnCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const { x, y } = this.getSpawnPosition();
      const entity = new Entity(type, x, y);
      entity.setVelocity();
      entity.element.addEventListener('click', () => entity.onClick());
      gameState.entities.add(entity);
    }
  }
}

// Game systems
function activateFreeze() {
  gameState.isTimeFrozen = true;
  dom.container.classList.add('frozen');
  gameState.freezeTimer = 5000; // 5 seconds freeze
}

function updateFreeze(deltaTime) {
  if (!gameState.isTimeFrozen) return;

  gameState.freezeTimer -= deltaTime;
  if (gameState.freezeTimer <= 0) {
    gameState.isTimeFrozen = false;
    dom.container.classList.remove('frozen');
    gameState.entities.forEach(entity => entity.setVelocity());
  }
}

function updateTimer() {
  if (gameState.isPaused || gameState.isGameOver) return;
  
  gameState.timeRemaining--;
  dom.timer.textContent = `Time: ${gameState.timeRemaining}s`;
  
  if (gameState.timeRemaining <= 10) {
    dom.timer.classList.add('warning');
  }
  
  if (gameState.timeRemaining <= 0) {
    endGame();
  }
}

function endGame() {
  gameState.isGameOver = true;
  gameState.entities.forEach(entity => entity.destroy());
  gameState.entities.clear();
  dom.finalScore.textContent = gameState.score;
  dom.menuOverlay.style.display = 'flex';
  saveGameScore(gameState.score);
}

function resetGame() {
  gameState.entities.forEach(entity => entity.destroy());
  gameState.entities.clear();
  gameState.score = 0;
  gameState.timeRemaining = 30;
  gameState.isGameOver = false;
  gameState.isPaused = false;
  gameState.isTimeFrozen = false;
  gameState.spawnTimer = 0;
  
  dom.score.textContent = 'Score: 0';
  dom.timer.textContent = 'Time: 30s';
  dom.timer.classList.remove('warning');
  dom.menuOverlay.style.display = 'none';
  
  requestAnimationFrame(gameLoop);
}

// Main game loop using requestAnimationFrame
function gameLoop(timestamp) {
  if (gameState.isGameOver || gameState.isPaused) return;

  // Calculate delta time
  gameState.deltaTime = timestamp - gameState.lastFrameTime;
  gameState.lastFrameTime = timestamp;

  // Update spawn timer
  gameState.spawnTimer += gameState.deltaTime;
  if (gameState.spawnTimer >= 2000) { // Spawn every 2 seconds
    SpawnSystem.spawnWave();
    gameState.spawnTimer = 0;
  }

  // Update freeze status
  updateFreeze(gameState.deltaTime);

  // Update all entities
  gameState.entities.forEach(entity => entity.update(gameState.deltaTime));

  requestAnimationFrame(gameLoop);
}

// Event handlers
function togglePause() {
  gameState.isPaused = !gameState.isPaused;
  dom.pauseBtn.classList.toggle('paused');
  
  if (!gameState.isPaused) {
    gameState.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

async function saveGameScore(gameScore) {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  if (!token || !username) {
    console.error('Authentication data not found');
    return;
  }

  try {
    const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/update-game-score', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, gameScore }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Server error');
    
    localStorage.setItem('score', data.newScore.toString());
    return data.newScore;
  } catch (error) {
    console.error('Error saving score:', error);
  }
}

// Initialization
function initGame() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  
  if (!username || !token) {
    window.location.href = 'home.html';
    return;
  }

  // Event listeners
  dom.playAgainBtn.addEventListener('click', resetGame);
  dom.pauseBtn.addEventListener('click', togglePause);
  dom.exitGameBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
  });

  // Start game systems
  gameState.lastFrameTime = performance.now();
  setInterval(updateTimer, 1000);
  requestAnimationFrame(gameLoop);
}

// Start the game
initGame();