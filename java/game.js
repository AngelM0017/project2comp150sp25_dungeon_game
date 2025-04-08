
// Game state variables
const gameState = {
    selectedCharacter: null,
    selectedCharacterType: null,
    currentMonsters: [],
    selectedMove: 'Basic Attack',
    inBattleMode: false,
    currentFloor: 1,
    monsterSprites: [],
    playerPosition: { x: 400, y: 300 },
    currentRoom: { x: 0, y: 0 },
    rooms: new Map(),
    moveSpeed: 5,
    defeatedMonstersInFloor: 0,
    totalRoomsInFloor: 0
};

// Moveset configurations
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

// Room type constants
const ROOM_TYPES = {
    MONSTER: 'monster',
    TREASURE: 'treasure',
    TRAP: 'trap'
};

// Game initialization
document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
    setupEventListeners();
    createPromptScreen();
    addButtonStyles();
}

function setupEventListeners() {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyPress);
    addButtonClickability();
}

function handleGlobalClick(event) {
    const target = event.target;
    
    if (target.classList.contains('character-btn')) {
        handleCharacterSelection(target);
    } else if (target.classList.contains('action-button')) {
        handleActionButton(target);
    } else if (target.classList.contains('monster-sprite')) {
        handleMonsterClick(target);
    } else if (target.classList.contains('treasure-chest')) {
        handleTreasureClick(target);
    }
}

function handleKeyPress(event) {
    if (!gameState.inBattleMode) {
        handleMovement(event);
    }
}

function handleMovement(event) {
    const key = event.key.toLowerCase();
    const moveMap = {
        'w': () => gameState.playerPosition.y = Math.max(0, gameState.playerPosition.y - gameState.moveSpeed),
        's': () => gameState.playerPosition.y = Math.min(468, gameState.playerPosition.y + gameState.moveSpeed),
        'a': () => gameState.playerPosition.x = Math.max(0, gameState.playerPosition.x - gameState.moveSpeed),
        'd': () => gameState.playerPosition.x = Math.min(768, gameState.playerPosition.x + gameState.moveSpeed)
    };

    if (moveMap[key]) {
        moveMap[key]();
        updatePlayerPosition();
        checkProximityInteractions();
    }
}

// Export game state and functions
export {
    gameState,
    movesets,
    ROOM_TYPES,
    initializeGame,
    handleGlobalClick,
    handleKeyPress
};
