window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('inviteCode');

    if (inviteCode) {
        handleInviteCode(inviteCode);
    }

    // Call function to display invited friends on page load
    displayInvitedFriends();
};

function handleInviteCode(inviteCode) {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('Please log in to use the invite code.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referral/${inviteCode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

    if (!username) {
        alert('User not logged in.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/generate-invite/${username}`)
        .then((response) => response.json())
        .then((data) => {
            const inviteLink = data.inviteLink;

            navigator.clipboard.writeText(inviteLink).then(() => {
                alert('Invite link copied to clipboard!');
            }, (err) => {
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

    if (!username) {
        alert('User not logged in.');
        return;
    }

    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/referrals/${username}`)
        .then((response) => response.json())
        .then((data) => {
            const friendsList = data.referredUsers;
            const friendCount = friendsList.length;  // Get the number of referred friends
            const friendListContainer = document.getElementById('invited-friends-list');
            const friendCountContainer = document.querySelector('.friend-count');
            
            friendListContainer.innerHTML = '';

            // Update the friend count display
            friendCountContainer.textContent = `${friendCount} friend${friendCount === 1 ? '' : 's'}`;

            // Render each referred friend in the list
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

