const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const socket = require('socket.io');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const path = require('path');

const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
      origin: ["http://localhost:4080"]
    }
  });

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  });

app.use(express.static('public'));
const connectedPlayers = new Map();

let pixels = {};

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

function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.send(JSON.stringify({ 
        action: 'playersList', 
        data: Array.from(connectedPlayers.values()).map(({ player }) => player)
    }));

    ws.send(JSON.stringify({ action: 'init', data: pixels }));

    ws.on('message', 
        
    /**
     * Description placeholder
     *
     * @param {*} message
     */
    (message) => {
        console.log("message", message);
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
                console.log("connexion pseudo déjà pris", username)
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
                message: `Bienvenue ${playerData.player.username} ! `
            }));
            console.log("connexion réussie", playerId)
            broadcastPlayersList();
        }

             // Fetch player info
             const player = Array.from(connectedPlayers.values()).find(({ ws }) => ws === ws);
             console.log("player ws", player)
 
         if (!player) {
             console.error('Player not found for drawing action');
             return;
         }
         console.log("state of data ", data)

         const existingPixel = pixels[data.id];
         if (existingPixel) {
            console.log("over pixel");
             wss.clients.forEach(client => {
                 if (client.readyState === WebSocket.OPEN && existingPixel.player.id === client.player.id) {
                     client.send(JSON.stringify({
                         action: 'overwrite',
                         data: { x: data.x, y: data.y, by: data.player }
                     }));
                 }
             });
             console.log(`Overwriting pixel at ${data.id} (x: ${data.x}, y: ${data.y}) by ${data.player}`);
         }



         const drawData = {
            ...data,
            player: { id: player.player.id, username: data.player, color: data.color }
        };
        
        if (action === 'draw') {
            console.log("draw data", drawData)

            // const existingPixel = pixels[data.id];

            // if (existingPixel) {
            //     console.log(`Overwriting pixel at ${data.id} (x: ${data.x}, y: ${data.y}) by ${data.player}`);
            // }

            pixels[data.id] = drawData;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action, data: drawData }));
                }
            });
        }
        console.log(`Pixel placed by ${data.player} with color ${data.color}:`, data);
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
}, 3000); 

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




