import { useNavigate } from 'react-router-dom';
import useTetris from '../hooks/useTetris';
import { useEffect } from 'react';
import React from 'react';

// ゲームコンポーネントをエクスポート
export default function Game() {
  const navigate = useNavigate();
  
  const {
    displayBoard,
    score,
    level,
    lines,
    isGameOver,
    isPaused,
    nextPiece,
    movePiece,
    rotatePiece,
    hardDrop,
    togglePause,
    resetGame,
  } = useTetris();
  
  // ゲームオーバー時にリザルト画面に遷移
  useEffect(() => {
    if (isGameOver) {
      // ハイスコアをローカルストレージから取得
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
  
  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, togglePause]);
  
  // モバイル用のタッチコントロール
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 横スワイプ
          movePiece(deltaX > 0 ? 1 : -1, 0);
        } else {
          // 下スワイプ（ハードドロップ）
          if (deltaY > 0) {
            hardDrop();
          }
        }
        // タッチ終了を検知
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove as EventListener);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd, { once: true });
  };

  // ボードをレンダリング
  const renderBoard = () => {
    // 現在のボードの状態を取得（現在のピースを含む）
    const board = displayBoard();

    return board.map((row: (string | number | null)[], y: number) => (
      <div key={y} style={{ display: 'flex' }}>
        {row.map((cell: string | number | null, x: number) => {
          // セルの値を文字列に変換し、大文字に揃える
          const cellValue = cell ? String(cell).toUpperCase() : '';
          
          // ベーススタイル
          const baseStyle = {
            width: '1.5rem',
            height: '1.5rem',
            border: '1px solid #374151',
            boxSizing: 'border-box' as const,
            backgroundColor: '#111827' // デフォルトは空のセル（暗いグレー）
          };
          
          // セルの値に基づいてスタイルを決定
          let cellStyle = { ...baseStyle };
          
          // セルにブロックがある場合、色を設定
          if (cellValue) {
            const colorMap: Record<string, string> = {
              'I': '#00F0F0', // cyan
              'J': '#0000F0', // blue
              'L': '#F0A000', // orange
              'O': '#F0F000', // yellow
              'S': '#00F000', // green
              'T': '#A000F0', // purple
              'Z': '#F00000'  // red
            };
            
            cellStyle.backgroundColor = colorMap[cellValue] || '#FFFFFF';
          }
          
          return (
            <div
              key={`${y}-${x}`}
              style={cellStyle}
              title={`${x},${y} - ${cellValue || 'empty'}`}
            />
          );
        })}
      </div>
    ));
  };

  // 次のテトロミノを表示
  const renderNextPiece = () => {
    if (!nextPiece) return null;
    
    // テトロミノの形状定義
    const tetrominoShapes = {
      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
    } as const;
    
    const shape = tetrominoShapes[nextPiece] || [];
    const cellSize = '1.5rem';
    
    // テトロミノの色マッピング
    const colorMap = {
      'I': '#00F0F0', // cyan
      'J': '#0000F0', // blue
      'L': '#F0A000', // orange
      'O': '#F0F000', // yellow
      'S': '#00F000', // green
      'T': '#A000F0', // purple
      'Z': '#F00000'  // red
    };
    
    // テトロミノの色を取得
    const color = colorMap[nextPiece] || '#FFFFFF';
    
    // グリッドのサイズを計算（最大4x4グリッド）
    const gridSize = 4;
    const gridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridSize}, ${cellSize})`,
      gridTemplateRows: `repeat(${gridSize}, ${cellSize})`,
      gap: '2px',
      backgroundColor: '#1F2937',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      margin: '0.5rem 0',
    };
    
    // 空のグリッドを作成
    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    // テトロミノをグリッドの中央に配置
    const startRow = Math.floor((gridSize - shape.length) / 2);
    const startCol = Math.floor((gridSize - shape[0].length) / 2);
    
    // テトロミノの形状をグリッドにコピー
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (startRow + y < gridSize && startCol + x < gridSize) {
          grid[startRow + y][startCol + x] = shape[y][x];
        }
      }
    }
    
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={gridStyle}>
          {grid.map((row, y) =>
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
  };

  // スタイル定義
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#111827', // bg-gray-900
      padding: '1rem',
    },
    title: {
      fontSize: '1.875rem', // text-3xl
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '1.5rem', // mb-6
    },
    gameContainer: {
      position: 'relative' as const,
      backgroundColor: '#1F2937', // bg-gray-800
      borderRadius: '0.5rem', // rounded-lg
      padding: '0.25rem 1.5rem 1.5rem', // Further reduced top padding
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl
      width: '100%',
      maxWidth: '500px',
    },
    gameHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      width: '100%',
      marginBottom: '0.5rem',
      gap: '1rem',
    },
    gameInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.25rem',
      backgroundColor: '#1F2937',
      padding: '0.5rem',
      borderRadius: '0.5rem',
      color: 'white',
      minWidth: '100px',
    },
    infoSection: {
      display: 'flex',
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.1rem 0.5rem',
      width: '100%',
      minHeight: '1.5rem',
    },
    infoLabel: {
      fontSize: '0.75rem',
      color: '#9CA3AF',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginRight: '1rem',
    },
    infoValue: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: 'white',
      minWidth: '2.5rem',
      textAlign: 'right' as const,
    },
    nextPieceContainer: {
      backgroundColor: '#1F2937',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    gameBoard: {
      border: '4px solid #374151', // border-4 border-gray-700
      backgroundColor: '#111827', // bg-gray-900
      touchAction: 'none', // touch-none
      margin: '0 auto', // 中央寄せ
    },
    mobileControls: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem', // gap-4
      marginTop: '1rem', // mt-4
    },
    controlButton: {
      backgroundColor: '#374151', // bg-gray-700
      color: 'white',
      padding: '1rem', // p-4
      borderRadius: '9999px', // rounded-full
      width: '4rem', // w-16
      height: '4rem', // h-16
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem', // text-2xl
      border: 'none',
      cursor: 'pointer',
    },
    hardDropButton: {
      backgroundColor: '#2563EB', // bg-blue-600
      marginLeft: '1rem', // ml-4
    },
    controlsColumn: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem', // gap-2
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>TETRIS</h1>
      
      <div style={styles.gameContainer} onTouchStart={handleTouchStart}>
        {/* ゲーム情報ヘッダー */}
        <div style={styles.gameHeader}>
          <div style={styles.gameInfo}>
            <div style={styles.infoSection}>
              <div style={styles.infoLabel}>SCORE</div>
              <div style={styles.infoValue}>{score}</div>
            </div>
            <div style={styles.infoSection}>
              <div style={styles.infoLabel}>LEVEL</div>
              <div style={styles.infoValue}>{level}</div>
            </div>
            <div style={styles.infoSection}>
              <div style={styles.infoLabel}>LINES</div>
              <div style={styles.infoValue}>{lines}</div>
            </div>
          </div>
          <div style={styles.nextPieceContainer}>
            <div style={{...styles.infoLabel, marginBottom: '0.5rem'}}>NEXT</div>
            {renderNextPiece()}
          </div>
        </div>

        {/* ゲームボード */}
        <div style={styles.gameBoard}>
          {renderBoard()}
        </div>
        
        {/* モバイルコントロール */}
        <div style={styles.mobileControls}>
          <button 
            onClick={() => movePiece(-1, 0)}
            style={styles.controlButton}
            aria-label="Move left"
          >
            ←
          </button>
          <div style={styles.controlsColumn}>
            <button 
              onClick={() => rotatePiece()}
              style={styles.controlButton}
              aria-label="Rotate"
            >
              ↻
            </button>
            <button 
              onClick={() => movePiece(0, 1)}
              style={styles.controlButton}
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
          <button 
            onClick={() => movePiece(1, 0)}
            style={styles.controlButton}
            aria-label="Move right"
          >
            →
          </button>
          <button 
            onClick={hardDrop}
            style={{ ...styles.controlButton, ...styles.hardDropButton }}
            aria-label="Hard drop"
          >
            ↓↓
          </button>
        </div>
        
        {/* デスクトップ用コントロール */}
        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: '#D1D5DB',
          fontSize: '0.875rem',
          display: 'none'  // Will be shown with media query
        }}>
          <p>矢印キーで移動 / 上キーで回転 / スペースでハードドロップ</p>
          <p style={{ marginTop: '0.5rem' }}>ESC: タイトルに戻る / P: ポーズ</p>
        </div>
        
        {isPaused && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: '#1F2937',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '1rem'
              }}>PAUSED</h2>
              <button
                onClick={togglePause}
                style={{
                  backgroundColor: '#2563EB',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              >
                ゲームを再開
              </button>
              <button
                onClick={() => {
                  resetGame();
                  navigate('/');
                }}
                style={{
                  marginLeft: '1rem',
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4B5563'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              >
                ゲームを終了
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* モバイル用の操作ガイド */}
      <div style={{
        marginTop: '2rem',
        fontSize: '0.875rem',
        color: '#6B7280',
        textAlign: 'center',
        display: 'none'  // Will be shown with media query
      }}>
        モバイルでは画面下部のボタンで操作できます
      </div>
    </div>
  );
}
