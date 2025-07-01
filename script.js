// Basic structure, will be filled in later
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    const gridSize = 20; // Size of each grid cell in pixels
    const tileCount = 20; // Number of tiles in width and height

    canvas.width = gridSize * tileCount;
    canvas.height = gridSize * tileCount;

    // Snake variables
    let snake = [
        { x: 10, y: 10 } // Initial position of the snake's head (in grid units)
    ];
    let velocityX = 0;
    let velocityY = 0;
    const initialTailLength = 3; // Initial number of segments including head
    let tailLength = initialTailLength;

    // Food variables
    let foodX;
    let foodY;

    // Game state
    let score = 0;
    let gameOver = false;
    let gameSpeed = 12; // frames per second, can be increased for difficulty

    // Obstacles
    let obstacles = [];
    const numObstacles = 5; // Number of obstacles

    // Shrinking Play Area
    let minPlayX = 0;
    let maxPlayX = tileCount;
    let minPlayY = 0;
    let maxPlayY = tileCount;
    let shrinkInterval = 100; // Shrink area every 100 points
    let nextShrinkScore = shrinkInterval;
    const minPlayableSize = 10; // Minimum width/height for the play area

    // Bonus/Malus Items
    const itemTypes = {
        BONUS_POINTS: 'bonus_points',
        MALUS_SLOW: 'malus_slow',
        MALUS_FAST: 'malus_fast',
        MALUS_REVERSE_CONTROLS: 'malus_reverse_controls'
        // Future: MALUS_SHRINK_SNAKE, BONUS_INVINCIBILITY etc.
    };
    let activeItems = []; // {x, y, type, lifetime, effectDuration}
    const maxItemsOnScreen = 2;
    const itemSpawnChance = 0.002; // Reduced chance per game tick to spawn an item
    const itemDefaultLifetime = 300; // Ticks item stays on screen (e.g., 300 ticks / 10-30fps = 10-30s)
    const itemEffectDuration = 200; // Ticks an effect lasts (e.g., 200 ticks / 10-30fps = 6-20s)

    // Active effects
    let effects = {
        [itemTypes.MALUS_SLOW]: 0, // duration ticks remaining
        [itemTypes.MALUS_FAST]: 0,
        [itemTypes.MALUS_REVERSE_CONTROLS]: 0
    };


    function drawGameBoard() {
        // Full canvas background (slightly different from play area to show shrinkage)
        context.fillStyle = '#202020';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Active play area background
        context.fillStyle = '#2d2d2d'; // Dark grey for the game board
        context.fillRect(minPlayX * gridSize, minPlayY * gridSize, (maxPlayX - minPlayX) * gridSize, (maxPlayY - minPlayY) * gridSize);

        // Grid lines only within the active play area
        context.strokeStyle = '#333'; // Slightly lighter grey for grid lines
        for (let x = minPlayX * gridSize; x <= maxPlayX * gridSize; x += gridSize) {
            if (x >= minPlayX * gridSize && x <= maxPlayX * gridSize) { // Ensure lines are within bounds
                 context.beginPath();
                 context.moveTo(x, minPlayY * gridSize);
                 context.lineTo(x, maxPlayY * gridSize);
                 context.stroke();
            }
        }
        for (let y = minPlayY * gridSize; y <= maxPlayY * gridSize; y += gridSize) {
             if (y >= minPlayY * gridSize && y <= maxPlayY * gridSize) { // Ensure lines are within bounds
                context.beginPath();
                context.moveTo(minPlayX * gridSize, y);
                context.lineTo(maxPlayX * gridSize, y);
                context.stroke();
             }
        }
    }

    function drawSnake() {
        context.fillStyle = 'lime'; // Snake color
        snake.forEach(segment => {
            context.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2); // -2 for small gap
        });
    }

    function placeFood() {
        // Place food within the current active play area
        foodX = minPlayX + Math.floor(Math.random() * (maxPlayX - minPlayX));
        foodY = minPlayY + Math.floor(Math.random() * (maxPlayY - minPlayY));

        // Ensure food doesn't spawn on the snake
        for (let segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                placeFood(); // Recursively call if conflict
                return;
            }
        }
        // Ensure food doesn't spawn on an obstacle
        for (let obs of obstacles) {
            if (obs.x === foodX && obs.y === foodY) {
                placeFood(); // Recursively call if conflict
                return;
            }
        }
    }

    function drawFood() {
        context.fillStyle = 'red'; // Food color
        context.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2); // -2 for small gap
    }

    function createObstacles() {
        obstacles = [];
        for (let i = 0; i < numObstacles; i++) {
            let obsX, obsY, validPlacement;
            do {
                validPlacement = true;
                // Obstacles should also spawn within the initial play area,
                // though they might end up outside as it shrinks.
                // For simplicity, we'll keep them spawning within the overall tileCount at start.
                // More advanced: spawn within current minPlayX/maxPlayX if game starts shrunk.
                obsX = Math.floor(Math.random() * tileCount);
                obsY = Math.floor(Math.random() * tileCount);

                // Avoid spawning on initial snake position
                for (let segment of snake) {
                    if (segment.x === obsX && segment.y === obsY) {
                        validPlacement = false;
                        break;
                    }
                }
                // Avoid spawning too close to initial snake head (e.g. within 2 blocks)
                if (Math.abs(obsX - snake[0].x) < 3 && Math.abs(obsY - snake[0].y) < 3) {
                    validPlacement = false;
                }

                // Avoid spawning on other obstacles
                for (let existingObs of obstacles) {
                    if (existingObs.x === obsX && existingObs.y === obsY) {
                        validPlacement = false;
                        break;
                    }
                }
            } while (!validPlacement);
            obstacles.push({ x: obsX, y: obsY });
        }
    }

    function drawObstacles() {
        context.fillStyle = 'grey'; // Obstacle color
        obstacles.forEach(obs => {
            context.fillRect(obs.x * gridSize, obs.y * gridSize, gridSize - 1, gridSize - 1); // Slightly smaller for visual distinction
        });
    }

    function updateSnakePosition() {
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        snake.unshift(head); // Add new head

        // Keep snake length
        while (snake.length > tailLength) {
            snake.pop();
        }
    }

    // Removed duplicated gameLoop here

    function handleKeyPress(event) {
        const isReversed = effects[itemTypes.MALUS_REVERSE_CONTROLS] > 0;

        // Prevent snake from immediately reversing (logic needs to account for reversed controls)
        const goingUp = velocityY === -1;
        const goingDown = velocityY === 1;
        const goingRight = velocityX === 1;
        const goingLeft = velocityX === -1;

        let key = event.key;

        // If controls are reversed, map arrow keys to their opposites
        if (isReversed) {
            if (key === 'ArrowUp') key = 'ArrowDown';
            else if (key === 'ArrowDown') key = 'ArrowUp';
            else if (key === 'ArrowLeft') key = 'ArrowRight';
            else if (key === 'ArrowRight') key = 'ArrowLeft';
        }

        switch (key) {
            case 'ArrowUp':
                if (!goingDown) { // Still check against actual current movement
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (!goingUp) {
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (!goingRight) {
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (!goingLeft) {
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
             case ' ': // Space bar to restart if game over
                if (gameOver) {
                    initializeGame();
                }
                break;
        }
    }

    function checkCollisions() {
        const head = snake[0];

        // Updated Wall collision (using dynamic play area boundaries)
        if (head.x < minPlayX || head.x >= maxPlayX || head.y < minPlayY || head.y >= maxPlayY) {
            gameOver = true;
            return;
        }

        // Self collision (check if head collides with any other segment)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver = true;
                return;
            }
        }

        // Obstacle collision
        for (let obs of obstacles) {
            if (head.x === obs.x && head.y === obs.y) {
                gameOver = true;
                return;
            }
        }
    }

    function drawScore() {
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText("Score: " + score, 10, canvas.height - 10);
    }

    function displayGameOver() {
        context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.font = '40px Arial';
        context.textAlign = 'center';
        context.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
        context.font = '20px Arial';
        context.fillText('Your Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
        context.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 50);
    }

    function updateGameLogic() {
        if (gameOver) return;

        updateSnakePosition();
        checkCollisions();

        // Check if snake eats food
        if (!gameOver && snake[0].x === foodX && snake[0].y === foodY) {
            tailLength++;
            score += 10; // Increase score
            // --- Speed Adjustments ---
            // Increase speed more aggressively: every 30 points, and by a larger increment initially.
            // Max speed cap increased to 30.
            if (score % 30 === 0) {
                if (gameSpeed < 15) {
                    gameSpeed += 2; // Faster increase at lower speeds
                } else if (gameSpeed < 25) {
                    gameSpeed += 1;
                } else if (gameSpeed < 30) { // Max speed cap
                    gameSpeed +=1;
                }
            }
            placeFood();
        }

        // Check and apply play area shrink
        if (score >= nextShrinkScore) {
            shrinkPlayArea();
            nextShrinkScore += shrinkInterval;
        }

        // Item logic
        spawnItem(); // Attempt to spawn new items
        updateItems(); // Update lifetimes and active effects

        // Check if snake collects an item
        const head = snake[0];
        for (let i = activeItems.length - 1; i >= 0; i--) {
            const item = activeItems[i];
            if (head.x === item.x && head.y === item.y) {
                applyItemEffect(item);
                activeItems.splice(i, 1); // Remove collected item
                break;
            }
        }
    }

    function shrinkPlayArea() {
        const currentWidth = maxPlayX - minPlayX;
        const currentHeight = maxPlayY - minPlayY;

        if (currentWidth > minPlayableSize) {
            minPlayX++;
            maxPlayX--;
        }
        if (currentHeight > minPlayableSize) {
            minPlayY++;
            maxPlayY--;
        }

        // Ensure snake head is not immediately out of bounds after shrink.
        // If it is, it's game over (handled by checkCollisions in the next frame).
        // Obstacles might become out of bounds, which is fine, they become non-interactive.
        // Food might become out of bounds, new food will be placed correctly.
        console.log(`Play area shrunk: X(${minPlayX}-${maxPlayX}), Y(${minPlayY}-${maxPlayY})`);
    }

    function spawnItem() {
        if (activeItems.length >= maxItemsOnScreen || Math.random() > itemSpawnChance) {
            return;
        }

        let itemX, itemY, validPlacement;
        const availableItemTypes = Object.values(itemTypes);
        const type = availableItemTypes[Math.floor(Math.random() * availableItemTypes.length)];

        do {
            validPlacement = true;
            itemX = minPlayX + Math.floor(Math.random() * (maxPlayX - minPlayX));
            itemY = minPlayY + Math.floor(Math.random() * (maxPlayY - minPlayY));

            if (itemX === foodX && itemY === foodY) validPlacement = false;
            for (let segment of snake) if (segment.x === itemX && segment.y === itemY) validPlacement = false;
            for (let obs of obstacles) if (obs.x === itemX && obs.y === itemY) validPlacement = false;
            for (let existingItem of activeItems) if (existingItem.x === itemX && existingItem.y === itemY) validPlacement = false;

        } while (!validPlacement);

        activeItems.push({ x: itemX, y: itemY, type: type, lifetime: itemDefaultLifetime });
        console.log(`Spawned item: ${type} at (${itemX}, ${itemY})`);
    }

    function drawItems() {
        activeItems.forEach(item => {
            switch (item.type) {
                case itemTypes.BONUS_POINTS: context.fillStyle = 'gold'; break;
                case itemTypes.MALUS_SLOW: context.fillStyle = 'cyan'; break;
                case itemTypes.MALUS_FAST: context.fillStyle = 'orange'; break;
                case itemTypes.MALUS_REVERSE_CONTROLS: context.fillStyle = 'purple'; break;
                default: context.fillStyle = 'white';
            }
            context.fillRect(item.x * gridSize, item.y * gridSize, gridSize - 2, gridSize - 2);
            // Maybe draw a letter or symbol on item too
            context.fillStyle = 'black';
            context.font = `${gridSize*0.6}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            let symbol = '?';
            if(item.type === itemTypes.BONUS_POINTS) symbol = '$';
            if(item.type === itemTypes.MALUS_SLOW) symbol = 'S';
            if(item.type === itemTypes.MALUS_FAST) symbol = 'F';
            if(item.type === itemTypes.MALUS_REVERSE_CONTROLS) symbol = 'R';
            context.fillText(symbol, item.x * gridSize + gridSize / 2, item.y * gridSize + gridSize / 2 + 1);

        });
    }

    function updateItems() {
        for (let i = activeItems.length - 1; i >= 0; i--) {
            activeItems[i].lifetime--;
            if (activeItems[i].lifetime <= 0) {
                activeItems.splice(i, 1);
                console.log("Item expired");
            }
        }

        // Update active effects
        for (const effectType in effects) {
            if (effects[effectType] > 0) {
                effects[effectType]--;
                if (effects[effectType] === 0) {
                    console.log(`Effect ${effectType} wore off.`);
                    // Reset specific things if needed when effect wears off, e.g. speed
                    if(effectType === itemTypes.MALUS_FAST || effectType === itemTypes.MALUS_SLOW) {
                        // Recalculate base speed based on score
                        // This is a bit tricky as speed is modified directly.
                        // For now, we'll let it return to score-based speed naturally next time food is eaten.
                        // A better way would be to store baseSpeed and modifier.
                    }
                }
            }
        }
    }

    function applyItemEffect(item) {
        console.log(`Collected item: ${item.type}`);
        switch (item.type) {
            case itemTypes.BONUS_POINTS:
                score += 50; // Bonus points!
                // Potentially trigger speed update logic if it depends on score
                if (score >= nextShrinkScore) { // Check shrink condition again after score change
                     shrinkPlayArea();
                     nextShrinkScore += shrinkInterval;
                 }
                break;
            case itemTypes.MALUS_SLOW:
                effects[itemTypes.MALUS_SLOW] = itemEffectDuration;
                break;
            case itemTypes.MALUS_FAST:
                effects[itemTypes.MALUS_FAST] = itemEffectDuration;
                break;
            case itemTypes.MALUS_REVERSE_CONTROLS:
                effects[itemTypes.MALUS_REVERSE_CONTROLS] = itemEffectDuration;
                break;
        }
    }

    function getEffectiveGameSpeed() {
        let currentSpeed = gameSpeed;
        if (effects[itemTypes.MALUS_SLOW] > 0) {
            currentSpeed = Math.max(5, gameSpeed - 5); // Significantly slower, but not too slow
        }
        if (effects[itemTypes.MALUS_FAST] > 0) {
            currentSpeed = Math.min(40, gameSpeed + 10); // Significantly faster
        }
        return currentSpeed;
    }


    // Modify gameLoop to use updateGameLogic
    function gameLoop() {
        updateGameLogic(); // Handles position updates, collisions, food eating, item logic

        drawGameBoard();
        drawObstacles(); // Draw obstacles
        drawItems();     // Draw items
        drawFood();
        drawSnake();
        drawScore(); // Also draw active effects here

        if (effects[itemTypes.MALUS_REVERSE_CONTROLS] > 0) {
            context.fillStyle = 'purple';
            context.font = '18px Arial';
            context.textAlign = 'center';
            context.fillText('Controls Reversed!', canvas.width / 2, 25);
        }
         if (effects[itemTypes.MALUS_FAST] > 0) {
            context.fillStyle = 'orange';
            context.font = '18px Arial';
            context.textAlign = 'center';
            context.fillText('FAST!', canvas.width / 2, 45);
        }
         if (effects[itemTypes.MALUS_SLOW] > 0) {
            context.fillStyle = 'cyan';
            context.font = '18px Arial';
            context.textAlign = 'center';
            context.fillText('SLOW!', canvas.width / 2, 45);
        }


        if (gameOver) {
            displayGameOver();
            return;
        }

        setTimeout(gameLoop, 1000 / getEffectiveGameSpeed()); // Use effective game speed
    }

    // Removed duplicated initializeGame here

    function initializeGame() {
        // This is the start of the correct initializeGame
        const isRestart = gameOver; // Check before resetting gameOver
        gameOver = false; // Reset gameOver for the new game session
        score = 0;
        // --- Speed Adjustments ---
        gameSpeed = 12; // Increased initial speed (was 10)

        // Reset play area boundaries
        minPlayX = 0;
        maxPlayX = tileCount;
        minPlayY = 0;
        maxPlayY = tileCount;
        nextShrinkScore = shrinkInterval; // Reset shrink score trigger

        // Reset items and effects
        activeItems = [];
        for (const effectType in effects) {
            effects[effectType] = 0;
        }

        // Initialize snake starting position and tail first
        let startX = Math.floor(tileCount / 2);
        let startY = Math.floor(tileCount / 2);
        snake = [{ x: startX, y: startY }];
        tailLength = initialTailLength;
        for(let i = 1; i < initialTailLength; i++) {
            if (startX - i >= 0) {
                snake.push({x: startX - i, y: startY});
            } else {
                 snake.push({x: startX + i, y: startY}); // Should rarely happen with centered start
            }
        }

        createObstacles(); // Create obstacles after snake is initialized

        velocityX = 1; // Start moving right
        velocityY = 0;

        placeFood(); // Place food after obstacles are set


        if (isRestart) {
            console.log("Game restarted.");
        } else {
            console.log("Snake game initialized.");
        }

        // Remove previous listener to avoid multiple initializations on restart
        document.removeEventListener('keydown', handleKeyPress);
        document.addEventListener('keydown', handleKeyPress);

        // Start the game loop
        gameLoop();
    }

    // Initial call to start the game when the script loads
    initializeGame();
});
