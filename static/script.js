let selectedCharacter = null;
let selectedCharacterType = null;
let currentMonsters = [];
let selectedMove = 'Basic Attack';
let inBattleMode = false;
let currentFloor = 1;
let monsterSprites = [];
let playerPosition = { x: 400, y: 300 };
let currentRoom = { x: 0, y: 0 };
const rooms = new Map();
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
        e.preventDefault(); // Prevent default scrolling
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// Add movement update function
function updateMovement() {
    const player = document.querySelector('.player');
    if (!player) return;

    let dx = 0;
    let dy = 0;

    if (keys.w) dy -= 1;  // Move up
    if (keys.s) dy += 1;  // Move down
    if (keys.a) dx -= 1;  // Move left
    if (keys.d) dx += 1;  // Move right

    // Allow diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;  // Normalize diagonal movement
        dy *= 0.707;
    }

    // Apply movement speed
    dx *= moveSpeed;
    dy *= moveSpeed;
        dx *= 0.707;
        dy *= 0.707;
    }

    // Calculate new position
    const newX = playerPosition.x + dx * moveSpeed;
    const newY = playerPosition.y + dy * moveSpeed;

    // Get game environment dimensions
    const gameEnv = document.querySelector('.game-environment');
    const maxX = gameEnv.clientWidth - 60;  // Account for player width and padding
    const maxY = gameEnv.clientHeight - 60; // Account for player height and padding

    // Update position with boundary constraints
    playerPosition.x = Math.max(20, Math.min(maxX, newX));
    playerPosition.y = Math.max(20, Math.min(maxY, newY));

    // Update player position
    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;

    // Check for door interactions
    checkDoorInteractions();
}

// Add movement interval
setInterval(updateMovement, 16);

// Prevent function redefinitions that cause issues
let originalUpdatePlayerStats;
let originalStartGame;
let originalAttack;
let originalHandlePostCombatEvent;

const movesets = {
    'Swordsman': {
        'Basic Attack': { damage: [5, 15], mana: 0, description: 'A basic sword attack' },
        'Heavy Strike': { damage: [15, 25], mana: 0, description: 'A powerful overhead strike' },
        'Quick Slash': { damage: [8, 12], mana: 0, description: 'A swift slashing attack' },
        'Blade Dance': { damage: [12, 20], mana: 0, description: 'A series of quick sword strikes' }
    },
    'Mage': {
        'Fireball': { damage: [15, 25], mana: 5, description: 'Launches a ball of fire' },
        'Water Lance': { damage: [12, 18], mana: 10, description: 'Piercing water projectile' },
        'Wind Cutter': { damage: [10, 16], mana: 12, description: 'Sharp blades of wind' },
        'Thunder Bolt': { damage: [18, 28], mana: 18, description: 'A powerful lightning strike' }
    },
    'FrostRevenant': {
        'Ice Spear': { damage: [12, 20], mana: 5, description: 'Ice spear with 35% freeze chance', freezeChance: 0.35 },
        'Ice Lance': { damage: [15, 22], mana: 18, description: 'Piercing ice lance with 35% freeze chance', freezeChance: 0.35 },
        'Ice Ball': { damage: [10, 16], mana: 12, description: 'Ball of ice with 35% freeze chance', freezeChance: 0.35 },
        'Ice Fist': { damage: [18, 25], mana: 5, description: 'Frozen fist strike with 35% freeze chance', freezeChance: 0.35 }
    },
    'CelestialMonk': {
        'Monks Fist': { damage: [12, 18], mana: 0, description: 'Mana-enhanced punch' },
        'Monks Light': { damage: [10, 15], mana: 5, description: 'Quick light-infused strike' },
        'Monks Headbutt': { damage: [15, 22], mana: 10, description: 'Powerful celestial headbutt' },
        'Monks Fire Fist': { damage: [18, 25], mana: 10, description: 'Burning mana-enhanced punch' }
    }
};

// Define room types constant
const ROOM_TYPES = {
    MONSTER: 'monster',
    TREASURE: 'treasure',
    TRAP: 'trap'
};

let currentFloorRooms = [];
let totalRoomsInFloor = 0;
let defeatedMonstersInFloor = 0;

// Define selectCharacter function globally
function selectCharacter(choice) {
    selectedCharacter = choice.toString();
    const buttons = document.querySelectorAll('.character-options button');
    buttons.forEach(btn => btn.classList.remove('selected'));

    // Add selected class to clicked button
    const selectedBtn = document.querySelector(`.character-options button:nth-child(${choice})`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }

    document.getElementById('character-name-input').style.display = 'block';
}

// Add click event listeners when document loads
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for prompt screen positioning
    const style = document.createElement('style');
    style.textContent = `
      #prompt-screen {
        position: fixed;
        left: 0;
        top: 0;
        width: 250px;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 15px;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
        overflow-y: auto;
        display: none; /* Hidden by default */
        z-index: 1000;
      }

      .game-environment {
        margin-left: 250px; /* Make room for the prompt screen */
      }

      /* Only apply margin when prompt screen is visible */
      .prompt-active .game-environment {
        margin-left: 250px; 
      }

      .prompt-inactive .game-environment {
        margin-left: 0;
      }
    `;
    document.head.appendChild(style);

    // Add this improved event delegation function at the beginning of your code
    function addButtonClickability() {
      // Use event delegation for all buttons in the document
      document.addEventListener('click', function(event) {
        const target = event.target;

        // Handle character selection buttons
        if (target.classList.contains('character-btn')) {
          selectedCharacter = target.getAttribute('data-char');
          document.getElementById('character-name-input').style.display = 'block';
        }

        // Handle action buttons
        if (target.classList.contains('action-button')) {
          if (target.classList.contains('fight-button')) {
            const nearbyMonster = findNearbyMonster();
            if (nearbyMonster !== null) {
              startBattleMode(nearbyMonster);
            }
          } else if (target.classList.contains('loot-button')) {
            lootChest();
          } else if (target.classList.contains('ability-button')) {
            const moveName = target.textContent.split(' (')[0]; // Extract move name
            setMove(moveName);
          } else if (target.textContent === '🧘 Rest') {
            restCharacter();
          } else if (target.textContent === '🔍 Search') {
            searchArea();
          }
        }

        // Handle monster sprites
        if (target.classList.contains('monster-sprite')) {
          const index = Array.from(document.querySelectorAll('.monster-sprite')).indexOf(target);
          if (inBattleMode) {
            attack(index + 1);
          } else {
            const sprite = monsterSprites[index];
            if (sprite) {
              const dx = playerPosition.x - sprite.x;
              const dy = playerPosition.y - sprite.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 32) {
                startBattleMode(index);
              } else {
                addToCombatLog("You're too far away to attack. Move closer!");
              }
            }
          }
        }

        // Handle treasure chests
        if (target.classList.contains('treasure-chest') && !target.classList.contains('looted')) {
          const distance = getDistanceToPlayer(target);
          if (distance < 32) {
            lootChest();
          }
        }

        // Handle retry/play again buttons
        if (target.id === 'retry-button' || target.id === 'play-again-button') {
          retryGame();
        }

        // Handle start/play buttons
        if (target.id === 'start-button' || target.id === 'play-button') {
          startGame();
        }
      });
    }

    // Add this CSS fix to improve button clickability
    function addButtonStyles() {
      const style = document.createElement('style');
      style.textContent = `
        button {
          cursor: pointer;
          position: relative;
          z-index: 10;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .action-button, .character-btn, .move-btn, .ability-button {
          pointer-events: auto;
          touch-action: manipulation;
          cursor: pointer;
        }

        .monster-sprite {
          cursor: pointer;
          z-index: 5;
        }

        .treasure-chest {
          cursor: pointer;
          z-index: 5;
        }

        /* Prevent text selection on buttons */
        button, .action-button, .character-btn, .move-btn, .ability-button {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        /* Fix for context buttons container */
        .context-buttons {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 10px;
          pointer-events: auto;
        }

        /* Add hover effects for better user feedback */
        button:hover, .action-button:hover, .character-btn:hover {
          filter: brightness(1.1);
        }

        button:active, .action-button:active, .character-btn:active {
          filter: brightness(0.9);
        }
      `;
      document.head.appendChild(style);
    }

    // Modified createPromptScreen function to ensure button clickability
    function createPromptScreen() {
        // This functionality is now handled by GameHUD
        return;
    }

    // Enhanced function to check proximity interactions with better button creation
    function checkProximityInteractions() {
        // This functionality is now handled by InteractionManager
        return;
    }

    // Update prompt screen for monster interaction
    function updatePromptScreenForMonster(monster, index) {
        // This functionality is now handled by InteractionManager
        return;
    }

    // Update prompt screen for chest interaction
    function updatePromptScreenForChest(chest) {
        // This functionality is now handled by InteractionManager
        return;
    }

    // Modified function to handle combat button creation
    function enterCombatMode() {
        // This functionality is now handled by InteractionManager
        return;
    }

    function initPromptScreen() {
        // This functionality is now handled by GameHUD
        return;
    }

    function updatePlayerStatusDisplay() {
        // This functionality is now handled by GameHUD
        return;
    }

    function hidePromptScreen() {
        // This functionality is now handled by GameHUD
        return;
    }

    function showPromptScreen() {
        // This functionality is now handled by GameHUD
        return;
    }

    // Make selectCharacter available globally
    window.selectCharacter = function(choice) {
        const characterMap = {
            1: 'Swordsman',
            2: 'Mage',
            3: 'FrostRevenant',
            4: 'CelestialMonk'
        };

        selectedCharacter = characterMap[choice];

        const buttons = document.querySelectorAll('.character-options button');
        buttons.forEach(btn => btn.classList.remove('selected'));

        const selectedBtn = document.querySelector(`.character-options button:nth-child(${choice})`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }

        document.getElementById('character-name-input').style.display = 'block';
    };



    // Add click feedback to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.style.cursor = 'pointer';
    });

    // Ensure retry button works
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', retryGame);
    }

    // Ensure play button works
    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', startGame);
    }

    // Create prompt screen if it doesn't exist
    createPromptScreen();
    addButtonClickability();
    addButtonStyles();
});

