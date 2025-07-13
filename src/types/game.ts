// テトロミノの種類
export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

// セルの型 (テトロミノの種類または空)
export type CellType = TetrominoType | 0;

// 位置情報
export interface Position {
  x: number;
  y: number;
}

// テトロミノの情報
export interface Tetromino {
  type: TetrominoType;
  position: Position;
  shape: number[][];
}

// ゲームの状態
export interface GameState {
  board: CellType[][];
  currentPiece: Tetromino | null;
  nextPiece: TetrominoType;
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  isPaused: boolean;
}

// ゲームのコンテキストタイプ
export interface GameContextType extends Omit<GameState, 'board'> {
  displayBoard: () => CellType[][];
  movePiece: (deltaX: number, deltaY: number) => boolean;
  rotatePiece: () => void;
  hardDrop: () => void;
  togglePause: () => void;
  resetGame: () => void;
}
