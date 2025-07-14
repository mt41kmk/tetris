import { useState, useEffect, useCallback, useRef } from 'react';
import { BOARD_HEIGHT, BOARD_WIDTH, LINE_POINTS } from '../constants/tetris';

// テトロミノの種類
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

// セルの型 (テトロミノの種類または空)
type CellType = TetrominoType | 0;

// テトロミノの形状を表す型
type TetrominoShape = number[][];

// テトロミノのテンプレート
interface TetrominoTemplate {
  shape: TetrominoShape;
  color: string;
}

// 位置情報
interface Position {
  x: number;
  y: number;
}

// テトロミノの情報
interface Tetromino {
  type: TetrominoType;
  position: Position;
  shape: TetrominoShape;
}

// テトロミノの型
interface Tetromino {
  type: TetrominoType;
  position: Position;
  shape: number[][];
  color: string;
}

// ゲームの状態
interface GameState {
  board: CellType[][];
  currentPiece: Tetromino | null;
  nextPiece: TetrominoType;
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  isPaused: boolean;
}

// テトロミノの形状を定義
const TETROMINOS: Record<TetrominoType, TetrominoTemplate> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'tetris-cyan',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'tetris-blue',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'tetris-orange',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'tetris-yellow',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'tetris-green',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'tetris-purple',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'tetris-red',
  },
};

// 空のボードを生成する関数
const createEmptyBoard = (): CellType[][] => {
  return Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(0));
};

// ランダムなテトロミノを取得
const randomTetromino = (): TetrominoType => {
  const tetrominos = Object.keys(TETROMINOS) as TetrominoType[];
  return tetrominos[Math.floor(Math.random() * tetrominos.length)];
};

// ゲームの初期状態
const getInitialState = (): GameState => {
  const nextPiece = randomTetromino();
  const initialBoard = createEmptyBoard();
  
  return {
    board: initialBoard,
    currentPiece: null,
    nextPiece,
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isPaused: false,
  };
};

const initialState: GameState = getInitialState();

// テトロミノの形状をディープコピー
const deepCopyShape = (shape: number[][]): number[][] => {
  return shape.map(row => [...row]);
};

// ボードのディープコピーを作成するヘルパー関数
const deepCopyBoard = (board: CellType[][]): CellType[][] => {
  return board.map(row => [...row]);
};