// Initialize the prompt screen
function initPromptScreen() {
    // This functionality is now handled by GameHUD
    return;
}

// Update player stats in the prompt screen
function updatePlayerStatusDisplay() {
    // This functionality is now handled by GameHUD
    return;
}

// Functions to show/hide prompt screen
function hidePromptScreen() {
    // This functionality is now handled by GameHUD
    return;
}

function showPromptScreen() {
    // This functionality is now handled by GameHUD
    return;
}

// Check for nearby interactive elements
function checkProximityInteractions() {
    // This functionality is now handled by InteractionManager
    return;
}

// Check if player is near any monsters
function checkNearbyMonsters() {
    if (!monsterSprites || monsterSprites.length === 0) return null;

    for (let i = 0; i < monsterSprites.length; i++) {
        if (!currentMonsters[i] || !currentMonsters[i].isAlive) continue;

        const sprite = monsterSprites[i];
        if (!sprite || sprite.x === undefined) continue;

        const dx = playerPosition.x - sprite.x;
        const dy = playerPosition.y - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 32) {
            return i;
        }
    }
    return null;
}

// Check if player is near any treasure chests
function checkNearbyChests() {
    const chests = document.querySelectorAll('.treasure-chest');
    for (const chest of chests) {
        const rect = chest.getBoundingClientRect();
        const chestX = rect.left + rect.width/2;
        const chestY = rect.top + rect.height/2;

        const dx = playerPosition.x - chestX;
        const dy = playerPosition.y - chestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 32) {
            return chest;
        }
    }
    return null;
}

// Enter combat mode in the prompt screen
function enterCombatMode() {
    // This functionality is now handled by InteractionManager
    return;
}

// Rest function to recover some health
function restCharacter() {
    if (!selectedCharacterType) return;

    if (selectedCharacterType.health < (selectedCharacterType.maxHealth || 100)) {
        const healthRecovery = Math.floor((selectedCharacterType.maxHealth || 100) * 0.1);
        selectedCharacterType.health = Math.min(
            selectedCharacterType.health + healthRecovery,
            selectedCharacterType.maxHealth || 100
        );

        // Recover mana for mana users
        if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
            const manaRecovery = Math.floor((selectedCharacterType.maxMana || selectedCharacterType.mana) * 0.15);
            selectedCharacterType.mana = Math.min(
                selectedCharacterType.mana + manaRecovery,
                selectedCharacterType.maxMana || selectedCharacterType.mana
            );
        }

        addToCombatLog(`You rested and recovered ${healthRecovery} health points.`);
        updatePlayerStatusDisplay();
    } else {
        addToCombatLog("You're already at full health!");
    }
}

// Loot a treasure chest
function lootChest() {
    if (!selectedCharacterType) return;

    const randomLoot = Math.random();

    if (randomLoot < 0.3) {
        // 30% chance for attack bonus
        selectedCharacterType.attack *= 1.05;
        addToCombatLog("You found a weapon enhancement! Attack increased by 5%");
    } else if (randomLoot < 0.6) {
        // 30% chance for defense bonus
        selectedCharacterType.defense += 5;
        addToCombatLog("You found armor enhancement! Defense increased by 5");
    } else {
        // 40% chance for health bonus
        const healthBonus = Math.floor((selectedCharacterType.maxHealth || 100) * 0.2);
        selectedCharacterType.health = Math.min(
            selectedCharacterType.health + healthBonus,
            selectedCharacterType.maxHealth || 100
        );
        addToCombatLog(`You found a health potion! Recovered ${healthBonus} HP`);
    }

    // Remove the chest
    const chest = checkNearbyChests();
    if (chest) {
        chest.remove();
    }

    updatePlayerStatusDisplay();
}

