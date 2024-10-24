window.onload = function() {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('User not logged in.');
        return;
    }
    // Fetch user data and update score
    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/user/${username}`)
        .then(response => response.json())
        .then(data => {
            if (data.score) {
                const scoreElement = document.getElementById('score-value');
                if (scoreElement) {
                    scoreElement.textContent = data.score;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

    // Check if tasks are completed and update the button states
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    
    // Check the state of each task and update the button accordingly
    updateButtonState('watch-ads-button', completedTasks.watchAds, 'Watched');
    updateButtonState('daily-reward-button', completedTasks.dailyReward, 'Collected');
    updateButtonState('reward-button', completedTasks.tonTransaction, 'Completed');
    updateButtonState('subscribe-mouse-button', completedTasks.subscribeMouse, 'Subscribed');
    updateButtonState('invite-friends-button', completedTasks.inviteFriends, 'Sent');
};

function updateButtonState(buttonId, isCompleted, buttonText) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isCompleted) {
            markAsCompleted(buttonId, buttonText);
        } else {
            // Reset button to initial state if not completed
            button.classList.remove('completed');
            button.textContent = 'Complete Task'; // Set to default text, change as needed
        }
    } else {
        console.warn(`Button with id '${buttonId}' not found`);
    }
}


function markAsCompleted(buttonId, buttonText) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.classList.add('completed');
        button.textContent = buttonText;
    } else {
        console.warn(`Button with id '${buttonId}' not found`);
    }
}

function watchAds() {
    earnReward('watch_ads', 50);
    markAsCompleted('watch-ads-button', 'Watched');
    saveCompletionStatus('watchAds');
}

function getDailyReward() {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('User not logged in.');
        return;
    }

    fetch('http://127.0.0.1:5000/api/rewards/daily-reward', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.newScore) {
            const scoreElement = document.getElementById('score-value');
            if (scoreElement) {
                scoreElement.textContent = data.newScore;
            }
            localStorage.setItem('score', data.newScore);
            markAsCompleted('daily-reward-button', 'Collected');
            saveCompletionStatus('dailyReward');
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function earnReward(task, amount) {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('User not logged in.');
        return;
    }

    fetch('https://dolphins-ai6u.onrender.co/api/rewards/complete-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, task, amount }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.newScore) {
            const scoreElement = document.getElementById('score-value');
            if (scoreElement) {
                scoreElement.textContent = data.newScore;
            }
            localStorage.setItem('score', data.newScore);
            alert(data.message);

            // Mark the task as completed only if the operation was successful
            if (task === 'ton_transaction') {
                markAsCompleted('reward-button', 'Completed');
                saveCompletionStatus('tonTransaction');
            } else if (task === 'subscribe_mouse') {
                markAsCompleted('subscribe-mouse-button', 'Subscribed');
                saveCompletionStatus('subscribeMouse');
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function generateInviteLink() {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('User not logged in.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/generate-invite/${username}`)
    .then(response => response.json())
    .then(data => {
        const inviteLink = data.inviteLink;
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('Invite link copied to clipboard!');
            markAsCompleted('invite-friends-button', 'Sent');  // Mark sender's task as completed
            saveCompletionStatus('inviteFriends'); // Save sender's task completion
        }, (err) => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy invite link. Please try again.');
        });

        if (navigator.share) {
            navigator.share({
                title: 'Invite Link',
                text: 'Join me using this invite link!',
                url: inviteLink
            })
            .then(() => console.log('Invite link shared successfully'))
            .catch(error => console.error('Error sharing invite link:', error));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to generate invite link. Please try again.');
    });
}


function saveCompletionStatus(task) {
    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || {};
    completedTasks[task] = true;
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
}

function trackReferral(inviteCode) {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('User not logged in.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referral/${inviteCode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.newScore) {
            const scoreElement = document.getElementById('score-value');
            if (scoreElement) {
                scoreElement.textContent = data.newScore;
            }
            alert(data.message);

            // Here you should not mark any tasks as completed for the receiver.
            // Instead, you can update the score or show a message to the user.
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
function startGame() {
    window.location.href = 'game.html';
}
