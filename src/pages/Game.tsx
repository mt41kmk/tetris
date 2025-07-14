import { useNavigate } from 'react-router-dom';
import useTetris from '../hooks/useTetris';
import { type FC } from 'react';
import { useEffect, useMemo } from 'react';
import Board from '../components/Board';
import { BOARD_HEIGHT } from '../constants/tetris';

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

const TETROMINO_COLORS = {
  I: '#00F0F0', // cyan
  J: '#0000F0', // blue
  L: '#F0A000', // orange
  O: '#F0F000', // yellow
  S: '#00F000', // green
  T: '#A000F0', // purple
  Z: '#F00000'  // red
} as const;

const tetrominoShapes: Record<TetrominoType, number[][]> = {
  'I': [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'J': [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'L': [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'O': [
    [1, 1],
    [1, 1]
  ],
  'S': [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

// Game component
const Game: FC = () => {
  const navigate = useNavigate();
  
  const {
    displayBoard,
    score,
    level,
    lines,
    isGameOver,
    isPaused,
    nextPiece,
    currentPiece,
    movePiece,
    rotatePiece,
    hardDrop,
    togglePause,
    resetGame,
  } = useTetris();
  
  // Navigate to result screen on game over
  useEffect(() => {
    if (isGameOver) {
      const highScore = parseInt(localStorage.getItem('tetrisHighScore') || '0', 10);
      const isNewRecord = score > highScore;
      
      if (isNewRecord) {
        localStorage.setItem('tetrisHighScore', score.toString());
      }
      
      navigate('/result', {
        state: {
          score,
          lines,
          level,
          isNewRecord,
        },
      });
    }
  }, [isGameOver, score, lines, level, navigate]);
  
  // キーボード操作の定数
  const KEY = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    DOWN: 'ArrowDown',
    ENTER: 'Enter',
    SPACE: ' ',
    ESC: 'Escape',
  } as const;

  // キーボード入力ハンドラ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isPaused || isGameOver) return;
      
      switch (e.key) {
        case KEY.LEFT:
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case KEY.RIGHT:
          e.preventDefault();
          movePiece(1, 0);
          break;
        case KEY.DOWN:          // ▼ ソフトドロップ
          e.preventDefault();
          movePiece(0, 1);
          break;
        case KEY.ENTER:         // ↵ ハードドロップ
          e.preventDefault();
          hardDrop();
          break;
        case KEY.SPACE:         // Space で回転
          e.preventDefault();
          rotatePiece();
          break;
        case KEY.ESC:           // Esc でタイトルへ
          navigate('/');
          break;
      }
    };
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPaused, isGameOver, movePiece, hardDrop, rotatePiece, navigate]);
  
  // Get the current board state (only show the visible part)
  const board = useMemo(() => displayBoard().slice(0, BOARD_HEIGHT), [displayBoard]);

  // Utility function to trim empty rows and columns from a shape
  const trimShape = (mat: number[][]) => {
    // 上下左右の 0 だけの行列を削る
    if (mat.length === 0) return [];
    
    let top = 0, bottom = mat.length - 1;
    while (top <= bottom && mat[top].every(v => v === 0)) top++;
    while (bottom >= top && mat[bottom].every(v => v === 0)) bottom--;
    
    if (top > bottom) return [];
    
    let left = 0, right = mat[0].length - 1;
    while (left <= right && mat.every(r => r[left] === 0)) left++;
    while (right >= left && mat.every(r => r[right] === 0)) right--;
    
    return mat.slice(top, bottom + 1).map(r => r.slice(left, right + 1));
  };

  // Render the next piece preview
  const renderNextPiece = useMemo(() => {
    if (!nextPiece) return null;
    
    const pieceType = nextPiece as TetrominoType;
    const raw = tetrominoShapes[pieceType];
    const shape = trimShape(raw);
    
    if (!shape || shape.length === 0) return null;
    
    const BOARD_CELL = 25;      // 盤面セル
    const SCALE = 0.7;         // 70 %
    const cellSize = `${BOARD_CELL * SCALE}px`;
    const color = TETROMINO_COLORS[pieceType];
    
    // Get the first 2 rows of the shape for preview
    const previewShape = shape.slice(0, 2);
    
    return (
      <div style={{ 
        width: `calc(${BOARD_CELL}px * 4)`,
        height: `calc(${BOARD_CELL}px * 2)`,   // 高さを 2 行分
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#1F2937',
        padding: '4px',
        borderRadius: '4px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateRows: `repeat(${previewShape.length}, ${cellSize})`,
          gridTemplateColumns: `repeat(${previewShape[0].length}, ${cellSize})`,
          gap: '1px',
        }}>
          {previewShape.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`next-${y}-${x}`}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: cell ? color : 'transparent',
                  border: cell ? `1px solid ${color}80` : 'none',
                  borderRadius: '2px',
                  opacity: cell ? 1 : 0,
                  transition: 'all 0.2s ease',
                }}
              />
            ))
          )}
        </div>
      </div>
    );
  }, [nextPiece, tetrominoShapes, TETROMINO_COLORS]);

  // メインのレンダリング
  return (
    <div 
      className="game-container" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#111827',
        color: 'white',
        padding: '0',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '0',
        padding: '1rem',
        maxWidth: '500px',
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}>
          <div>
            <div>SCORE: {score}</div>
            <div>LEVEL: {level}</div>
            <div>LINES: {lines}</div>
          </div>
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.1rem' }}>NEXT</div>
            {renderNextPiece}
          </div>
        </div>
        
        <Board board={board} currentPiece={currentPiece} />
        
        {/* モバイルコントロール */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
          padding: '0.5rem'
        }}>
          <button 
            onClick={() => movePiece(-1, 0)}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => rotatePiece()}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.25rem 1.5rem',
                cursor: 'pointer'
              }}
            >
              ↻
            </button>
            <button 
              onClick={() => movePiece(0, 1)}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                padding: '0.25rem 0.75rem',
                cursor: 'pointer'
              }}
            >
              ↓
            </button>
          </div>
          
          <button 
            onClick={() => movePiece(1, 0)}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            →
          </button>
          
          <button 
            onClick={hardDrop}
            style={{
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              padding: '0.5rem 1rem',
              fontSize: '1.25rem',
              cursor: 'pointer',
              marginLeft: '1rem'
            }}
          >
            ↓↓
          </button>
        </div>
      </div>
      
      {isPaused && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1F2937',
            padding: '2rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>PAUSED</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={togglePause}
                style={{
                  backgroundColor: '#2563EB',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ゲームを再開
              </button>
              <button
                onClick={() => {
                  resetGame();
                  navigate('/');
                }}
                style={{
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ゲームを終了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
