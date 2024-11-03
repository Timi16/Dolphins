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

const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const pauseBtn = document.getElementById('pause-btn');
const menuOverlay = document.querySelector('.menu-overlay');
const finalScoreSpan = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const exitGameBtn = document.getElementById('exit-game');

function getBallSpawnRate() {
  // Faster spawn rate
  const width = window.innerWidth;
  if (width < 768) return 300;  // Increased spawn rate
  if (width < 1024) return 200;
  return 150;  // Much faster for larger screens
}

function getRandomVelocity() {
  // Faster movement
  return {
    x: (Math.random() - 0.5) * 4,  // Doubled horizontal speed
    y: Math.random() * 4 + 2       // Doubled vertical speed
  };
}

function createSpecialBall() {
  if (isGameOver || isPaused) return;
  
  const ball = document.createElement('div');
  ball.className = 'ball special';
  ball.style.background = '#ffffff';
  ball.style.border = '3px solid #ffff00';  // Golden border
  ball.style.boxShadow = '0 0 10px #ffff00';  // Glowing effect
  
  const rect = gameContainer.getBoundingClientRect();
  const size = parseInt(getComputedStyle(ball).width) || 55;
  
  ball.style.left = `${Math.random() * (rect.width - size)}px`;
  ball.style.top = '-50px';
  
  ball.velocity = getRandomVelocity();
  
  ball.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isGameOver && !isPaused) {
      isTimeFrozen = true;
      score += 5;  // Bonus points for catching special ball
      scoreElement.textContent = `Score: ${score}`;
      ball.remove();
      
      // Freeze all existing balls
      const balls = document.querySelectorAll('.ball');
      balls.forEach(b => b.classList.add('frozen'));
      
      // Unfreeze after 5 seconds
      setTimeout(() => {
        isTimeFrozen = false;
        document.querySelectorAll('.ball.frozen').forEach(b => b.classList.remove('frozen'));
      }, 5000);
    }
  });
  
  gameContainer.appendChild(ball);
}

function createBallGroup() {
  if (isGameOver || isPaused) return;
  
  // Create multiple balls at once
  const numBalls = Math.floor(Math.random() * 3) + 3;  // 3-5 balls at once
  
  for (let i = 0; i < numBalls; i++) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    
    // More blue balls (80% chance)
    const isBlue = Math.random() < 0.8;
    
    ball.style.background = isBlue ? '#0077ff' : '#000000';
    ball.style.border = '3px solid white';
    
    const rect = gameContainer.getBoundingClientRect();
    const size = parseInt(getComputedStyle(ball).width) || 55;
    
    // Spread balls across the width
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
          score = Math.max(0, score - 2);  // Penalty reduced to -2
          ball.style.transform = 'scale(1.2)';
          ball.style.background = '#ff0000';
        }
        scoreElement.textContent = `Score: ${score}`;
        setTimeout(() => ball.remove(), 100);
      }
    };
    
    ball.addEventListener('click', clickHandler);
    ball.addEventListener('touchstart', clickHandler, { passive: false });
    
    gameContainer.appendChild(ball);
  }
}

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
      ball.remove();
    }
  });
}

// Add CSS styles for the frozen effect
const style = document.createElement('style');
style.textContent = `
  .ball.frozen {
    animation: none !important;
    filter: brightness(0.7);
    pointer-events: auto;
  }
  .ball.special {
    animation: pulse 1s infinite;
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

function gameLoop(currentTime) {
  if (!isGameOver && !isPaused) {
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= getBallSpawnRate()) {
      createBallGroup();  // Spawn groups instead of single balls
      lastTime = currentTime;
      
      // Randomly spawn special white ball (2% chance per spawn cycle)
      if (Math.random() < 0.02 && !isTimeFrozen) {
        createSpecialBall();
      }
    }
    
    updateBallPositions();
    requestAnimationFrame(gameLoop);
  }
}


  function createBall() {
    if (isGameOver || isPaused) return;
    
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
      if (!isGameOver && !isPaused) {
        if (isBlue) {
          score += 1;
          ball.style.transform = 'scale(1.2)';
          ball.style.background = '#00ff00';
        } else {
          score = 0;
          ball.style.transform = 'scale(1.2)';
          ball.style.background = '#ff0000';
        }
        scoreElement.textContent = `Score: ${score}`;
        setTimeout(() => ball.remove(), 100);
      }
    };
    
    ball.addEventListener('click', clickHandler);
    ball.addEventListener('touchstart', clickHandler, { passive: false });
    
    gameContainer.appendChild(ball);
  }

  function updateBallPositions() {
    if (isPaused) return;
    
    const balls = document.querySelectorAll('.ball');
    const rect = gameContainer.getBoundingClientRect();
    
    balls.forEach(ball => {
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
        ball.remove();
      }
    });
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

  function clearBalls() {
    const balls = document.querySelectorAll('.ball');
    balls.forEach(ball => ball.remove());
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
  

  // Event Listeners
  pauseBtn.addEventListener('click', togglePause);
  playAgainBtn.addEventListener('click', resetGame);
  exitGameBtn.addEventListener('click', () => {
    saveGameScore(score).then(() => {
        window.location.href = 'home.html';
    });
});
  // Start game
  const timerInterval = setInterval(updateTimer, 1000);
  requestAnimationFrame(gameLoop);

  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !isGameOver && !isPaused) {
      togglePause();
    }
  });

// Get username from localStorage
const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
if (!username || !token) {
    window.location.href = 'home.html';
}

// Add function to save game score to database
async function saveGameScore(gameScore) {
  const token = localStorage.getItem('token');
  
  if (!token) {
      console.error('Authentication token not found');
      return;
  }

  try {
      // Make the API request
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

      // Get raw response text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse the response as JSON
      let data;
      try {
          data = JSON.parse(responseText);
      } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          console.log('Raw response was:', responseText);
          throw new Error('Invalid JSON response from server');
      }

      // Check if the response was successful
      if (!response.ok) {
          throw new Error(data.message || 'Server returned an error');
      }

      // Validate the response data
      if (data.newScore === undefined) {
          throw new Error('Response missing newScore field');
      }

      // Update local storage with new score
      localStorage.setItem('score', data.newScore.toString());
      console.log('Score updated successfully:', data.newScore);

      return data.newScore;

  } catch (error) {
      console.error('Error in saveGameScore:', error);
      
      // You might want to show this to the user in your UI
      if (error.message === 'Failed to fetch') {
          console.error('Network error - server might be down');
      } else if (error.message.includes('Invalid JSON')) {
          console.error('Server returned invalid data');
      } else {
          console.error('Server error:', error.message);
      }
      
      throw error; // Re-throw to allow caller to handle the error
  }
}