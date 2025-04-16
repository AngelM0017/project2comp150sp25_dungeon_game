document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // Initialize game layout
    const gameLayout = document.createElement('div');
    gameLayout.className = 'game-layout';
    document.body.appendChild(gameLayout);

    // Create game world
    const gameWorld = document.createElement('div');
    gameWorld.className = 'game-world';
    gameLayout.appendChild(gameWorld);

    // Create game environment
    const gameEnvironment = document.createElement('div');
    gameEnvironment.className = 'game-environment';
    gameWorld.appendChild(gameEnvironment);

    // Create prompt screen
    const promptScreen = document.createElement('div');
    promptScreen.className = 'prompt-screen';
    gameLayout.appendChild(promptScreen);

    // Create movement boundary
    const movementBoundary = document.createElement('div');
    movementBoundary.className = 'movement-boundary';
    gameWorld.appendChild(movementBoundary);

    // Initialize the game
    game.init();
}); 