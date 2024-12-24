import confetti from 'canvas-confetti';

export class PongGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private paddleWidth = 10;
  private paddleHeight = 100;
  private ballSize = 10;

  private leftPaddle = { x: 10, y: 250, dy: 0 };
  private rightPaddle = { x: 780, y: 250, dy: 0 };
  private ball = { x: 400, y: 300, dx: 3, dy: 3 };

  private grid: boolean[][] = Array.from({ length: 9 }, () => Array(16).fill(false));; // 2D array to store grid state
  private highestLevelAttempted = 1;
  private currentLevel = 1;
  private isLevelComplete = false;

  private isPaused: boolean;
  private showPlaySymbol: boolean; // Controls whether the play symbol is visible

  private backgroundImage: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.resizeCanvas();

    this.backgroundImage = new Image();
    this.loadState();
    this.loadLevel(this.highestLevelAttempted);

    this.registerInputListeners();
    this.positionPaddles();

    this.isPaused = true; // Start the game paused
    this.showPlaySymbol = true; // Show play symbol initially

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.positionPaddles();
    });

    document.querySelectorAll('.breadcrumb a').forEach((link, index) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.loadLevel(index + 1);
      });
    });

    // Show popup automatically when the page loads
    document.addEventListener('DOMContentLoaded', () => {
      this.createPopup("Welcome to Collaborative Pong!<br/><br/>Player 1 (left) controls the paddle with 'w' and 's'. Player 2 (right) uses the arrow keys.<br/><br/>Use space bar to start.", 'Play');
    });

    const resetButton = document.getElementById('reset-button');
    resetButton?.addEventListener('click', this.resetButtonClick);

  }

  private shootConfetti() {
    confetti({
      particleCount: 150,
      spread: 150,
      origin: { x: 0.5, y: 0.3 },
      ticks: 500,
    });
  };


  private resetButtonClick() {
    localStorage.removeItem('highestLevelAttempted');
    window.location.reload();
  }

  private persistState() {
    localStorage.setItem('highestLevelAttempted', this.highestLevelAttempted.toString());
  }

  private loadState() {
    const highestLevelAttempted = localStorage.getItem('highestLevelAttempted');
    this.highestLevelAttempted = highestLevelAttempted ? parseInt(highestLevelAttempted) : 1;
  }

  private loadLevel(level: number) {
    this.currentLevel = level;
    this.highestLevelAttempted = Math.max(this.highestLevelAttempted, this.currentLevel);
    if (this.currentLevel === this.highestLevelAttempted) {
      this.isLevelComplete = false;
    }
    this.persistState();

    const nav = document.querySelector('.breadcrumb');
    const links = nav?.querySelectorAll('a');

    links?.forEach((link, index) => {
      if (index + 1 <= this.highestLevelAttempted) {
        link.classList.remove('disabled'); // Enable the link
      } else {
        link.classList.add('disabled'); // Disable the link
      }

      if (index + 1 === this.currentLevel) {
        link.classList.add('active'); // Highlight the current level
      }
    });

    this.backgroundImage.src = `assets/background-level-${this.currentLevel}.png`; // Replace with your image path
    this.backgroundImage.onload = () => this.draw(); // Redraw once the image is loaded
    this.resetGrid();
    this.resetBall()
  }

  private drawPlaySymbol() {
    if (this.showPlaySymbol) {
      this.context.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
      this.context.font = '80px Arial';
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText('▶', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  private togglePause() {
    this.isPaused = !this.isPaused;

    if (!this.isPaused) {

      if (this.isLevelComplete) {
        this.loadLevel(this.currentLevel + 1);
      }

      this.showPlaySymbol = false;
      this.start();
    }
  }

  private registerInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.togglePause();
      } else {
        switch (e.key) {
          case 'w':
            this.leftPaddle.dy = -5;
            break;
          case 's':
            this.leftPaddle.dy = 5;
            break;
          case 'ArrowUp':
            this.rightPaddle.dy = -5;
            break;
          case 'ArrowDown':
            this.rightPaddle.dy = 5;
            break;
        }
      }

    });

    window.addEventListener('keyup', (e) => {
      switch (e.key) {
        case 'w':
        case 's':
          this.leftPaddle.dy = 0;
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          this.rightPaddle.dy = 0;
          break;
      }
    });
  }

  private update() {
    // Move paddles
    this.leftPaddle.y += this.leftPaddle.dy;
    this.rightPaddle.y += this.rightPaddle.dy;

    // Keep paddles on screen
    this.leftPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.leftPaddle.y));
    this.rightPaddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, this.rightPaddle.y));

    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with top and bottom walls
    if (this.ball.y <= 0 || this.ball.y >= this.canvas.height - this.ballSize) {
      this.ball.dy *= -1;
    }

    // Ball collision with paddles
    if (
      this.ball.x <= this.leftPaddle.x + this.paddleWidth &&
      this.ball.y + this.ballSize >= this.leftPaddle.y &&
      this.ball.y <= this.leftPaddle.y + this.paddleHeight
    ) {
      this.ball.dx *= -1;
    }

    if (
      this.ball.x + this.ballSize >= this.rightPaddle.x &&
      this.ball.y + this.ballSize >= this.rightPaddle.y &&
      this.ball.y <= this.rightPaddle.y + this.paddleHeight
    ) {
      this.ball.dx *= -1;
    }

    // Ball out of bounds
    if (this.ball.x <= 0 || this.ball.x >= this.canvas.width) {
      this.togglePause(); // Pause the game
      this.resetBall();
    }
  }

  private resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 3;
    this.ball.dy = (Math.random() > 0.5 ? 1 : -1) * 3;
  }

  private drawGrid() {
    const cellWidth = this.canvas.width / 16;
    const cellHeight = this.canvas.height / 9;

    // Calculate the grid cell containing the ball
    const ballCol = Math.floor(this.ball.x / cellWidth);
    const ballRow = Math.floor(this.ball.y / cellHeight);

    // Mark the cell as "transparent" if the ball touches it
    if (ballRow >= 0 && ballRow < 9 && ballCol >= 0 && ballCol < 16) {
      this.grid[ballRow][ballCol] = true;
    }

    // Change the compositing mode to "destination-out" to erase the overlay
    this.context.globalCompositeOperation = 'destination-out';

    // Reveal touched cells
    this.context.fillStyle = 'rgba(0, 0, 0, 1)'; // Semi-transparent white
    var isLevelComplete = true;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 16; col++) {
        if (!this.grid[row][col]) {
          isLevelComplete = false;
          this.context.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        } else {
          // this.context.fillStyle = '#443322'; // Dark gray
          // this.context.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    if (isLevelComplete) {
      this.togglePause();
      this.isLevelComplete = true;
      this.shootConfetti();
    }

    // Reset compositing to default
    this.context.globalCompositeOperation = 'source-over';
  }

  private draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the background image
    if (this.backgroundImage.complete) {
      this.context.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    // Reveal the grid cells
    this.drawGrid();

    // Draw paddles
    this.context.fillStyle = 'white';
    this.context.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.paddleWidth, this.paddleHeight);
    this.context.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.paddleWidth, this.paddleHeight);

    // Draw the ball
    this.context.font = '20px Arial';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText('🎾', this.ball.x, this.ball.y);

    // Draw play symbol when paused
    if (this.isPaused) {
      this.drawPlaySymbol();
    }
  }

  private resetGrid() {
    this.grid = Array.from({ length: 9 }, () => Array(16).fill(false));
  }

  private resizeCanvas() {
    const margin = 48; // 3em in pixels
    const header = document.getElementById('header');
    const headerHeight = header?.offsetHeight || 0;
    const gameInfo = document.getElementById('game-info');
    const gameInfoHeight = gameInfo?.offsetHeight || 0;
    const availableWidth = window.innerWidth - margin * 2;
    const availableHeight = window.innerHeight - headerHeight - gameInfoHeight - margin * 2;

    // Maintain 16:9 aspect ratio
    if (availableWidth / availableHeight > 16 / 9) {
      this.canvas.height = availableHeight;
      this.canvas.width = (16 / 9) * availableHeight;
    } else {
      this.canvas.width = availableWidth;
      this.canvas.height = (9 / 16) * availableWidth;
    }
  }

  private positionPaddles() {
    // Center paddles vertically
    this.leftPaddle.y = this.canvas.height / 2 - this.paddleHeight / 2;
    this.rightPaddle.y = this.canvas.height / 2 - this.paddleHeight / 2;

    // Position paddles horizontally
    this.leftPaddle.x = 0; // Left paddle at the left edge
    this.rightPaddle.x = this.canvas.width - this.paddleWidth; // Right paddle at the right edge
  }

  private createPopup(message: string, closeButtonText: string): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    // Create popup content
    const popup = document.createElement('div');
    popup.className = 'popup';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.innerText = closeButtonText;
    closeButton.onclick = () => document.body.removeChild(overlay);

    // Message
    const content = document.createElement('p');
    content.innerHTML = message;

    // Append elements
    popup.appendChild(content);
    popup.appendChild(closeButton);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  public start() {
    const gameLoop = () => {
      this.update();
      this.draw();
      if (this.isPaused) {
        return;
      }
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
}
