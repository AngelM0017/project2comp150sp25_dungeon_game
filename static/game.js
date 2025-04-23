class GameHUD {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'game-hud';
        this.container.className = 'game-hud';
        document.body.appendChild(this.container);

        this.currentCharacter = null;
        this.initializeHUD();
    }

    initializeHUD() {
        this.container.innerHTML = `
            <div class="hud-section stats-panel">
                <h2 id="character-name"></h2>
                <div class="primary-stats">
                    <div class="stat-group">
                        <div class="stat-label">Health</div>
                        <div class="stat-bar">
                            <div class="stat-fill health-fill"></div>
                            <div class="stat-text">
                                <span id="current-health">100</span>/<span id="max-health">100</span>
                            </div>
                        </div>
                    </div>
                    <div class="stat-group">
                        <div class="stat-label">Mana</div>
                        <div class="stat-bar">
                            <div class="stat-fill mana-fill"></div>
                            <div class="stat-text">
                                <span id="current-mana">50</span>/<span id="max-mana">50</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="secondary-stats">
                    <div class="stat-row">
                        <div class="stat-item">Level: <span id="char-level">1</span></div>
                        <div class="stat-item">XP: <span id="char-xp">0</span>/<span id="xp-needed">100</span></div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-item">Attack: <span id="char-attack">10</span></div>
                        <div class="stat-item">Defense: <span id="char-defense">5</span></div>
                    </div>
                    <div class="stat-item">Gold: <span id="char-gold">0</span></div>
                </div>
            </div>

            <div class="hud-section abilities-panel">
                <h3>Abilities</h3>
                <div id="ability-list" class="ability-grid"></div>
            </div>

            <div class="hud-section game-log">
                <h3>Adventure Log</h3>
                <div id="log-container"></div>
            </div>
        `;
    }

    updateCharacterInfo(character) {
        this.currentCharacter = character;
        if (!character) return;

        // Update stats panel
        document.getElementById('character-name').textContent = `${character.name} the ${character.type}`;
        this.updateStats(character);
        this.updateAbilities(character);

        // Update the game world character sprite separately
        this.updateCharacterSprite(character);
    }

    updateCharacterSprite(character) {
        const playerSprite = document.querySelector('.player-sprite');
        if (!playerSprite) {
            const sprite = document.createElement('div');
            sprite.className = 'player-sprite';
            document.querySelector('.game-container').appendChild(sprite);
        }

        // Update sprite appearance based on character type
        playerSprite.className = `player-sprite character-${character.type.toLowerCase()}`;
        playerSprite.setAttribute('data-direction', this.currentCharacter.direction);
    }

    updateStats(stats) {
        if (!stats) return;

        // Update health bar
        const healthFill = document.querySelector('.health-fill');
        const currentHealth = document.getElementById('current-health');
        const maxHealth = document.getElementById('max-health');
        if (healthFill && currentHealth && maxHealth) {
            const healthPercent = (stats.health / stats.maxHealth) * 100;
            healthFill.style.width = `${healthPercent}%`;
            currentHealth.textContent = Math.floor(stats.health);
            maxHealth.textContent = stats.maxHealth;
            healthFill.style.backgroundColor = this.getHealthColor(healthPercent);
        }

        // Update mana if applicable
        const manaSection = document.querySelector('.stat-group:nth-child(2)');
        if (manaSection) {
            if (['Mage', 'FrostRevenant', 'CelestialMonk'].includes(stats.type)) {
                manaSection.style.display = 'block';
                const manaFill = document.querySelector('.mana-fill');
                const currentMana = document.getElementById('current-mana');
                const maxMana = document.getElementById('max-mana');
                if (manaFill && currentMana && maxMana) {
                    const manaPercent = (stats.mana / stats.maxMana) * 100;
                    manaFill.style.width = `${manaPercent}%`;
                    currentMana.textContent = Math.floor(stats.mana);
                    maxMana.textContent = stats.maxMana;
                }
            } else {
                manaSection.style.display = 'none';
            }
        }

        // Update other stats
        document.getElementById('char-level').textContent = stats.level || 1;
        document.getElementById('char-xp').textContent = stats.xp || 0;
        document.getElementById('xp-needed').textContent = (stats.level || 1) * 100;
        document.getElementById('char-attack').textContent = Math.floor(stats.attack);
        document.getElementById('char-defense').textContent = stats.defense;
        document.getElementById('char-gold').textContent = stats.gold || 0;
    }

    updateAbilities(character) {
        if (!character || !character.type) return;

        const abilityList = document.getElementById('ability-list');
        if (!abilityList) return;

        const characterMoves = movesets[character.type];
        abilityList.innerHTML = '';

        for (const [moveName, move] of Object.entries(characterMoves)) {
            const abilityCard = document.createElement('div');
            abilityCard.className = 'ability-card';
            if (moveName === selectedMove) {
                abilityCard.classList.add('selected');
            }

            const manaCost = move.mana > 0 ? `<div class="ability-mana-cost">${move.mana} MP</div>` : '';
            const damage = `<div class="ability-damage">${move.damage[0]}-${move.damage[1]} DMG</div>`;

            abilityCard.innerHTML = `
                <div class="ability-header">
                    <div class="ability-name">${moveName}</div>
                    ${manaCost}
                </div>
                <div class="ability-body">
                    ${damage}
                    <div class="ability-description">${move.description}</div>
                    ${move.freezeChance ? `<div class="ability-effect">Freeze: ${move.freezeChance * 100}%</div>` : ''}
                </div>
            `;

            abilityCard.addEventListener('click', () => this.selectAbility(moveName));
            abilityList.appendChild(abilityCard);
        }
    }

    selectAbility(moveName) {
        const cards = document.querySelectorAll('.ability-card');
        cards.forEach(card => card.classList.remove('selected'));

        const selectedCard = Array.from(cards).find(card => 
            card.querySelector('.ability-name').textContent === moveName
        );

        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedMove = moveName;

            // Show ability selection feedback
            this.showNotification(`Selected: ${moveName}`, 'ability');
        }
    }

    getHealthColor(percentage) {
        if (percentage > 60) return '#2ecc71';
        if (percentage > 30) return '#f1c40f';
        return '#e74c3c';
    }

    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('log-container');
        if (!logContainer) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;

        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        const time = new Date();
        timestamp.textContent = `[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}] `;

        entry.appendChild(timestamp);
        entry.appendChild(document.createTextNode(message));
        logContainer.insertBefore(entry, logContainer.firstChild);

        // Limit log entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
}

