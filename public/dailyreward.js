// Get the initial SOWLS score, current day, and last claim time from local storage or set defaults
let sowls = parseInt(localStorage.getItem('sowls')) || 0;
let currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
let lastClaimTime = parseInt(localStorage.getItem('lastClaimTime')) || Date.now();

// Define a 24-hour period in milliseconds
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Array of daily rewards
const dailyRewards = [500, 1500, 2500, 3500, 5000, 7000, 8000, 9000, 10000];

// Function to display an ad
function showAd() {
  alert("Ad: Watch this ad to claim your reward!");
  // Here, insert the ad integration code if using an ad SDK
}

// Function to claim the daily reward
function claimDailyReward(day) {
  const currentTime = Date.now();

  // Check if the user has already claimed the reward for the day
  if (localStorage.getItem(`day${day}Claimed`) === 'true') {
    alert(`You've already claimed the reward for Day ${day}.`);
    return;
  }

  // Check if 24 hours have passed since the last claim
  if (currentTime - lastClaimTime < ONE_DAY_MS && day > 1) {
    alert("You need to wait 24 hours to claim the next day's reward.");
    return;
  }

  // Show an ad when claiming the reward
  showAd();

  // Add the reward to the SOWLS score
  sowls += dailyRewards[day - 1];
  localStorage.setItem('sowls', sowls);
  document.querySelector('.score').textContent = `${sowls.toLocaleString()} SOWLS`;

  // Mark the day as claimed and update the last claim time
  localStorage.setItem(`day${day}Claimed`, 'true');
  lastClaimTime = currentTime;
  localStorage.setItem('lastClaimTime', lastClaimTime);

  // Move to the next day or reset to Day 1 if at the end of the rewards
  currentDay = day < dailyRewards.length ? day + 1 : 1;
  localStorage.setItem('currentDay', currentDay);

  // Update the UI immediately
  updateUI();
}

// Function to update the UI based on the current day
function updateUI() {
  const currentTime = Date.now();

  // Iterate over each card
  document.querySelectorAll('.card').forEach((card, index) => {
    const day = index + 1;
    const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';
    const claimButton = card.querySelector('.button');

    // Update card status
    if (isClaimed) {
      claimButton.disabled = true;
      claimButton.textContent = 'Claimed';
      claimButton.classList.add('claimed'); // Add green color when claimed
    } else if (day === currentDay) {
      // Enable the claim button if 24 hours have passed or if it's the first claim
      if (currentTime - lastClaimTime >= ONE_DAY_MS || currentDay === 1) {
        claimButton.disabled = false;
        claimButton.textContent = 'Claim';
      } else {
        claimButton.disabled = true;
        claimButton.textContent = 'Unavailable';
      }
    } else {
      claimButton.disabled = true;
      claimButton.textContent = 'Unavailable';
    }
  });
}

// Add click event listeners to the "Claim" buttons
document.querySelectorAll('.button').forEach((button, index) => {
  button.addEventListener('click', () => claimDailyReward(index + 1));
});

// Initialize the UI
updateUI();


