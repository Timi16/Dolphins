// First, improve the token validation in index.js
function fetchUserScore(username, token) {
    if (!username || !token) {
        console.error('Missing username or token');
        window.location.href = 'index.html';
        return;
    }

    const apiUrl = `https://dolphins-ai6u.onrender.com/api/rewards/user/${encodeURIComponent(username)}`;
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(async response => {
        // First check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        if (!response.ok) {
            // Handle different error status codes
            switch (response.status) {
                case 401:
                case 403:
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.href = 'index.html';
                    throw new Error('Authentication failed');
                case 404:
                    throw new Error('User not found');
                case 500:
                    throw new Error(data.details || 'Server error occurred');
                default:
                    throw new Error(data.message || 'An error occurred');
            }
        }

        return data;
    })
    .then(data => {
        if (data.score !== undefined) {
            const scoreElement = document.getElementById('score-value');
            if (scoreElement) {
                scoreElement.textContent = data.score;
                console.log(`Score updated successfully: ${data.score}`);
            }
            
            // Also update other user data if available
            if (data.completedTasks) {
                localStorage.setItem('completedTasks', JSON.stringify(data.completedTasks));
                updateButtonStates(data.completedTasks);
            }
        }
    })
    .catch(error => {
        console.error('Error fetching user score:', error);
        
        // Show user-friendly error message
        const errorMessage = getErrorMessage(error.message);
        showErrorNotification(errorMessage);
        
        // If it's not an auth error and the error persists, retry after delay
        if (!error.message.includes('Authentication failed')) {
            setTimeout(() => {
                retryFetch(username, token, 3); // Retry up to 3 times
            }, 2000);
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

// Updated reward-related functions with proper error handling
function getDailyReward() {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ username: user.username })
    })
    .then(async response => {
        // Check for JSON response
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        if (!response.ok) {
            switch (response.status) {
                case 401:
                case 403:
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.href = 'index.html';
                    throw new Error('Authentication failed');
                case 404:
                    throw new Error('User not found');
                case 400:
                    throw new Error(data.message || 'Daily reward already collected');
                case 500:
                    throw new Error(data.details || 'Server error occurred');
                default:
                    throw new Error(data.message || 'An error occurred');
            }
        }
        return data;
    })
    .then(data => {
        if (data.newScore) {
            document.getElementById('score-value').textContent = data.newScore;
            localStorage.setItem('score', data.newScore);
            markAsCompleted(document.getElementById('daily-reward-button'), 'Collected');
            saveCompletionStatus('dailyReward');
            showSuccessNotification('Daily reward collected successfully!');
        }
    })
    .catch(error => {
        console.error('Error getting daily reward:', error);
        showErrorNotification(getErrorMessage(error.message));
        
        if (!error.message.includes('Authentication failed') && 
            !error.message.includes('Daily reward already collected')) {
            setTimeout(() => {
                retryRewardFetch('daily-reward', user.username, user.token, 3);
            }, 2000);
        }
    });
}

function earnReward(task, amount) {
    const user = checkUserLoggedIn();
    if (!user) return;

    if (!task || amount === undefined) {
        showErrorNotification('Invalid task parameters');
        return;
    }

    fetch('https://dolphins-ai6u.onrender.com/api/rewards/complete-task', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            username: user.username, 
            task, 
            amount 
        })
    })
    .then(async response => {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        if (!response.ok) {
            switch (response.status) {
                case 401:
                case 403:
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.href = 'index.html';
                    throw new Error('Authentication failed');
                case 404:
                    throw new Error('User not found');
                case 400:
                    throw new Error(data.message || 'Task already completed');
                case 500:
                    throw new Error(data.details || 'Server error occurred');
                default:
                    throw new Error(data.message || 'An error occurred');
            }
        }
        return data;
    })
    .then(data => {
        if (data.newScore) {
            document.getElementById('score-value').textContent = data.newScore;
            localStorage.setItem('score', data.newScore);
            
            // Mark the task as completed based on task type
            switch (task) {
                case 'ton_transaction':
                    markAsCompleted(document.getElementById('reward-button'), 'Completed');
                    saveCompletionStatus('tonTransaction');
                    break;
                case 'subscribe_mouse':
                    markAsCompleted(document.getElementById('subscribe-mouse-button'), 'Subscribed');
                    saveCompletionStatus('subscribeMouse');
                    break;
                // Add other task types as needed
            }
            
            showSuccessNotification(data.message || 'Task completed successfully!');
        }
    })
    .catch(error => {
        console.error('Error completing task:', error);
        showErrorNotification(getErrorMessage(error.message));
        
        if (!error.message.includes('Authentication failed') && 
            !error.message.includes('Task already completed')) {
            setTimeout(() => {
                retryRewardFetch('complete-task', user.username, user.token, 3, { task, amount });
            }, 2000);
        }
    });
}

// Helper function for retrying reward-related fetches
function retryRewardFetch(endpoint, username, token, maxRetries, additionalData = null, currentRetry = 1) {
    if (currentRetry > maxRetries) {
        showErrorNotification('Unable to connect to server after multiple attempts');
        return;
    }

    console.log(`Retry attempt ${currentRetry} of ${maxRetries}`);
    
    switch (endpoint) {
        case 'daily-reward':
            getDailyReward();
            break;
        case 'complete-task':
            if (additionalData) {
                earnReward(additionalData.task, additionalData.amount);
            }
            break;
    }
}

// Add success notification function
function showSuccessNotification(message) {
    let notification = document.getElementById('success-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'success-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Update error messages map
function getErrorMessage(error) {
    const errorMessages = {
        'Authentication failed': 'Please log in again',
        'User not found': 'User account not found',
        'Server error occurred': 'Server is temporarily unavailable',
        'Server returned non-JSON response': 'Unexpected server response',
        'Daily reward already collected': 'You have already collected today\'s reward',
        'Task already completed': 'You have already completed this task'
    };
    return errorMessages[error] || 'Unable to process request';
}

function generateInviteLink() {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/generate-invite/${user.username}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.token}`
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
            'Authorization': `Bearer ${user.token}`
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