class InteractionManager {
    constructor(gameHUD) {
        this.gameHUD = gameHUD;
        this.currentInteraction = null;
    }

    showInteraction(type, data) {
        this.currentInteraction = { type, data };
        const panel = this.gameHUD.interactionPanel;
        panel.style.display = 'block';

        switch (type) {
            case 'combat':
                this.setupCombatInteraction(data);
                break;
            case 'chest':
                this.setupChestInteraction(data);
                break;
            case 'npc':
                this.setupNPCInteraction(data);
                break;
        }
    }

    setupCombatInteraction(monster) {
        const panel = this.gameHUD.interactionPanel;
        panel.innerHTML = `
            <h2>${monster.name}</h2>
            <p>Level ${monster.level} Monster</p>
            <div class="interaction-buttons">
                <button class="interaction-button" onclick="game.interaction.attack()">
                    <i class="fas fa-sword"></i> Attack
                </button>
                <button class="interaction-button" onclick="game.interaction.useItem()">
                    <i class="fas fa-flask"></i> Use Item
                </button>
                <button class="interaction-button" onclick="game.interaction.flee()">
                    <i class="fas fa-running"></i> Flee
                </button>
            </div>
        `;
    }

    setupChestInteraction(chest) {
        const panel = this.gameHUD.interactionPanel;
        panel.innerHTML = `
            <h2>Treasure Chest</h2>
            <div class="interaction-buttons">
                <button class="interaction-button" onclick="game.interaction.openChest()">
                    <i class="fas fa-lock-open"></i> Open
                </button>
                <button class="interaction-button" onclick="game.interaction.checkForTraps()">
                    <i class="fas fa-search"></i> Check for Traps
                </button>
            </div>
        `;
    }

