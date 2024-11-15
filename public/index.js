function fetchUserScore(username, token) {
    console.log('Fetching score for:', username, 'with token:', token);

    if (!username || !token) {
        showErrorNotification('Missing username or token');
        return Promise.reject(new Error('Missing credentials'));
    }

    return fetch(`https://dolphins-coin.onrender.com/api/rewards/user/${username}`, {
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


function markAsCompleted(button, buttonText) {
    // First add processing state
    button.classList.add('processing');
    button.disabled = true;
    
    // Wait for 30 seconds before showing completion
    setTimeout(() => {
        button.classList.remove('processing');
        button.classList.add('completed');
        button.textContent = buttonText;
        button.disabled = false;
        
        // Save the completion status
        const taskId = button.id;
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
        completedTasks[taskId] = {
            completed: true,
            timestamp: Date.now()
        };
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }, 30000); // 30 seconds
}

function updateButtonState(buttonId, isCompleted, buttonText) {
    const button = document.getElementById(buttonId);
    if (button) {
        // Check localStorage for saved completion status
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
        const taskStatus = completedTasks[buttonId];
        
        if (isCompleted || (taskStatus && taskStatus.completed)) {
            button.classList.add('completed');
            button.textContent = buttonText;
        } else {
            button.classList.remove('completed');
            button.textContent = 'Complete Task';
        }
    } else {
        console.warn(`Button with id '${buttonId}' not found`);
    }
}


function getDailyReward() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    fetch('https://dolphins-coin.onrender.com/api/rewards/daily-reward', {
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
            return
        }
    })
    .catch(error => {
        console.error('Error getting daily reward:', error);
    });
}

function saveButtonState(buttonId, state, text) {
    const buttonStates = JSON.parse(localStorage.getItem('buttonStates')) || {};
    buttonStates[buttonId] = {
        state: state, // 'processing' or 'completed'
        text: text,
        timestamp: Date.now()
    };
    localStorage.setItem('buttonStates', JSON.stringify(buttonStates));
}

function earnReward(task, amount) {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    
    // Get the corresponding button based on the task
    let button;
    let buttonId;
    let completedText;
    
    switch (task) {
        case 'ton_transaction':
            buttonId = 'reward-button';
            completedText = 'Completed';
            break;
        case 'subscribe_mouse':
            buttonId = 'subscribe-mouse-button';
            completedText = 'Subscribed';
            break;
        case 'like-button' :
            buttonId = 'like-button';
            completedText = 'Subscribed';
            break;
    }
    
    button = document.getElementById(buttonId);

    // Start processing state
    if (button) {
        button.classList.add('processing');
        button.disabled = true;
        button.textContent = 'Processing...';
        saveButtonState(buttonId, 'processing', 'Processing...');
    }

    fetch('https://dolphins-coin.onrender.com/api/rewards/complete-task', {
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

            // Set a timeout in localStorage
            const completionTime = Date.now() + 30000; // 30 seconds from now
            localStorage.setItem(`${buttonId}_completionTime`, completionTime);

            setTimeout(() => {
                if (button) {
                    button.classList.remove('processing');
                    button.classList.add('completed');
                    button.disabled = false;
                    button.textContent = completedText;
                    saveButtonState(buttonId, 'completed', completedText);
                }
            }, 30000);
        }
    })
    .catch(error => {
        console.error('Error completing task:', error);
        if (button) {
            button.classList.remove('processing');
            button.disabled = false;
            button.textContent = 'Try Again';
            saveButtonState(buttonId, 'default', 'Try Again');
        }
    });
}

// Function to restore button states on page load or refresh
function initializeButtons() {
    const buttonStates = JSON.parse(localStorage.getItem('buttonStates')) || {};
    
    Object.entries(buttonStates).forEach(([buttonId, data]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            const completionTime = parseInt(localStorage.getItem(`${buttonId}_completionTime`) || '0');
            const currentTime = Date.now();
            
            if (data.state === 'processing' && completionTime > currentTime) {
                // Still in processing state
                button.classList.add('processing');
                button.disabled = true;
                button.textContent = 'Processing...';
                
                // Set remaining timeout
                const remainingTime = completionTime - currentTime;
                setTimeout(() => {
                    button.classList.remove('processing');
                    button.classList.add('completed');
                    button.disabled = false;
                    button.textContent = data.text.replace('Processing...', 'Completed');
                    saveButtonState(buttonId, 'completed', data.text.replace('Processing...', 'Completed'));
                }, remainingTime);
            } else if (data.state === 'completed' || completionTime <= currentTime) {
                // Already completed or processing time finished
                button.classList.remove('processing');
                button.classList.add('completed');
                button.disabled = false;
                button.textContent = data.text.replace('Processing...', 'Completed');
            }
        }
    });
}

// Add event listener for page load
document.addEventListener('DOMContentLoaded', function() {
    initializeButtons();
});

