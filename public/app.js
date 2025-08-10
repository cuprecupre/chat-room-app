document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // --- DOM Elements ---
    const screens = {
        create: document.getElementById('create-screen'),
        join: document.getElementById('join-screen'),
        lobby: document.getElementById('game-lobby'),
        game: document.getElementById('game-screen'),
        gameOver: document.getElementById('game-over-screen'),
    };

    const createGameBtn = document.getElementById('create-game-button');
    const hostNameInput = document.getElementById('host-name-input');
    const joinGameBtn = document.getElementById('join-game-button');
    const playerNameInput = document.getElementById('player-name-input');
    const copyLinkBtn = document.getElementById('copy-link-button');
    const startGameBtn = document.getElementById('start-game-button');
    const endGameBtn = document.getElementById('end-game-button');
    const playAgainBtn = document.getElementById('play-again-button');
    const newGameBtn = document.getElementById('new-game-button');

    const playerList = document.getElementById('player-list');
    const gameIdDisplay = document.getElementById('game-id-display');
    const roleDisplay = document.getElementById('role-display');
    const wordDisplay = document.getElementById('word-display');
    const resultDisplay = document.getElementById('result-display');
    const toast = document.getElementById('toast-notification');

    // --- State ---
    let gameId = '';
    let myId = '';
    let hostId = '';

    // --- Functions ---
    const showScreen = (screenName) => {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
    };

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000); // Hide after 3 seconds
    };

    const updatePlayerList = (players) => {
        playerList.innerHTML = '';
        players.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            playerList.appendChild(li);
        });
    };

    const checkHost = () => {
        if (myId === hostId) {
            startGameBtn.classList.remove('hidden');
            endGameBtn.classList.remove('hidden');
            playAgainBtn.classList.remove('hidden');
            newGameBtn.classList.remove('hidden');
        } else {
            startGameBtn.classList.add('hidden');
            endGameBtn.classList.add('hidden');
            playAgainBtn.classList.add('hidden');
            newGameBtn.classList.add('hidden');
        }
    };

    // --- Initial Setup ---
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdFromUrl = urlParams.get('gameId');

    if (gameIdFromUrl) {
        gameId = gameIdFromUrl;
        showScreen('join');
    } else {
        showScreen('create');
    }

    // --- Event Listeners ---
    createGameBtn.addEventListener('click', () => {
        const name = hostNameInput.value.trim();
        if (name) {
            socket.emit('create-game', { playerName: name });
        }
    });

    joinGameBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim();
        if (name && gameId) {
            socket.emit('join-game', { gameId, playerName: name });
        }
    });

    startGameBtn.addEventListener('click', () => {
        socket.emit('start-game', gameId);
    });

    endGameBtn.addEventListener('click', () => {
        socket.emit('end-game', gameId);
    });

    playAgainBtn.addEventListener('click', () => {
        socket.emit('play-again', gameId);
    });

    newGameBtn.addEventListener('click', () => {
        window.location.href = window.location.origin;
    });

    copyLinkBtn.addEventListener('click', () => {
        const link = `${window.location.origin}/?gameId=${gameId}`;
        navigator.clipboard.writeText(link).then(() => {
            showToast('¡Enlace de invitación copiado!');
        }).catch(err => {
            console.error('Error al copiar el enlace: ', err);
            showToast('Error al copiar el enlace.');
        });
    });

    // --- Socket.IO Handlers ---
    socket.on('game-created', (data) => {
        gameId = data.gameId;
        myId = socket.id;
        hostId = data.hostId;
        window.history.pushState({}, '', `?gameId=${gameId}`);
        gameIdDisplay.textContent = `ID: ${gameId}`;
        showScreen('lobby');
        checkHost();
    });

    socket.on('lobby-joined', (data) => {
        myId = socket.id;
        hostId = data.hostId;
        gameIdDisplay.textContent = `ID: ${gameId}`;
        updatePlayerList(data.players);
        showScreen('lobby');
        checkHost();
    });

    socket.on('playerList', (players) => {
        updatePlayerList(players);
    });

    socket.on('game-started', (data) => {
        roleDisplay.textContent = data.role;
        wordDisplay.textContent = data.word;
        showScreen('game');
        checkHost();
    });

    socket.on('game-over', (data) => {
        resultDisplay.innerHTML = `El impostor era <strong>${data.impostorName}</strong>. <br> La palabra era <strong>${data.secretWord}</strong>.`;
        showScreen('gameOver');
        checkHost();
    });

    socket.on('error-message', (message) => {
        alert(message);
    });
});