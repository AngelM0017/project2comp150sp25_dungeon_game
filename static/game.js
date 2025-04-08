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
    if (!selectedCharacterType) return;
    
    if (keys.w) playerPosition.y -= moveSpeed;
    if (keys.s) playerPosition.y += moveSpeed;
    if (keys.a) playerPosition.x -= moveSpeed;
    if (keys.d) playerPosition.x += moveSpeed;
    
    // Keep player within bounds
    playerPosition.x = Math.max(32, Math.min(736, playerPosition.x));
    playerPosition.y = Math.max(32, Math.min(436, playerPosition.y));
    
    updatePlayerPosition();
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
      const gameScreen = document.getElementById('game-screen');
      if (!gameScreen) return;

      // Check if prompt screen already exists
      let promptScreen = document.getElementById('prompt-screen');
      if (!promptScreen) {
        const promptScreenDiv = document.createElement('div');
        promptScreenDiv.id = 'prompt-screen';
        promptScreenDiv.innerHTML = `
          <h2 id="player-name"></h2>
          <div id="health-container">
            <div class="status-label">Health:</div>
            <div class="status-bar">
              <div id="health-bar" class="bar-fill"></div>
            </div>
            <div class="status-text"><span id="player-health">100</span>/<span id="player-max-health">100</span></div>
          </div>
          <div id="mana-container">
            <div class="status-label">Mana:</div>
            <div class="status-bar">
              <div id="mana-bar" class="bar-fill blue"></div>
            </div>
            <div class="status-text"><span id="player-mana">50</span>/<span id="player-max-mana">50</span></div>
          </div>
          <div class="stats-row">
            <div class="stat-item">Attack: <span id="player-attack">0</span></div>
            <div class="stat-item">Defense: <span id="player-defense">0</span></div>
          </div>
          <div class="stats-row">
            <div class="stat-item">Gold: <span id="player-gold">0</span></div>
          </div>
          <div class="floor-info">Floor: <span id="current-floor">1</span></div>
          <div id="monster-info" style="display: none;">
            <h3 id="monster-name"></h3>
            <div id="monster-health-container">
              <div class="status-label">Monster Health:</div>
              <div class="status-bar">
                <div id="monster-health-bar" class="bar-fill red"></div>
              </div>
              <div class="status-text"><span id="monster-health">100</span>/<span id="monster-max-health">100</span></div>
            </div>
            <div class="stats-row">
              <div class="stat-item">Attack: <span id="monster-attack">0</span></div>
              <div class="stat-item">Defense: <span id="monster-defense">0</span></div>
            </div>
            <div id="monster-description" class="monster-desc"></div>
          </div>
          <div id="context-message" class="context-message">Explore the dungeon...</div>
          <div id="context-buttons" class="context-buttons"></div>
        `;
        gameScreen.insertBefore(promptScreenDiv, gameScreen.firstChild);
      }
    }

    // Enhanced function to check proximity interactions with better button creation
    function checkProximityInteractions() {
      const promptScreen = document.getElementById('prompt-screen');
      const contextButtons = document.getElementById('context-buttons');
      const contextMessage = document.getElementById('context-message');

      if (!contextButtons || !contextMessage || !promptScreen) return;

      // Reset state
      promptScreen.className = 'prompt-screen';
      contextButtons.innerHTML = '';
      contextMessage.textContent = 'Explore the dungeon...';

      if (inBattleMode) {
        enterCombatMode();
        return;
      }

      // Check for nearby monsters
      const nearbyMonster = checkNearbyMonsters();
      if (nearbyMonster !== null) {
        contextMessage.textContent = `${currentMonsters[nearbyMonster].name} is nearby!`;

        const fightBtn = document.createElement('button');
        fightBtn.className = 'action-button fight-button urgent-action';
        fightBtn.textContent = '⚔️ Fight';
        // We'll rely on event delegation, but add a data attribute to help identify
        fightBtn.setAttribute('data-monster-index', nearbyMonster);
        contextButtons.appendChild(fightBtn);
        return;
      }

      // Check for nearby treasure chests
      const nearbyChest = checkNearbyChests();
      if (nearbyChest) {
        promptScreen.classList.add('treasure-mode');
        contextMessage.textContent = 'A treasure chest is nearby!';

        const lootBtn = document.createElement('button');
        lootBtn.className = 'action-button loot-button urgent-action';
        lootBtn.textContent = '💰 Loot';
        contextButtons.appendChild(lootBtn);
        return;
      }

      // Default exploration buttons
      const restBtn = document.createElement('button');
      restBtn.className = 'action-button';
      restBtn.textContent = '🧘 Rest';
      contextButtons.appendChild(restBtn);

      if (currentFloor < 7) {
        const searchBtn = document.createElement('button');
        searchBtn.className = 'action-button';
        searchBtn.textContent = '🔍 Search';
        contextButtons.appendChild(searchBtn);
      }
    }

    // Modified function to handle combat button creation
    function enterCombatMode() {
      const promptScreen = document.getElementById('prompt-screen');
      const contextButtons = document.getElementById('context-buttons');
      const contextMessage = document.getElementById('context-message');
      const monsterInfo = document.getElementById('monster-info');

      if (!promptScreen || !contextButtons || !contextMessage || !monsterInfo) return;

      promptScreen.classList.add('combat-mode');
      monsterInfo.style.display = 'block';

      // Find the active monster
      const activeMonsterIndex = currentMonsters.findIndex(m => m.isAlive);
      if (activeMonsterIndex === -1) return;

      const monster = currentMonsters[activeMonsterIndex];

      // Update monster info
      document.getElementById('monster-name').textContent = monster.name;
      document.getElementById('monster-health').textContent = monster.health;
      document.getElementById('monster-max-health').textContent = monster.maxHealth;
      document.getElementById('monster-health-bar').style.width = `${(monster.health / monster.maxHealth) * 100}%`;
      document.getElementById('monster-attack').textContent = monster.attack;
      document.getElementById('monster-defense').textContent = monster.defense;
      document.getElementById('monster-description').textContent = monster.description || '';

      // Set combat message
      contextMessage.textContent = 'Choose your attack:';

      // Generate ability buttons
      const characterMoves = movesets[selectedCharacterType.type];
      for (const moveName in characterMoves) {
        const move = characterMoves[moveName];

        const abilityBtn = document.createElement('button');
        abilityBtn.className = 'action-button ability-button';
        if (moveName === selectedMove) {
          abilityBtn.classList.add('active');
        }

        // Show mana cost for abilities that use mana
        const manaText = move.mana > 0 ? ` (${move.mana} MP)` : '';
        abilityBtn.textContent = `${moveName}${manaText}`;
        abilityBtn.setAttribute('data-move-name', moveName);

        // Disable if not enough mana
        if (move.mana > selectedCharacterType.mana) {
          abilityBtn.disabled = true;
          abilityBtn.style.opacity = '0.5';
        }

        contextButtons.appendChild(abilityBtn);
      }

      // Add attack button after selecting an ability
      const attackBtn = document.createElement('button');
      attackBtn.className = 'action-button fight-button';
      attackBtn.style.width = '100%';
      attackBtn.style.marginTop = '5px';
      attackBtn.textContent = `Attack ${monster.name}`;
      attackBtn.setAttribute('data-monster-index', activeMonsterIndex);
      contextButtons.appendChild(attackBtn);
    }

    // Modified setMove function for better button handling
    function setMove(moveName) {
      selectedMove = moveName;
      document.querySelectorAll('.move-btn, .ability-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(moveName)) {
          btn.classList.add('active');
        }
      });

      // Update description in combat mode
      if (inBattleMode) {
        const characterMoves = movesets[selectedCharacterType.type];
        const move = characterMoves[moveName];
        const damageRange = `${move.damage[0]}-${move.damage[1]}`;
        const manaText = move.mana > 0 ? `Mana cost: ${move.mana}` : 'No mana cost';
        const description = move.description || 'Basic attack';

        let moveInfoText = `${moveName}: ${description} (${damageRange} damage, ${manaText})`;
        if (move.freezeChance) {
          moveInfoText += `, ${Math.round(move.freezeChance * 100)}% freeze chance`;
        }

        addToCombatLog(moveInfoText);
      }
    }

    // Helper function to add combat log entries
    function addToCombatLog(message) {
      const combatLog = document.getElementById('combat-log');
      if (!combatLog) {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen) return;

        const logContainer = document.createElement('div');
        logContainer.id = 'combat-log-container';

        const log = document.createElement('div');
        log.id = 'combat-log';
        logContainer.appendChild(log);

        gameScreen.appendChild(logContainer);
      }

      const combatLogElement = document.getElementById('combat-log');
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = message;
      combatLogElement.appendChild(entry);
      combatLogElement.scrollTop = combatLogElement.scrollHeight;
    }

    // Make selectCharacter available globally
    window.selectCharacter = function(choice) {
        selectedCharacter = choice.toString();
        const buttons = document.querySelectorAll('.character-options button');
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        // Add selected class to clicked button
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
});

