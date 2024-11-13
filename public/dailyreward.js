// Get initial values from local storage or set defaults
let sowls = parseInt(localStorage.getItem('sowls')) || 0;
let currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
let lastClaimTime = parseInt(localStorage.getItem('lastClaimTime')) || 0; // Get last claim time

// Array of daily rewards
const dailyRewards = [500, 1500, 2500, 3500, 5000, 7000, 8000, 9000, 10000];

// Function to show popup message
function showPopup(message) {
    const popup = document.getElementById('popup-overlay');
    const popupMessage = document.getElementById('popup-message');
    popupMessage.textContent = message;
    popup.classList.remove('hidden');
}

// Function to hide popup
function hidePopup() {
    const popup = document.getElementById('popup-overlay');
    popup.classList.add('hidden');
}

// Function to claim the daily reward through the API
async function claimDailyReward(day) {
    const now = Date.now();

    // Check if 24 hours have passed since the last claim
    if (now - lastClaimTime < 24 * 60 * 60 * 1000) {
        showPopup('You can only claim the reward once every 24 hours.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ username: localStorage.getItem('username') })
        });

        const data = await response.json();

        if (response.ok) {
            // Update the sowls score and current day
            sowls = data.newScore;
            currentDay = data.nextDay;
            lastClaimTime = now; // Update last claim time
            
            // Save values to local storage
            localStorage.setItem('sowls', sowls);
            localStorage.setItem('currentDay', currentDay);
            localStorage.setItem('lastClaimTime', lastClaimTime);
            localStorage.setItem(`day${day}Claimed`, 'true');
            
            // Show success popup
            showPopup(`Congratulations! You've claimed ${dailyRewards[day - 1]} Dolphins!`);
            
            // Update the UI
            updateUI();
        } else {
            showPopup(data.message || 'Error claiming daily reward.');
        }
    } catch (error) {
        console.error('Error:', error);
        showPopup('Failed to claim daily reward. Please try again later.');
    }
}

// Function to update the UI based on the current day
function updateUI() {
    document.querySelectorAll('.reward-card').forEach((card, index) => {
        const day = index + 1;
        const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';
        
        // Remove existing classes
        card.classList.remove('claimed', 'unlocked', 'locked');
        
        if (isClaimed) {
            card.classList.add('claimed');
            card.style.cursor = 'default';
        } else if (day === currentDay) {
            card.classList.add('unlocked');
            card.style.cursor = 'pointer';
        } else {
            card.classList.add('locked');
            card.style.cursor = 'not-allowed';
        }
    });
}

// Add click event listeners to reward cards
document.querySelectorAll('.reward-card').forEach((card, index) => {
    card.addEventListener('click', () => {
        const day = index + 1;
        const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';
        
        if (!isClaimed && day === currentDay) {
            claimDailyReward(day);
        } else if (isClaimed) {
            showPopup('You have already claimed this reward!');
        } else if (day !== currentDay) {
            showPopup('This reward is not available yet!');
        }
    });
});

// Add click event listener to close popup
document.getElementById('close-popup').addEventListener('click', hidePopup);
document.getElementById('popup-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'popup-overlay') {
        hidePopup();
    }
});

// Initialize the UI
updateUI();

