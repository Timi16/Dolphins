let score = 0;
let isGameOver = false;
let isPaused = false;
let displayedSeconds = 300;
let actualSeconds = 0;
let lastTime = performance.now();
let lastBallColor = null;
let consecutiveSameColor = 0;
let isTimeFrozen = false;
const maxConsecutiveSameColor = 2;
let activeElements = 0;
const maxElements = 15;

const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const pauseBtn = document.getElementById('pause-btn');
const menuOverlay = document.querySelector('.menu-overlay');
const finalScoreSpan = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const exitGameBtn = document.getElementById('exit-game');

function getBallSpawnRate() {
  const width = window.innerWidth;
  if (width < 768) return 800;
  if (width < 1024) return 600;
  return 400;
}

function getRandomVelocity() {
  const width = window.innerWidth;
  const speedMultiplier = width < 768 ? 1.5 : 2.5;
  
  return {
    x: (Math.random() - 0.5) * speedMultiplier,
    y: Math.random() * speedMultiplier + 1
  };
}

function createBall() {
  if (isGameOver || isPaused || activeElements >= maxElements) return;
  
  const ball = document.createElement('div');
  ball.className = 'ball';
  
  // Control random distribution
  let isBlue;
  if (lastBallColor === null) {
    isBlue = Math.random() < 0.7;
  } else if (consecutiveSameColor >= maxConsecutiveSameColor) {
    isBlue = !lastBallColor;
  } else {
    isBlue = Math.random() < 0.7;
  }
  
  if (isBlue === lastBallColor) {
    consecutiveSameColor++;
  } else {
    consecutiveSameColor = 1;
  }
  lastBallColor = isBlue;
  
  ball.style.background = isBlue ? '#0077ff' : '#000000';
  ball.style.border = '3px solid white';
  
  const rect = gameContainer.getBoundingClientRect();
  const size = parseInt(getComputedStyle(ball).width) || 55;
  
  ball.style.left = `${Math.random() * (rect.width - size)}px`;
  ball.style.top = '-50px';
  
  ball.velocity = getRandomVelocity();
  
  const clickHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGameOver && !isPaused && !isTimeFrozen) {
      if (isBlue) {
        score += 1;
        ball.style.transform = 'scale(1.2)';
        ball.style.background = '#00ff00';
      } else {
        score = Math.max(0, score - 2);
        ball.style.transform = 'scale(1.2)';
        ball.style.background = '#ff0000';
      }
      scoreElement.textContent = `Score: ${score}`;
      activeElements--;
      setTimeout(() => ball.remove(), 100);
    }
  };
  
  ball.addEventListener('click', clickHandler);
  ball.addEventListener('touchstart', clickHandler, { passive: false });
  
  activeElements++;
  gameContainer.appendChild(ball);
}

// ... (previous code remains the same until createSpecialBall function)

function createSpecialBall() {
  if (isGameOver || isPaused || activeElements >= maxElements) return;
  
  const ball = document.createElement('div');
  ball.className = 'ball special';
  ball.style.background = '#ffffff';
  ball.style.border = '3px solid #ffff00';
  
  const rect = gameContainer.getBoundingClientRect();
  const size = parseInt(getComputedStyle(ball).width) || 55;
  
  ball.style.left = `${Math.random() * (rect.width - size)}px`;
  ball.style.top = '-50px';
  
  ball.velocity = getRandomVelocity();
  
  ball.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isGameOver && !isPaused) {
      isTimeFrozen = true;
      score += 5;
      scoreElement.textContent = `Score: ${score}`;
      activeElements--;
      ball.remove();
      
      // Only freeze the ball movement, keep them clickable
      const balls = document.querySelectorAll('.ball');
      balls.forEach(b => {
        b.classList.add('frozen');
        // Save current velocity
        b.dataset.savedVelocityX = b.velocity.x;
        b.dataset.savedVelocityY = b.velocity.y;
        // Temporarily stop movement
        b.velocity = { x: 0, y: 0 };
      });
      
      setTimeout(() => {
        isTimeFrozen = false;
        document.querySelectorAll('.ball.frozen').forEach(b => {
          b.classList.remove('frozen');
          // Restore saved velocity
          b.velocity = {
            x: parseFloat(b.dataset.savedVelocityX) || 0,
            y: parseFloat(b.dataset.savedVelocityY) || 0
          };
          // Clean up dataset
          delete b.dataset.savedVelocityX;
          delete b.dataset.savedVelocityY;
        });
      }, 5000);
    }
  });
  
  activeElements++;
  gameContainer.appendChild(ball);
}