// Initialize the prompt screen
function initPromptScreen() {
    // Show the prompt screen
    const promptScreen = document.getElementById('prompt-screen');
    if (!promptScreen) return;

    promptScreen.style.display = 'block';
    document.body.classList.add('prompt-active');
    document.body.classList.remove('prompt-inactive');

    // Hide mana container for non-mana using characters
    if (selectedCharacterType && !['Mage', 'FrostRevenant', 'CelestialMonk'].includes(selectedCharacterType.type)) {
        document.getElementById('mana-container').style.display = 'none';
    } else {
        document.getElementById('mana-container').style.display = 'block';
    }

    updatePlayerStatusDisplay();

    // Set up proximity detection for environmental interactions
    setInterval(checkProximityInteractions, 100);
}

// Update player stats in the prompt screen
function updatePlayerStatusDisplay() {
    if (!selectedCharacterType) return;

    const player = selectedCharacterType;
    document.getElementById('player-name').textContent = `${player.name} (${player.type})`;
    document.getElementById('player-health').textContent = player.health;
    document.getElementById('player-max-health').textContent = player.maxHealth || 100;
    document.getElementById('health-bar').style.width = `${(player.health / (player.maxHealth || 100)) * 100}%`;

    if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(player.type)) {
        document.getElementById('mana-container').style.display = 'block';
        document.getElementById('player-mana').textContent = player.mana;
        document.getElementById('player-max-mana').textContent = player.maxMana || player.mana;
        document.getElementById('mana-bar').style.width = `${(player.mana / (player.maxMana || player.mana)) * 100}%`;
    } else {
        document.getElementById('mana-container').style.display = 'none';
    }

    document.getElementById('player-attack').textContent = Math.round(player.attack);
    document.getElementById('player-defense').textContent = player.defense;
    document.getElementById('current-floor').textContent = currentFloor;
    document.getElementById('player-gold').textContent = player.gold || 0;
}

