export class PongGame {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private paddleWidth = 10;
  private paddleHeight = 100;
  private ballSize = 10;

  private leftPaddle = { x: 10, y: 250, dy: 0 };
  private rightPaddle = { x: 780, y: 250, dy: 0 };
  private ball = { x: 400, y: 300, dx: 3, dy: 3 };

  private grid: boolean[][]; // 2D array to store grid state

  private isPaused: boolean;
  private showPlaySymbol: boolean; // Controls whether the play symbol is visible

  private backgroundImage: HTMLImageElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.grid = Array.from({ length: 9 }, () => Array(16).fill(false));

    // Load the background image
    this.backgroundImage = new Image();
    // TODO: publish with build
    this.backgroundImage.src = 'assets/background.png'; // Replace with your image path
    this.backgroundImage.onload = () => this.draw(); // Redraw once the image is loaded

    this.registerInputListeners();
    this.positionPaddles();

    this.isPaused = true; // Start the game paused
    this.showPlaySymbol = true; // Show play symbol initially

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.positionPaddles();
    });
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
    console.log(this.isPaused ? 'Game paused' : 'Game resumed');

    if (!this.isPaused) {
      // Show the play symbol for 300ms when resuming
      this.showPlaySymbol = true;
      setTimeout(() => {
        this.showPlaySymbol = false;
      }, 300);
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
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 16; col++) {
        if (!this.grid[row][col]) {
          this.context.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        } else {
          // this.context.fillStyle = '#443322'; // Dark gray
          // this.context.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
      }
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

    // Draw the dark gray overlay
    if (this.isPaused) {
      this.context.fillStyle = '#443322'; // Dark gray
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    

    // Reveal the grid cells
    this.drawGrid();
    // Reset compositing to default
    this.context.globalCompositeOperation = 'source-over';

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
    const availableWidth = window.innerWidth - margin * 2;
    const availableHeight = window.innerHeight - margin * 2;

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
