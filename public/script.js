
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
const gameSection = document.getElementById('game');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = pseudoInput.value.trim();
    
    if (username) {

        ws.send(JSON.stringify({
            action: 'join',
            data: { username }
        }));
    }
});

// ws.onmessage = (event) => {
//     try {
//         const { action, data } = JSON.parse(event.data);
        // if (action === 'draw') {
        //     // Draw a single pixel
        //     ctx.fillStyle = data.color;
        //     ctx.fillRect(data.x, data.y, 10, 10);
        // } else if (action === 'init') {
        //     // Initialize the canvas with existing pixels
        //     Object.values(data).forEach(p => {
        //         ctx.fillStyle = p.color;
        //         ctx.fillRect(p.x, p.y, 10, 10);
        //     });
        // }
//     } catch (error) {
//         console.error('Error processing WebSocket message:', error);
//     }
// };
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
                ctx.fillStyle = response.data.color;
                ctx.fillRect(response.data.x, response.data.y, 10, 10);
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

// Gérer la réponse de connexion
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

        gameSection.classList.remove('play');
   
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

// Mettre à jour la liste des joueurs (à implémenter selon vos besoins)
function updatePlayersList(players) {
    console.log('Joueurs connectés:', players);

    const playerTemplate = document.querySelector('#player-template');
    playerTemplate.innerHTML = "";

    if (playerTemplate && players.length > 0) {
        players.forEach(player => {

            const playerElement = document.createElement('span');
            playerElement.classList.add('player-name', 'text-sm', 'font-medium', 'my-2', 'rounded-full', 'bg-gray-100', 'py-2', 'px-3');
            

            playerElement.textContent = player.username;

            playerTemplate.append(playerElement);
        });
    }
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = `${x},${y}`;
    const isPlayer1 = game.classList.contains("player-1");
 
    const pixelData = { 
        action: 'draw', 
        data: { id, x, y, color: isPlayer1 ? 'red' : 'black'}, 
        id: pageId 
    };

    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(pixelData));
    } else {
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
