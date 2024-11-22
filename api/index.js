const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let pixels = {}; // Store pixel data
let players = []; // Store connected players
let currentPlayerIndex = 0; // Track current turn
let turnTimeout = null; // Timeout for the current turn

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, '../public')));

// WebSocket connection handler
wss.on('connection', (ws) => {
    let player = null;

    ws.on('message', (message) => {
        const { action, data } = JSON.parse(message);

        if (action === 'join') {
            player = { id: ws._socket.remoteAddress, pseudo: data.pseudo, ws };
            players.push(player);

            // Notify all clients about connected players
            broadcast({ action: 'players', data: players.map(p => p.pseudo) });

            // Start the game if it's the first player
            if (players.length === 1) {
                startNextTurn();
            }
        }

        if (action === 'draw' && isCurrentPlayer(player)) {
            // Save pixel data and broadcast it
            pixels[data.id] = data;
            broadcast({ action: 'draw', data });
        }

        if (action === 'endTurn' && isCurrentPlayer(player)) {
            endTurn();
        }
    });

    ws.on('close', () => {
        // Remove the player on disconnect
        players = players.filter(p => p.id !== player?.id);

        if (player && isCurrentPlayer(player)) {
            endTurn();
        }

        // Notify all clients about the updated player list
        broadcast({ action: 'players', data: players.map(p => p.pseudo) });
    });

    // Send the initial state of the canvas to the new client
    ws.send(JSON.stringify({ action: 'init', data: pixels }));
});

// Helper functions
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

function isCurrentPlayer(player) {
    return players[currentPlayerIndex]?.id === player?.id;
}

function startNextTurn() {
    clearTimeout(turnTimeout);

    if (players.length > 0) {
        const currentPlayer = players[currentPlayerIndex];
        broadcast({ action: 'turn', data: currentPlayer.pseudo });

        turnTimeout = setTimeout(endTurn, 12000); // 2-minute turn
    }
}

function endTurn() {
    clearTimeout(turnTimeout);
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    startNextTurn();
}

// Start the server
const PORT = process.env.PORT || 4080;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
