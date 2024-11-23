const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the "public" directory
app.use(express.static('public'));

let pixels = {};

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ action: 'init', data: pixels }));

    ws.on('message', (message) => {
        const { action, data, id } = JSON.parse(message);
        console.log(action, data, id);
        if (action === 'draw') {
            pixels[data.id] = data;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action, data }));
                }
            });
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, 'public')});
  })

const PORT = process.env.PORT || 4080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

module.exports = server;