// Update the style to only affect visual appearance, not pointer events
const style = document.createElement('style');
style.textContent = `
  .ball.frozen {
    filter: brightness(0.7);
    /* Removed pointer-events property to keep balls clickable */
  }
  .ball.special {
    transform: scale(1.1);
  }
`;
document.head.appendChild(style);

function updateBallPositions() {
  if (isPaused || isTimeFrozen) return;
  
  const balls = document.querySelectorAll('.ball');
  const rect = gameContainer.getBoundingClientRect();
  
  balls.forEach(ball => {
    if (ball.classList.contains('frozen')) return;
    
    const ballRect = ball.getBoundingClientRect();
    let x = parseFloat(ball.style.left) || 0;
    let y = parseFloat(ball.style.top) || 0;
    
    x += ball.velocity.x;
    y += ball.velocity.y;
    
    if (x <= 0 || x + ballRect.width >= rect.width) {
      ball.velocity.x *= -1;
      x = x <= 0 ? 0 : rect.width - ballRect.width;
    }
    
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
    
    if (y > rect.height) {
      activeElements--;
      ball.remove();
    }
  });
}

function gameLoop(currentTime) {
  if (!isGameOver && !isPaused) {
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= getBallSpawnRate()) {
      createBall();
      lastTime = currentTime;
      
      if (Math.random() < 0.02 && !isTimeFrozen) {
        createSpecialBall();
      }
    }
    
    updateBallPositions();
    requestAnimationFrame(gameLoop);
  }
}

function clearBalls() {
  const balls = document.querySelectorAll('.ball');
  balls.forEach(ball => ball.remove());
  activeElements = 0;
}

function updateTimer() {
  if (isPaused) return;
  
  actualSeconds++;
  displayedSeconds -= 3;
  
  const minutes = Math.floor(Math.max(0, displayedSeconds) / 60);
  const seconds = Math.max(0, displayedSeconds) % 60;
  timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  if (actualSeconds >= 100) {
    endGame();
  }
}

function endGame() {
  isGameOver = true;
  clearBalls();
  finalScoreSpan.textContent = score;
  menuOverlay.style.display = 'flex';
  saveGameScore(score);
}

function resetGame() {
  score = 0;
  isGameOver = false;
  isPaused = false;
  displayedSeconds = 300;
  actualSeconds = 0;
  lastTime = performance.now();
  lastBallColor = null;
  consecutiveSameColor = 0;
  
  scoreElement.textContent = 'Score: 0';
  timerElement.textContent = '5:00';
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

// Start the game loop
requestAnimationFrame(gameLoop);

// Start the timer
setInterval(updateTimer, 1000);

// Add event listeners
playAgainBtn.addEventListener('click', resetGame);
pauseBtn.addEventListener('click', togglePause);

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

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          console.log('Raw response was:', responseText);
          throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
          throw new Error(data.message || 'Server returned an error');
      }

      if (data.newScore === undefined) {
          throw new Error('Response missing newScore field');
      }

      localStorage.setItem('score', data.newScore.toString());
      console.log('Score updated successfully:', data.newScore);

      return data.newScore;

  } catch (error) {
      console.error('Error in saveGameScore:', error);
      
      if (error.message === 'Failed to fetch') {
          console.error('Network error - server might be down');
      } else if (error.message.includes('Invalid JSON')) {
          console.error('Server returned invalid data');
      } else {
          console.error('Server error:', error.message);
      }
      
      throw error;
  }
}