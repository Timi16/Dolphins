window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('inviteCode');

    // First check login status
    const user = checkUserLoggedIn();
    if (!user) return;

    if (inviteCode) {
        handleInviteCode(inviteCode);
    }

    displayInvitedFriends();

    // Add error handling for missing elements
    const inviteButton = document.getElementById('invite-link');
    if (inviteButton) {
        inviteButton.addEventListener('click', generateInviteLink);
    } else {
        console.error('Invite button not found');
    }
};

async function handleInviteCode(inviteCode) {
    const user = checkUserLoggedIn();
    if (!user) return;

    try {
        const response = await fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referral/${inviteCode}`, {
            method: 'POST',
            headers: {
                'Authorization': user.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: user.username }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to process invite code');
        }

        showNotification(data.message || 'Successfully used invite code!');
        // Refresh the friends list after successful referral
        displayInvitedFriends();
    } catch (error) {
        console.error('Error processing invite code:', error);
        showNotification(error.message || 'Failed to process invite code');
    }
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

async function generateInviteLink() {
    const user = checkUserLoggedIn();
    if (!user) return;

    try {
        const response = await fetch(`https://dolphins-ai6u.onrender.com/api/rewards/generate-invite/${user.username}`, {
            method: 'GET',
            headers: {
                'Authorization': user.token,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to generate invite link');
        }

        if (!data.inviteLink) {
            throw new Error('No invite link received from server');
        }

        // Create share data
        const shareData = {
            title: 'Join Dolphins',
            text: 'Hey! Join me on Dolphins using my invite link!',
            url: data.inviteLink
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                showNotification('Thanks for sharing!');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    copyToClipboard(data.inviteLink);
                }
            }
        } else {
            copyToClipboard(data.inviteLink);
        }
    } catch (error) {
        console.error('Error generating invite link:', error);
        showNotification(error.message || 'Failed to generate invite link');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API when available
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Link copied to clipboard!'))
            .catch(() => fallbackCopyToClipboard(text));
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy link');
    } finally {
        document.body.removeChild(input);
    }
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
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Force reflow
    notification.offsetHeight;
    notification.style.opacity = '1';

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2700);
}

async function displayInvitedFriends() {
    const user = checkUserLoggedIn();
    if (!user) return;

    try {
        const response = await fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referrals/${user.username}`, {
            method: 'GET',
            headers: {
                'Authorization': user.token,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch invited friends');
        }

        const friendsList = data.referredUsers || [];
        const friendCount = friendsList.length;
        
        const friendListContainer = document.getElementById('invited-friends-list');
        const friendCountContainer = document.querySelector('.friend-count');

        if (!friendListContainer || !friendCountContainer) {
            throw new Error('Required DOM elements not found');
        }

        friendListContainer.innerHTML = '';
        friendCountContainer.textContent = `${friendCount} friend${friendCount === 1 ? '' : 's'}`;

        friendsList.forEach((friend) => {
            if (typeof friend === 'string' && friend.length > 0) {
                const listItem = document.createElement('li');
                listItem.classList.add('friend-item');
                listItem.innerHTML = `
                    <div class="friend-avatar">${friend.charAt(0).toUpperCase()}</div>
                    <div class="friend-info">
                        <div class="friend-name">${escapeHtml(friend)}</div>
                    </div>
                `;
                friendListContainer.appendChild(listItem);
            }
        });
    } catch (error) {
        console.error('Error fetching invited friends:', error);
        showNotification('Failed to load invited friends');
    }
}

// Helper function to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}