    setupNPCInteraction(npc) {
        const panel = this.gameHUD.interactionPanel;
        panel.innerHTML = `
            <h2>${npc.name}</h2>
            <div class="interaction-buttons">
                <button class="interaction-button" onclick="game.interaction.talk()">
                    <i class="fas fa-comments"></i> Talk
                </button>
                <button class="interaction-button" onclick="game.interaction.trade()">
                    <i class="fas fa-exchange-alt"></i> Trade
                </button>
            </div>
        `;
    }

    hideInteraction() {
        this.currentInteraction = null;
        this.gameHUD.interactionPanel.style.display = 'none';
    }

    // Combat actions
    attack() {
        if (this.currentInteraction?.type !== 'combat') return;
        // Implement combat logic here
        this.gameHUD.addLogEntry('You attack the monster!', 'combat');
    }

    useItem() {
        // Implement item usage logic
        this.gameHUD.addLogEntry('Using item...', 'info');
    }

    flee() {
        this.gameHUD.addLogEntry('You attempt to flee!', 'combat');
        this.hideInteraction();
    }

    // Chest actions
    openChest() {
        if (this.currentInteraction?.type !== 'chest') return;
        // Implement chest opening logic
        this.gameHUD.addLogEntry('Opening chest...', 'loot');
        this.gameHUD.showNotification('You found treasure!', 'loot');
    }

    checkForTraps() {
        this.gameHUD.addLogEntry('Checking for traps...', 'info');
    }

    // NPC actions
    talk() {
        if (this.currentInteraction?.type !== 'npc') return;
        // Implement dialogue system
        this.gameHUD.addLogEntry('Starting conversation...', 'info');
    }

    trade() {
        // Implement trading system
        this.gameHUD.addLogEntry('Opening trade window...', 'info');
    }
}

