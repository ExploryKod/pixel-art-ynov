const pseudoForm = document.getElementById('pseudoForm');
const gameUI = document.getElementById('gameUI');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const playerList = document.getElementById('playerList');
const endTurnButton = document.getElementById('endTurnButton');
const progressBar = document.getElementById('progressBar');
const countdownText = document.getElementById('countdownText'); // Element for displaying the countdown

let ws = null;
let isMyTurn = false;
let turnTimer = null;
let startTime = null; // Store the start time of the turn

// Store player info in localStorage
function setPlayerInfo(id, pseudo) {
    localStorage.setItem('player', JSON.stringify({ id, pseudo }));
}

// Get player info from localStorage
function getPlayerInfo() {
    const playerData = localStorage.getItem('player');
    return playerData ? JSON.parse(playerData) : null;
}

// Clear player info from localStorage
function clearPlayerInfo() {
    localStorage.removeItem('player');
}

// Initialize WebSocket connection
function initializeWebSocket() {
    ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => {
        const player = getPlayerInfo();
        if (player) {
            ws.send(JSON.stringify({ action: 'join', data: player }));
            makeToast(`Welcome, ${player.pseudo}! You have joined the game.`);
        }
    };

    ws.onmessage = (event) => {
        const { action, data } = JSON.parse(event.data);

        if (action === 'init') {
            // Initialize canvas with existing pixels
            Object.values(data).forEach((pixel) => drawPixel(pixel));
        } else if (action === 'draw') {
            // Draw a new pixel
            drawPixel(data);
        } else if (action === 'turn') {
            // Handle turn
            updateTurnInfo(data);
        } else if (action === 'players') {
            // Update player list
            updatePlayerList(data);
        }
    };

    ws.onclose = () => {
        makeToast('Connection lost. Refresh the page to reconnect.');
        clearPlayerInfo();
        location.reload();
    };
}

// Handle form submission
pseudoForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const pseudoInput = document.getElementById('pseudo');
    const pseudo = pseudoInput.value.trim();

    if (!pseudo) {
        makeToast('Please enter a valid pseudo!');
        return;
    }

    // Store player info locally
    const playerId = Date.now().toString(); // Generate a unique ID for the player
    setPlayerInfo(playerId, pseudo);

    // Hide the form and show the game UI
    pseudoForm.classList.add('hidden');
    gameUI.classList.remove('hidden');

    // Connect to WebSocket
    initializeWebSocket();
});

// Draw a pixel on the canvas
function drawPixel({ x, y, color = 'black' }) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 10, 10);
}

// Update player list
function updatePlayerList(players) {
    playerList.innerHTML = ''; // Clear the list

    players.forEach((player) => {
        const li = document.createElement('li');
        li.textContent = player.pseudo;
        playerList.appendChild(li);
    });
}

// Update turn info
function updateTurnInfo(currentTurnPlayerId) {
    const player = getPlayerInfo();

    if (turnTimer) clearInterval(turnTimer); // Reset any ongoing timers

    if (player && player.id === currentTurnPlayerId) {
        isMyTurn = true;
        makeToast("It's your turn! Start drawing.");
        document.querySelector('h1[x-text="message"]').setAttribute('x-data', `{ message: "It's your turn!" }`);
        startTime = Date.now(); // Start the turn timer
        startTurnTimer();
    } else {
        isMyTurn = false;
        const currentPlayer = currentTurnPlayerId ? `Player ${currentTurnPlayerId}` : 'Waiting for players...';
        makeToast(`It's ${currentPlayer}'s turn.`);
        document.querySelector('h1[x-text="message"]').setAttribute('x-data', `{ message: "It's ${currentPlayer}'s turn" }`);
    }
}

// Handle canvas clicks
canvas.addEventListener('click', (event) => {
    if (!isMyTurn) {
        makeToast('Wait for your turn!');
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / 10) * 10;
    const y = Math.floor((event.clientY - rect.top) / 10) * 10;

    ws.send(JSON.stringify({ action: 'draw', data: { id: `${x},${y}`, x, y, color: 'black' } }));
});

// End turn
endTurnButton.addEventListener('click', () => {
    if (isMyTurn) {
        ws.send(JSON.stringify({ action: 'endTurn' }));
        isMyTurn = false;
        clearInterval(turnTimer); // Stop the timer on turn end
        resetProgressBar();
        makeToast('Your turn has ended.');
    } else {
        makeToast('You cannot end your turn—it’s not your turn!');
    }
});

// Start the turn timer (elapsed time)
function startTurnTimer() {
    let timeElapsed = 0; // Track the elapsed time in seconds
    progressBar.value = 0; // Reset progress bar

    turnTimer = setInterval(() => {
        if (isMyTurn) {
            timeElapsed++;
            progressBar.value = (timeElapsed / 60) * 100; // Update progress bar (max is 60 seconds)
            const minutes = Math.floor(timeElapsed / 60);
            const seconds = timeElapsed % 60;
            countdownText.textContent = `Turn: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; // Display elapsed time
        }
    }, 1000);
}

// Reset the progress bar
function resetProgressBar() {
    progressBar.value = 0;
    countdownText.textContent = 'Turn: 0:00'; // Reset the countdown text
}

// Toastify notifications
function makeToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top", // Position
        position: "right", // Align
        backgroundColor: "#3182CE", // Tailwind blue
        stopOnFocus: true, // Stops timer on hover
    }).showToast();
}