// Search function to find items or trigger events
function searchArea() {
    if (!selectedCharacterType) return;

    const chance = Math.random();

    if (chance < 0.1) { // 10% chance for a good item
        selectedCharacterType.attack *= 1.01;
        addToCombatLog("You found a weapon enhancement! Attack increased by 1%");
    } else if (chance < 0.2) { // 10% chance for health potion
        selectedCharacterType.health = Math.min(
            selectedCharacterType.health + 5,
            selectedCharacterType.maxHealth || 100
        );
        addToCombatLog("You found a small health potion! (+5 HP)");
    } else if (chance < 0.3 && ['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
        // 10% chance for mana potion for mana users
        selectedCharacterType.mana = Math.min(
            selectedCharacterType.mana + 5,
            selectedCharacterType.maxMana || selectedCharacterType.mana
        );
        addToCombatLog("You found a small mana potion! (+5 MP)");
    } else if (chance < 0.35) { // 5% chance for trap
        selectedCharacterType.health = Math.max(0, selectedCharacterType.health - 5);
        addToCombatLog("You triggered a small trap! Lost 5 HP");

        if (selectedCharacterType.health <= 0) {
            addToCombatLog('You died from the trap! Game Over!');
            disableAttackButtons();
            return;
        }
    } else {
        addToCombatLog("You searched the area but found nothing of interest.");
    }

    updatePlayerStatusDisplay();
}

// Update moveset buttons
function updateMovesetButtons() {
    const movesetContainer = document.getElementById('moveset-buttons');
    if (!movesetContainer || !selectedCharacterType) return;

    movesetContainer.innerHTML = '';

    const characterMoves = movesets[selectedCharacterType.type];
    for (const moveName in characterMoves) {
        const move = characterMoves[moveName];
        const btn = document.createElement('button');
        btn.onclick = () => setMove(moveName);
        btn.className = 'move-btn';
        if (moveName === selectedMove) {
            btn.classList.add('active');
        }
        btn.textContent = `${moveName} (${move.mana} MP)`;
        movesetContainer.appendChild(btn);
    }
}

// Update player position
function updatePlayerPosition() {
    const player = document.querySelector('.player');
    if (!player) return;

    player.style.left = playerPosition.x + 'px';
    player.style.top = playerPosition.y + 'px';

    // Check for room transitions
    if (playerPosition.x < 0) {
        // Move to west room
        transitionToRoom(currentRoom.x - 1, currentRoom.y, 760, playerPosition.y);
    } else if (playerPosition.x > 768) {
        // Move to east room
        transitionToRoom(currentRoom.x + 1, currentRoom.y, 8, playerPosition.y);
    } else if (playerPosition.y < 0) {
        // Move to north room
        transitionToRoom(currentRoom.x, currentRoom.y - 1, playerPosition.x, 440);
    } else if (playerPosition.y > 468) {
        // Move to south room
        transitionToRoom(currentRoom.x, currentRoom.y + 1, playerPosition.x, 8);
    }
}

// Create a room
function createRoom(x = 0, y = 0) {
    const room = document.createElement('div');
    room.className = 'room';
    room.dataset.x = x;
    room.dataset.y = y;

    // Add a single door in a random position
    const directions = ['north', 'south', 'east', 'west'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const door = document.createElement('div');
    door.className = `door ${randomDirection}`;
    room.appendChild(door);

    // Generate room content
    const roomType = Math.random();
    if (roomType < 0.4) { // 40% chance for monster room
        spawnMonstersInRoom(room);
    } else if (roomType < 0.6) { // 20% chance for treasure room
        createTreasureChest(room);
    } else if (roomType < 0.8) { // 20% chance for trap room
        createSlimeTrap(room);
    } else { // 20% chance for healing shrine
        createHealingShrine(room);
    }

    return room;
}

function createSlimeTrap(room) {
    const slimeCount = Math.floor(Math.random() * 10) + 10; // 10-20 slimes
    for (let i = 0; i < slimeCount; i++) {
        const slime = document.createElement('div');
        slime.className = 'slime';
        slime.style.left = Math.random() * 100 + '%';
        slime.style.top = Math.random() * 100 + '%';
        room.appendChild(slime);
    }

    // Add slime damage interval
    const damageInterval = setInterval(() => {
        if (!selectedCharacterType) return;

        const slimes = room.querySelectorAll('.slime');
        let nearSlime = false;

        slimes.forEach(slime => {
            const distance = getDistanceToPlayer(slime);
            if (distance < 32) {
                nearSlime = true;
            }
        });

        if (nearSlime) {
            const damage = Math.max(1, Math.floor(currentFloor * 2));
            selectedCharacterType.health = Math.max(0, selectedCharacterType.health - damage);
            addToCombatLog(`Toxic slime deals ${damage} damage!`);
            updatePlayerStatusDisplay();

            if (selectedCharacterType.health <= 0) {
                clearInterval(damageInterval);
                handlePlayerDeath();
            }
        }
    }, 1000);

    // Clear interval when room is destroyed
    room.addEventListener('remove', () => clearInterval(damageInterval));
}

function transitionToNewRoom(direction) {
    const currentRoom = document.querySelector('.room');
    if (!currentRoom) return;

    currentRoom.style.opacity = '0';

    const directions = {
        north: 'northern',
        south: 'southern',
        east: 'eastern',
        west: 'western'
    };

    addToGameLog(`Player moved through ${directions[direction]} door to a new room`, 'movement');

    setTimeout(() => {
        currentRoom.remove();
        const newRoom = createRoom();
        document.querySelector('.game-environment').appendChild(newRoom);

        // Position player based on entry direction
        const playerRect = document.querySelector('.player').getBoundingClientRect();
        const roomRect = newRoom.getBoundingClientRect();

        switch(direction) {
            case 'north':
                playerPosition.x = roomRect.width / 2 - playerRect.width / 2;
                playerPosition.y = roomRect.height - playerRect.height - 40;
                break;
            case 'south':
                playerPosition.x = roomRect.width / 2 - playerRect.width / 2;
                playerPosition.y = 40;
                break;
            case 'east':
                playerPosition.x = 40;
                playerPosition.y = roomRect.height / 2 - playerRect.height / 2;
                break;
            case 'west':
                playerPosition.x = roomRect.width - playerRect.width - 40;
                playerPosition.y = roomRect.height / 2 - playerRect.height / 2;
                break;
        }

        updatePlayerPosition();
        newRoom.style.opacity = '1';
    }, 500);
}

// Create a treasure chest
function createTreasureChest(room) {
    const chest = document.createElement('div');
    chest.className = 'treasure-chest';
    chest.style.left = '50%';
    chest.style.top = '50%';
    chest.style.transform = 'translate(-50%, -50%)';
    room.appendChild(chest);

    chest.addEventListener('click', () => handleChestClick(chest));
}

// Calculate distance to player
function getDistanceToPlayer(element) {
    const rect = element.getBoundingClientRect();
    const elementX = rect.left + rect.width/2;
    const elementY = rect.top + rect.height/2;

    const dx = playerPosition.x - elementX;
    const dy = playerPosition.y - elementY;

    return Math.sqrt(dx * dx + dy * dy);
}

// Spawn monsters in a room
function spawnMonstersInRoom(room) {
    const monsterPool = getMonsterPoolForFloor(currentFloor);
    const count = Math.min(3, Math.floor(Math.random() * 3) + 1);

    for (let i = 0; i < count; i++) {
        const monster = monsterPool[Math.floor(Math.random() * monsterPool.length)];
        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster-sprite';
        monsterEl.style.backgroundColor = getMonsterColor(monster.type);
        monsterEl.style.left = (20 + Math.random() * 60) + '%';
        monsterEl.style.top = (20 + Math.random() * 60) + '%';
        room.appendChild(monsterEl);
    }
}

// Start the game
function startGame() {
    const name = document.getElementById('name-input').value;
    if (!name) {
        alert('Please enter a character name');
        return;
    }

    if (!selectedCharacter) {
        alert('Please select a character class first');
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

    // Create initial room
    const initialRoom = createRoom(0, 0, 0);
    environment.appendChild(initialRoom);
    rooms.set('0,0', initialRoom);

    // Set initial player position
    playerPosition = { x: 384, y: 234 };
    updatePlayerPosition();

    fetch('/start_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            choice: selectedCharacter,
            name: name
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        // Initialize character with proper max health/mana
        selectedCharacterType = data;
        selectedCharacterType.maxHealth = selectedCharacterType.health;

        if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
            selectedCharacterType.maxMana = selectedCharacterType.mana;
        }

        // Hide character selection, show game screen
        document.getElementById('character-select').style.display = 'none';
        document.getElementById('character-name-input').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';

        // Initialize UI
        updatePlayerStats(selectedCharacterType);
        updatePlayerStatusDisplay();

        // Initialize combat log
        const combatLogContainer = document.createElement('div');
        combatLogContainer.id = 'combat-log-container';
        const combatLog = document.createElement('div');
        combatLog.id = 'combat-log';
        combatLogContainer.appendChild(combatLog);
        gameScreen.appendChild(combatLogContainer);

        // Initialize monsters area
        const monstersArea = document.createElement('div');
        monstersArea.id = 'monsters-area';
        environment.appendChild(monstersArea);

        // Add action buttons container if it doesn't exist
        if (!document.getElementById('action-buttons')) {
            const actionButtons = document.createElement('div');
            actionButtons.id = 'action-buttons';
            actionButtons.className = 'action-buttons';
            gameScreen.appendChild(actionButtons);

            // Add moveset buttons container
            const movesetButtons = document.createElement('div');
            movesetButtons.id = 'moveset-buttons';
            movesetButtons.className = 'moveset-buttons';
            actionButtons.appendChild(movesetButtons);

            // Add fight button
            const fightButton = document.createElement('button');
            fightButton.id = 'fight-button';
            fightButton.textContent = 'Fight!';
            fightButton.style.display = 'none';
            actionButtons.appendChild(fightButton);

            // Add monster stats container
            const monsterStats = document.createElement('div');
            monsterStats.id = 'monster-stats';
            monsterStats.style.display = 'none';
            gameScreen.appendChild(monsterStats);
        }

        updateMovesetButtons();
        addToCombatLog(`Welcome, ${name} the ${selectedCharacterType.type}! Explore the dungeon...`);

        // Start by spawning some monsters in the first room
        currentMonsters = generateMonsters();
        displayMonsters(currentMonsters);

        // Initialize prompt screen if it exists
        if (document.getElementById('prompt-screen')) {
            initPromptScreen();
        }

        // Add event listener for the fight button
        const fightButton = document.getElementById('fight-button');
        if (fightButton) {
            fightButton.addEventListener('click', () => {
                const nearbyMonster = findNearbyMonster();
                if (nearbyMonster !== null) {
                    startBattleMode(nearbyMonster);
                }
            });
        }
    })
    .catch(error => {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    });
}

// Fix updatePlayerStats function
function updatePlayerStats(character) {
    const statsDiv = document.getElementById('player-stats');
    if (!statsDiv) {
        const gameScreen = document.getElementById('game-screen');
        const newStatsDiv = document.createElement('div');
        newStatsDiv.id = 'player-stats';
        gameScreen.appendChild(newStatsDiv);
    }

    // Update the stats display
    document.getElementById('player-stats').innerHTML = `
        ${character.name} (${character.type}) - 
        Health: ${character.health}/${character.maxHealth || 100} | 
        Attack: ${Math.round(character.attack)} | 
        Defense: ${character.defense} 
        ${['Mage', 'FrostRevenant', 'CelestialMonk'].includes(character.type) ? 
          `| Mana: ${character.mana}/${character.maxMana || character.mana}` : ''}
    `;

    // Also update the prompt screen if it exists
    updatePlayerStatusDisplay();
}

// Helper function to find nearby monsters
function findNearbyMonster() {
    for (let i = 0; i < monsterSprites.length; i++) {
        if (!currentMonsters[i] || !currentMonsters[i].isAlive) continue;

        const sprite = monsterSprites[i];
        const dx = playerPosition.x - sprite.x;
        const dy = playerPosition.y - sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 32) {
            return i;
        }
    }
    return null;
}