class Game {
    constructor() {
        this.player = {
            x: 400,
            y: 300,
            speed: 5,

    attack() {
        if (this.player.attacking) return;
        
        this.player.attacking = true;
        this.player.attackCooldown = true;

        // Get the player sprite and arm
        const playerSprite = document.querySelector('.player');
        if (!playerSprite) return;

        // Create body parts if they don't exist
        if (!playerSprite.querySelector('.player-body')) {
            playerSprite.innerHTML = `
                <div class="player-body"></div>
                <div class="player-arm left"></div>
                <div class="player-arm right"></div>
            `;
        }

        // Trigger attack animation
        const rightArm = playerSprite.querySelector('.player-arm.right');
        rightArm.classList.add('attacking');

        // Reset attack state after animation
        setTimeout(() => {
            rightArm.classList.remove('attacking');
            this.player.attacking = false;
        }, 300);

        // Reset cooldown
        setTimeout(() => {
            this.player.attackCooldown = false;
        }, 500);
    }

    updatePlayerSprite() {
        const playerSprite = document.querySelector('.player');
        if (!playerSprite) return;

        // Update position and direction
        playerSprite.style.left = `${this.player.x}px`;
        playerSprite.style.top = `${this.player.y}px`;
        playerSprite.setAttribute('data-direction', this.player.direction);

        // Create body parts if they don't exist
        if (!playerSprite.querySelector('.player-body')) {
            playerSprite.innerHTML = `
                <div class="player-body"></div>
                <div class="player-arm left"></div>
                <div class="player-arm right"></div>
            `;
        }

        // Update movement animation
        if (this.player.moving) {
            playerSprite.classList.add('moving');
        } else {
            playerSprite.classList.remove('moving');
        }
    }

            direction: 'south',
            moving: false,
            diagonal: false,
            attacking: false,
            attackCooldown: false
        };

        // Bind attack handler
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.player.attackCooldown) {
                this.attack();
            }
        });

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        this.currentRoom = { x: 0, y: 0 };
        this.visitedRooms = new Set(['0,0']);
        this.roomSize = { width: 1024, height: 768 }; // Updated room size

        this.setupMiniMap();
        this.setupRoomTransition();
        this.bindControls();
    }

    setupMiniMap() {
        this.miniMap = document.createElement('div');
        this.miniMap.className = 'mini-map';
        document.body.appendChild(this.miniMap);
        this.updateMiniMap();
    }

    setupRoomTransition() {
        this.transition = document.createElement('div');
        this.transition.className = 'room-transition';
        document.body.appendChild(this.transition);
    }

    updateMiniMap() {
        this.miniMap.innerHTML = '';
        for (let y = -2; y <= 2; y++) {
            for (let x = -2; x <= 2; x++) {
                const room = document.createElement('div');
                room.className = 'mini-map-room';
                const roomKey = `${this.currentRoom.x + x},${this.currentRoom.y + y}`;

                if (x === 0 && y === 0) {
                    room.classList.add('current');
                }
                if (this.visitedRooms.has(roomKey)) {
                    room.classList.add('visited');
                }

                this.miniMap.appendChild(room);
            }
            this.miniMap.appendChild(document.createElement('br'));
        }
    }

    async changeRoom(direction) {
        this.transition.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 300));

        switch (direction) {
            case 'north':
                this.currentRoom.y--;
                this.player.y = this.roomSize.height - 100;
                break;
            case 'south':
                this.currentRoom.y++;
                this.player.y = 100;
                break;
            case 'west':
                this.currentRoom.x--;
                this.player.x = this.roomSize.width - 100;
                break;
            case 'east':
                this.currentRoom.x++;
                this.player.x = 100;
                break;
        }

        const roomKey = `${this.currentRoom.x},${this.currentRoom.y}`;
        this.visitedRooms.add(roomKey);
        this.updateMiniMap();

        await new Promise(resolve => setTimeout(resolve, 300));
        this.transition.classList.remove('active');
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
                this.player.moving = true;
                this.updatePlayerDirection();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
                this.updatePlayerDirection();

                // Check if any movement keys are still pressed
                if (!Object.values(this.keys).some(key => key)) {
                    this.player.moving = false;
                }
            }
        });
    }

    updatePlayerDirection() {
        const { w, a, s, d } = this.keys;

        // Determine primary direction based on key combinations
        if (w && !s) {
            this.player.direction = 'north';
        } else if (s && !w) {
            this.player.direction = 'south';
        }

        if (a && !d) {
            this.player.direction = 'west';
        } else if (d && !a) {
            this.player.direction = 'east';
        }

        // Set diagonal movement flag
        this.player.diagonal = (w || s) && (a || d);
    }

    updatePlayerPosition() {
        if (!this.player.moving) return;

        const { w, a, s, d } = this.keys;
        let dx = 0;
        let dy = 0;

        // Calculate movement vector
        if (w) dy -= this.player.speed;
        if (s) dy += this.player.speed;
        if (a) dx -= this.player.speed;
        if (d) dx += this.player.speed;

        // Normalize diagonal movement
        if (this.player.diagonal) {
            dx *= 0.707; // Math.cos(45 degrees)
            dy *= 0.707; // Math.sin(45 degrees)
        }

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Check room boundaries and doors
        if (newY < 60 && this.isDoorAt('north')) {
            this.changeRoom('north');
        } else if (newY > this.roomSize.height - 60 && this.isDoorAt('south')) {
            this.changeRoom('south');
        } else if (newX < 60 && this.isDoorAt('west')) {
            this.changeRoom('west');
        } else if (newX > this.roomSize.width - 60 && this.isDoorAt('east')) {
            this.changeRoom('east');
        } else if (newX >= 0 && newX <= this.roomSize.width && 
                   newY >= 0 && newY <= this.roomSize.height) {
            this.player.x = newX;
            this.player.y = newY;
            this.updatePlayerSprite();
        }
    }

    isDoorAt(direction) {
        // This should be replaced with actual door placement logic
        return true; // For testing, assuming doors are always present
    }

    init() {
        // Create game layout
        const gameLayout = document.createElement('div');
        gameLayout.className = 'game-layout';
        document.body.appendChild(gameLayout);

        // Create game container
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        gameLayout.appendChild(gameContainer);

        // Create game world
        const gameWorld = document.createElement('div');
        gameWorld.className = 'game-world';
        gameContainer.appendChild(gameWorld);

        // Initialize game components
        this.generateDungeon();
        this.setupEventListeners();
        this.enterRoom(0, 0);
        this.startGameLoop();

        // Create HUD after game container
        this.hud = new GameHUD();
    }

    startGameLoop() {
        const gameLoop = (timestamp) => {
            if (this.gameState.isPaused) {
                requestAnimationFrame(gameLoop);
                return;
            }

            this.gameState.deltaTime = timestamp - this.gameState.lastUpdate;
            this.gameState.lastUpdate = timestamp;

            this.update();
            this.render();

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    update() {
        if (this.player.moving) {
            this.updatePlayerPosition();
        }
        this.checkCollisions();
        this.updateRoomState();
    }

    checkCollisions() {
        if (!this.roomManager.currentRoom || this.gameState.isInCombat) return;

        const room = this.roomManager.currentRoom;
        const collisionChecks = [
            { items: room.contents.monsters, range: 15, handler: this.initiateCombat.bind(this) },
            { items: room.contents.treasures, range: 10, handler: this.collectTreasure.bind(this) },
            { items: room.contents.traps, range: 8, handler: this.triggerTrap.bind(this) }
        ];

        for (const check of collisionChecks) {
            for (const item of check.items) {
                if (item.collected || item.defeated || item.triggered) continue;

                const distance = this.getDistance(
                    this.player.x,
                    this.player.y,
                    item.x || 50,
                    item.y || 50
                );

                if (distance < check.range) {
                    check.handler(item);
                }
            }
        }
    }

    updateRoomState() {
        const room = this.roomManager.currentRoom;
        if (!room) return;

        // Check if room should be marked as cleared
        if (room.type === 'combat' && 
            room.contents.monsters.every(m => m.defeated)) {
            room.cleared = true;
        }
    }

    setupEventListeners() {
        const handleKeyEvent = (e, isKeyDown) => {
            const key = e.key.toLowerCase();

            if (['w', 's', 'a', 'd'].includes(key)) {
                if (isKeyDown && !this.gameState.isInCombat) {
                    this.player.moving = true;
                    this.player.direction = {
                        w: 'north',
                        s: 'south',
                        a: 'west',
                        d: 'east'
                    }[key];
                } else if (!isKeyDown && this.player.direction === {
                    w: 'north',
                    s: 'south',
                    a: 'west',
                    d: 'east'
                }[key]) {
                    this.player.moving = false;
                }
            }
        };

        document.addEventListener('keydown', e => handleKeyEvent(e, true));
        document.addEventListener('keyup', e => handleKeyEvent(e, false));
    }

    generateDungeon() {
        // Generate initial rooms in a 5x5 grid
        for (let y = -2; y <= 2; y++) {
            for (let x = -2; x <= 2; x++) {
                this.createRoom(x, y);
            }
        }
    }

    createRoom(x, y) {
        const roomKey = `${x},${y}`;
        if (!this.roomManager.rooms.has(roomKey)) {
            const roomType = this.determineRoomType(x, y);
            const room = {
                x,
                y,
                type: roomType,
                doors: this.generateDoors(x, y),
                cleared: false,
                contents: this.generateRoomContents(roomType)
            };
            this.roomManager.rooms.set(roomKey, room);
        }
    }

    generateDoors(x, y) {
        const doors = {
            north: Math.abs(y) < 2,
            south: Math.abs(y) < 2,
            east: Math.abs(x) < 2,
            west: Math.abs(x) < 2
        };
        return doors;
    }

    determineRoomType(x, y) {
        if (x === 0 && y === 0) return 'sanctuary';
        if (Math.abs(x) === 2 && Math.abs(y) === 2) return 'boss';

        const distance = Math.sqrt(x * x + y * y);
        const random = Math.random();

        if (distance > 2) return 'combat';
        if (random < 0.4) return 'combat';
        if (random < 0.6) return 'treasure';
        if (random < 0.8) return 'trap';
        return 'sanctuary';
    }

    generateRoomContents(roomType) {
        const contents = {
            monsters: [],
            treasures: [],
            traps: [],
            events: []
        };

        switch (roomType) {
            case 'combat':
                contents.monsters.push(this.generateMonster());
                break;
            case 'treasure':
                contents.treasures.push(this.generateTreasure());
                break;
            case 'trap':
                contents.traps.push(this.generateTrap());
                break;
            case 'boss':
                contents.monsters.push(this.generateBoss());
                contents.treasures.push(this.generateTreasure());
                break;
        }

        return contents;
    }

    enterRoom(x, y) {
        const roomKey = `${x},${y}`;
        const room = this.roomManager.rooms.get(roomKey);

        if (!room) return false;

        // Add transition effect
        const transition = document.createElement('div');
        transition.className = 'room-transition active';
        document.body.appendChild(transition);

        setTimeout(() => {
            this.roomManager.currentRoom = room;
            this.roomManager.visitedRooms.add(roomKey);

            this.renderRoom(room);
            this.updateMiniMap();

            transition.classList.remove('active');
            setTimeout(() => transition.remove(), 300);

            // Trigger room-specific events
            this.handleRoomEntry(room);
        }, 300);

        return true;
    }

    handleRoomEntry(room) {
        if (room.cleared) return;

        switch (room.type) {
            case 'combat':
                if (room.contents.monsters.length > 0) {
                    this.initiateCombat(room.contents.monsters[0]);
                }
                break;
            case 'trap':
                if (room.contents.traps.length > 0) {
                    this.triggerTrap(room.contents.traps[0]);
                }
                break;
            case 'sanctuary':
                this.applyHealingEffect();
                break;
            case 'boss':
                if (!room.cleared) {
                    this.initiateBossFight();
                }
                break;
        }
    }

    renderRoom(room) {
        const gameWorld = document.querySelector('.game-world');
        gameWorld.innerHTML = '';

        // Create room element
        const roomElement = document.createElement('div');
        roomElement.className = `room ${room.type}-room`;
        roomElement.setAttribute('data-room-type', room.type);

        // Create room content container
        const roomContent = document.createElement('div');
        roomContent.className = 'room-content';
        roomElement.appendChild(roomContent);

        // Add doors
        Object.entries(room.doors).forEach(([direction, exists]) => {
            if (exists) {
                const door = document.createElement('div');
                door.className = `door ${direction} ${this.isDoorAccessible(room, direction) ? 'accessible' : ''}`;
                door.addEventListener('click', () => this.useDoor(direction));
                roomContent.appendChild(door);
            }
        });

        // Add player sprite if not exists
        let playerSprite = document.querySelector('.player');
        if (!playerSprite) {
            playerSprite = document.createElement('div');
            playerSprite.className = 'player';
            roomContent.appendChild(playerSprite);
        }

        // Update player position
        playerSprite.style.left = `${this.player.x}px`;
        playerSprite.style.top = `${this.player.y}px`;
        playerSprite.setAttribute('data-direction', this.player.direction);
        if (this.player.moving) {
            playerSprite.classList.add('moving');
        } else {
            playerSprite.classList.remove('moving');
        }

        // Add room contents
        this.renderRoomContents(roomContent, room);

        gameWorld.appendChild(roomElement);
    }

    renderRoomContents(container, room) {
        // Render monsters
        room.contents.monsters.forEach(monster => {
            if (!monster.defeated) {
                const monsterElement = document.createElement('div');
                monsterElement.className = `monster-sprite ${monster.type.toLowerCase()}`;
                monsterElement.style.left = `${monster.x || 50}%`;
                monsterElement.style.top = `${monster.y || 50}%`;
                container.appendChild(monsterElement);
            }
        });

        // Render treasures
        room.contents.treasures.forEach(treasure => {
            if (!treasure.collected) {
                const treasureElement = document.createElement('div');
                treasureElement.className = 'treasure-chest';
                treasureElement.style.left = `${treasure.x || 50}%`;
                treasureElement.style.top = `${treasure.y || 50}%`;
                container.appendChild(treasureElement);
            }
        });

        // Render traps
        room.contents.traps.forEach(trap => {
            if (!trap.triggered) {
                const trapElement = document.createElement('div');
                trapElement.className = 'trap-indicator';
                trapElement.style.left = `${trap.x || 50}%`;
                trapElement.style.top = `${trap.y || 50}%`;
                container.appendChild(trapElement);
            }
        });

        // Render special events
        room.contents.events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-marker ${event.type}`;
            eventElement.style.left = `${event.x || 50}%`;
            eventElement.style.top = `${event.y || 50}%`;
            container.appendChild(eventElement);
        });
    }

    isDoorAccessible(room, direction) {
        const nextCoords = this.getNextRoomCoords(room.x, room.y, direction);
        const nextRoomKey = `${nextCoords.x},${nextCoords.y}`;
        return this.roomManager.rooms.has(nextRoomKey);
    }

    getNextRoomCoords(x, y, direction) {
        switch (direction) {
            case 'north': return { x, y: y + 1 };
            case 'south': return { x, y: y - 1 };
            case 'east': return { x: x + 1, y };
            case 'west': return { x: x - 1, y };
        }
    }

    useDoor(direction) {
        const currentRoom = this.roomManager.currentRoom;
        if (!currentRoom || !currentRoom.doors[direction]) return;

        const nextCoords = this.getNextRoomCoords(currentRoom.x, currentRoom.y, direction);
        this.enterRoom(nextCoords.x, nextCoords.y);
    }

    // Placeholder methods for game mechanics
    generateMonster() {
        return { type: 'monster', health: 50, damage: 10 };
    }

    generateBoss() {
        return { type: 'boss', health: 200, damage: 25 };
    }

    generateTreasure() {
        return { type: 'chest', contents: 'gold' };
    }

    generateTrap() {
        return { type: 'spike', damage: 15 };
    }

    initiateCombat(monster) {
        this.showMessage(`Entering combat with ${monster.type}!`);
    }

    triggerTrap(trap) {
        this.showMessage(`Triggered ${trap.type} trap!`);
        this.player.health -= trap.damage;
    }

    applyHealingEffect() {
        this.showMessage('Healing in sanctuary...');
        this.player.health = Math.min(this.player.health + 30, this.player.maxHealth);
        this.player.mana = Math.min(this.player.mana + 20, this.player.maxMana);
    }

    initiateBossFight() {
        this.showMessage('Boss battle initiated!');
    }

    showMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    updatePlayerSprite() {
        const playerSprite = document.querySelector('.player');
        if (!playerSprite) return;

        playerSprite.style.left = `${this.player.x}px`;
        playerSprite.style.top = `${this.player.y}px`;
        playerSprite.setAttribute('data-direction', this.player.direction);

        if (this.player.moving) {
            playerSprite.classList.add('moving');
        } else {
            playerSprite.classList.remove('moving');
        }
    }
}

// Initialize game
const game = new Game();