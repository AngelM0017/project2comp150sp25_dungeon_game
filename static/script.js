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
    const healthText = document.getElementById('player-health');
    const healthBar = document.querySelector('.health-fill');
    const maxHealth = parseInt(document.getElementById('player-max-health').textContent);
    
    if (healthText && healthBar) {
        healthText.textContent = Math.max(0, playerHealth);
        const healthPercent = (playerHealth / maxHealth) * 100;
        healthBar.style.width = `${Math.max(0, Math.min(100, healthPercent))}%`;
        
        // Update health bar color based on percentage
        if (healthPercent > 60) {
            healthBar.style.backgroundColor = '#2ecc71';
        } else if (healthPercent > 30) {
            healthBar.style.backgroundColor = '#f1c40f';
        } else {
            healthBar.style.backgroundColor = '#e74c3c';
        }
    }
}

function updateManaDisplay(character) {
    const manaContainer = document.getElementById('mana-container');
    const manaText = document.getElementById('player-mana');
    const manaBar = document.querySelector('.mana-fill');
    const maxMana = parseInt(document.getElementById('player-max-mana').textContent);
    
    if (!character || !character.mana) {
        if (manaContainer) {
            manaContainer.style.display = 'none';
        }
        return;
    }
    
    if (manaContainer && manaText && manaBar) {
        manaContainer.style.display = 'block';
        manaText.textContent = Math.max(0, character.mana);
        const manaPercent = (character.mana / maxMana) * 100;
        manaBar.style.width = `${Math.max(0, Math.min(100, manaPercent))}%`;
    }
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
            
            if (window.selectedCharacterType && ['Mage', 'FrostRevenant', 'CelestialMonk'].includes(window.selectedCharacterType)) {
                updateManaDisplay({mana: Math.max(0, parseInt(document.getElementById('player-mana').textContent))});
            }

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
            stairs.style.display = 'block';
            stairs.addEventListener('click', () => {
                if (monstersDefeated >= totalMonsters) {
                    currentFloor++;
                    playerHealth = 100; // Reset health when entering new floor
                    monstersDefeated = 0;
                    document.getElementById('current-floor').textContent = currentFloor;
                    initializeGameEnvironment();
                }
            });
        }
    }
}

function handleRoomDoors() {
    const roomDoors = document.querySelectorAll('.room-door');
    roomDoors.forEach(door => {
        door.addEventListener('click', () => {
            const doorType = door.classList.contains('trap-door') ? 'trap-room' :
                           door.classList.contains('sanctuary-door') ? 'sanctuary-room' : 'treasure-room';
            
            switch(doorType) {
                case 'treasure-room':
                    enterTreasureRoom();
                    break;
                case 'trap-room':
                    enterRoom('trap-room');
                    break;
                case 'sanctuary-room':
                    enterRoom('sanctuary-room');
                    break;
            }
        });
    });
}

function initializeGameEnvironment() {
    playerPosition = { x: 400, y: 300 };
    const gameEnvironment = document.querySelector('.game-environment');
    gameEnvironment.innerHTML = '<div class="player"></div>';

    // Add random room door with random type
    const doorTypes = ['treasure-door', 'trap-door', 'sanctuary-door'];
    const randomDoorType = doorTypes[Math.floor(Math.random() * doorTypes.length)];
    const doorPosition = ['north', 'east', 'south', 'west'][Math.floor(Math.random() * 4)];
    
    const roomDoor = document.createElement('div');
    roomDoor.className = `room-door ${doorPosition} ${randomDoorType}`;
    gameEnvironment.appendChild(roomDoor);

    // Spawn monsters for the current floor
    const numMonsters = 8 + ((currentFloor - 1) * 3);
    for(let i = 0; i < numMonsters; i++) {
        const monster = document.createElement('div');
        monster.className = 'monster';
        monster.style.left = `${300 + Math.random() * 200}px`;
        monster.style.top = `${200 + Math.random() * 200}px`;
        monster.style.transform = `scale(${1 + currentFloor * 0.1})`;
        gameEnvironment.appendChild(monster);
    }

    // Add hidden stairs
    const stairs = document.createElement('div');
    stairs.className = 'floor-stairs';
    stairs.style.display = 'none';
    gameEnvironment.appendChild(stairs);

    // Initialize door handlers
    handleRoomDoors();
    updatePlayerPosition();
}

window.selectCharacter = function(choice) {
    const characterTypes = {
        1: 'Swordsman',
        2: 'Mage',
        3: 'FrostRevenant',
        4: 'CelestialMonk'
    };
    window.selectedCharacterType = characterTypes[choice];
    document.getElementById('character-name-input').style.display = 'block';
};

