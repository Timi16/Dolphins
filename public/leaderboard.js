// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Fetch the user data and leaderboard from the API
window.onload = function() {
    const username = localStorage.getItem('username');

    if (!username) {
        alert('User not logged in.');
        return;
    }

    // Fetch user data for the highlighted section
    fetch(`https://dolphins-ai6u.onrender.com/api/rewards/user/${username}`)
    .then(response => response.json())
    .then(data => {
        if (data.username && data.score) {
            // Set username and score
            document.getElementById('displayUsername').textContent = data.username;
            document.getElementById('displayScore').textContent = `${data.score} Dolphins`;

            // Display first two letters of the username in the avatar
            const avatarText = data.username.slice(0, 2).toUpperCase();
            document.getElementById('userAvatar').textContent = avatarText;

            // Set random background color for the avatar
            document.getElementById('userAvatar').style.backgroundColor = getRandomColor();
        } else {
            alert('Error fetching user data');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });

    // Fetch the leaderboard data
    fetch('https://dolphins-ai6u.onrender.com/api/rewards/leaderboard')
    .then(response => response.json())
    .then(data => {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';  // Clear existing content

        // Iterate through leaderboard data and add each user
        data.forEach(user => {
            const listItem = document.createElement('li');
            listItem.classList.add('leaderboard-item');
            listItem.innerHTML = `
                <div class="medal">${user.rank}</div>
                <div class="user-avatar" style="background-color: ${getRandomColor()}">${user.username.slice(0, 2).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-score">${user.score.toLocaleString()} Dolphins</div>
                </div>
            `;
            leaderboardList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error fetching leaderboard data:', error);
    });
     // Fetch the holders count
    fetch('https://dolphins-ai6u.onrender.com/api/rewards/holdersCount') // Update this URL according to your API
    .then(response => response.json())
    .then(data => {
        document.getElementById('holdersCount').textContent = `${data.holdersCount.toLocaleString()} holders`;
    })
    .catch(error => {
        console.error('Error fetching holders count:', error);
        document.getElementById('holdersCount').textContent = 'Error fetching holders count';
    });
};

