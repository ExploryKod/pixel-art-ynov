
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let pageId = crypto.randomUUID(); 
console.log("Page ID:", pageId);

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${protocol}://${window.location.host}`;
const ws = new WebSocket(wsUrl);

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = `${x},${y}`;
    const isPlayer1 = game.classList.contains("player-1");
    const isPlayer2 = game.classList.contains("player-2");


    // Prepare pixel data
    const pixelData = { 
        action: 'draw', 
        data: { id, x, y, color: isPlayer1 ? 'red' : 'black'}, 
        id: pageId 
    };

    // Send pixel data if WebSocket is open
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(pixelData));
    } else {
        console.error('WebSocket is not open:', ws.readyState);
    }
});

// Handle incoming WebSocket messages
ws.onmessage = (event) => {
    try {
        const { action, data } = JSON.parse(event.data);
        if (action === 'draw') {
            // Draw a single pixel
            ctx.fillStyle = data.color;
            ctx.fillRect(data.x, data.y, 10, 10);
        } else if (action === 'init') {
            // Initialize the canvas with existing pixels
            Object.values(data).forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 10, 10);
            });
        }
    } catch (error) {
        console.error('Error processing WebSocket message:', error);
    }
};

// Handle WebSocket closure
ws.onclose = (event) => {
    console.log('WebSocket is closed:', event.reason);
};

// Handle WebSocket errors
ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};