// Fixed attack function
function attack(monsterIndex) {
    // Adjust index since we're using 0-based arrays but 1-based input
    const adjustedIndex = typeof monsterIndex === 'number' ? monsterIndex - 1 : 0;
    const monster = currentMonsters[adjustedIndex];

    if (!monster || !monster.isAlive) {
        addToCombatLog('Invalid target or monster is already defeated!');
        return;
    }

    const characterMoves = movesets[selectedCharacterType.type];
    const move = characterMoves[selectedMove];

    if (move.mana > selectedCharacterType.mana) {
        addToCombatLog('Not enough mana for this move!');
        return;
    }

    // Calculate damage with a random roll
    const baseDamage = Math.floor(Math.random() * (move.damage[1] - move.damage[0] + 1)) + move.damage[0];
    const calculatedDamage = Math.max(1, Math.floor(baseDamage * (selectedCharacterType.attack / 100)));

    // Apply defense reduction (a simple formula)
    const finalDamage = Math.max(1, calculatedDamage - Math.floor(monster.defense / 5));

    // Handle freeze effect for FrostRevenant
    let freezeApplied = false;
    if (selectedCharacterType.type === 'FrostRevenant' && move.freezeChance) {
        freezeApplied = Math.random() < move.freezeChance;
    }

    // Consume mana
    selectedCharacterType.mana -= move.mana;

    // Try to use fetch, but have a fallback for local testing
    try {
        fetch('/attack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target_idx: adjustedIndex,
                player: selectedCharacterType,
                monster: monster,
                move: selectedMove
            })
        })
        .then(response => response.json())
        .then(handleAttackResponse)
        .catch(error => {
            console.error('Error with attack fetch:', error);
            // Fallback local combat calculation
            handleLocalAttack(monster, finalDamage, freezeApplied);
        });
    } catch (error) {
        console.error('Fetch not available, using local combat:', error);
        // Fallback local combat calculation
        handleLocalAttack(monster, finalDamage, freezeApplied);
    }
}

// Handle attack response from server
function handleAttackResponse(data) {
    if (data.success) {
        selectedCharacterType.health = data.newPlayerHealth;
        currentMonsters[data.targetIndex].health = data.newMonsterHealth;

        addToCombatLog(`You used ${selectedMove}! ${data.message}`);

        if (data.monsterDefeated) {
            currentMonsters[data.targetIndex].isAlive = false;
            addToCombatLog(`${currentMonsters[data.targetIndex].name} has been defeated!`);

            // Add mana for mana-using characters when defeating monsters
            if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
                selectedCharacterType.mana = Math.min(
                    selectedCharacterType.mana + 5, 
                    selectedCharacterType.maxMana || selectedCharacterType.mana
                );
                addToCombatLog(`Gained 5 mana from defeating ${currentMonsters[data.targetIndex].name}!`);
            }
        }

        if (data.playerDefeated) {
            addToCombatLog('You have been defeated! Game Over!');
            handlePlayerDeath();
            return;
        }

        updatePlayerStats(selectedCharacterType);
        displayMonsters(currentMonsters);

        // Check if all monsters are defeated
        if (currentMonsters.every(m => !m.isAlive)) {
            addToCombatLog('Victory! All monsters have been defeated!');
            inBattleMode = false;
            document.getElementById('moveset-buttons').style.display = 'none';
            document.getElementById('monster-stats').style.display = 'none';
            handlePostCombatEvent();
        }
    }
}

// Fallback for local combat calculation
function handleLocalAttack(monster, damage, freezeApplied) {
    // Apply damage to monster
    monster.health = Math.max(0, monster.health - damage);

    // Build attack message
    let attackMessage = `You deal ${damage} damage to ${monster.name}`;
    if (freezeApplied) {
        attackMessage += " and freeze it, preventing its next attack!";
    }
    addToCombatLog(attackMessage);

    // Check if monster defeated
    const monsterDefeated = monster.health <= 0;
    if (monsterDefeated) {
        monster.isAlive = false;
        addToCombatLog(`${monster.name} has been defeated!`);

        // Handle monster drops
        handleMonsterDrops(monster);

        // Add mana for mana-using characters when defeating monsters
        if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
            selectedCharacterType.mana = Math.min(
                selectedCharacterType.mana + 5, 
                selectedCharacterType.maxMana || selectedCharacterType.mana
            );
            addToCombatLog(`Gained 5 mana from defeating ${monster.name}!`);
        }
    } else if (!freezeApplied) {
        // Monster counterattack if not frozen and still alive
        const monsterDamage = Math.max(1, Math.floor(monster.attack - selectedCharacterType.defense / 5));
        selectedCharacterType.health = Math.max(0, selectedCharacterType.health - monsterDamage);
        addToCombatLog(`${monster.name} counterattacks for ${monsterDamage} damage!`);

        // Check if player defeated
        if (selectedCharacterType.health <= 0) {
            addToCombatLog('You have been defeated! Game Over!');
            handlePlayerDeath();
            return;
        }
    }

    updatePlayerStats(selectedCharacterType);
    displayMonsters(currentMonsters);

    // Check if all monsters are defeated
    if (currentMonsters.every(m => !m.isAlive)) {
        addToCombatLog('Victory! All monsters have been defeated!');
        inBattleMode = false;
        if (document.getElementById('moveset-buttons')) {
            document.getElementById('moveset-buttons').style.display = 'none';
        }
        if (document.getElementById('monster-stats')) {
            document.getElementById('monster-stats').style.display = 'none';
        }
        handlePostCombatEvent();
    }
}

