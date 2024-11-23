


const game = document.querySelector("#game");
const form = document.querySelector('#form')

form.addEventListener('submit', (event) => {
    event.preventDefault();

    const pseudoInput = document.getElementById('pseudo');
    const pseudo = pseudoInput.value.trim();

    if (!pseudo) {
        makeToast2('Please enter a valid pseudo!');
        return;
    }

    // Register the player in localStorage
    let players = getPlayers();
    const playerId = Date.now().toString(); // Unique ID for each player
    players.push({ id: playerId, pseudo: pseudo });
    savePlayers(players);

    if(players.length > 1) {
        // Hide the form and show the game UI
        form.classList.add('hidden');
        game.classList.remove('hidden');
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
  form.classList.toggle("opacity-50");
  if(game.classList.contains("player-2")) {
    game.classList.remove("player-2");
    game.classList.add("player-1");
  } else {
    game.classList.remove("player-1");
    game.classList.add("player-2");
  }
}

