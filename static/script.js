let playerPosition = { x: 400, y: 300 };
let currentFloor = 1;
const maxFloor = 7;
const moveSpeed = 5;
let hasStairs = false; // Track if stairs are available
let canProgress = false; // Track if player can progress to next floor
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

function progressToNextFloor() {
    if (currentFloor < maxFloor) {
        currentFloor++;
        document.getElementById('current-floor').textContent = currentFloor;
        // Increase difficulty with each floor
        const difficultyMultiplier = 1 + (currentFloor * 0.2);
        
        // Update game environment for new floor
        updateGameEnvironment();
        
        // Display floor transition message
        const message = `You've reached Floor ${currentFloor}!`;
        document.getElementById('context-message').textContent = message;
    } else {
        // Player has reached the final floor
        document.getElementById('context-message').textContent = 'You\'ve reached the final floor!';
    }
}

function updateGameEnvironment() {
    // Reset player position for new floor
    playerPosition = { x: 400, y: 300 };
    updatePlayerPosition();
    
    // Generate new floor layout with content
    const gameEnvironment = document.querySelector('.game-environment');
    if (gameEnvironment) {
        // Add monsters
        const monsterCount = Math.min(2 + currentFloor, 5);
        for (let i = 0; i < monsterCount; i++) {
            const monster = document.createElement('div');
            monster.className = 'monster';
            monster.style.left = `${100 + Math.random() * 600}px`;
            monster.style.top = `${100 + Math.random() * 400}px`;
            gameEnvironment.appendChild(monster);
        }

        // Add treasure chest
        const treasure = document.createElement('div');
        treasure.className = 'treasure';
        treasure.style.left = `${200 + Math.random() * 400}px`;
        treasure.style.top = `${150 + Math.random() * 300}px`;
        gameEnvironment.appendChild(treasure);

        // Update objective message
        const contextMessage = document.getElementById('context-message');
        if (contextMessage) {
            contextMessage.textContent = `Floor ${currentFloor}: Defeat ${monsterCount} monsters and collect the treasure!`;
        }
    }
    
    // Update floor display
    document.getElementById('current-floor').textContent = currentFloor;
    
    // Show floor transition message
    const message = `Welcome to Floor ${currentFloor}`;
    const contextMessage = document.getElementById('context-message');
    if (contextMessage) {
        contextMessage.textContent = message;
    }
    
    // Reset floor progression flags
    hasStairs = false;
    canProgress = false;
    
    // Add stairs when player clears the floor
    setTimeout(() => {
        hasStairs = true;
        const stairs = document.createElement('div');
        stairs.className = 'floor-stairs';
        stairs.style.display = 'block';
        document.querySelector('.game-environment').appendChild(stairs);
        
        // Enable progression when player reaches stairs
        stairs.addEventListener('click', () => {
            if (canProgress && currentFloor < maxFloor) {
                progressToNextFloor();
            }
        });
    }, 1000);
}

function unlockFloorProgression() {
    canProgress = true;
    const contextMessage = document.getElementById('context-message');
    if (contextMessage) {
        contextMessage.textContent = 'You can now proceed to the next floor!';
    }
}