// Add new function for handling monster drops
function handleMonsterDrops(monster) {
    // Drop rates
    const dropRates = {
        healthPotion: 0.3,  // 30% chance
        gold: 0.5,         // 50% chance
        weapon: 0.2        // 20% chance
    };

    // Health Potion Drop
    if (Math.random() < dropRates.healthPotion) {
        const healAmount = Math.floor((selectedCharacterType.maxHealth || 100) * 0.2);
        selectedCharacterType.health = Math.min(
            selectedCharacterType.health + healAmount,
            selectedCharacterType.maxHealth || 100
        );
        addToCombatLog(`${monster.name} dropped a health potion! Restored ${healAmount} HP`);
    }

    // Gold Drop
    if (Math.random() < dropRates.gold) {
        const baseGold = 5;
        const goldAmount = baseGold + (currentFloor - 1) * 5;
        if (!selectedCharacterType.gold) {
            selectedCharacterType.gold = 0;
        }
        selectedCharacterType.gold += goldAmount;
        addToCombatLog(`${monster.name} dropped ${goldAmount} gold!`);

        // Update gold display in prompt screen
        const goldDisplay = document.getElementById('player-gold');
        if (goldDisplay) {
            goldDisplay.textContent = selectedCharacterType.gold;
        }
    }

    // Weapon/Attack Boost Drop
    if (Math.random() < dropRates.weapon) {
        const baseAttackBoost = 5;
        const attackBoost = baseAttackBoost + (currentFloor - 1) * 5;
        selectedCharacterType.attack += attackBoost;
        addToCombatLog(`${monster.name} dropped a new weapon! Attack increased by ${attackBoost}!`);
    }
}

// Function to handle player death
function handlePlayerDeath() {
    inBattleMode = false;
    document.getElementById('game-screen').style.display = 'none';

    // Create game over screen if it doesn't exist
    if (!document.getElementById('game-over')) {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'game-over';
        gameOverDiv.innerHTML = `
            <h2>Game Over</h2>
            <p>You were defeated in the dungeon.</p>
            <button id="retry-button">Try Again</button>
        `;
        document.body.appendChild(gameOverDiv);

        document.getElementById('retry-button').addEventListener('click', retryGame);
    }

    document.getElementById('game-over').style.display = 'block';
}

// Fixed displayMonsters function
function displayMonsters(monsters) {
    const container = document.getElementById('monsters-area');
    if (!container) return;

    container.innerHTML = '';
    monsterSprites.length = 0;

    monsters.forEach((monster, i) => {
        if (!monster.isAlive) return; // Skip displaying defeated monsters

        const sprite = document.createElement('div');
        sprite.className = 'monster-sprite';
        sprite.textContent = monster.name.charAt(0); // First letter as label
        sprite.title = monster.name;
        sprite.style.backgroundColor = getMonsterColor(monster.name);

        // Make monsters clickable for attack
        sprite.addEventListener('click', () => handleMonsterClick(monster, i));

        const position = {
            x: Math.random() * 568,
            y: Math.random() * 368,
            element: sprite
        };

        sprite.style.left = position.x + 'px';
        sprite.style.top = position.y + 'px';

        container.appendChild(sprite);
        monsterSprites.push(position);
    });

    if (!window.monsterInterval) {
        window.monsterInterval = setInterval(updateMonsterPositions, 100);
    }
}

// Fix startBattleMode function
function startBattleMode(monsterIndex) {
    if (!currentMonsters[monsterIndex] || !currentMonsters[monsterIndex].isAlive) {
        addToCombatLog("This monster is no longer available to fight.");
        return;
    }

    inBattleMode = true;

    if (document.getElementById('fight-button')) {
        document.getElementById('fight-button').style.display = 'none';
    }

    if (document.getElementById('moveset-buttons')) {
        document.getElementById('moveset-buttons').style.display = 'flex';
    }

    if (document.getElementById('monster-stats')) {
        document.getElementById('monster-stats').style.display = 'block';
    }

    displayMonsterStats(currentMonsters[monsterIndex]);
    addToCombatLog(`Engaged in battle with ${currentMonsters[monsterIndex].name}!`);

    // If we have a prompt screen, update it for combat mode
    if (document.getElementById('prompt-screen')) {
        enterCombatMode();
    }
}

function createHealingShrine(room) {
    const shrine = document.createElement('div');
    shrine.className = 'healing-shrine';
    shrine.style.left = '50%';
    shrine.style.top = '50%';
    shrine.style.transform = 'translate(-50%, -50%)';
    shrine.addEventListener('click', () => {
        if (getDistanceToPlayer(shrine) < 32) {
            if (selectedCharacterType) {
                const healAmount = Math.floor(selectedCharacterType.maxHealth * 0.3);
                selectedCharacterType.health = Math.min(
                    selectedCharacterType.health + healAmount,
                    selectedCharacterType.maxHealth
                );
                addToCombatLog(`The shrine heals you for ${healAmount} HP!`);
                updatePlayerStats(selectedCharacterType);
                shrine.style.opacity = '0.5';
                shrine.style.pointerEvents = 'none';
            }
        } else {
            addToCombatLog("Move closer to use the healing shrine!");
        }
    });
    room.appendChild(shrine);
}

// Fix loot function for treasure chests
function lootChest() {
    const treasureType = Math.random();

    if (treasureType < 0.3) { // 30% chance for attack boost
        selectedCharacterType.attack *= 1.02;
        addToCombatLog('You found a weapon enhancement! Attack increased by 2%');
    } else if (treasureType < 0.6) { // 30% chance for defense boost
        selectedCharacterType.defense += 5;
        addToCombatLog('You found armor enhancement! Defense increased by 5');
    } else if (treasureType < 0.9) { // 30% chance for health potion
        const healAmount = Math.floor((selectedCharacterType.maxHealth || 100) * 0.2);
        selectedCharacterType.health = Math.min(
            selectedCharacterType.health + healAmount,
            selectedCharacterType.maxHealth || 100
        );
        addToCombatLog(`You found a health potion! Restored ${healAmount} HP`);
    } else { // 10% chance for special item
        if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
            if (!selectedCharacterType.maxMana) {
                selectedCharacterType.maxMana = selectedCharacterType.mana + 10;
            } else {
                selectedCharacterType.maxMana += 10;
            }
            selectedCharacterType.mana = selectedCharacterType.maxMana;
            addToCombatLog('You found a magical artifact! Max mana increased by 10 and fully restored');
        } else {
            selectedCharacterType.maxHealth += 10;
            selectedCharacterType.health = selectedCharacterType.maxHealth;
            addToCombatLog('You found a vitality crystal! Max health increased by 10 and fully restored');
        }
    }

    // Remove the chest after looting
    const chest = checkNearbyChests();
    if (chest) {
        chest.style.opacity = '0.3';
        chest.classList.add('looted');
    }

    updatePlayerStats(selectedCharacterType);
}

// Improved handlePostCombatEvent function
function handlePostCombatEvent() {
    // Check if all monsters on current floor are defeated
    defeatedMonstersInFloor++;

    // Floor completion check
    if (defeatedMonstersInFloor >= getRequiredMonstersForFloor()) {
        if (currentFloor < 7) {
            addToCombatLog(`Floor ${currentFloor} cleared! Advance to find the stairs to the next floor.`);
            showFloorStairs();
        } else {
            addToCombatLog("Congratulations! You have defeated the Lord of the Tomb and completed the game!");
            // Show victory screen
            const gameScreen = document.getElementById('game-screen');
            gameScreen.innerHTML = `
                <div class="victory-screen">
                    <h2>Victory!</h2>
                    <p>You have conquered the dungeon and defeated the Lord of the Tomb!</p>
                    <button id="play-again-button">Play Again</button>
                </div>
            `;
            document.getElementById('play-again-button').addEventListener('click', retryGame);
            return;
        }
    } else {
        // Post-combat event reward
        const eventRoll = Math.random() * 100;

        if (eventRoll < 40) { // 40% chance for treasure
            const treasureType = Math.random() < 0.5 ? 'defense' : 'attack';
            if (treasureType === 'defense') {
                selectedCharacterType.defense += 5;
                addToCombatLog('You found treasure in the remains! Defense increased by 5');
            } else {
                selectedCharacterType.attack *= 1.01;
                addToCombatLog('You found treasure in the remains! Attack increased by 1%');
            }

            // Handle healing for all character types
            const healAmount = Math.floor((selectedCharacterType.maxHealth || 100) * 0.1);
            selectedCharacterType.health = Math.min(
                selectedCharacterType.health + healAmount,
                selectedCharacterType.maxHealth || 100
            );
            addToCombatLog(`The treasure included a small healing potion! (+${healAmount} HP)`);

            // Handle mana restoration for mana users
            if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
                const manaAmount = Math.floor((selectedCharacterType.maxMana || selectedCharacterType.mana) * 0.15);
                selectedCharacterType.mana = Math.min(
                    selectedCharacterType.mana + manaAmount,
                    selectedCharacterType.maxMana || selectedCharacterType.mana
                );
                addToCombatLog(`The treasure included a small mana potion! (+${manaAmount} MP)`);
            }
        }
    }

    updatePlayerStats(selectedCharacterType);

    // Generate new monsters
    setTimeout(() => {
        currentMonsters = generateMonsters();
        displayMonsters(currentMonsters);
        addToCombatLog('New monsters have appeared!');
    }, 2000);
}

