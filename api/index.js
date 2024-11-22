const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const path = require('path');

const wss = new WebSocket.Server({ server });

let pixels = {};
let players = [];
let currentTurnIndex = 0;

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const { action, data } = JSON.parse(message);

        if (action === 'join') {
            const { id, pseudo } = data;

            if (!players.find((p) => p.id === id)) {
                players.push({ id, pseudo });
            }

            broadcast({ action: 'players', data: players });
            if (players.length === 2) startGame();
        } else if (action === 'draw') {
            pixels[data.id] = data;
            broadcast({ action: 'draw', data });
        } else if (action === 'endTurn') {
            nextTurn();
        }
    });

    ws.on('close', () => {
        players = players.filter((p) => p.ws !== ws);
        broadcast({ action: 'players', data: players });
    });
});

function startGame() {
    currentTurnIndex = 0;
    nextTurn();
}

function nextTurn() {
    if (players.length === 0) return;
    currentTurnIndex = (currentTurnIndex + 1) % players.length;
    const currentPlayer = players[currentTurnIndex];
    broadcast({ action: 'turn', data: currentPlayer.id });

    // End turn automatically after 12 seconds
    setTimeout(nextTurn, 12000);
}

function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 4080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
