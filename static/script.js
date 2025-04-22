let playerPosition = { x: 400, y: 300 };
const moveSpeed = 5;
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Add keyboard event listeners
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

function updateMovement() {
    const player = document.querySelector('.player');
    if (!player) return;

    let dx = 0;
    let dy = 0;

    if (keys.w) dy -= moveSpeed;  // Move up
    if (keys.s) dy += moveSpeed;  // Move down
    if (keys.a) dx -= moveSpeed;  // Move left
    if (keys.d) dx += moveSpeed;  // Move right

    // Allow diagonal movement
    if ((keys.w || keys.s) && (keys.a || keys.d)) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Update position with boundary constraints
    playerPosition.x = Math.max(20, Math.min(760, playerPosition.x + dx));
    playerPosition.y = Math.max(20, Math.min(540, playerPosition.y + dy));

    // Update player position
    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;
}

// Add movement interval
setInterval(updateMovement, 16);

// Start the game
function startGame() {
    const name = document.getElementById('name-input').value;
    if (!name) {
        alert('Please enter a character name');
        return;
    }

    // Create game environment and player
    const gameScreen = document.getElementById('game-screen');
    const environment = document.createElement('div');
    environment.className = 'game-environment';
    gameScreen.innerHTML = ''; // Clear existing content

    // Add the player sprite
    const player = document.createElement('div');
    player.className = 'player';
    environment.appendChild(player);

    // Add the environment to the game screen
    gameScreen.appendChild(environment);

    // Hide character selection, show game screen
    document.getElementById('character-select').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    // Set initial player position
    playerPosition = { x: 400, y: 300 };
    updatePlayerPosition();
}

function updatePlayerPosition() {
    const player = document.querySelector('.player');
    if (!player) return;
    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;
}

// Make selectCharacter function available globally
window.selectCharacter = function(choice) {
    document.getElementById('character-name-input').style.display = 'block';
};

// Make startGame function available globally
window.startGame = startGame;