function startGame() {
    const name = document.getElementById('name-input').value;
    if (!name) {
        alert('Please enter a character name');
        return;
    }

    fetch('/start_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            choice: window.selectedCharacterType,
            name: name
        })
    })
    .then(response => response.json())
    .then(character => {
        document.getElementById('character-select').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        document.getElementById('player-name').textContent = character.name;
        document.getElementById('player-health').textContent = character.health;
        document.getElementById('player-max-health').textContent = character.health;
        document.getElementById('player-attack').textContent = character.attack;
        document.getElementById('player-defense').textContent = character.defense;
        
        if (character.mana > 0) {
            document.getElementById('mana-container').style.display = 'block';
            document.getElementById('player-mana').textContent = character.mana;
            document.getElementById('player-max-mana').textContent = character.mana;
        } else {
            document.getElementById('mana-container').style.display = 'none';
        }
        
        initializeGameEnvironment();
    })
    .catch(error => {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    });
}

window.startGame = startGame;

// Room type handlers
function handleTrapRoom() {
    const trapDamage = 5;
    const damageInterval = setInterval(() => {
        const monsters = document.querySelectorAll('.trap-monster');
        monsters.forEach(monster => {
            if (isColliding(document.querySelector('.player'), monster)) {
                playerHealth = Math.max(0, playerHealth - trapDamage);
                updateHealthDisplay();
                showDamageEffect();
            }
        });
    }, 1000);

    // Store interval ID to clear when leaving room
    window.currentRoomInterval = damageInterval;
}

function handleSanctuaryRoom() {
    const healInterval = setInterval(() => {
        if (playerHealth < 100) {
            playerHealth = Math.min(100, playerHealth + 5);
            updateHealthDisplay();
            showHealEffect();
        }
    }, 1000);

    // Store interval ID to clear when leaving room
    window.currentRoomInterval = healInterval;
}

function showHealEffect() {
    const healText = document.createElement('div');
    healText.className = 'heal-text';
    healText.style.position = 'absolute';
    healText.style.color = '#4CAF50';
    healText.style.left = `${playerPosition.x}px`;
    healText.style.top = `${playerPosition.y - 30}px`;
    healText.innerHTML = '+5';
    document.querySelector('.game-environment').appendChild(healText);
    setTimeout(() => healText.remove(), 1000);
}

function showDamageEffect() {
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.style.position = 'absolute';
    damageText.style.color = '#ff0000';
    damageText.style.left = `${playerPosition.x}px`;
    damageText.style.top = `${playerPosition.y - 30}px`;
    damageText.innerHTML = '-5';
    document.querySelector('.game-environment').appendChild(damageText);
    setTimeout(() => damageText.remove(), 1000);
}

let roomHistory = [];
let currentRoomId = 0;

function generateNewRoom() {
    const roomTypes = ['treasure-room', 'trap-room', 'sanctuary-room'];
    return {
        id: ++currentRoomId,
        type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
        doors: Math.floor(Math.random() * 2) + 1  // 1 or 2 additional doors
    };
}

function enterRoom(roomType, fromRoomId = null) {
    // Clear any existing room intervals
    if (window.currentRoomInterval) {
        clearInterval(window.currentRoomInterval);
        window.currentRoomInterval = null;
    }

    const gameEnvironment = document.querySelector('.game-environment');
    gameEnvironment.innerHTML = '<div class="player"></div>';
    gameEnvironment.className = 'game-environment ' + roomType;

    // Generate room properties
    const currentRoom = {
        id: fromRoomId || ++currentRoomId,
        type: roomType,
        doors: Math.floor(Math.random() * 2) + 1
    };

    if (fromRoomId === null) {
        roomHistory.push(currentRoom);
    }

    if (roomType === 'trap-room') {
        // Add trap monsters
        for (let i = 0; i < 3; i++) {
            const monster = document.createElement('div');
            monster.className = 'trap-monster';
            monster.style.left = `${200 + Math.random() * 400}px`;
            monster.style.top = `${150 + Math.random() * 300}px`;
            gameEnvironment.appendChild(monster);
        }
        handleTrapRoom();
    } else if (roomType === 'sanctuary-room') {
        handleSanctuaryRoom();
    }

    // Add return door
    const returnDoor = document.createElement('div');
    returnDoor.className = 'return-door';
    returnDoor.addEventListener('click', () => {
        if (roomHistory.length > 1) {
            roomHistory.pop(); // Remove current room
            const previousRoom = roomHistory[roomHistory.length - 1];
            enterRoom(previousRoom.type, previousRoom.id);
        } else {
            if (window.currentRoomInterval) {
                clearInterval(window.currentRoomInterval);
                window.currentRoomInterval = null;
            }
            initializeGameEnvironment();
        }
    });
    gameEnvironment.appendChild(returnDoor);

    // Add additional doors based on room configuration
    const doorPositions = ['north', 'east', 'west'];
    const usedPositions = new Set();
    
    for (let i = 0; i < currentRoom.doors; i++) {
        let position;
        do {
            position = doorPositions[Math.floor(Math.random() * doorPositions.length)];
        } while (usedPositions.has(position));
        
        usedPositions.add(position);
        
        const newDoor = document.createElement('div');
        newDoor.className = `room-door ${position}`;
        newDoor.addEventListener('click', () => {
            const newRoom = generateNewRoom();
            roomHistory.push(newRoom);
            enterRoom(newRoom.type, newRoom.id);
        });
        gameEnvironment.appendChild(newDoor);
    }
}

function enterTreasureRoom() {
    enterRoom('treasure-room');

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
