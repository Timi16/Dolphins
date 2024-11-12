window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('inviteCode');

    if (inviteCode) {
        handleInviteCode(inviteCode);
    }

    displayInvitedFriends();

    // Attach event listener to the button
    document.getElementById('invite-link').addEventListener('click', generateInviteLink);
};

function handleInviteCode(inviteCode) {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
        alert('Please log in to use the invite code.');
        return;
    }

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
        })
        .catch((error) => {
            console.error('Error processing invite code:', error);
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

// Helper function for clipboard fallback
function copyToClipboard(text) {
    // Create temporary input element
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
        `;
    }
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function displayInvitedFriends() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referrals/${username}`, {
        method: 'GET',
        headers: {
            'Authorization': token,
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

            friendListContainer.innerHTML = '';
            friendCountContainer.textContent = `${friendCount} friend${friendCount === 1 ? '' : 's'}`;

            friendsList.forEach((friend) => {
                const listItem = document.createElement('li');
                listItem.classList.add('friend-item');
                listItem.innerHTML = `
                    <div class="friend-avatar">${friend.charAt(0)}</div>
                    <div class="friend-info">
                        <div class="friend-name">${friend}</div>
                    </div>
                `;
                friendListContainer.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error('Error fetching invited friends:', error);
        });
}
