import React from 'react';
import type { FC } from 'react';
import './Board.css';

const TETROMINO_COLORS = {
  I: '#00F0F0', // cyan
  J: '#0000F0', // blue
  L: '#F0A000', // orange
  O: '#F0F000', // yellow
  S: '#00F000', // green
  T: '#A000F0', // purple
  Z: '#F00000'  // red
} as const;

type TetrominoType = keyof typeof TETROMINO_COLORS;

interface BoardProps {
  board: (TetrominoType | 0)[][];
  currentPiece?: {
    type: TetrominoType;
    position: { x: number; y: number };
    shape: number[][];
  } | null;
}

const Board: FC<BoardProps> = ({ board, currentPiece }) => {
  // Apply current piece to the board for rendering
  const renderBoard = React.useMemo(() => {
    const boardWithPiece = board.map(row => [...row]);
    
    if (currentPiece) {
      const { x: pieceX, y: pieceY } = currentPiece.position;
      
      // Draw current piece on the board
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] !== 0) {
            const boardY = pieceY + y;
            const boardX = pieceX + x;
            
            // Only draw if within board bounds
            if (boardY >= 0 && boardY < boardWithPiece.length && boardX >= 0 && boardX < boardWithPiece[0].length) {
              boardWithPiece[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    
    return boardWithPiece;
  }, [board, currentPiece]);

  return (
    <div className="board">
      {renderBoard.slice(0, 20).map((row, y) => (
        <div key={y} className="board-row">
          {row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className={`cell ${cell ? 'filled' : 'empty'}`}
              style={{
                backgroundColor: cell ? TETROMINO_COLORS[cell] : 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
