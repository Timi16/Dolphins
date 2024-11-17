window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || urlParams.get('inviteCode');

    if (inviteCode) {
        handleInviteCode(inviteCode);
    }

    displayInvitedFriends();
    displayInviteStatistics();

    document.getElementById('invite-link').addEventListener('click', generateInviteLink);

    const refreshButton = document.getElementById('refresh-stats');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            displayInvitedFriends();
            displayInviteStatistics();
            showNotification('Statistics refreshed!');
        });
    }
};

function handleInviteCode(inviteParam) {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
        alert('Please log in to use the invite code.');
        return;
    }

    // Extract the invite code from the URL parameter
    const inviteCode = inviteParam.startsWith('DLPH-') ? inviteParam : inviteParam.split('=')[1];

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referral/${inviteCode}`, {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username }),
    })
    .then(async (response) => {
        const text = await response.text();
        console.log('Raw response:', text);
        const data = JSON.parse(text);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to process invite code');
        }
        showNotification(data.message || 'Invite code processed successfully!');
        // Refresh stats after successful invite
        displayInvitedFriends();
        displayInviteStatistics();
    })
    .catch((error) => {
        console.error('Error processing invite code:', error);
        showNotification('Error: ' + error.message);
    });
}


function checkUserLoggedIn() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    
    if (!username || !token) {
        window.location.href = 'index.html';
        return false;
    }
    return { username, token };
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
        
        // Create share data
        const shareData = {
            title: 'Join Dolphins',
            text: 'Hey! Join me on Dolphins using my invite link!',
            url: inviteLink
        };

        // Try native sharing first
        if (navigator.share) {
            navigator.share(shareData)
                .then(() => {
                    showNotification('Thanks for sharing!');
                })
                .catch(error => {
                    // If share fails, fallback to clipboard
                    copyToClipboard(inviteLink);
                });
        } else {
            // Fallback to clipboard on devices without share capability
            copyToClipboard(inviteLink);
        }
    })
    .catch(error => {
        console.error('Error generating invite link:', error);
        showNotification('Failed to generate invite link');
    });
}

function copyToClipboard(text) {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!');
    } catch (err) {
        showNotification('Failed to copy link');
    }
    
    document.body.removeChild(input);
}

function showNotification(message) {
    let notification = document.getElementById('share-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'share-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
    }
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function displayInvitedFriends() {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referrals/${user.username}`, {
        method: 'GET',
        headers: {
            'Authorization': user.token,
            'Content-Type': 'application/json'
        }
    })
    .then(async (response) => {
        const text = await response.text();
        console.log('Raw response:', text);
        const data = JSON.parse(text);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch invited friends');
        }

        const friendsList = data.referredUsers || [];
        const friendCount = friendsList.length;
        const friendListContainer = document.getElementById('invited-friends-list');
        const friendCountContainer = document.querySelector('.friend-count');

        if (friendCountContainer) {
            friendCountContainer.textContent = `${friendCount} friend${friendCount === 1 ? '' : 's'}`;
        }

        if (friendListContainer) {
            friendListContainer.innerHTML = '';
            
            if (friendsList.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-friends-message';
                emptyMessage.textContent = 'No friends invited yet. Share your invite link to get started!';
                friendListContainer.appendChild(emptyMessage);
            } else {
                friendsList.forEach((friend) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('friend-item');
                    listItem.innerHTML = `
                        <div class="friend-avatar">${friend.charAt(0).toUpperCase()}</div>
                        <div class="friend-info">
                            <div class="friend-name">${friend}</div>
                            <div class="friend-status">Joined</div>
                        </div>
                    `;
                    friendListContainer.appendChild(listItem);
                });
            }
        }
    })
    .catch((error) => {
        console.error('Error fetching invited friends:', error);
        showNotification('Error loading friends list');
    });
}

function displayInviteStatistics() {
    const user = checkUserLoggedIn();
    if (!user) return;

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/invite-stats/${user.username}`, {
        method: 'GET',
        headers: {
            'Authorization': user.token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(stats => {
        const statsContainer = document.getElementById('invite-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stats-box">
                    <h3>Your Invite Statistics</h3>
                    <div class="stat-item">
                        <span class="stat-label">Total Referrals:</span>
                        <span class="stat-value">${stats.referralsCount || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Invite Code Uses:</span>
                        <span class="stat-value">${stats.usageCount || 0}</span>
                    </div>
                    ${stats.lastUsed ? `
                    <div class="stat-item">
                        <span class="stat-label">Last Used:</span>
                        <span class="stat-value">${new Date(stats.lastUsed).toLocaleDateString()}</span>
                    </div>
                    ` : ''}
                    <div class="stat-progress">
                        <div class="progress-label">Progress to next bonus</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(stats.referralsCount % 5) * 20}%"></div>
                        </div>
                        <div class="progress-text">${stats.referralsCount % 5}/5 referrals</div>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error fetching invite statistics:', error);
        showNotification('Error loading statistics');
    });
}

// Add CSS styles
const styles = `
    .stats-box {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
    }

    .stat-label {
        color: #666;
        font-weight: 500;
    }

    .stat-value {
        color: #007bff;
        font-weight: 600;
    }

    .friend-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
        transition: background-color 0.3s;
    }

    .friend-avatar {
        width: 40px;
        height: 40px;
        background: #007bff;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        font-weight: bold;
    }

    .friend-info {
        flex: 1;
    }

    .friend-name {
        font-weight: 500;
    }

    .friend-status {
        font-size: 0.8em;
        color: #28a745;
    }

    .empty-friends-message {
        text-align: center;
        padding: 20px;
        color: #666;
    }

    .progress-bar {
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        margin: 8px 0;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #007bff;
        transition: width 0.3s ease;
    }

    .progress-label {
        font-size: 0.9em;
        color: #666;
        margin-top: 10px;
    }

    .progress-text {
        font-size: 0.8em;
        color: #666;
        text-align: right;
    }

    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
