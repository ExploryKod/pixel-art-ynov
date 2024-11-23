const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const path = require('path');

// Serve static files from the "public" directory
app.use(express.static('public'));
const connectedPlayers = new Map();

let pixels = {};

// wss.on('connection', (ws) => {
//     ws.send(JSON.stringify({ action: 'init', data: pixels }));

//     ws.on('message', (message) => {
//         const { action, data, id } = JSON.parse(message);
//         console.log(action, data, id);
//         if (action === 'draw') {
//             pixels[data.id] = data;
//             wss.clients.forEach(client => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(JSON.stringify({ action, data }));
//                 }
//             });
//         }
//     });
// });


// Dans api/index.js, modifiez le code pour ajouter la gestion des déconnexions :



// Fonction pour diffuser la liste des joueurs à tous les clients
function broadcastPlayersList() {
    const playersList = Array.from(connectedPlayers.values()).map(({ player }) => ({
        id: player.id,
        username: player.username
    }));

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                action: 'playersList',
                data: playersList
            }));
            console.log("player", playersList)
        }
    });
}

// Fonction pour vérifier périodiquement les connexions
function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    // Envoyer la liste initiale des joueurs
    ws.send(JSON.stringify({ 
        action: 'playersList', 
        data: Array.from(connectedPlayers.values()).map(({ player }) => player)
    }));

    ws.send(JSON.stringify({ action: 'init', data: pixels }));

    ws.on('message', /**
     * Description placeholder
     *
     * @param {*} message
     */
    (message) => {
        const { action, data, id } = JSON.parse(message);
        
        if (action === 'join') {
            const username = data.username;
            const isUsernameTaken = Array.from(connectedPlayers.values())
                .some(({ player }) => player.username === username);

            if (isUsernameTaken) {
                ws.send(JSON.stringify({
                    action: 'joinResponse',
                    success: false,
                    message: 'Ce pseudo est déjà pris'
                }));
                console.log("connexion", username)
                return;
            }

            const playerId = Date.now().toString();
            const playerData = {
                player: {
                    id: playerId,
                    username: username
                },
                ws: ws
            };
            
            connectedPlayers.set(playerId, playerData);

            ws.send(JSON.stringify({
                action: 'joinResponse',
                success: true,
                playerId: playerId,
                message: 'Connexion réussie!'
            }));
            console.log("connexion réussie", playerId)
            broadcastPlayersList();
        }

        
        if (action === 'draw') {
            pixels[data.id] = data;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action, data }));
                }
            });
        }
    });

    ws.on('close', () => {
        
        for (const [playerId, data] of connectedPlayers.entries()) {
            if (data.ws === ws) {
                connectedPlayers.delete(playerId);
                break;
            }
        }
        broadcastPlayersList();
    });
});

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            for (const [playerId, data] of connectedPlayers.entries()) {
                if (data.ws === ws) {
                    connectedPlayers.delete(playerId);
                    break;
                }
            }
            ws.terminate();
            console.log("player broadcast");
            broadcastPlayersList();
            return;
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}, 30000); 

wss.on('close', () => {
    clearInterval(interval);
});


app.get('/', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, 'public')});
  })

const PORT = process.env.PORT || 4080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

module.exports = server;




