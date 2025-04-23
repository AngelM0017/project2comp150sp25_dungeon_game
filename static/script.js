let playerPosition = { x: 400, y: 300 };
let currentFloor = 1;
let monstersDefeated = 0;
const maxFloor = 7;
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

    if (keys.w) dy -= moveSpeed;
    if (keys.s) dy += moveSpeed;
    if (keys.a) dx -= moveSpeed;
    if (keys.d) dx += moveSpeed;

    if ((keys.w || keys.s) && (keys.a || keys.d)) {
        dx *= 0.707;
        dy *= 0.707;
    }

    playerPosition.x = Math.max(20, Math.min(760, playerPosition.x + dx));
    playerPosition.y = Math.max(20, Math.min(540, playerPosition.y + dy));

    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;

    checkCollisions();
}

let playerHealth = 100;
let monsterDamage = 10 + (currentFloor * 3); // Reduced base damage and scaling

function updateHealthDisplay() {
    const healthDisplay = document.createElement('div');
    healthDisplay.className = 'health-display';
    healthDisplay.style.position = 'fixed';
    healthDisplay.style.top = '20px';
    healthDisplay.style.left = '20px';
    healthDisplay.style.color = 'white';
    healthDisplay.style.fontSize = '20px';
    healthDisplay.innerHTML = `Health: ${playerHealth}`;

    const existingDisplay = document.querySelector('.health-display');
    if (existingDisplay) {
        existingDisplay.remove();
    }
    document.body.appendChild(healthDisplay);
}

function checkCollisions() {
    const monsters = document.querySelectorAll('.monster');
    const player = document.querySelector('.player');
    const stairs = document.querySelector('.floor-stairs');
    const requiredMonsters = Math.floor(currentFloor * 1.5);

    // Check for monster collisions first
    monsters.forEach(monster => {
        if (isColliding(player, monster)) {
            // Player takes damage
            playerHealth = Math.max(0, playerHealth - monsterDamage);
            updateHealthDisplay();

            // Show player damage effect
            const damageText = document.createElement('div');
            damageText.className = 'damage-text';
            damageText.style.position = 'absolute';
            damageText.style.color = 'red';
            damageText.style.fontSize = '20px';
            damageText.style.left = `${playerPosition.x}px`;
            damageText.style.top = `${playerPosition.y - 30}px`;
            damageText.innerHTML = `-${monsterDamage}`;
            document.querySelector('.game-environment').appendChild(damageText);

            // Remove monster and show monster damage
            const monsterDamageText = document.createElement('div');
            monsterDamageText.className = 'damage-text';
            monsterDamageText.style.position = 'absolute';
            monsterDamageText.style.color = '#ff0000';
            monsterDamageText.style.fontSize = '20px';
            monsterDamageText.style.left = monster.style.left;
            monsterDamageText.style.top = monster.style.top;
            monsterDamageText.innerHTML = 'Defeated!';
            document.querySelector('.game-environment').appendChild(monsterDamageText);

            // Remove damage texts after animation
            setTimeout(() => {
                damageText.remove();
                monsterDamageText.remove();
            }, 1000);

            // Remove monster
            monster.remove();
            monstersDefeated++;

            // Update counter display
            const counterDisplay = document.querySelector('.counter-display');
            if (counterDisplay) {
                counterDisplay.innerHTML = `Monsters defeated: ${monstersDefeated}/${requiredMonsters} - Defeat at least ${requiredMonsters} monsters to proceed!`;
            }

            // Check if required number of monsters is defeated
            if (monstersDefeated >= requiredMonsters) {
                unlockFloorProgression();
            }

            // Check if player died
            if (playerHealth <= 0) {
                alert('Game Over! You died!');
                location.reload();
            }
        }
    });

    // Check for stairs collision separately
    if (stairs && 
        stairs.style.display === 'block' && 
        monstersDefeated === requiredMonsters && 
        isColliding(player, stairs)) {
        if (currentFloor < maxFloor) {
            currentFloor++;
            playerHealth = 100; // Reset health when entering new floor
            monstersDefeated = 0; // Reset monsters defeated
            updateHealthDisplay();
            document.getElementById('current-floor').textContent = currentFloor;
            initializeGameEnvironment();
        } else {
            alert('Congratulations! You have completed all floors!');
        }
    }
}