const useTetris = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const dropCounter = useRef<number>(0);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number>(0);

  // 衝突判定（最適化版）
  const checkCollision = useCallback((position: Position, shape: TetrominoShape, board: CellType[][]) => {
    const { x: posX, y: posY } = position;
    const boardHeight = board.length;
    const boardWidth = board[0]?.length || 0;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        // 空でないセルのみチェック
        if (shape[y][x] !== 0) {
          const newX = posX + x;
          const newY = posY + y;
          
          // ボードの境界チェック
          if (newX < 0 || newX >= boardWidth || newY >= boardHeight) {
            return true;
          }
          
          // ボード内かつ既存のブロックとの衝突チェック
          if (newY >= 0 && board[newY]?.[newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // 新しいピースを生成
  const spawnNewPiece = useCallback((board: CellType[][], pieceType: TetrominoType = randomTetromino()): Tetromino | null => {
    const tetromino = TETROMINOS[pieceType];
    const newPiece: Tetromino = {
      type: pieceType,
      position: { x: 3, y: 0 },
      shape: deepCopyShape(tetromino.shape),
      color: tetromino.color
    };
    
    // 新しいピースがボードと衝突する場合はゲームオーバー
    if (checkCollision(newPiece.position, newPiece.shape, board)) {
      return null;
    }
    
    return newPiece;
  }, [checkCollision]);

  // ラインをクリア
  const clearLines = useCallback((board: CellType[][]): { board: CellType[][], linesCleared: number } => {
    const newBoard = board.map(row => [...row]);
    const linesToClear = board.reduce<number[]>((acc, row, y) => {
      if (row.every(cell => cell !== 0)) acc.push(y);
      return acc;
    }, []);
    
    if (!linesToClear.length) return { board: newBoard, linesCleared: 0 };
    
    // 消去する行を削除し、先頭に空行を追加
    linesToClear
      .sort((a, b) => b - a)
      .forEach(lineIndex => newBoard.splice(lineIndex, 1));
    
    // 消去した行の数だけ空行を先頭に追加
    newBoard.unshift(...Array(linesToClear.length).fill(0).map(() => Array(BOARD_WIDTH).fill(0) as CellType[]));
    
    // ボードのサイズをBOARD_HEIGHT行に調整
    while (newBoard.length > BOARD_HEIGHT) newBoard.pop();
    
    return { board: newBoard, linesCleared: linesToClear.length };
  }, []);

  // ゲームの状態を更新
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({
      ...prev,
      ...updates,
      ...(updates.lines !== undefined && { 
        level: Math.max(1, Math.floor(updates.lines / 10) + 1) 
      })
    }));
  }, []);

  // テトロミノを移動
  const movePiece = useCallback((deltaX: number, deltaY: number): boolean => {
    setGameState((prevState: GameState): GameState => {
      // ゲームオーバー、ポーズ中、または現在のピースがない場合は何もしない
      if (prevState.isGameOver || prevState.isPaused || !prevState.currentPiece) {
        return { ...prevState };
      }

      const { currentPiece, board, level, lines, nextPiece } = prevState;
      if (!currentPiece) return { ...prevState };
      const newPosition = {
        x: currentPiece.position.x + deltaX,
        y: currentPiece.position.y + deltaY,
      } as const;

      // 移動可能かチェック
      if (!checkCollision(newPosition, currentPiece.shape, board)) {
        // 移動可能な場合は位置を更新
        const updatedPiece: Tetromino = {
          ...currentPiece,
          position: newPosition,
        };
        return {
          ...prevState,
          currentPiece: updatedPiece,
        };
      }

      // 下方向への移動で衝突した場合、ピースを固定
      if (deltaY > 0) {
        // 現在のボードのディープコピーを作成
        const newBoard = deepCopyBoard(board);
        
        // 現在のピースをボードに固定
        for (let y = 0; y < currentPiece.shape.length; y++) {
          for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
              const boardY = currentPiece.position.y + y;
              const boardX = currentPiece.position.x + x;
              
              // ボードの範囲内かチェック（念のため）
              if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                // テトロミノのタイプを保存
                newBoard[boardY][boardX] = currentPiece.type;
              }
            }
          }
        }

        // ラインをクリア
        const { board: updatedBoard, linesCleared } = clearLines(newBoard);
        const newLines = lines + linesCleared;
        
        // スコア計算（レベルは自動的に更新される）
        const scoreAddition = linesCleared > 0 ? LINE_POINTS[Math.min(linesCleared, 4)] * level : 0;
        
        // 次のピースを生成
        const newNextPiece = randomTetromino();
        
        // 現在のボード状態で新しいピースを配置可能か確認
        let newCurrentPiece = spawnNewPiece(updatedBoard, nextPiece);
        let isGameOver = false;
        
        // 新しいピースが配置できない場合（ゲームオーバー）
        if (!newCurrentPiece) {
          isGameOver = true;
          // ゲームオーバー時は現在のピースをクリア
          newCurrentPiece = null;
        }
        
        // 新しい状態を作成（直接返す）
        // 10ラインごとにレベルが1上がる（10-19: レベル2, 20-29: レベル3, ...）
        const newLevel = Math.floor(newLines / 10) + 1;
        
        return {
          ...prevState,
          board: updatedBoard,
          currentPiece: newCurrentPiece,
          nextPiece: newNextPiece,
          score: prevState.score + scoreAddition,
          lines: newLines,
          level: newLevel,
          isGameOver: isGameOver,
          isPaused: prevState.isPaused
        };
      }

      return { ...prevState };
    });
    
    return true;
  }, [checkCollision, clearLines, spawnNewPiece]);


  // ゲームをリセット
  const resetGame = useCallback((): void => {
    const newState = getInitialState();
    const initialPiece = spawnNewPiece(newState.board, newState.nextPiece);
    
    // ゲームループをリセット
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    lastUpdateTime.current = 0;
    dropCounter.current = 0;
    
    const updatedState: GameState = {
      ...newState,
      currentPiece: initialPiece,
      isGameOver: initialPiece === null,
      level: 1,
      lines: 0,
      score: 0,
      isPaused: false
    };
    
    setGameState(updatedState);
  }, [spawnNewPiece]);
  
  // ゲームの状態を初期化
  useEffect(() => {
    resetGame();
    
    // コンポーネントのアンマウント時にゲームループをクリーンアップ
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [resetGame]);

  // ゲームをポーズ/再開
  const togglePause = useCallback((): void => {
    updateGameState({
      isPaused: !gameState.isPaused,
    });
  }, [gameState.isPaused, updateGameState]);

  // ハードドロップ
  const hardDrop = useCallback((): void => {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentPiece) return;

    setGameState(prev => {
      if (!prev.currentPiece) return prev;
      
      let dropDistance = 0;
      while (!checkCollision(
        { ...prev.currentPiece!.position, y: prev.currentPiece!.position.y + dropDistance + 1 },
        prev.currentPiece.shape,
        prev.board
      )) {
        dropDistance++;
      }

      if (dropDistance > 0) {
        const newPosition = {
          ...prev.currentPiece.position,
          y: prev.currentPiece.position.y + dropDistance,
        };
        
        // ピースを移動
        const newPiece = {
          ...prev.currentPiece,
          position: newPosition,
        };
        
        // ボードにピースを配置
        const newBoard = deepCopyBoard(prev.board);
        
        // 現在のピースをボードに固定
        for (let y = 0; y < newPiece.shape.length; y++) {
          for (let x = 0; x < newPiece.shape[y].length; x++) {
            if (newPiece.shape[y][x] !== 0) {
              const boardY = newPiece.position.y + y;
              const boardX = newPiece.position.x + x;
              
              if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                newBoard[boardY][boardX] = newPiece.type;
              }
            }
          }
        }
        
        // ラインをクリア
        const { board: updatedBoard, linesCleared } = clearLines(newBoard);
        const newLines = prev.lines + linesCleared;
        const scoreAddition = linesCleared > 0 ? LINE_POINTS[Math.min(linesCleared, 4)] * prev.level : 0;
        
        // 次のピースを生成
        const newNextPiece = randomTetromino();
        let newCurrentPiece = spawnNewPiece(updatedBoard, prev.nextPiece);
        let isGameOver = false;
        
        if (!newCurrentPiece) {
          isGameOver = true;
          newCurrentPiece = null;
        }
        
        // 10ラインごとにレベルが1上がる（10-19: レベル2, 20-29: レベル3, ...）
        const newLevel = Math.floor(newLines / 10) + 1;
        
        return {
          ...prev,
          board: updatedBoard,
          currentPiece: newCurrentPiece,
          nextPiece: newNextPiece,
          score: prev.score + scoreAddition,
          lines: newLines,
          level: newLevel,
          isGameOver
        };
      }
      
      return prev;
    });
  }, [checkCollision, gameState, movePiece, updateGameState]);

  // ピースを回転
  const rotatePiece = useCallback(() => {
    if (gameState.isGameOver || gameState.isPaused || !gameState.currentPiece) return;

    // 現在のピースの形状を90度回転
    const newShape = gameState.currentPiece.shape[0].map((_, index) =>
      gameState.currentPiece!.shape.map((row) => row[index]).reverse()
    ) as number[][];

    // 壁蹴り処理（左右の壁にめり込まないように調整）
    const originalPosition = { ...gameState.currentPiece.position };
    
    // 回転後の位置調整を試行
    const testOffsets = [0, 1, -1, 2, -2]; // 中央、右、左、さらに右、さらに左の順に試行
    
    for (const offset of testOffsets) {
      const newPosition = {
        x: originalPosition.x + offset,
        y: originalPosition.y
      };
      
      // 新しい位置で衝突がなければ、その位置で回転を確定
      if (!checkCollision(newPosition, newShape, gameState.board)) {
        updateGameState({
          currentPiece: {
            ...gameState.currentPiece,
            position: newPosition,
            shape: newShape,
          },
        });
        return;
      }
    }
    
    // 上下方向も含めて調整を試行（壁蹴り）
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      if (yOffset === 0) continue; // 水平方向の調整は既に試行済み
      
      for (const xOffset of testOffsets) {
        const newPosition = {
          x: originalPosition.x + xOffset,
          y: originalPosition.y + yOffset
        };
        
        if (!checkCollision(newPosition, newShape, gameState.board)) {
          updateGameState({
            currentPiece: {
              ...gameState.currentPiece,
              position: newPosition,
              shape: newShape,
            },
          });
          return;
        }
      }
    }
  }, [checkCollision, gameState, updateGameState]);

  // 重力による自動落下を処理する関数
  const applyGravity = useCallback(() => {
    if (!gameState.isGameOver && !gameState.isPaused) {
      movePiece(0, 1);
    }
  }, [gameState.isGameOver, gameState.isPaused, movePiece]);

  // ゲームループ - 重力を適用
  useEffect(() => {
    const gameLoop = (time: number) => {
      if (!previousTimeRef.current) {
        previousTimeRef.current = time;
      }

      const deltaTime = time - previousTimeRef.current;
      previousTimeRef.current = time;
      
      if (!gameState.isGameOver && !gameState.isPaused) {
        dropCounter.current += deltaTime;
        const dropSpeed = Math.max(100, 1000 - (gameState.level - 1) * 100);

        if (dropCounter.current > dropSpeed) {
          dropCounter.current = 0;
          applyGravity();
        }
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState.level, gameState.isGameOver, gameState.isPaused, applyGravity]);

  // ボードを描画用に準備（メモ化）
  const displayBoard = useCallback(() => {
    // 現在のボードの状態を直接返す（コンポーネント側で現在のピースを描画する）
    return gameState.board;
  }, [gameState.board]);

  // ゲームの状態と関数を返す
  return {
    displayBoard,
    board: gameState.board,
    currentPiece: gameState.currentPiece,
    nextPiece: gameState.nextPiece,
    score: gameState.score,
    level: gameState.level,
    lines: gameState.lines,
    isGameOver: gameState.isGameOver,
    isPaused: gameState.isPaused,
    movePiece,
    rotatePiece,
    hardDrop,
    togglePause,
    resetGame,
  } as const;

};

export default useTetris;
