
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let pageId = crypto.randomUUID(); 

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${protocol}://${window.location.host}`;
const ws = new WebSocket(wsUrl);
const game = document.querySelector("#game");
const form = document.querySelector('#form')
const subText = document.querySelector(".subtext")
const pseudoInput = document.getElementById('pseudo');
const colorInput = document.getElementById('color');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = pseudoInput.value.trim();
    const color = colorInput.value.trim();

    if(!username) {
        return
    }

    if(!color) {
        return
    }
    
    if (username && color) {

        localStorage.setItem("current-player", username);
        localStorage.setItem("points", 0);
        localStorage.setItem("color", color);

        ws.send(JSON.stringify({
            action: 'join',
            data: { username }
        }));
    }
});


ws.onmessage = (event) => {
    try {
        const response = JSON.parse(event.data);
        
        switch (response.action) {
            case 'joinResponse':
                handleJoinResponse(response);
                break;
            case 'playersList':
                updatePlayersList(response.data);
                break;
            case 'draw':
                // Un seul pixel est dessiné
                const { x, y, color, player } = response.data;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 10, 10);
                console.log("data on placement", response.data)
                console.log(`Pixel placed by ${player.username} at (${x}, ${y}) with color ${player.color}`);
                
                Toastify({
                    text: `Pixel placed by ${player.username} at ${x}, ${y}`,
                    duration: 3000,
                    gravity: "top",
                    position: 'right',
                    style: {
                        background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                    }
                }).showToast();

            case 'init':
                // (Re)initialise le plateau de jeu
                Object.values(response.data).forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, 10, 10);
                });
        }
    } catch (error) {
        console.error('Erreur dans la gestion du message websocket:', error);
        Toastify({
            text: "Erreur de connexion au jeu",
            duration: 3000,
            gravity: "top",
            position: 'right',
            style: {
                background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }
        }).showToast();
    }
};

function handleJoinResponse(response) {
    if (response.success) {

        Toastify({
            text: response.message,
            duration: 3000,
            gravity: "top",
            position: 'right',
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
            }
        }).showToast();

        game.classList.remove('play');
   
        form.style.display = 'none';
  
        localStorage.setItem('playerId', response.playerId);
    } else {

        Toastify({
            text: response.message,
            duration: 3000,
            gravity: "top",
            position: 'right',
            style: {
                background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }
        }).showToast();
    }
}

function updatePlayersList(players) {
    console.log('Joueurs connectés:', players);

    const playerTemplate = document.querySelector('#player-template');
    const playerTitle = document.querySelector('.player-title');
    playerTemplate.innerHTML = "";

    if (playerTemplate && players.length > 0) {
        
        playerTitle.classList.remove("hidden");

        players.forEach((player, index) => {

            if(index < 4) {
                const playerElement = document.createElement('span');
                playerElement.classList.add('player-name', 'text-sm', 'font-medium', 'my-2', 'rounded-full', 'bg-gray-100', 'py-2', 'px-3');
                playerElement.textContent = player.username;
                playerTemplate.append(playerElement);
            }
            
        });

        if(players.length > 2 && players.length < 4) {
            Toastify({
                text: "Minimum de joueur atteint: Une partie peut commencer !",
                duration: 3000,
                gravity: "top",
                position: 'right',
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                }
            }).showToast();
        }

        if(players.length === 3) {
            Toastify({
                text: "Maximum de 3 joueurs atteint, la partie commence !",
                duration: 3000,
                gravity: "top",
                position: 'center',
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                }
            }).showToast();
            game.classList.add('play');
            form.style.display = 'none';
        }
    }
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = `${x},${y}`;
    const currentPlayer = localStorage.getItem("current-player");
    const points = localStorage.getItem("points");
    const color = localStorage.getItem("color");
    const pixelData = { 
        action: 'draw', 
        data: { id, x, y, color: 'green', player: currentPlayer, points: points, color: color}, 
        id: pageId 
    };

    if (ws.readyState === WebSocket.OPEN) {
        console.log("send pixel data", pixelData);
        ws.send(JSON.stringify(pixelData));
    } else {
        Toastify({
            text: "Le jeu n'est pas ouvert, erreur de connexion.",
            duration: 3000,
            gravity: "top",
            position: 'right',
            style: {
                background: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }
        }).showToast();
        console.error('WebSocket is not open:', ws.readyState);
    }
});

ws.onclose = (event) => {
    console.log('WebSocket is closed:', event.reason);
    Toastify({
        text: "Fin de la connexion au jeu",
        duration: 3000,
        gravity: "top",
        position: 'right',
        style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }
    }).showToast();
};

ws.onerror = (error) => {
    console.error('WebSocket encountered an error:', error);
    Toastify({
        text: "Erreur de connexion au jeu",
        duration: 3000,
        gravity: "top",
        position: 'right',
        style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }
    }).showToast();
};
