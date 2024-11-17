// Initialize variables from local storage or set default values
let sowls = parseInt(localStorage.getItem('sowls')) || 0;
let currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
let lastClaimDate = localStorage.getItem('lastClaimDate') || "";
const dailyRewards = [50, 100, 150, 200, 250, 300, 350, 400, 500];

// Function to show a popup message
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
    try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        // Send request to backend to claim daily reward
        const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (response.ok) {
            sowls = data.newScore;
            currentDay = data.nextDay;

            localStorage.setItem('sowls', sowls);
            localStorage.setItem('currentDay', currentDay);

            showPopup(`Congratulations! You've claimed ${dailyRewards[day - 1]} Dolphins!`);
            updateUI();
        } else {
            // Display backend message if claiming is too soon
            showPopup(data.message || 'Error claiming daily reward.');
        }
    } catch (error) {
        console.error('Error:', error);
        showPopup('Failed to claim daily reward. Please try again later.');
    }
}


// Function to update the UI based on the current day
function updateUI() {
    const storedCurrentDay = parseInt(localStorage.getItem('currentDay')) || 1;

    document.querySelectorAll('.reward-card').forEach((card, index) => {
        const day = index + 1;
        const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';

        card.classList.remove('claimed', 'unlocked', 'locked');
        if (isClaimed) {
            card.classList.add('claimed');
            card.style.cursor = 'default';
        } else if (day === storedCurrentDay) {
            card.classList.add('unlocked');
            card.style.cursor = 'pointer';
        } else {
            card.classList.add('locked');
            card.style.cursor = 'not-allowed';
        }
    });
}

// Add event listeners for claiming rewards
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

