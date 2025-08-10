document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Screens
    const homeScreen = document.getElementById('home-screen');
    const joinScreen = document.getElementById('join-screen');
    const gameLobby = document.getElementById('game-lobby');

    // Buttons and Inputs
    const createGameBtn = document.getElementById('createGameBtn');
    const joinGameBtn = document.getElementById('joinGameBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const nameInput = document.getElementById('nameInput');
    const joinNameInput = document.getElementById('joinNameInput');
    const playerList = document.getElementById('player-list');

    let currentGameId = null;

    const urlParams = new URLSearchParams(window.location.search);
    const gameIdFromUrl = urlParams.get('game');

    if (gameIdFromUrl) {
        homeScreen.style.display = 'none';
        joinScreen.style.display = 'block';
        currentGameId = gameIdFromUrl;
    } else {
        homeScreen.style.display = 'block';
        joinScreen.style.display = 'none';
    }

    createGameBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            socket.emit('createGame', { name });
        } else {
            alert('Please enter your name.');
        }
    });

    joinGameBtn.addEventListener('click', () => {
        const name = joinNameInput.value.trim();
        if (name && currentGameId) {
            socket.emit('joinGame', { gameId: currentGameId, name });
        } else {
            alert('Please enter your name.');
        }
    });

    copyLinkBtn.addEventListener('click', () => {
        const link = `${window.location.origin}/?game=${currentGameId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Invite link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    });

    socket.on('gameCreated', (gameId) => {
        currentGameId = gameId;
        homeScreen.style.display = 'none';
        gameLobby.style.display = 'block';
    });

    socket.on('joinSuccess', () => {
        joinScreen.style.display = 'none';
        gameLobby.style.display = 'block';
    });

    socket.on('updatePlayerList', (players) => {
        playerList.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });
    });

    socket.on('joinError', (message) => {
        alert(message);
        window.location.href = '/';
    });
});