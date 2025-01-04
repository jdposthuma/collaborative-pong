import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import './PongGame.css';

interface PongGameProps {
  width?: number;
  height?: number;
}

export const PongGame: React.FC<PongGameProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const [isPaused, setIsPaused] = useState(true);
  const [showPlaySymbol, setShowPlaySymbol] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highestLevelAttempted, setHighestLevelAttempted] = useState(1);
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  const paddleWidth = 10;
  const paddleHeight = 100;
  const ballSize = 10;

  const [leftPaddle, setLeftPaddle] = useState({ x: 10, y: 250, dy: 0 });
  const [rightPaddle, setRightPaddle] = useState({ x: 780, y: 250, dy: 0 });
  const [ball, setBall] = useState({ x: 400, y: 300, dx: 3, dy: 3 });
  const [grid, setGrid] = useState<boolean[][]>(
    Array.from({ length: 9 }, () => Array(16).fill(false))
  );

  const backgroundImageRef = useRef<HTMLImageElement>(new Image());

  const showWelcomePopup = () => {
    createPopup(
      'Welcome to Pong! Use W/S for left paddle and Arrow Up/Down for right paddle. Press Space to start.',
      'Got it!'
    );
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    contextRef.current = canvasRef.current.getContext('2d');
    resizeCanvas();
    loadState();
    loadLevel(highestLevelAttempted);
    positionPaddles();

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    showWelcomePopup();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleResize = () => {
    resizeCanvas();
    positionPaddles();
  };

  const resizeCanvas = () => {
    if (!canvasRef.current) return;

    const margin = 48;
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

  const positionPaddles = () => {
    if (!canvasRef.current) return;

    // Center paddles vertically
    setLeftPaddle(prev => ({
      ...prev,
      y: canvasRef.current!.height / 2 - paddleHeight / 2,
      x: 0
    }));

    setRightPaddle(prev => ({
      ...prev,
      y: canvasRef.current!.height / 2 - paddleHeight / 2,
      x: canvasRef.current!.width - paddleWidth
    }));
  };

  const createPopup = (message: string, closeButtonText: string): void => {
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

  const shootConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 150,
      origin: { x: 0.5, y: 0.3 },
      ticks: 500,
    });
  };

  const resetGame = () => {
    localStorage.removeItem('highestLevelAttempted');
    window.location.reload();
  };

  const persistState = () => {
    localStorage.setItem('highestLevelAttempted', highestLevelAttempted.toString());
  };

  const loadState = () => {
    const saved = localStorage.getItem('highestLevelAttempted');
    setHighestLevelAttempted(saved ? parseInt(saved) : 1);
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

  const draw = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const context = contextRef.current;
    const canvas = canvasRef.current;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image
    if (backgroundImageRef.current.complete) {
      context.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
    }

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
    if (isPaused && showPlaySymbol) {
      drawPlaySymbol();
    }
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

  const resetGrid = () => {
    setGrid(Array.from({ length: 9 }, () => Array(16).fill(false)));
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

  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (!isPaused) {
      if (isLevelComplete) {
        loadLevel(currentLevel + 1);
      }
      setShowPlaySymbol(false);
      start();
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

  return (
    <div className="pong-game">
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
      <div className="game-controls">
        <button onClick={resetGame}>Reset Game</button>
        <div className="level-navigation">
          {Array.from({ length: 3 }, (_, i) => (
            <button
              key={i}
              disabled={i + 1 > highestLevelAttempted}
              onClick={() => loadLevel(i + 1)}
              className={currentLevel === i + 1 ? 'active' : ''}
            >
              Level {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
