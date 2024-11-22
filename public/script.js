const pseudoForm = document.getElementById('pseudoForm');
const gameUI = document.getElementById('gameUI');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let ws = null;
let isMyTurn = false;
let pseudo = null;

// Handle form submission to collect pseudo
pseudoForm.addEventListener('submit', (event) => {
    event.preventDefault(); 

    const pseudoInput = document.getElementById('pseudo');
    pseudo = pseudoInput.value.trim();

    if (!pseudo) {
        makeToast('Ce champ ne peut être vide');
        return;
    }

    pseudoForm.classList.add('hidden');
    gameUI.classList.remove('hidden');

    initializeWebSocket();
});

function initializeWebSocket() {
    ws = new WebSocket(`ws://${window.location.host}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'join', data: { pseudo } }));
    };

    ws.onmessage = (event) => {
        const { action, data } = JSON.parse(event.data);

        if (action === 'init') {
        
            Object.values(data).forEach(pixel => drawPixel(pixel));
        } else if (action === 'draw') {
          
            drawPixel(data);
        } else if (action === 'turn') {
          
            document.querySelector('h1[x-text="message"]').setAttribute('x-data', `{ message: "Tour de ${data}" }`);
            isMyTurn = (data === pseudo);
            if (isMyTurn)  makeToast('A votre tour !');
        } else if (action === 'players') {
            updatePlayerList(data);
        }
    };

    ws.onclose = () => {
        alert('Connection lost. Refresh the page to reconnect.');
    };
}

// Draw pixel on canvas
function drawPixel({ x, y, color = 'black' }) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 10, 10);
}

// Handle canvas clicks
canvas.addEventListener('click', (event) => {
    if (!isMyTurn) {
        alert('Wait for your turn!');
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / 10) * 10;
    const y = Math.floor((event.clientY - rect.top) / 10) * 10;

    ws.send(JSON.stringify({ action: 'draw', data: { id: `${x},${y}`, x, y, color: 'black' } }));
});

// End turn
document.getElementById('endTurnButton').addEventListener('click', () => {
    if (isMyTurn) {
        ws.send(JSON.stringify({ action: 'endTurn' }));
        isMyTurn = false;
    } else {
        makeToast('C\'est toujours votre tour');
    }
});

// Update player list
function updatePlayerList(players) {
    const list = document.getElementById('playerList');
    list.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player;
        list.appendChild(li);
    });
}

function makeToast(message) {
    Toastify({
        text: message ? message : "",
        duration: 3000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "center", 
        position: "center", 
        stopOnFocus: true, 
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        onClick: function(){} 
      }).showToast();
}