function isColliding(element1, element2) {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

setInterval(updateMovement, 16);

function startGame() {
    const name = document.getElementById('name-input').value;
    if (!name) {
        alert('Please enter a character name');
        return;
    }

    document.getElementById('character-select').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    playerHealth = 100;
    updateHealthDisplay();
    initializeGameEnvironment();
}

function initializeGameEnvironment() {
    playerPosition = { x: 400, y: 300 };
    monstersDefeated = 0;
    
    const gameEnvironment = document.querySelector('.game-environment');
    gameEnvironment.innerHTML = '<div class="player"></div>';

    // Add room doors randomly on one wall
    const doorPosition = Math.floor(Math.random() * 4); // 0: north, 1: east, 2: south, 3: west
    const roomDoor = document.createElement('div');
    roomDoor.className = `room-door ${['north', 'east', 'south', 'west'][doorPosition]}`;
    roomDoor.addEventListener('click', () => enterTreasureRoom());
    gameEnvironment.appendChild(roomDoor);

    // Required monsters to defeat (starts at 8, increases by 3 per floor)
    const requiredMonsters = 8 + ((currentFloor - 1) * 3);

    // Create counter display
    const counterDisplay = document.createElement('div');
    counterDisplay.className = 'counter-display';
    counterDisplay.style.position = 'fixed';
    counterDisplay.style.top = '50px';
    counterDisplay.style.left = '20px';
    counterDisplay.style.color = 'white';
    counterDisplay.style.fontSize = '20px';
    counterDisplay.innerHTML = `Defeat exactly ${requiredMonsters} monsters!`;
    document.body.appendChild(counterDisplay);

    // Spawn exactly the required number of monsters for the floor
    const numMonsters = requiredMonsters;

    // Add monsters with increased stats and size per floor
    for(let i = 0; i < numMonsters; i++) {
        const monsterSize = 1 + (currentFloor * 0.15); // Monsters get 15% larger each floor
        const monsterHealth = 100 + (currentFloor * 20); // Health increases by 20 per floor
        const monster = document.createElement('div');
        monster.className = 'monster';
        // Cluster monsters in a smaller area
        monster.style.left = `${300 + Math.random() * 200}px`;
        monster.style.top = `${200 + Math.random() * 200}px`;
        // Make monsters visually larger and darker with each floor
        monster.style.backgroundColor = `hsl(0, 50%, ${Math.max(20, 50 - currentFloor * 5)}%)`;
        monster.style.transform = `scale(${1 + currentFloor * 0.1})`;
        gameEnvironment.appendChild(monster);
    }

    // Add stairs but hide them initially
    const stairs = document.createElement('div');
    stairs.className = 'floor-stairs';
    stairs.style.display = 'none';  // Hide stairs initially
    stairs.style.left = '600px';
    stairs.style.top = '400px';
    gameEnvironment.appendChild(stairs);

    // Add click event to stairs
    stairs.addEventListener('click', () => {
        if (currentFloor < maxFloor) {
            currentFloor++;
            document.getElementById('current-floor').textContent = currentFloor;
            initializeGameEnvironment();
        } else {
            alert('Congratulations! You have completed all floors!');
        }
    });

    updatePlayerPosition();
    document.getElementById('current-floor').textContent = currentFloor;
}

function updatePlayerPosition() {
    const player = document.querySelector('.player');
    if (!player) return;
    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;
}

function unlockFloorProgression() {
    const stairs = document.querySelector('.floor-stairs');
    const monsters = document.querySelectorAll('.monster');
    const totalMonsters = monsters.length;

    if (monstersDefeated >= totalMonsters && currentFloor < maxFloor) {
        if (stairs) {
            stairs.style.display = 'block';  // Show stairs when all monsters in the floor are defeated
        }
    }
}

window.selectCharacter = function(choice) {
    document.getElementById('character-name-input').style.display = 'block';
};

window.startGame = startGame;

function enterTreasureRoom() {
    const gameEnvironment = document.querySelector('.game-environment');
    gameEnvironment.innerHTML = '<div class="player"></div>';
    gameEnvironment.classList.add('treasure-room');

    // Create treasure chest
    const chest = document.createElement('div');
    chest.className = 'treasure-chest';
    chest.style.left = '400px';
    chest.style.top = '200px';
    chest.addEventListener('click', () => {
        const isMageClass = document.querySelector('.mage, .frost-revenant, .celestial-monk') !== null;
        
        if (isMageClass) {
            // Boost mana for magical characters
            playerMana += 50;
            showNotification('Mana increased by 50!', 'buff');
        } else {
            // Random boost for physical characters
            const isAttackBoost = Math.random() > 0.5;
            if (isAttackBoost) {
                monsterDamage += 5;
                showNotification('Attack increased by 5!', 'buff');
            } else {
                playerHealth += 30;
                showNotification('Defense increased! Max Health +30', 'buff');
            }
        }
        
        chest.remove();
        // Add return door
        const returnDoor = document.createElement('div');
        returnDoor.className = 'return-door';
        returnDoor.addEventListener('click', initializeGameEnvironment);
        gameEnvironment.appendChild(returnDoor);
    });
    
    gameEnvironment.appendChild(chest);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
