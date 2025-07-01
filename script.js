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
    let gameSpeed = 10; // frames per second, can be increased for difficulty


    function drawGameBoard() {
        // Background
        context.fillStyle = '#2d2d2d'; // Dark grey for the game board
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines (optional, can be removed for a cleaner look)
        context.strokeStyle = '#333'; // Slightly lighter grey for grid lines
        for (let x = 0; x <= canvas.width; x += gridSize) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        for (let y = 0; y <= canvas.height; y += gridSize) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
    }

    function drawSnake() {
        context.fillStyle = 'lime'; // Snake color
        snake.forEach(segment => {
            context.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2); // -2 for small gap
        });
    }

    function placeFood() {
        foodX = Math.floor(Math.random() * tileCount);
        foodY = Math.floor(Math.random() * tileCount);

        // Ensure food doesn't spawn on the snake
        for (let segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                placeFood(); // Recursively call if conflict
                return;
            }
        }
    }

    function drawFood() {
        context.fillStyle = 'red'; // Food color
        context.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2); // -2 for small gap
    }

    function updateSnakePosition() {
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        snake.unshift(head); // Add new head

        // Keep snake length
        while (snake.length > tailLength) {
            snake.pop();
        }
    }


    function gameLoop() {
        // Check for game over conditions (will be added later)

        updateSnakePosition();

        // Check if snake eats food
        if (snake[0].x === foodX && snake[0].y === foodY) {
            tailLength++; // Grow snake
            placeFood(); // Place new food
        }

        drawGameBoard(); // Redraw board first
        drawFood();      // Draw food
        drawSnake();     // Then draw the snake on top
        drawScore();

        if (gameOver) {
            displayGameOver();
            return; // Stop the game loop
        }

        setTimeout(gameLoop, 1000 / gameSpeed);
    }

    function handleKeyPress(event) {
        // Prevent snake from immediately reversing
        const goingUp = velocityY === -1;
        const goingDown = velocityY === 1;
        const goingRight = velocityX === 1;
        const goingLeft = velocityX === -1;

        switch (event.key) {
            case 'ArrowUp':
                if (!goingDown) {
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

        // Wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
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
            // Increase speed slightly every 50 points for added difficulty
            if (score % 50 === 0 && gameSpeed < 25) { // Max speed cap
                gameSpeed +=1;
            }
            placeFood();
        }
    }


    // Modify gameLoop to use updateGameLogic
    function gameLoop() {
        updateGameLogic(); // Handles position updates, collisions, food eating

        drawGameBoard();
        drawFood();
        drawSnake();
        drawScore();

        if (gameOver) {
            displayGameOver();
            return;
        }

        setTimeout(gameLoop, 1000 / gameSpeed);
    }


    function initializeGame() {
        gameOver = false;
        score = 0;
        gameSpeed = 10; // Reset speed

        // Initialize snake starting position and tail
        let startX = Math.floor(tileCount / 2);
        let startY = Math.floor(tileCount / 2);
        snake = [{ x: startX, y: startY }];
        tailLength = initialTailLength;
        for(let i = 1; i < initialTailLength; i++) {
            if (startX - i >= 0) {
                snake.push({x: startX - i, y: startY});
            } else {
                 snake.push({x: startX + i, y: startY});
            }
        }

        velocityX = 1; // Start moving right
        velocityY = 0;

        placeFood();
        drawGameBoard();
        drawFood();
        drawSnake();
        drawScore();

        const isRestart = gameOver; // Check before resetting gameOver
        gameOver = false; // Reset gameOver for the new game session
        score = 0;
        gameSpeed = 10;


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