// Functions to show/hide prompt screen
function hidePromptScreen() {
    const promptScreen = document.getElementById('prompt-screen');
    if (promptScreen) {
        promptScreen.style.display = 'none';
        document.body.classList.remove('prompt-active');
        document.body.classList.add('prompt-inactive');
    }
}

function showPromptScreen() {
    const promptScreen = document.getElementById('prompt-screen');
    if (promptScreen) {
        promptScreen.style.display = 'block';
        document.body.classList.add('prompt-active');
        document.body.classList.remove('prompt-inactive');
    }
}

// Check for nearby interactive elements
function checkProximityInteractions() {
    const promptScreen = document.getElementById('prompt-screen');
    const contextButtons = document.getElementById('context-buttons');
    const contextMessage = document.getElementById('context-message');

    if (!contextButtons || !contextMessage || !promptScreen) return;

    // Reset state
    promptScreen.className = 'prompt-screen';
    contextButtons.innerHTML = '';
    contextMessage.textContent = 'Explore the dungeon...';

    if (inBattleMode) {
        enterCombatMode();
        return;
    }

    // Check for nearby monsters
    const nearbyMonster = checkNearbyMonsters();
    if (nearbyMonster !== null) {
        contextMessage.textContent = `${currentMonsters[nearbyMonster].name} is nearby!`;

        const fightBtn = document.createElement('button');
        fightBtn.className = 'action-button fight-button urgent-action';
        fightBtn.textContent = '⚔️ Fight';
        fightBtn.onclick = () => startBattleMode(nearbyMonster);
        contextButtons.appendChild(fightBtn);
        return;
    }

    // Check for nearby treasure chests
    const nearbyChest = checkNearbyChests();
    if (nearbyChest) {
        promptScreen.classList.add('treasure-mode');
        contextMessage.textContent = 'A treasure chest is nearby!';

        const lootBtn = document.createElement('button');
        lootBtn.className = 'action-button loot-button urgent-action';
        lootBtn.textContent = '💰 Loot';
        lootBtn.onclick = lootChest;
        contextButtons.appendChild(lootBtn);
        return;
    }

    // Default exploration buttons
    const restBtn = document.createElement('button');
    restBtn.className = 'action-button';
    restBtn.textContent = '🧘 Rest';
    restBtn.onclick = restCharacter;
    contextButtons.appendChild(restBtn);

    if (currentFloor < 7) {
        const searchBtn = document.createElement('button');
        searchBtn.className = 'action-button';
        searchBtn.textContent = '🔍 Search';
        searchBtn.onclick = searchArea;
        contextButtons.appendChild(searchBtn);
    }
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
    const promptScreen = document.getElementById('prompt-screen');
    const contextButtons = document.getElementById('context-buttons');
    const contextMessage = document.getElementById('context-message');
    const monsterInfo = document.getElementById('monster-info');

    if (!promptScreen || !contextButtons || !contextMessage || !monsterInfo) return;

    promptScreen.classList.add('combat-mode');
    monsterInfo.style.display = 'block';

    // Find the active monster
    const activeMonsterIndex = currentMonsters.findIndex(m => m.isAlive);
    if (activeMonsterIndex === -1) return;

    const monster = currentMonsters[activeMonsterIndex];

    // Update monster info
    document.getElementById('monster-name').textContent = monster.name;
    document.getElementById('monster-health').textContent = monster.health;
    document.getElementById('monster-max-health').textContent = monster.maxHealth;
    document.getElementById('monster-health-bar').style.width = `${(monster.health / monster.maxHealth) * 100}%`;
    document.getElementById('monster-attack').textContent = monster.attack;
    document.getElementById('monster-defense').textContent = monster.defense;
    document.getElementById('monster-description').textContent = monster.description || '';

    // Set combat message
    contextMessage.textContent = 'Choose your attack:';

    // Generate ability buttons
    const characterMoves = movesets[selectedCharacterType.type];
    for (const moveName in characterMoves) {
        const move = characterMoves[moveName];

        const abilityBtn = document.createElement('button');
        abilityBtn.className = 'action-button ability-button';
        if (moveName === selectedMove) {
            abilityBtn.classList.add('active');
        }

        // Show mana cost for abilities that use mana
        const manaText = move.mana > 0 ? ` (${move.mana} MP)` : '';
        abilityBtn.textContent = `${moveName}${manaText}`;
        abilityBtn.onclick = () => setMove(moveName);

        // Disable if not enough mana
        if (move.mana > selectedCharacterType.mana) {
            abilityBtn.disabled = true;
            abilityBtn.style.opacity = '0.5';
        }

        contextButtons.appendChild(abilityBtn);
    }

    // Add attack button after selecting an ability
    const attackBtn = document.createElement('button');
    attackBtn.className = 'action-button fight-button';
    attackBtn.style.width = '100%';
    attackBtn.style.marginTop = '5px';
    attackBtn.textContent = `Attack ${monster.name}`;
    attackBtn.onclick = () => {
        // Find the proper index for the attack function
        const visibleMonsterIndex = currentMonsters.findIndex(m => m.isAlive) + 1;
        attack(visibleMonsterIndex);
    };
    contextButtons.appendChild(attackBtn);
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
function createRoom(x, y) {
    const room = document.createElement('div');
    room.className = 'room';
    room.dataset.x = x;
    room.dataset.y = y;

    // Add doors
    const northDoor = document.createElement('div');
    northDoor.className = 'door north';
    room.appendChild(northDoor);

    if (y > 0) {
        const southDoor = document.createElement('div');
        southDoor.className = 'door south';
        room.appendChild(southDoor);
    }

    const roomType = Math.random();
    if (roomType < 0.6) { // 60% monster room
        room.dataset.type = ROOM_TYPES.MONSTER;
        spawnMonstersInRoom(room);
    } else if (roomType < 0.8) { // 20% treasure room
        room.dataset.type = ROOM_TYPES.TREASURE;
        createTreasureChest(room);
    } else { // 20% trap room
        room.dataset.type = ROOM_TYPES.TRAP;
        createSlimeTrap(room);
    }

    return room;
}

// Handle room transitions
function transitionToRoom(newX, newY, newPlayerX, newPlayerY) {
    const newRoomKey = `${newX},${newY}`;
    if (!rooms.has(newRoomKey)) {
        const newRoom = createRoom(newX, newY);
        document.querySelector('.game-environment').appendChild(newRoom);
        rooms.set(newRoomKey, newRoom);
    }

    const oldRoomKey = `${currentRoom.x},${currentRoom.y}`;
    const oldRoom = rooms.get(oldRoomKey);
    if (oldRoom) {
        oldRoom.style.transform = newX > currentRoom.x ? 'translateX(-100%)' : 'translateX(100%)';
        oldRoom.style.opacity = '0';
    }

    const newRoom = rooms.get(newRoomKey);
    newRoom.style.transform = 'translateX(0)';
    newRoom.style.opacity = '1';

    currentRoom.x = newX;
    currentRoom.y = newY;
    playerPosition.x = newPlayerX;
    playerPosition.y = newPlayerY;
}

// Create a treasure chest
function createTreasureChest(room) {
    const chest = document.createElement('div');
    chest.className = 'treasure-chest';
    chest.style.left = '50%';
    chest.style.top = '50%';
    chest.style.transform = 'translate(-50%, -50%)';
    room.appendChild(chest);

    chest.addEventListener('mouseover', () => {
        const distance = getDistanceToPlayer(chest);
        if (distance < 32) {
            showLootButton();
        }
    });
}

// Create slime trap
function createSlimeTrap(room) {
    for (let i = 0; i < 20; i++) {
        const slime = document.createElement('div');
        slime.className = 'slime';
        slime.style.left = Math.random() * 100 + '%';
        slime.style.top = Math.random() * 100 + '%';
        room.appendChild(slime);
    }
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
        sprite.addEventListener('click', () => {
            if (inBattleMode) {
                attack(i + 1);
            } else {
                const dx = playerPosition.x - position.x;
                const dy = playerPosition.y - position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 32) {
                    startBattleMode(i);
                } else {
                    addToCombatLog("You're too far away to attack. Move closer!");
                }
            }
        });

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

// Fix createRoom function
function createRoom(index, x, y) {
    const room = document.createElement('div');
    room.className = 'room';
    room.dataset.index = index;
    room.dataset.x = x || 0;
    room.dataset.y = y || 0;

    // Choose room type
    const roomType = Math.random();
    if (roomType < 0.6) { // 60% monster room
        room.dataset.type = ROOM_TYPES.MONSTER;
        // We'll spawn monsters when player enters the room
    } else if (roomType < 0.8) { // 20% treasure room
        room.dataset.type = ROOM_TYPES.TREASURE;
        createTreasureChest(room);
    } else { // 20% trap room
        room.dataset.type = ROOM_TYPES.TRAP;
        createSlimeTrap(room);
    }

    return room;
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
            { name: 'Dark Elf', type: 'humanoid', health: 50, maxHealth: 50, attack: 15, defense: 3, description: 'A cunning dark elf' }
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