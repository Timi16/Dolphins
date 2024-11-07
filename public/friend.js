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
        
        // Create a modal for sharing
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            max-width: 90%;
            width: 320px;
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
        `;

        // Add content to modal
        modal.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #333;">Share Invite Link</h3>
                <input type="text" value="${inviteLink}" readonly style="
                    width: 100%;
                    padding: 8px;
                    margin-bottom: 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    box-sizing: border-box;
                ">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <a href="https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Join me using this invite link!')}" 
                       target="_blank"
                       style="
                        background: #0088cc;
                        color: white;
                        padding: 10px;
                        border-radius: 6px;
                        text-decoration: none;
                        text-align: center;
                    ">
                        Share on Telegram
                    </a>
                    <button onclick="window.open('https://wa.me/?text=${encodeURIComponent('Join me using this invite link! ' + inviteLink)}', '_blank')"
                            style="
                                background: #25D366;
                                color: white;
                                border: none;
                                padding: 10px;
                                border-radius: 6px;
                                cursor: pointer;
                            ">
                        Share on WhatsApp
                    </button>
                </div>
                ${navigator.share ? `
                    <button onclick="shareNatively('${inviteLink}')"
                            style="
                                background: #007bff;
                                color: white;
                                border: none;
                                padding: 10px;
                                border-radius: 6px;
                                cursor: pointer;
                                margin-top: 10px;
                                width: 100%;
                            ">
                        Share with Other Apps
                    </button>
                ` : ''}
                <button onclick="this.parentElement.parentElement.remove(); document.querySelector('.share-overlay').remove()"
                        style="
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 10px;
                            border-radius: 6px;
                            cursor: pointer;
                            margin-top: 10px;
                            width: 100%;
                        ">
                    Close
                </button>
            </div>
        `;

        overlay.classList.add('share-overlay');
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Click outside to close
        overlay.onclick = function() {
            modal.remove();
            overlay.remove();
        };
    })
    .catch(error => {
        console.error('Error generating invite link:', error);
        showNotification('Failed to generate invite link');
    });
}

// Helper function for native sharing
function shareNatively(inviteLink) {
    if (navigator.share) {
        navigator.share({
            title: 'Invite Link',
            text: 'Join me using this invite link!',
            url: inviteLink
        }).catch(err => console.error('Error sharing:', err));
    }
}

// Add this to your existing showNotification function if you haven't already
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
            animation: slideIn 0.5s ease;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = message;

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
