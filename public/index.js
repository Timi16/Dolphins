// First, improve the token validation in index.js
function checkUserLoggedIn() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    
    if (!username || !token) {
        window.location.href = 'index.html'; // Redirect to login page instead of alert
        return false;
    }
    return { username, token };
}

function fetchUserScore(username, token) {
    // Add proper error handling and token validation
    if (!token || token === 'undefined' || token === 'null') {
        console.error('Invalid token detected');
        window.location.href = 'index.html';
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/user/${username}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                window.location.href = 'index.html';
                throw new Error('Authentication failed');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.score !== undefined) {
            const scoreElement = document.getElementById('score-value');
            if (scoreElement) {
                scoreElement.textContent = data.score;
            }
        } else {
            console.warn('Score data not found in response');
        }
    })
    .catch(error => {
        console.error('Error fetching user score:', error);
        if (error.message !== 'Authentication failed') {
            // Only show alert if it's not an auth error (since we're already redirecting)
            alert('Error loading user data. Please try refreshing the page.');
        }
    });
}

// Update the window.onload function to handle errors better
window.onload = function() {
    const userAuth = checkUserLoggedIn();
    if (!userAuth) return; // Will redirect to login if needed

    // Fetch user data and update score
    fetchUserScore(userAuth.username, userAuth.token);

    // Update task button states
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    updateButtonStates(completedTasks);
};

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
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch('https://dolphins-ai6u.onrender.com/api/rewards/daily-reward', {
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
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch('https://dolphins-ai6u.onrender.com/api/rewards/complete-task', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ username: user.username, task, amount })
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

