// Initialize variables
let sowls = parseInt(localStorage.getItem('sowls')) || 0;
let currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
let lastClaimDate = localStorage.getItem('lastClaimDate') || "";

// Array of daily rewards (same as backend)
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

// Function to claim daily reward
async function claimDailyReward(day) {
    try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        // Request daily reward from the backend
        const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            },
            body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (response.ok) {
            // Update local variables with backend data
            sowls = data.newScore;
            currentDay = data.nextDay;

            // Mark reward as claimed in local storage
            localStorage.setItem(`day${day}Claimed`, 'true');

            // Reset UI if last day is reached
            if (currentDay === 1) {
                resetUI();
            }

            // Update local storage
            localStorage.setItem('sowls', sowls);
            localStorage.setItem('currentDay', currentDay);

            // Show success message
            showPopup(`Congratulations! You've claimed ${dailyRewards[day - 1]} Dolphins!`);

            // Refresh the UI
            updateUI();
        } else {
            showPopup(data.message || 'Error claiming daily reward.');
        }
    } catch (error) {
        console.error('Error:', error);
        showPopup('Failed to claim daily reward. Please try again later.');
    }
}

// Function to reset the UI
function resetUI() {
    // Reset current day to 1 in localStorage
    localStorage.setItem('currentDay', 1);

    // Clear claimed statuses from localStorage
    dailyRewards.forEach((_, index) => {
        localStorage.removeItem(`day${index + 1}Claimed`);
    });

    // Clear UI styles for all reward cards
    document.querySelectorAll('.reward-card').forEach((card) => {
        card.classList.remove('claimed', 'unlocked', 'locked');
        card.style.cursor = 'not-allowed'; // Default state
    });

    currentDay = 1; // Reset current day
    updateUI(); // Reinitialize UI
}

// Function to update the UI
function updateUI() {
    const storedCurrentDay = parseInt(localStorage.getItem('currentDay')) || 1;

    document.querySelectorAll('.reward-card').forEach((card, index) => {
        const day = index + 1;
        const isClaimed = localStorage.getItem(`day${day}Claimed`) === 'true';

        // Reset all classes
        card.classList.remove('claimed', 'unlocked', 'locked');

        if (isClaimed) {
            // Add 'claimed' class to visually show the green double check mark
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

    attachEventListeners(); // Ensure event listeners are reattached
}

// Function to attach event listeners to reward cards
function attachEventListeners() {
    document.querySelectorAll('.reward-card').forEach((card, index) => {
        card.replaceWith(card.cloneNode(true));

        const newCard = document.querySelectorAll('.reward-card')[index];
        newCard.addEventListener('click', () => {
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
}

// Add event listeners for popup
document.getElementById('close-popup').addEventListener('click', hidePopup);
document.getElementById('popup-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'popup-overlay') {
        hidePopup();
    }
});

// Initialize the UI
updateUI();



