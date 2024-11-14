let sowls = parseInt(localStorage.getItem('sowls')) || 0;
let currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
let lastClaimDate = localStorage.getItem('lastClaimDate') || "";

// Array of daily rewards
const dailyRewards = [50, 100, 150, 200, 250, 300, 350, 400, 500];

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

// Function to get today's UTC date in YYYY-MM-DD format
function getCurrentUtcDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Function to claim daily reward
async function claimDailyReward(day) {
    const currentUtcDate = getCurrentUtcDate(); // Get current UTC date

    // Check if the user has already claimed the reward today
    if (currentUtcDate === lastClaimDate) {
        showPopup('You have already claimed today\'s reward!');
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
            // Update score and day based on backend response
            sowls = data.newScore;
            currentDay = data.nextDay;  // Sync with backend's currentDay
            lastClaimDate = currentUtcDate; // Update last claim date to current UTC date

            // Save values to local storage for consistency
            localStorage.setItem('sowls', sowls);
            localStorage.setItem('currentDay', currentDay);
            localStorage.setItem('lastClaimDate', lastClaimDate);
            localStorage.setItem(`day${day}Claimed`, 'true');

            // Show success popup with correct reward amount
            showPopup(`Congratulations! You've claimed ${dailyRewards[day - 1]} Dolphins!`);

            // Update the UI based on the new day
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
    // Fetch current day from local storage to ensure correct day is unlocked
    const storedCurrentDay = parseInt(localStorage.getItem('currentDay')) || 1;

    document.querySelectorAll('.reward-card').forEach((card, index) => {
        const day = index + 1;
        const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';

        card.classList.remove('claimed', 'unlocked', 'locked');
        if (isClaimed) {
            card.classList.add('claimed');
            card.style.cursor = 'default';
        } else if (day === storedCurrentDay) {
            card.classList.add('unlocked');  // Enable claiming only for current day
            card.style.cursor = 'pointer';
        } else {
            card.classList.add('locked');
            card.style.cursor = 'not-allowed';
        }
    });
}

// Event listener for claiming rewards
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

// Add event listeners for popup
document.getElementById('close-popup').addEventListener('click', hidePopup);
document.getElementById('popup-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'popup-overlay') {
        hidePopup();
    }
});

// Initialize the UI
updateUI();