// Add event listener for page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        initializeButtons();
    }
});


function generateInviteLink() {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch(`https://dolphins-coin.onrender.com/api/rewards/generate-invite/${user.username}`, {
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

    fetch(`https://dolphins-coin.onrender.com/api/rewards/referral/${inviteCode}`, {
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
        } else {
            return
        }
    })
    .catch(error => {
        console.error('Error tracking referral:', error);
    });
}

function startGame() {
    window.location.href = 'game.html';
}

function trackReferralStatus(targetReferrals, rewardAmount) {
    const user = checkUserLoggedIn();
    if (!user) return;

    const buttonId = `track-referral-button-${targetReferrals}`;

    fetch(`https://dolphins-coin.onrender.com/api/rewards/referrals/${user.username}`, {
        method: 'GET',
        headers: {
            'Authorization': user.token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.referralsCount >= targetReferrals) {
            // Mark the specific task as completed
            markAsCompleted(document.getElementById(buttonId), 'Done');
            showNotification(`Congratulations! ${targetReferrals} referrals task completed!`);
        } else {
            // Show progress for the specific target
            const remaining = targetReferrals - data.referralsCount;
            const progressMessage = `Progress: ${data.referralsCount}/${targetReferrals} referrals\nInvite ${remaining} more friends to earn ${rewardAmount} points!`;
            showNotification(progressMessage);
        }
    })
    .catch(error => {
        console.error('Error tracking referral status:', error);
        showNotification('Failed to check referral status');
    });
}

function showNotification(message) {
    let notification = document.getElementById('task-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'task-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            white-space: pre-line;
            line-height: 1.4;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = message;

    // Add a progress bar if the message contains progress information
    if (message.includes('Progress:')) {
        const progressData = message.match(/(\d+)\/(\d+)/);
        if (progressData) {
            const [, current, total] = progressData;
            const percentage = (current / total) * 100;
            
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                width: 100%;
                height: 4px;
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                margin-top: 8px;
            `;
            
            const progress = document.createElement('div');
            progress.style.cssText = `
                width: ${percentage}%;
                height: 100%;
                background-color: white;
                border-radius: 2px;
                transition: width 0.3s ease;
            `;
            
            progressBar.appendChild(progress);
            notification.appendChild(progressBar);
        }
    }

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}


function redirectAndEarn(link, task, amount) {
    // Open the link in a new tab
    const newWindow = window.open(`https://${link}`, '_blank');

    // Check if the window was blocked by a popup blocker
    if (newWindow) {
        // Focus on the new tab and wait for confirmation from the user
        newWindow.focus();
        earnReward(task, amount);
        
    }

}
// Add this to your existing index.js file

function initializeDailyRewardTimer() {
    // Create timer elements if they don't exist
    let timerContainer = document.getElementById('daily-reward-timer');
    if (!timerContainer) {
        const dailyRewardButton = document.getElementById('daily-reward-button');
        if (!dailyRewardButton) return;

        timerContainer = document.createElement('div');
        timerContainer.id = 'daily-reward-timer';
        timerContainer.style.cssText = `
            font-family: 'Arial', sans-serif;
            text-align: center;
            margin-top: 10px;
            padding: 10px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;

        // Insert timer container after the daily reward button
        dailyRewardButton.parentNode.insertBefore(timerContainer, dailyRewardButton.nextSibling);
    }

    function updateTimer() {
        const lastClaimTime = localStorage.getItem('lastDailyRewardClaim');
        const now = new Date().getTime();
        
        if (!lastClaimTime || now - parseInt(lastClaimTime) >= 24 * 60 * 60 * 1000) {
            timerContainer.innerHTML = `
                <div style="color: #4CAF50; font-weight: bold;">
                    🎁 Reward Available!
                </div>
            `;
            enableDailyRewardButton();
            return;
        }

        const nextClaimTime = parseInt(lastClaimTime) + (24 * 60 * 60 * 1000);
        const timeLeft = nextClaimTime - now;

        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        timerContainer.innerHTML = `
            <div style="color: #666;">
                <div style="font-size: 0.9em; margin-bottom: 5px;">Next Reward In:</div>
                <div style="font-size: 1.2em; font-weight: bold; color: #2196F3;">
                    ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
                </div>
            </div>
        `;
        disableDailyRewardButton();
    }

    function enableDailyRewardButton() {
        const button = document.getElementById('daily-reward-button');
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
        }
    }

    function disableDailyRewardButton() {
        const button = document.getElementById('daily-reward-button');
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.5';
        }
    }

    // Update the original getDailyReward function to work with the timer
    const originalGetDailyReward = window.getDailyReward;
    window.getDailyReward = function() {
        originalGetDailyReward();
        localStorage.setItem('lastDailyRewardClaim', new Date().getTime().toString());
        updateTimer();
    };

    // Start the timer
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    initializeDailyRewardTimer();
});