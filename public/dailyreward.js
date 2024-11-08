// Get the initial SOWLS score, current day, and last claim time from local storage or set defaults
let sowls = parseInt(localStorage.getItem('sowls')) || 0;
let currentDay = parseInt(localStorage.getItem('currentDay')) || 1;

// Array of daily rewards (for UI purposes only)
const dailyRewards = [500, 1500, 2500, 3500, 5000, 7000, 8000, 9000, 10000];

// Function to claim the daily reward through the API
async function claimDailyReward(day) {
  try {
    // Show an ad before claiming the reward (optional)
    showAd();
    const token = localStorage.getItem('token');
    // Make a POST request to the /daily-reward endpoint
    const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token // Assuming the token is stored in localStorage
      },
      body: JSON.stringify({ username: localStorage.getItem('username') })
    });

    const data = await response.json();

    // Check if the reward was successfully claimed
    if (response.ok) {
      // Update the sowls score and display it in the UI
      sowls = data.newScore;
      document.querySelector('.score').textContent = `${sowls.toLocaleString()} Dolphins`;

      // Update the current day and save it to localStorage
      currentDay = data.nextDay;
      localStorage.setItem('currentDay', currentDay);

      // Mark the day as claimed in local storage
      localStorage.setItem(`day${day}Claimed`, 'true');

      // Update the UI to reflect the claimed reward
      updateUI();
    } else {
      alert(data.message || 'Error claiming daily reward.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to claim daily reward. Please try again later.');
  }
}

// Function to update the UI based on the current day
function updateUI() {
  const currentTime = Date.now();

  document.querySelectorAll('.card').forEach((card, index) => {
    const day = index + 1;
    const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';
    const claimButton = card.querySelector('.button');

    // Update card status
    if (isClaimed) {
      claimButton.disabled = true;
      claimButton.textContent = 'Claimed';
      claimButton.classList.add('claimed');
    } else if (day === currentDay) {
      claimButton.disabled = false;
      claimButton.textContent = 'Claim';
    } else {
      claimButton.disabled = true;
      claimButton.textContent = 'Unavailable';
    }
  });
}

// Add click event listeners to "Claim" buttons
document.querySelectorAll('.button').forEach((button, index) => {
  button.addEventListener('click', () => claimDailyReward(index + 1));
});

// Initialize the UI
updateUI();
