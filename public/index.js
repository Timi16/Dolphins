function fetchUserScore(username, token) {
    if (!username || !token) {
        console.error('Missing username or token');
        window.location.href = 'index.html';
        return;
    }

    const apiUrl = `https://dolphins-ai6u.onrender.com/api/rewards/user/${username}`;
    
    console.log(`Fetching score for user: ${username} with token: ${token}`);

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    .then(async response => {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();

        if (!response.ok) {
            console.error('Error response:', data); // Log the error response
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

        console.log('Received data:', data); // Log the data for inspection

        const scoreElement = document.getElementById('score-value');
        if (data.score !== undefined && scoreElement) {
            scoreElement.textContent = data.score;
            console.log(`Score updated successfully: ${data.score}`);
        } else {
            console.error('Score element not found in the DOM or score is undefined');
        }

        // Update other user data if available
        if (data.completedTasks) {
            localStorage.setItem('completedTasks', JSON.stringify(data.completedTasks));
            updateButtonStates(data.completedTasks);
        }
    })
    .catch(error => {
        console.error('Error fetching user score:', error);
        
        if (error.response) {
            console.error('Response data:', error.response.data);
        }

        const errorMessage = getErrorMessage(error.message);
        showErrorNotification(errorMessage);

        // Retry logic
        if (!error.message.includes('Authentication failed')) {
            setTimeout(() => {
                retryFetch(username, token, 3);
            }, 2000);
        }
    });
}

// Helper functions
function getErrorMessage(error) {
    const errorMessages = {
        'Authentication failed': 'Please log in again',
        'User not found': 'User account not found',
        'Server error occurred': 'Server is temporarily unavailable',
        'Server returned non-JSON response': 'Unexpected server response'
    };
    return errorMessages[error] || 'Unable to load user data';
}

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
            'Authorization': `Bearer ${token}`
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
            'Authorization': `Bearer ${token}`
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

