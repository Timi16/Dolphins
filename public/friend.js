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

            alert(data.message);
        })
        .catch((error) => {
            console.error('Error processing invite code:', error);
            alert('An error occurred while processing the invite code.');
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
        navigator.clipboard.writeText(inviteLink).then(() => {
            alert('Invite link copied to clipboard!');
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

function displayInvitedFriends() {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    if (!username || !token) {
        alert('Please log in to view invited friends.');
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
            alert('An error occurred while loading invited friends.');
        });
}
