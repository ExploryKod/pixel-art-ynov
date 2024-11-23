
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let pageId = crypto.randomUUID(); 

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${protocol}://${window.location.host}`;
const ws = new WebSocket(wsUrl);
const game = document.querySelector("#game");
const form = document.querySelector('#form')
const subText = document.querySelector(".subtext")
let players = getPlayers()
if(game && players.length > 0){
    localStorage.removeItem('players', JSON.stringify(players));
}
form.addEventListener('submit', (event) => {
    event.preventDefault();

    const pseudoInput = document.getElementById('pseudo');
    const pseudo = pseudoInput.value.trim();

    if (!pseudo) {
        return;
    }

    // Register the player in localStorage
    const playerId = Date.now().toString(); // Unique ID for each player
    players.push({ id: playerId, pseudo: pseudo });
    savePlayers(players);
    pseudoInput.value = "";
    players = getPlayers()
    if(players.length > 1 && players.length < 3) {
        // Hide the form and show the game UI
        form.classList.add('hidden');
        game.classList.remove('opacity-50');
        game.classList.remove('pointer-none');
        setInterval(start, 3500);
    }
   
});


function getPlayers() {
    const playersData = localStorage.getItem('players');
    return playersData ? JSON.parse(playersData) : [];
}

function savePlayers(players) {
    localStorage.setItem('players', JSON.stringify(players));
}


function start() {
  game.classList.toggle("on");
  game.classList.toggle("pointer-auto");
  form.classList.toggle("opacity-50");

  if(game.classList.contains("player-2")) {
    game.classList.remove("player-2");
    game.classList.add("player-1");
    game.classList.add('pointer-none');
  } else {
    game.classList.remove("player-1");
    game.classList.add("player-2");
  }
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = `${x},${y}`;
    const isPlayer1 = game.classList.contains("player-1");
 
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

