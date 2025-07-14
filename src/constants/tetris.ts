// Tetris game constants
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 18; // Reduced from 20 to 18

export const CELL_SIZE = 30; // Size of each cell in pixels
export const NEXT_PIECE_SIZE = 4; // Size of the next piece preview

export const LINE_POINTS = [0, 40, 100, 300, 1200]; // Points for clearing 0-4 lines

export const LEVEL_SPEED = [
  800, 720, 630, 550, 470, 380, 300, 220, 130, 100,
  80, 80, 80, 70, 70, 70, 50, 50, 30, 30,
  20, 20, 20, 10, 10, 5, 5, 5, 3, 3, 1
]; // Drop speed in ms per level
