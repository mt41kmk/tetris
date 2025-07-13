import { useState, useCallback, useEffect, useRef } from 'react';

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
  color?: string;
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
  return Array(20).fill(0).map((): CellType[] => Array(10).fill(0));
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

const useTetris = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const dropCounter = useRef<number>(0);

  // 衝突判定
  const checkCollision = useCallback((position: Position, shape: TetrominoShape, board: CellType[][]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        // テトロミノのセルが空でない場合のみチェック
        if (shape[y][x] !== 0) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          // ボードの左端、右端、下端を超えているかチェック
          if (newX < 0 || newX >= 10 || newY >= 20) {
            return true;
          }
          
          // ボードの上端より上は無視（テトロミノが完全にボードの上にある場合）
          if (newY >= 0) {
            // すでにブロックがある場合は衝突（0 または undefined でない場合）
            if (board[newY] && board[newY][newX] !== 0) {
              return true;
            }
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

  // ボードを更新（現在のピースを含む表示用ボードを生成）
  // この関数は displayBoard に統合されたため削除
  // 古いコードは削除します

  // ラインをクリア
  const clearLines = useCallback((board: CellType[][]): { board: CellType[][], linesCleared: number } => {
    const newBoard = [...board];
    let linesCleared = 0;
    const emptyRow = Array(10).fill(0) as CellType[];
    const rowsToKeep: CellType[][] = [];

    // 下から上に走査して、消去する行を特定
    for (let y = newBoard.length - 1; y >= 0; y--) {
      // 行が全て埋まっているかチェック
      if (newBoard[y].every(cell => cell !== 0)) {
        linesCleared++;
      } else {
        // 消去されない行は保持
        rowsToKeep.unshift([...newBoard[y]]);
      }
    }

    // 消去された行の数だけ空の行を追加
    const clearedBoard = [
      ...Array(linesCleared).fill(emptyRow),
      ...rowsToKeep
    ];

    return { 
      board: clearedBoard.slice(0, 20), // 念のため20行に制限
      linesCleared 
    };
  }, []);

  // ゲームの状態を更新
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => {
      // スコア計算が必要な場合
      if (updates.lines !== undefined) {
        const linesCleared = updates.lines - prev.lines;
        const linePoints = [0, 40, 100, 300, 1200];
        const scoreAddition = linesCleared > 0 ? linePoints[Math.min(linesCleared, 4)] * prev.level : 0;
        const newLevel = Math.floor(updates.lines / 10) + 1;
        
        return {
          ...prev,
          ...updates,
          score: prev.score + scoreAddition,
          level: newLevel
        };
      }
      
      // 通常の状態更新
      return {
        ...prev,
        ...updates
      };
    });
  }, []);

  // テトロミノを移動
  const movePiece = useCallback((deltaX: number, deltaY: number): boolean => {
    setGameState((prevState: GameState): GameState => {
      // ゲームオーバー、ポーズ中、または現在のピースがない場合は何もしない
      if (prevState.isGameOver || prevState.isPaused || !prevState.currentPiece) {
        return { ...prevState };
      }

      const { currentPiece, board, score, level, lines, nextPiece } = prevState;
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
        const newBoard = board.map(row => [...row]);
        
        // 現在のピースをボードに固定
        for (let y = 0; y < currentPiece.shape.length; y++) {
          for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
              const boardY = currentPiece.position.y + y;
              const boardX = currentPiece.position.x + x;
              
              // ボードの範囲内かチェック
              if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
                // テトロミノのタイプを保存
                newBoard[boardY][boardX] = currentPiece.type;
              }
            }
          }
        }

        // ラインをクリア
        const { board: updatedBoard, linesCleared } = clearLines(newBoard);
        const newLines = lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        const linePoints = [0, 40, 100, 300, 1200];
        const newScore = score + (linePoints[Math.min(linesCleared, 4)] * level);
        
        // 次のピースを生成
        const newNextPiece = randomTetromino();
        const newCurrentPiece = spawnNewPiece(updatedBoard, nextPiece);
        
        // 新しいボードとピースを設定
        const newState: GameState = {
          ...prevState,
          board: updatedBoard,
          currentPiece: newCurrentPiece,
          nextPiece: newNextPiece,
          score: newScore,
          level: newLevel,
          lines: newLines,
          isGameOver: newCurrentPiece === null,
        };
        
        return {
          ...prevState,
          board: newState.board,
          currentPiece: newState.currentPiece,
          nextPiece: newState.nextPiece || prevState.nextPiece,
          score: newState.score,
          level: newState.level,
          lines: newState.lines,
          isGameOver: newState.isGameOver,
          isPaused: newState.isPaused
        } as GameState;
      }

      return { ...prevState };
    });
    
    return true;
  }, [checkCollision, clearLines, spawnNewPiece]);

  // 落下速度を計算（レベルに応じて速くなる）
  const getDropTime = useCallback(() => {
    // 基本速度を1000ms（1秒）に設定し、レベルが上がるごとに100msずつ減少（最低100ms）
    return Math.max(1000 - (gameState.level - 1) * 100, 100);
  }, [gameState.level]);

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
      isGameOver: initialPiece === null
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

    let dropDistance = 0;
    while (!checkCollision(
      { ...gameState.currentPiece.position, y: gameState.currentPiece.position.y + dropDistance + 1 },
      gameState.currentPiece.shape,
      gameState.board
    )) {
      dropDistance++;
    }

    if (dropDistance > 0) {
      updateGameState({
        currentPiece: {
          ...gameState.currentPiece,
          position: {
            ...gameState.currentPiece.position,
            y: gameState.currentPiece.position.y + dropDistance,
          },
        },
      });
      // すぐに固定するために下方向に1マス移動を実行
      movePiece(0, 1);
    }
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
    const pieceWidth = newShape[0].length;
    const pieceHeight = newShape.length;
    
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

  // ゲームループ
  const gameLoop = useCallback((time: number) => {
    if (!lastUpdateTime.current) {
      lastUpdateTime.current = time;
    }

    if (gameState.isGameOver || gameState.isPaused) {
      lastUpdateTime.current = time;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = time - lastUpdateTime.current;
    lastUpdateTime.current = time;

    // 自動落下（1秒ごとに1マス）
    dropCounter.current += deltaTime;
    const dropInterval = getDropTime();
    
    if (dropCounter.current > dropInterval) {
      movePiece(0, 1);
      dropCounter.current = 0;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isGameOver, gameState.isPaused, getDropTime, movePiece]);

  // ゲームの初期化とクリーンアップ
  useEffect(() => {
    // 既存のゲームループをクリア
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    // ゲームをリセット
    resetGame();

    // キーボードイベントハンドラ
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (gameState.isGameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // ゲームループを開始
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop]); // gameLoopのみを依存関係に指定

  // 現在のボードの状態を計算（現在のピースを含む）
  const displayBoard = useCallback((): CellType[][] => {
    // ボードのディープコピーを作成（新しい配列として完全にコピー）
    const currentBoard = gameState.board.map(row => [...row]);
    
    // 現在のピースがなければボードをそのまま返す
    if (!gameState.currentPiece) {
      return currentBoard;
    }
    
    const { position, shape, type } = gameState.currentPiece;
    
    // 現在のピースをボードに描画
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        // テトロミノのセルが空でない場合のみ描画
        if (shape[y][x] !== 0) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          
          // ボードの範囲内にある場合のみ描画
          if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
            // 現在のピースを描画（既存のブロックは上書きしない）
            currentBoard[boardY][boardX] = type;
          }
        }
      }
    }
    
    return currentBoard;
  }, [gameState.board, gameState.currentPiece]);

// ゲームの状態と関数を返す
const result = {
  displayBoard,
  score: gameState.score,
  level: gameState.level,
  lines: gameState.lines,
  isGameOver: gameState.isGameOver,
  isPaused: gameState.isPaused,
  nextPiece: gameState.nextPiece,
  movePiece,
  rotatePiece,
  hardDrop,
  togglePause,
  resetGame,
} as const;

return result;
};

export default useTetris;
