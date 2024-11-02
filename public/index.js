function fetchUserScore(username, token) {
    console.log('Fetching score for:', username, 'with token:', token);

    if (!username || !token) {
        showErrorNotification('Missing username or token');
        return Promise.reject(new Error('Missing credentials'));
    }

    return fetch(`https://dolphins-ai6u.onrender.com/api/rewards/user/${username}`, {
        method: 'GET',
        headers: {
            // Send the token directly since we're using a simple token system
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    })
    .then(async response => {
        const text = await response.text();
        console.log('Raw response:', text);

        try {
            const data = JSON.parse(text);
            
            if (!response.ok) {
                throw new Error(data.message || 'Server error');
            }

            if (data.success === false) {
                throw new Error(data.message || 'Operation failed');
            }

            // Update the score if available
            const scoreElement = document.getElementById('score-value');
            if (scoreElement && data.data && data.data.score !== undefined) {
                scoreElement.textContent = data.data.score;
                console.log('Updated score:', data.data.score);
            }

            return data.data;
        } catch (e) {
            console.error('Parse error:', e);
            throw new Error('Failed to parse server response');
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        showErrorNotification(error.message || 'Failed to load user data');
        throw error;
    });
}

// Updated error message handler
function getErrorMessage(error) {
    const errorMessages = {
        'Authentication failed': 'Please log in again',
        'User not found': 'User account not found',
        'Internal server error': 'Server is temporarily unavailable',
        'Missing credentials': 'Please log in to continue',
        'Server error': 'Unable to connect to server'
    };
    return errorMessages[error] || 'Unable to load user data';
}

// Update the event listener to use the new retry mechanism
document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (username && token) {
        retryFetch(username, token, 3)
            .catch(error => {
                console.error('All retry attempts failed:', error);
                showErrorNotification('Failed to load user data after multiple attempts');
            });
    }
});
function showErrorNotification(message) {
    // Create or update error notification element
    let notification = document.getElementById('error-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function retryFetch(username, token, maxRetries, currentRetry = 1) {
    if (currentRetry > maxRetries) {
        showErrorNotification('Unable to connect to server after multiple attempts');
        return;
    }

    console.log(`Retry attempt ${currentRetry} of ${maxRetries}`);
    fetchUserScore(username, token)
        .catch(() => {
            if (currentRetry < maxRetries) {
                setTimeout(() => {
                    retryFetch(username, token, maxRetries, currentRetry + 1);
                }, 2000 * currentRetry); // Exponential backoff
            }
        });
}
function checkUserLoggedIn() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    
    if (!username || !token) {
        window.location.href = 'index.html'; // Redirect to login page instead of alert
        return false;
    }
    return { username, token };
}


function updateButtonStates(completedTasks) {
    updateButtonState('watch-ads-button', completedTasks.watchAds, 'Watched');
    updateButtonState('daily-reward-button', completedTasks.dailyReward, 'Collected');
    updateButtonState('reward-button', completedTasks.tonTransaction, 'Completed');
    updateButtonState('subscribe-mouse-button', completedTasks.subscribeMouse, 'Subscribed');
    updateButtonState('invite-friends-button', completedTasks.inviteFriends, 'Sent');
}

function updateButtonState(buttonId, isCompleted, buttonText) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isCompleted) {
            markAsCompleted(button, buttonText);
        } else {
            button.classList.remove('completed');
            button.textContent = 'Complete Task';
        }
    } else {
        console.warn(`Button with id '${buttonId}' not found`);
    }
}

function markAsCompleted(button, buttonText) {
    button.classList.add('completed');
    button.textContent = buttonText;
}


function getDailyReward() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username})
    })
    .then(response => response.json())
    .then(data => {
        if (data.newScore) {
            document.getElementById('score-value').textContent = data.newScore;
            localStorage.setItem('score', data.newScore);
            markAsCompleted(document.getElementById('daily-reward-button'), 'Collected');
            saveCompletionStatus('dailyReward');
        } else {
            alert(data.message || 'Failed to get daily reward.');
        }
    })
    .catch(error => {
        console.error('Error getting daily reward:', error);
    });
}

function earnReward(task, amount) {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    fetch('https://dolphins-ai6u.onrender.com/api/rewards/complete-task', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, task, amount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.newScore) {
            document.getElementById('score-value').textContent = data.newScore;
            localStorage.setItem('score', data.newScore);
            alert(data.message || 'Task completed successfully.');

            // Mark the task as completed
            if (task === 'ton_transaction') {
                markAsCompleted(document.getElementById('reward-button'), 'Completed');
                saveCompletionStatus('tonTransaction');
            } else if (task === 'subscribe_mouse') {
                markAsCompleted(document.getElementById('subscribe-mouse-button'), 'Subscribed');
                saveCompletionStatus('subscribeMouse');
            }
        } else {
            alert(data.message || 'Failed to complete task.');
        }
    })
    .catch(error => {
        console.error('Error completing task:', error);
    });
}

function generateInviteLink() {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/generate-invite/${user.username}`, {
        method: 'GET',
        headers: {
            'Authorization': user.token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const inviteLink = data.inviteLink;
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('Invite link copied to clipboard!');
            markAsCompleted(document.getElementById('invite-friends-button'), 'Sent');
            saveCompletionStatus('inviteFriends');
        });

        if (navigator.share) {
            navigator.share({
                title: 'Invite Link',
                text: 'Join me using this invite link!',
                url: inviteLink
            });
        }
    })
    .catch(error => {
        console.error('Error generating invite link:', error);
        alert('Failed to generate invite link.');
    });
}

function saveCompletionStatus(task) {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    completedTasks[task] = true;
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
}

function trackReferral(inviteCode) {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referral/${inviteCode}`, {
        method: 'POST',
        headers: {
            'Authorization': user.token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: user.username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.newScore) {
            document.getElementById('score-value').textContent = data.newScore;
            alert(data.message || 'Referral tracked successfully.');
        } else {
            alert(data.message || 'Failed to track referral.');
        }
    })
    .catch(error => {
        console.error('Error tracking referral:', error);
    });
}

function startGame() {
    window.location.href = 'game.html';
}
const userId = localStorage.setItem("userId"); // Replace with actual user ID logic
const rewardUrl = `https://dolphins-ai6u.onrender.com/api/ads/user/${userId}`;

// Initialize Adsgram Ad Controller
const AdController = window.Adsgram.init({ blockId: "4920" });

// Get the watch ads button
const watchAdsButton = document.getElementById('watch-ads-button');

watchAdsButton.addEventListener('click', () => {
    AdController.show().then((result) => {
        // If the user completes watching the ad, send reward request to backend
        fetch(rewardUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rewardStatus: 'completed' }) // Adjust payload as required
        })
        .then(response => response.json())
        .then(data => {
            alert('Reward granted!');
            console.log('Reward response:', data);
        })
        .catch(error => {
            console.error('Error processing reward:', error);
            alert('There was an error processing the reward.');
        });
    }).catch((result) => {
        // Handle cases where the ad is skipped or an error occurs
        alert('Ad was not completed or an error occurred.');
        console.error('Ad error:', result);
    });
});