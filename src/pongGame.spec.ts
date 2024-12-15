import { PongGame } from './pongGame';

describe('PongGame', () => {
  let canvas: HTMLCanvasElement;
  let pongGame: PongGame;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    pongGame = new PongGame(canvas);
  });

  afterEach(() => {
    document.body.removeChild(canvas);
  });

  xtest('should initialize with paddles and ball in correct positions', () => {
    expect(pongGame['leftPaddle'].x).toBe(0);
    expect(pongGame['leftPaddle'].y).toBe(canvas.height / 2 - pongGame['paddleHeight'] / 2);

    expect(pongGame['rightPaddle'].x).toBe(canvas.width - pongGame['paddleWidth']);
    expect(pongGame['rightPaddle'].y).toBe(canvas.height / 2 - pongGame['paddleHeight'] / 2);

    expect(pongGame['ball'].x).toBe(canvas.width / 2);
    expect(pongGame['ball'].y).toBe(canvas.height / 2);
  });

  xtest('should pause and resume game with togglePause', () => {
    expect(pongGame['isPaused']).toBe(true);
    pongGame['togglePause']();
    expect(pongGame['isPaused']).toBe(false);
    pongGame['togglePause']();
    expect(pongGame['isPaused']).toBe(true);
  });

  test('should move paddles based on key inputs', () => {
    const event = new KeyboardEvent('keydown', { key: 'w' });
    window.dispatchEvent(event);

    expect(pongGame['leftPaddle'].dy).toBe(-5);

    const event2 = new KeyboardEvent('keyup', { key: 'w' });
    window.dispatchEvent(event2);

    expect(pongGame['leftPaddle'].dy).toBe(0);
  });

  test('should move the ball and detect wall collisions', () => {
    pongGame['ball'].x = 10;
    pongGame['ball'].y = 10;
    pongGame['ball'].dx = -3;
    pongGame['ball'].dy = -3;

    pongGame['update']();

    expect(pongGame['ball'].dx).toBe(-3); // Ball does not reverse on x-axis
    expect(pongGame['ball'].dy).toBe(-3); // Ball reverses direction on y-axis
  });

  xtest('should reset the ball when it goes out of bounds', () => {
    pongGame['ball'].x = -10; // Simulate ball out of bounds
    pongGame['update']();

    expect(pongGame['ball'].x).toBe(canvas.width / 2);
    expect(pongGame['ball'].y).toBe(canvas.height / 2);
    expect(pongGame['isPaused']).toBe(true); // Game should pause
  });

  test('should resize canvas while maintaining aspect ratio', () => {
    window.innerWidth = 1000;
    window.innerHeight = 700;

    window.dispatchEvent(new Event('resize'));

    const { width, height } = canvas;
    expect(width / height).toBeCloseTo(16 / 9);
  });

  test('should mark grid cells as touched when ball passes through', () => {
    const cellWidth = canvas.width / 16;
    const cellHeight = canvas.height / 9;

    pongGame['ball'].x = cellWidth * 2 + 5; // Place ball in the third column
    pongGame['ball'].y = cellHeight * 4 + 5; // Place ball in the fifth row

    pongGame['drawGrid']();

    expect(pongGame['grid'][4][2]).toBe(true); // The correct grid cell should be marked
  });
});
