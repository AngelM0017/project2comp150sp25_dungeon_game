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

function checkCollisions() {
    const monsters = document.querySelectorAll('.monster');
    const player = document.querySelector('.player');
    const treasures = document.querySelectorAll('.treasure');

    monsters.forEach(monster => {
        if (isColliding(player, monster)) {
            monster.remove();
            monstersDefeated++;
            if (monstersDefeated >= 2) {
                unlockFloorProgression();
            }
        }
    });

    treasures.forEach(treasure => {
        if (isColliding(player, treasure)) {
            treasure.remove();
            if (monstersDefeated >= 2) {
                unlockFloorProgression();
            }
        }
    });
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

    initializeGameEnvironment();
}

function initializeGameEnvironment() {
    playerPosition = { x: 400, y: 300 };
    monstersDefeated = 0;

    const gameEnvironment = document.querySelector('.game-environment');
    gameEnvironment.innerHTML = '<div class="player"></div>';

    // Add monsters
    for (let i = 0; i < 2; i++) {
        const monster = document.createElement('div');
        monster.className = 'monster';
        monster.style.left = `${100 + Math.random() * 600}px`;
        monster.style.top = `${100 + Math.random() * 400}px`;
        gameEnvironment.appendChild(monster);
    }

    // Add treasure
    const treasure = document.createElement('div');
    treasure.className = 'treasure';
    treasure.style.left = `${200 + Math.random() * 400}px`;
    treasure.style.top = `${150 + Math.random() * 300}px`;
    gameEnvironment.appendChild(treasure);

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
    if (currentFloor < maxFloor) {
        const stairs = document.createElement('div');
        stairs.className = 'floor-stairs';
        stairs.style.display = 'block';
        document.querySelector('.game-environment').appendChild(stairs);

        stairs.addEventListener('click', () => {
            currentFloor++;
            initializeGameEnvironment();
        });
    }
}

window.selectCharacter = function(choice) {
    document.getElementById('character-name-input').style.display = 'block';
};

window.startGame = startGame;