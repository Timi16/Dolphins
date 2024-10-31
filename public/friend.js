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
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while processing the invite code.');
        });
}

function generateInviteLink() {
    const username = localStorage.getItem('username');

    const token = localStorage.getItem('token');
    if (!username || !token) {
        alert('Please log in to use the invite code.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/generate-invite/${username}`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
    })
        .then((response) => response.json())
        .then((data) => {
            const inviteLink = data.inviteLink;

            navigator.clipboard.writeText(inviteLink)
                .then(() => {
                    alert('Invite link copied to clipboard!');
                })
                .catch((err) => {
                    console.error('Could not copy text: ', err);
                    alert('Failed to copy invite link. Please try again.');
                });
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to generate invite link. Please try again.');
        });
}

function displayInvitedFriends() {
    const username = localStorage.getItem('username');

    const token = localStorage.getItem('token');
    if (!username || !token) {
        alert('Please log in to use the invite code.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referrals/${username}`,{
        method: 'GET',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    })
        .then((response) => response.json())
        .then((data) => {
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