// Function to handle game retry
function retryGame() {
    // Reset game state
    selectedCharacter = null;
    selectedCharacterType = null;
    currentMonsters = [];
    selectedMove = 'Basic Attack';
    currentFloor = 1;
    defeatedMonstersInFloor = 0;
    totalRoomsInFloor = 0;
    inBattleMode = false;

    // Clear intervals
    if (window.monsterInterval) {
        clearInterval(window.monsterInterval);
        window.monsterInterval = null;
    }

    // Reset UI
    if (document.getElementById('game-over')) {
        document.getElementById('game-over').style.display = 'none';
    }
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('character-select').style.display = 'block';
    document.getElementById('character-name-input').style.display = 'none';

    if (document.getElementById('name-input')) {
        document.getElementById('name-input').value = '';
    }

    if (document.getElementById('combat-log')) {
        document.getElementById('combat-log').innerHTML = '';
    }

    // Reset rooms map
    rooms.clear();
    currentRoom = { x: 0, y: 0 };

    // Reset player position
    playerPosition = { x: 400, y: 300 };
}

// Monster generation and management functions
function getMonsterPoolForFloor(floor) {
    const monsterPools = {
        1: [
            { name: 'Slime', type: 'normal', health: 30, maxHealth: 30, attack: 5, defense: 2, description: 'A basic slime monster' },
            { name: 'Rat', type: 'normal', health: 25, maxHealth: 25, attack: 7, defense: 1, description: 'A quick little rat' }
        ],
        2: [
            { name: 'Skeleton', type: 'undead', health: 45, maxHealth: 45, attack: 8, defense: 3, description: 'An animated skeleton' },
            { name: 'Ghost', type: 'spirit', health: 35, maxHealth: 35, attack: 10, defense: 2, description: 'A haunting spirit' }
        ],
        3: [
            { name: 'Zombie', type: 'undead', health: 60, maxHealth: 60, attack: 12, defense: 4, description: 'A shambling zombie' },
            { name: 'Dark Elf', type: 'humanoid', health: 50, maxHealth: 50, attack:15, defense: 3, description: 'A cunning dark elf' }
        ],
        4: [
            { name: 'Golem', type: 'construct', health: 80, maxHealth: 80, attack: 15, defense: 6, description: 'A stone golem' },
            { name: 'Wraith', type: 'spirit', health: 65, maxHealth: 65, attack: 18, defense: 4, description: 'A malevolent wraith' }
        ],
        5: [
            { name: 'Demon', type: 'demon', health: 90, maxHealth: 90, attack: 20, defense: 7, description: 'A fearsome demon' },
            { name: 'Dragon Whelp', type: 'dragon', health: 75, maxHealth: 75, attack: 22, defense: 5, description: 'A young dragon' }
        ],
        6: [
            { name: 'Lich', type: 'undead', health: 100, maxHealth: 100, attack: 25, defense: 8, description: 'A powerful undead sorcerer' },
            { name: 'Demon Lord', type: 'demon', health: 110, maxHealth: 110, attack: 28, defense: 7, description: 'A mighty demon lord' }
        ],
        7: [
            { name: 'Lord of the Tomb', type: 'boss', health: 150, maxHealth: 150, attack: 30, defense: 10, description: 'The final boss of the dungeon' }
        ]
    };

    // Scale monster stats based on floor level
    return monsterPools[floor].map(monster => ({
        ...monster,
        health: Math.floor(monster.health * (1 + (floor - 1) * 0.2)),
        maxHealth: Math.floor(monster.maxHealth * (1 + (floor - 1) * 0.2)),
        attack: Math.floor(monster.attack * (1 + (floor - 1) * 0.15)),
        defense: Math.floor(monster.defense * (1 + (floor - 1) * 0.1)),
        isAlive: true
    }));
}

function generateMonsters() {
    const monsterPool = getMonsterPoolForFloor(currentFloor);
    const count = currentFloor === 7 ? 1 : Math.min(3, Math.floor(Math.random() * 3) + 1);
    const monsters = [];

    for (let i = 0; i < count; i++) {
        const monster = { ...monsterPool[Math.floor(Math.random() * monsterPool.length)] };
        monsters.push(monster);
    }

    return monsters;
}

function getMonsterColor(monsterType) {
    const colorMap = {
        'normal': '#8a9b6e',    // Earthy green for basic monsters
        'undead': '#6e8a9b',    // Pale blue for undead
        'spirit': '#9b6e8a',    // Purple for spirits
        'humanoid': '#8a6e9b',  // Dark purple for humanoids
        'construct': '#9b8a6e', // Brown for constructs
        'demon': '#9b6e6e',     // Red for demons
        'dragon': '#6e9b6e',    // Green for dragons
        'boss': '#c41e3a'       // Crimson for boss
    };

    return colorMap[monsterType] || '#888888'; // Default gray if type not found
}

function updateMonsterPositions() {
    if (!inBattleMode) {
        monsterSprites.forEach((sprite, index) => {
            if (!currentMonsters[index] || !currentMonsters[index].isAlive) return;

            // Calculate direction to player
            const dx = playerPosition.x - sprite.x;
            const dy = playerPosition.y - sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Move towards player if within range, otherwise move randomly
            if (distance < 150 && distance > 32) {
                // Move towards player
                sprite.x += (dx / distance) * 2;
                sprite.y += (dy / distance) * 2;
            } else if (distance > 32) {
                // Random movement
                sprite.x += (Math.random() - 0.5) * 4;
                sprite.y += (Math.random() - 0.5) * 4;
            }

            // Keep monsters within bounds
            sprite.x = Math.max(32, Math.min(736, sprite.x));
            sprite.y = Math.max(32, Math.min(436, sprite.y));

            // Update sprite position
            if (sprite.element) {
                sprite.element.style.left = sprite.x + 'px';
                sprite.element.style.top = sprite.y + 'px';
            }
        });
    }
}

function displayMonsterStats(monster) {
    const monsterStats = document.getElementById('monster-stats');
    if (!monsterStats || !monster) return;

    monsterStats.innerHTML = `
        <div class="monster-header">
            <h3>${monster.name}</h3>
            <div class="monster-type">${monster.type}</div>
        </div>
        <div class="monster-health-bar">
            <div class="health-fill" style="width: ${(monster.health / monster.maxHealth) * 100}%"></div>
            <div class="health-text">${monster.health}/${monster.maxHealth} HP</div>
        </div>
        <div class="monster-stats">
            <div>Attack: ${monster.attack}</div>
            <div>Defense: ${monster.defense}</div>
        </div>
        <div class="monster-description">${monster.description}</div>
    `;
    monsterStats.style.display = 'block';
}

