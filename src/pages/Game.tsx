import { useNavigate } from 'react-router-dom';
import useTetris from '../hooks/useTetris';
import * as React from 'react';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';
import Board from '../components/Board';

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
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
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
  
  // Escapeキーでメニューに戻る
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;
    
    // Determine swipe direction
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > 30) {
        movePiece(diffX > 0 ? 1 : -1, 0);
      }
    } else if (Math.abs(diffY) > 30) {
      // Vertical swipe down for hard drop
      if (diffY > 0) {
        hardDrop();
      }
    } else {
      // Tap to rotate
      rotatePiece();
    }
    
    // Reset touch positions
    touchStartX.current = 0;
    touchStartY.current = 0;
  }, [movePiece, hardDrop, rotatePiece]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    
    // Add touch end and move event listeners
    const touchEndHandler = (e: Event) => handleTouchEnd(e as TouchEvent);
    document.addEventListener('touchend', touchEndHandler, { once: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchend', touchEndHandler);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchEnd, handleTouchMove]);

  // Get the current board state
  const board = useMemo(() => displayBoard(), [displayBoard]);

  // Render the next piece preview
  const renderNextPiece = useMemo(() => {
    if (!nextPiece) return null;
    
    const pieceType = nextPiece as TetrominoType;
    const shape = tetrominoShapes[pieceType];
    
    if (!shape) return null;
    
    const cellSize = '20px';
    const color = TETROMINO_COLORS[pieceType];
    
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateRows: `repeat(${shape.length}, ${cellSize})`,
          gridTemplateColumns: `repeat(${shape[0]?.length || 4}, ${cellSize})`,
          gap: '1px',
          backgroundColor: '#1F2937',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {Array(shape.length).fill(0).map((_, y) =>
            Array(shape[0]?.length || 4).fill(0).map((_, x) => {
              const cell = shape[y]?.[x] || 0;
              return (
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
              );
            })
          )}
        </div>
      </div>
    );
  }, [nextPiece, tetrominoShapes, TETROMINO_COLORS]);

  // メインのレンダリング
  return (
    <div 
      className="game-container" 
      onTouchStart={handleTouchStart}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#111827',
        color: 'white',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>TETRIS</h1>
      
      <div style={{
        backgroundColor: '#1F2937',
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: '500px',
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.25rem',
        }}>
          <div>
            <div>SCORE: {score}</div>
            <div>LEVEL: {level}</div>
            <div>LINES: {lines}</div>
          </div>
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>NEXT</div>
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
