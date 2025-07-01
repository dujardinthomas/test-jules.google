# Simple Snake Game

A classic Snake game implemented using HTML, CSS, and JavaScript. Test your reflexes and see how long you can make your snake grow!

## How to Play

*   **Objective:** Control the snake to eat the red food pellets that appear on the screen. Each pellet eaten makes the snake grow longer.
*   **Controls:**
    *   Use the **Arrow Keys** (Up, Down, Left, Right) on your keyboard to change the snake's direction.
    *   The snake moves continuously.
*   **Game Over:** The game ends if the snake:
    *   Collides with any of the four walls of the game area.
    *   Collides with its own body.
*   **Scoring:** You get 10 points for each food pellet eaten. The game speed will slightly increase as your score gets higher.
*   **Restart:** After a "Game Over", press the **Space Bar** to start a new game.

## Running the Game Locally

1.  **Clone the repository or download the files:**
    *   If you have Git: `git clone <repository-url>`
    *   Alternatively, download the `index.html`, `style.css`, and `script.js` files.
2.  **Open `index.html`:**
    *   Navigate to the directory where you saved the files.
    *   Double-click the `index.html` file, or right-click it and choose "Open with" your preferred web browser (e.g., Chrome, Firefox, Edge, Safari).

The game will then load and be ready to play in your browser.

## Deployment to GitHub Pages

This game is a client-side application and can be easily deployed using GitHub Pages for free. Here's how:

1.  **Ensure your code is on GitHub:**
    *   Push the game files (including `index.html`, `style.css`, `script.js`, and this `README.md`) to a GitHub repository. Make sure `index.html` is at the root of the files you want to deploy.
2.  **Go to Repository Settings:**
    *   Navigate to your repository on GitHub.
    *   Click on the "Settings" tab.
3.  **Configure GitHub Pages:**
    *   In the left sidebar, click on "Pages" (under the "Code and automation" section).
    *   Under "Build and deployment", for the "Source", select "Deploy from a branch".
    *   Under "Branch", select the branch that contains your game files (e.g., `main`, `master`, or `snake-game-v1` if you created a specific branch for it). Ensure the folder is set to `/ (root)`.
    *   Click "Save".
4.  **Access Your Game:**
    *   GitHub Pages will build and deploy your site. This might take a minute or two.
    *   Once deployed, GitHub will provide you with a URL (usually in the format `https://<your-username>.github.io/<repository-name>/`) where you can access and play your Snake game. You'll see this URL displayed on the GitHub Pages settings page.

Enjoy the game!
