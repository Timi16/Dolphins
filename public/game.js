
  let score = 0;
  let isGameOver = false;
  let isPaused = false;
  let displayedSeconds = 300;
  let actualSeconds = 0;
  let lastTime = performance.now();
  let lastBallColor = null;
  let consecutiveSameColor = 0;
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
    const width = window.innerWidth;
    if (width < 768) return 1000;
    if (width < 1024) return 800;
    return 600;
  }

  function getRandomVelocity() {
    return {
      x: (Math.random() - 0.5) * 2,
      y: Math.random() * 2 + 1
    };
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

  function gameLoop(currentTime) {
    if (!isGameOver && !isPaused) {
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= getBallSpawnRate()) {
        createBall();
        lastTime = currentTime;
      }
      
      updateBallPositions();
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
    try {
        const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/update-game-score', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username,
                gameScore
            }),
        });

        const data = await response.json();
        if (data.newScore) {
            localStorage.setItem('score', data.newScore);
        }
    } catch (error) {
        console.error('Error saving game score:', error);
    }
}
