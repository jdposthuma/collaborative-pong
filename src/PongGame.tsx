import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import './PongGame.css';

interface PongGameProps {
  width?: number;
  height?: number;
}

interface PopupProps {
  message: string;
  closeButtonText: string;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, closeButtonText, onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup">
        <p dangerouslySetInnerHTML={{ __html: message }} />
        <button className="popup-close" onClick={onClose}>
          {closeButtonText}
        </button>
      </div>
    </div>
  );
};

export const PongGame: React.FC<PongGameProps> = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const backgroundImageRef = useRef<HTMLImageElement>(new Image());

  // Game state
  const [isPaused, setIsPaused] = useState(true);
  const [showPlaySymbol, setShowPlaySymbol] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highestLevelAttempted, setHighestLevelAttempted] = useState(1);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  // Constants
  const paddleWidth = 10;
  const paddleHeight = 100;
  const ballSize = 10;

  // Game objects state
  const [leftPaddle, setLeftPaddle] = useState({ x: 10, y: 250, dy: 0 });
  const [rightPaddle, setRightPaddle] = useState({ x: 780, y: 250, dy: 0 });
  const [ball, setBall] = useState({ x: 400, y: 300, dx: 3, dy: 3 });

  // Add grid state that we'll need
  const [grid, setGrid] = useState<boolean[][]>(
    Array.from({ length: 9 }, () => Array(16).fill(false))
  );

  const loadState = () => {
    const saved = localStorage.getItem('highestLevelAttempted');
    setHighestLevelAttempted(saved ? parseInt(saved) : 1);
  };

  const persistState = () => {
    localStorage.setItem('highestLevelAttempted', highestLevelAttempted.toString());
  };

  const resetGrid = () => {
    setGrid(Array.from({ length: 9 }, () => Array(16).fill(false)));
  };

  const loadLevel = (level: number) => {
    setCurrentLevel(level);
    setHighestLevelAttempted(prev => Math.max(prev, level));
    setIsLevelComplete(false);
    persistState();

    backgroundImageRef.current.src = `assets/background-level-${level}.png`;
    backgroundImageRef.current.onload = () => draw();
    
    resetGrid();
    resetBall();
  };

  const resetBall = () => {
    if (!canvasRef.current) return;
    setBall({
      x: canvasRef.current.width / 2,
      y: canvasRef.current.height / 2,
      dx: (Math.random() > 0.5 ? 1 : -1) * 3,
      dy: (Math.random() > 0.5 ? 1 : -1) * 3
    });
  };

  const resizeCanvas = () => {
    if (!canvasRef.current) return;
    
    const margin = 48; // 3em in pixels
    const header = document.getElementById('header');
    const headerHeight = header?.offsetHeight || 0;
    const gameInfo = document.getElementById('game-info');
    const gameInfoHeight = gameInfo?.offsetHeight || 0;
    const availableWidth = window.innerWidth - margin * 2;
    const availableHeight = window.innerHeight - headerHeight - gameInfoHeight - margin * 2;

    // Maintain 16:9 aspect ratio
    if (availableWidth / availableHeight > 16 / 9) {
      canvasRef.current.height = availableHeight;
      canvasRef.current.width = (16 / 9) * availableHeight;
    } else {
      canvasRef.current.width = availableWidth;
      canvasRef.current.height = (9 / 16) * availableWidth;
    }
  };

  const handleResize = () => {
    resizeCanvas();
    positionPaddles();
  };

  const positionPaddles = () => {
    if (!canvasRef.current) return;
    
    // Center paddles vertically
    const newY = canvasRef.current.height / 2 - paddleHeight / 2;
    
    setLeftPaddle(prev => ({
      ...prev,
      y: newY,
      x: 0 // Left paddle at the left edge
    }));

    setRightPaddle(prev => ({
      ...prev,
      y: newY,
      x: canvasRef.current!.width - paddleWidth // Right paddle at the right edge
    }));
  };

  const drawPlaySymbol = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const context = contextRef.current;
    const canvas = canvasRef.current;

    if (showPlaySymbol) {
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.font = '80px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('▶', canvas.width / 2, canvas.height / 2);
    }
  };

  const drawGrid = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const context = contextRef.current;
    const canvas = canvasRef.current;

    const cellWidth = canvas.width / 16;
    const cellHeight = canvas.height / 9;

    // Calculate the grid cell containing the ball
    const ballCol = Math.floor(ball.x / cellWidth);
    const ballRow = Math.floor(ball.y / cellHeight);

    // Mark the cell as "transparent" if the ball touches it
    if (ballRow >= 0 && ballRow < 9 && ballCol >= 0 && ballCol < 16) {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[ballRow][ballCol] = true;
        return newGrid;
      });
    }

    // Change the compositing mode to "destination-out" to erase the overlay
    context.globalCompositeOperation = 'destination-out';

    // Reveal touched cells
    context.fillStyle = 'rgba(0, 0, 0, 1)';
    let isComplete = true;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 16; col++) {
        if (!grid[row][col]) {
          isComplete = false;
          context.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    if (isComplete && !isLevelComplete) {
      setIsLevelComplete(true);
      confetti({
        particleCount: 150,
        spread: 150,
        origin: { x: 0.5, y: 0.3 },
        ticks: 500,
      });
    }

    // Reset compositing to default
    context.globalCompositeOperation = 'source-over';
  };

  const draw = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const context = contextRef.current;
    const canvas = canvasRef.current;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image
    if (backgroundImageRef.current.complete) {
      context.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Reveal the grid cells
    drawGrid();

    // Draw paddles
    context.fillStyle = 'white';
    context.fillRect(leftPaddle.x, leftPaddle.y, paddleWidth, paddleHeight);
    context.fillRect(rightPaddle.x, rightPaddle.y, paddleWidth, paddleHeight);

    // Draw the ball
    context.font = '20px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('🎾', ball.x, ball.y);

    // Draw play symbol when paused
    if (isPaused) {
      drawPlaySymbol();
    }
  };

  const update = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Move paddles
    setLeftPaddle(prev => ({
      ...prev,
      y: Math.max(0, Math.min(canvas.height - paddleHeight, prev.y + prev.dy))
    }));

    setRightPaddle(prev => ({
      ...prev,
      y: Math.max(0, Math.min(canvas.height - paddleHeight, prev.y + prev.dy))
    }));

    // Move ball
    setBall(prev => {
      let newDx = prev.dx;
      let newDy = prev.dy;
      let newX = prev.x + prev.dx;
      let newY = prev.y + prev.dy;

      // Ball collision with top and bottom walls
      if (newY <= 0 || newY >= canvas.height - ballSize) {
        newDy *= -1;
      }

      // Ball collision with paddles
      if (
        newX <= leftPaddle.x + paddleWidth &&
        newY + ballSize >= leftPaddle.y &&
        newY <= leftPaddle.y + paddleHeight
      ) {
        newDx *= -1;
      }

      if (
        newX + ballSize >= rightPaddle.x &&
        newY + ballSize >= rightPaddle.y &&
        newY <= rightPaddle.y + paddleHeight
      ) {
        newDx *= -1;
      }

      // Ball out of bounds
      if (newX <= 0 || newX >= canvas.width) {
        togglePause();
        resetBall();
        return prev;
      }

      return { ...prev, x: newX, y: newY, dx: newDx, dy: newDy };
    });
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (isPaused) {
      if (isLevelComplete) {
        loadLevel(currentLevel + 1);
      }
      setShowPlaySymbol(false);
      start();
    }
  };

  const start = () => {
    const gameLoop = () => {
      if (!isPaused) {
        update();
        draw();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };
    gameLoop();
  };

  // Add keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        togglePause();
      } else {
        switch (e.key) {
          case 'w':
            setLeftPaddle(prev => ({ ...prev, dy: -5 }));
            break;
          case 's':
            setLeftPaddle(prev => ({ ...prev, dy: 5 }));
            break;
          case 'ArrowUp':
            setRightPaddle(prev => ({ ...prev, dy: -5 }));
            break;
          case 'ArrowDown':
            setRightPaddle(prev => ({ ...prev, dy: 5 }));
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'w':
        case 's':
          setLeftPaddle(prev => ({ ...prev, dy: 0 }));
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          setRightPaddle(prev => ({ ...prev, dy: 0 }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused, isLevelComplete, currentLevel]); // Dependencies for togglePause

  // Initial canvas setup
  useEffect(() => {
    if (!canvasRef.current) return;
    
    contextRef.current = canvasRef.current.getContext('2d');
    resizeCanvas();
    loadState();
    loadLevel(highestLevelAttempted);
    positionPaddles();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const resetGame = () => {
    localStorage.removeItem('highestLevelAttempted');
    setHighestLevelAttempted(1);
    setCurrentLevel(1);
    loadLevel(1);
  };

  // Add this effect to show welcome popup
  useEffect(() => {
    if (showWelcomePopup) {
      setIsPaused(true);
      setShowPlaySymbol(true);
    }
  }, [showWelcomePopup]);

  return (
    <div className="pong-game">
      {showWelcomePopup && (
        <Popup
          message="Welcome to Collaborative Pong!<br/><br/>Player 1 (left) controls the paddle with 'w' and 's'. Player 2 (right) uses the arrow keys.<br/><br/>Use space bar to start."
          closeButtonText="Play"
          onClose={() => setShowWelcomePopup(false)}
        />
      )}
      <div id="game-info">
        <nav className="breadcrumb">
          {Array.from({ length: 10 }, (_, i) => (
            <a
              href="#"
              key={i}
              className={`
                ${currentLevel === i + 1 ? 'active' : ''}
                ${i + 1 > highestLevelAttempted ? 'disabled' : ''}
              `}
              onClick={(e) => {
                e.preventDefault();
                if (i + 1 <= highestLevelAttempted) {
                  loadLevel(i + 1);
                }
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </a>
          ))}
        </nav>
        <button 
          id="reset-button" 
          className="secondary"
          onClick={resetGame}
        >
          Reset
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
    </div>
  );
}; 