function getRequiredMonstersForFloor() {
    // Higher floors require more monsters to be defeated
    const requirements = {
        1: 3,  // First floor: 3 monsters
        2: 4,  // Second floor: 4 monsters
        3: 5,  // Third floor: 5 monsters
        4: 6,  // Fourth floor: 6 monsters
        5: 7,  // Fifth floor: 7 monsters
        6: 8,  // Sixth floor: 8 monsters
        7: 1   // Final floor: Just the boss
    };
    return requirements[currentFloor] || 3;
}

// Add validation for character selection
function selectCharacter(characterType) {
     if (!movesets[characterType]) {
        throw new Error("Invalid character type");
    }
    // ... rest of selection logic
}

// Create popup for displaying object info
function createInfoPopup(title, content) {
    const popup = document.createElement('div');
    popup.className = 'info-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>${title}</h3>
            <div>${content}</div>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// Handle treasure chest click
function handleChestClick(chest) {
    const contextMessage = document.getElementById('context-message');
    const contextButtons = document.getElementById('context-buttons');

    if (!contextMessage || !contextButtons) return;

    // Clear previous buttons
    contextButtons.innerHTML = '';

    const distance = getDistanceToPlayer(chest);

    if (distance < 32) {
        contextMessage.textContent = 'Open the treasure chest?';
        const lootButton = document.createElement('button');
        lootButton.className = 'action-button loot-button';
        lootButton.textContent = 'Open Chest';
        lootButton.onclick = () => {
            lootChest();
            chest.classList.add('looted');
        };
        contextButtons.appendChild(lootButton);
    } else {
        contextMessage.textContent = 'Move closer to open the chest';
    }
}

// Handle monster click
function handleMonsterClick(monster, index) {
    const contextMessage = document.getElementById('context-message');
    const contextButtons = document.getElementById('context-buttons');
    const monsterInfo = document.getElementById('monster-info');

    if (!contextMessage || !contextButtons || !monsterInfo) return;

    // Show tooltip with monster info
    const tooltip = document.createElement('div');
    tooltip.className = 'monster-tooltip';
    tooltip.innerHTML = `
        <h3>${monster.name}</h3>
        <div class="monster-stats">
            <div>Health: ${monster.health}/${monster.maxHealth}</div>
            <div>Attack: ${monster.attack}</div>
            <div>Defense: ${monster.defense}</div>
        </div>
        <div class="monster-description">${monster.description || ''}</div>
    `;

    // Position tooltip near monster sprite
    const sprite = monsterSprites[index];
    if (sprite && sprite.element) {
        const rect = sprite.element.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        document.body.appendChild(tooltip);

        // Remove tooltip after 3 seconds or when clicking elsewhere
        setTimeout(() => tooltip.remove(), 3000);
        document.addEventListener('click', (e) => {
            if (!tooltip.contains(e.target)) {
                tooltip.remove();
            }
        }, { once: true });
    }

    // Update monster info in prompt screen
    monsterInfo.style.display = 'block';
    monsterInfo.innerHTML = `
        <h3>${monster.name}</h3>
        <div class="monster-stats">
            <div>Health: <span class="monster-health-value">${monster.health}</span>/<span class="monster-max-health">${monster.maxHealth}</span></div>
            <div>Attack: ${monster.attack}</div>
            <div>Defense: ${monster.defense}</div>
        </div>
        <div class="monster-description">${monster.description || ''}</div>
    `;

    // Check distance to monster
    const distance = getDistanceToPlayer(sprite.element);

    if (distance < 32) {
        contextMessage.textContent = `Engage ${monster.name} in combat?`;
        const fightButton = document.createElement('button');
        fightButton.className = 'action-button fight-button';
        fightButton.textContent = 'Fight!';
        fightButton.onclick = () => startBattleMode(index);
        contextButtons.appendChild(fightButton);
    } else {
        contextMessage.textContent = `Move closer to engage ${monster.name}`;
    }
}

function updateCombatUI(data) {
    const { player, monster, message, is_crit } = data;

    // Update health bars with smooth animations
    updateHealthBar('player-health', player.health, player.max_health);
    updateHealthBar('monster-health', monster.health, monster.max_health);

    // Update stats
    document.getElementById('player-health').textContent = Math.ceil(player.health);
    document.getElementById('monster-health').textContent = Math.ceil(monster.health);

    // Add combat log message with appropriate styling
    const logEntry = document.createElement('div');
    logEntry.className = is_crit ? 'player-action critical' : 'player-action';
    logEntry.textContent = message;

    const combatLog = document.getElementById('combat-log');
    combatLog.insertBefore(logEntry, combatLog.firstChild);

    // Trim combat log if too long
    while (combatLog.children.length > 50) {
        combatLog.removeChild(combatLog.lastChild);
    }

    // Add hit animation
    if (monster.health > 0) {
        addHitAnimation(document.querySelector('.monster.active'), is_crit);
    } else {
        handleMonsterDefeat(monster);
    }

    // Check for game over
    if (player.health <= 0) {
        handleGameOver();
    }
}

function updateHealthBar(elementId, current, max) {
    const healthBar = document.getElementById(elementId + '-bar');
    const percentage = (current / max) * 100;

    healthBar.style.width = percentage + '%';
    healthBar.style.backgroundColor = getHealthColor(percentage);
}

function getHealthColor(percentage) {
    if (percentage > 50) {
        return `hsl(${120 * (percentage / 100)}, 70%, 45%)`;
    } else {
        return `hsl(${120 * (percentage / 100)}, 70%, 45%)`;
    }
}

function addHitAnimation(element, isCritical) {
    element.classList.add('hit');
    if (isCritical) {
        element.classList.add('critical-hit');

        const critText = document.createElement('div');
        critText.className = 'crit-text';
        critText.textContent = 'CRITICAL!';
        element.appendChild(critText);

        setTimeout(() => {
            element.removeChild(critText);
        }, 1000);
    }

    setTimeout(() => {
        element.classList.remove('hit', 'critical-hit');
    }, 300);
}

function handleMonsterDefeat(monster) {
    const monsterElement = document.querySelector('.monster.active');
    monsterElement.classList.add('monster-dead');

    const defeatText = document.createElement('div');
    defeatText.className = 'defeat-text';
    defeatText.textContent = 'Defeated!';
    monsterElement.appendChild(defeatText);

    setTimeout(() => {
        monsterElement.classList.add('fade-out');
        setTimeout(() => {
            if (monsterElement.parentNode) {
                monsterElement.parentNode.removeChild(monsterElement);
            }
        }, 1000);
    }, 1500);
}

function handleGameOver() {
    const gameOverScreen = document.getElementById('game-over');
    gameOverScreen.style.display = 'flex';
    gameOverScreen.classList.add('fade-in');

    // Disable combat controls
    const actionArea = document.querySelector('.action-area');
    actionArea.style.pointerEvents = 'none';
}

// Add these CSS classes to style.css
const newStyles = `
.hit {
    animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
}

.critical-hit {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
}

.crit-text {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    color: #ffd700;
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
    animation: float-up 1s ease-out forwards;
}

.defeat-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ff3e3e;
    font-size: 32px;
    font-weight: bold;
    text-shadow: 0 0 15px rgba(255, 62, 62, 0.6);
    animation: pulse 1s ease-in-out infinite;
}

.fade-out {
    animation: fadeOut 1s ease-out forwards;
}

.fade-in {
    animation: fadeIn 0.5s ease-in forwards;
}

@keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
}

@keyframes float-up {
    0% { transform: translate(-50%, 0); opacity: 1; }
    100% { transform: translate(-50%, -50px); opacity: 0; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;

// Constants for movement and interaction
const PLAYER_SPEED = 4;
const DOOR_INTERACTION_DISTANCE = 40;
const ROOM_WIDTH = 768;
const ROOM_HEIGHT = 468;

// Function to check for door interactions
function checkDoorInteractions() {
    const door = document.querySelector('.door');
    if (!door) return false;

    const doorRect = door.getBoundingClientRect();
    const playerRect = document.querySelector('.player').getBoundingClientRect();

    const distance = Math.sqrt(
        Math.pow((doorRect.left + doorRect.width/2) - (playerRect.left + playerRect.width/2), 2) +
        Math.pow((doorRect.top + doorRect.height/2) - (playerRect.top + playerRect.height/2), 2)
    );

    if (distance < DOOR_INTERACTION_DISTANCE) {
        door.classList.add('door-active');

        // Get door direction
        const direction = door.classList.contains('north') ? 'north' :
                        door.classList.contains('south') ? 'south' :
                        door.classList.contains('east') ? 'east' : 'west';

        transitionToNewRoom(direction);
        return true;
    } else {
        door.classList.remove('door-active');
        return false;
    }
}

function transitionToNewRoom(direction) {
    const currentRoom = document.querySelector('.room');
    if (!currentRoom) return;

    currentRoom.style.opacity = '0';

    const directions = {
        north: 'northern',
        south: 'southern',
        east: 'eastern',
        west: 'western'
    };

    addToGameLog(`Player moved through ${directions[direction]} door to a new room`, 'movement');

    setTimeout(() => {
        currentRoom.remove();
        const newRoom = createRoom();
        document.querySelector('.game-environment').appendChild(newRoom);

        // Position player based on entry direction
        const playerRect = document.querySelector('.player').getBoundingClientRect();
        const roomRect = newRoom.getBoundingClientRect();

        switch(direction) {
            case 'north':
                playerPosition.x = roomRect.width / 2 - playerRect.width / 2;
                playerPosition.y = roomRect.height - playerRect.height - 40;
                break;
            case 'south':
                playerPosition.x = roomRect.width / 2 - playerRect.width / 2;
                playerPosition.y = 40;
                break;
            case 'east':
                playerPosition.x = 40;
                playerPosition.y = roomRect.height / 2 - playerRect.height / 2;
                break;
            case 'west':
                playerPosition.x = roomRect.width - playerRect.width - 40;
                playerPosition.y = roomRect.height / 2 - playerRect.height / 2;
                break;
        }

        updatePlayerPosition();
        newRoom.style.opacity = '1';
    }, 500);
}

// Add game logging system
function addToGameLog(message, type) {
    const gameLog = document.querySelector('.game-log');
    if (!gameLog) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;

    gameLog.insertBefore(entry, gameLog.firstChild);

    // Keep only last 50 entries for performance
    while (gameLog.children.length > 50) {
        gameLog.removeChild(gameLog.lastChild);
    }
}

class GameHUD {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'game-hud';
        document.body.appendChild(this.container);

        this.initializeHUD();
        this.setupEventListeners();
    }

    initializeHUD() {
        // Create player stats section
        this.statsSection = document.createElement('div');
        this.statsSection.className = 'hud-section';
        this.container.appendChild(this.statsSection);

        // Create game log section
        this.logSection = document.createElement('div');
        this.logSection.className = 'game-log';
        this.container.appendChild(this.logSection);

        // Create interaction panel
        this.interactionPanel = document.createElement('div');
        this.interactionPanel.className = 'interaction-panel';
        this.container.appendChild(this.interactionPanel);

        this.updatePlayerStats();
    }

    updatePlayerStats(stats = {
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        level: 1,
        exp: 0
    }) {
        this.statsSection.innerHTML = `
            <div class="player-stats-container">
                <div class="stat-group">
                    <div class="stat-label">
                        <span>Health</span>
                        <span class="stat-value">${stats.health}/${stats.maxHealth}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-fill health-fill" style="width: ${(stats.health / stats.maxHealth) * 100}%"></div>
                    </div>
                </div>
                <div class="stat-group">
                    <div class="stat-label">
                        <span>Mana</span>
                        <span class="stat-value">${stats.mana}/${stats.maxMana}</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-fill mana-fill" style="width: ${(stats.mana / stats.maxMana) * 100}%"></div>
                    </div>
                </div>
                <div class="stat-label">
                    <span>Level ${stats.level}</span>
                    <span class="stat-value">EXP: ${stats.exp}</span>
                </div>
            </div>
        `;
    }

    addLogEntry(message, type = 'status') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;

        this.logSection.insertBefore(entry, this.logSection.firstChild);

        // Keep only last 50 messages
        while (this.logSection.children.length > 50) {
            this.logSection.removeChild(this.logSection.lastChild);
        }

        // Animate new entry
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(-10px)';
        requestAnimationFrame(() => {
            entry.style.transition = 'all 0.3s ease-out';
            entry.style.opacity = '1';
            entry.style.transform = 'translateX(0)';
        });
    }

    showInteraction(title, actions) {
        this.interactionPanel.innerHTML = `
            <div class="interaction-title">${title}</div>
            <div class="interaction-buttons">
                ${actions.map(action => `
                    <button class="action-button ${action.type}-button" data-action="${action.id}">
                        ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    hideInteraction() {
        this.interactionPanel.innerHTML = '';
    }

    showTooltip(content, x, y) {
        let tooltip = document.querySelector('.game-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'game-tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.innerHTML = `
            <div class="tooltip-title">${content.title}</div>
            <div class="tooltip-content">${content.description}</div>
        `;

        // Position tooltip
        const rect = tooltip.getBoundingClientRect();
        const margin = 10;

        // Keep tooltip within viewport
        x = Math.min(x, window.innerWidth - rect.width - margin);
        y = Math.min(y, window.innerHeight - rect.height - margin);

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    hideTooltip() {
        const tooltip = document.querySelector('.game-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, 20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Handle interaction button clicks
        this.interactionPanel.addEventListener('click', (e) => {
            const button = e.target.closest('.action-button');
            if (button) {
                const actionId = button.dataset.action;
                this.handleAction(actionId);
            }
        });

        // Handle tooltip triggers
        document.addEventListener('mouseover', (e) => {
            const tooltipTrigger = e.target.closest('[data-tooltip]');
            if (tooltipTrigger) {
                const content = JSON.parse(tooltipTrigger.dataset.tooltip);
                this.showTooltip(content, e.clientX + 10, e.clientY + 10);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const tooltipTrigger = e.target.closest('[data-tooltip]');
            if (tooltipTrigger) {
                this.hideTooltip();
            }
        });
    }

    handleAction(actionId) {
        // Dispatch custom event for action handling
        const event = new CustomEvent('game-action', {
            detail: { actionId }
        });
        document.dispatchEvent(event);
    }
}

// Initialize interaction manager
class InteractionManager {
    constructor(gameHUD) {
        this.gameHUD = gameHUD;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('game-action', (e) => {
            this.handleGameAction(e.detail.actionId);
        });
    }

    handleGameAction(actionId) {
        switch (actionId) {
            case 'fight':
                this.startCombat();
                break;
            case 'loot':
                this.handleLoot();
                break;
            case 'interact':
                this.handleInteraction();
                break;
            // Add more action handlers as needed
        }
    }

    startCombat() {
        this.gameHUD.addLogEntry('Entering combat...', 'combat');
        // Add combat initialization logic
    }

    handleLoot() {
        this.gameHUD.addLogEntry('Searching for loot...', 'loot');
        // Add looting logic
    }

    handleInteraction() {
        this.gameHUD.addLogEntry('Interacting...', 'status');
        // Add interaction logic
    }

    showMonsterInteraction(monster) {
        this.gameHUD.showInteraction('Monster Encountered', [
            {
                id: 'fight',
                type: 'fight',
                label: 'Fight',
                icon: 'fas fa-sword'
            },
            {
                id: 'run',
                type: 'interact',
                label: 'Run Away',
                icon: 'fas fa-running'
            }
        ]);
    }

    showChestInteraction(chest) {
        this.gameHUD.showInteraction('Treasure Found', [
            {
                id: 'loot',
                type: 'loot',
                label: 'Open Chest',
                icon: 'fas fa-chest'
            }
        ]);
    }
}

// Initialize the systems
const gameHUD = new GameHUD();
const interactionManager = new InteractionManager(gameHUD);