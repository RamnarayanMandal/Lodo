'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayerColor, GameState } from '@/types/socket';
import { calculateIntermediatePositions } from '@/lib/utils/positionCalculator';
import { positionToFlexbox } from '@/lib/utils/positionCalculatorFlex';

interface GameBoardProps {
  gameState: GameState | null;
  selectedPiece: number | null;
  onPieceClick: (pieceId: number) => void;
  currentPlayerColor?: PlayerColor;
  movingPiece?: { pieceId: number; fromPosition: number; toPosition: number; diceValue: number; color: PlayerColor } | null;
  isAnimating?: boolean;
}

const CELL_SIZE = 40; // Match HTML

const playerColors: Record<PlayerColor, { main: string; light: string; dark: string }> = {
  [PlayerColor.RED]: { main: '#FF0000', light: '#FF4444', dark: '#CC0000' },
  [PlayerColor.GREEN]: { main: '#009900', light: '#00BB00', dark: '#006600' },
  [PlayerColor.BLUE]: { main: '#66CCFF', light: '#88DDFF', dark: '#44AADD' },
  [PlayerColor.YELLOW]: { main: '#FFCC00', light: '#FFDD33', dark: '#CCAA00' },
};

export function GameBoard({ gameState, selectedPiece, onPieceClick, currentPlayerColor, movingPiece, isAnimating = false }: GameBoardProps) {
  if (!gameState) return null;

  const [animatingPieces, setAnimatingPieces] = useState<Map<string, { currentPos: number; positions: number[] }>>(new Map());

  useEffect(() => {
    if (movingPiece) {
      const key = `${movingPiece.color}-${movingPiece.pieceId}`;
      const positions = calculateIntermediatePositions(
        movingPiece.fromPosition,
        movingPiece.toPosition,
        movingPiece.color,
        movingPiece.diceValue
      );

      setAnimatingPieces(prev => {
        const newMap = new Map(prev);
        newMap.set(key, { currentPos: movingPiece.fromPosition, positions });
        return newMap;
      });

      let stepIndex = 0;
      const animateStep = () => {
        if (stepIndex < positions.length) {
          setAnimatingPieces(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(key);
            if (current) {
              current.currentPos = positions[stepIndex];
              newMap.set(key, current);
            }
            return newMap;
          });
          stepIndex++;
          setTimeout(animateStep, 150);
        } else {
          setTimeout(() => {
            setAnimatingPieces(prev => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }, 200);
        }
      };
      setTimeout(animateStep, 100);
    }
  }, [movingPiece]);

  const getHomePieces = (color: PlayerColor) => {
    const player = gameState.players.find((p) => p.color === color);
    if (!player) return [];
    return player.pieces.filter((p) => p.isHome && p.position === -1);
  };

  const getTrackPieces = () => {
    const pieces: Array<{ piece: any; player: any; position: number }> = [];
    gameState.players.forEach((player) => {
      player.pieces
        .filter((p) => !(p.isHome && p.position === -1))
        .forEach((piece) => {
          pieces.push({ piece, player, position: piece.position });
        });
    });
    return pieces;
  };

  const renderPiece = (piece: any, player: any, position: number) => {
    const color = player.color as PlayerColor;
    const key = `${color}-${piece.id}`;
    const animating = animatingPieces.get(key);
    const currentPos = animating ? animating.currentPos : position;
    const gridPos = positionToFlexbox(currentPos, color);
    
    if (!gridPos && currentPos !== -1) return null;

    const isMoving = movingPiece?.pieceId === piece.id && movingPiece?.color === color;
    const isSelected = selectedPiece === piece.id && currentPlayerColor === color;

    if (currentPos === -1) {
      // Piece in home base - rendered separately
      return null;
    }

    const colorClass = `${color.toLowerCase()}-token`;
    
    return (
      <motion.div
        key={`piece-${player.userId}-${piece.id}`}
        className={`track-piece ${colorClass} ${isSelected ? 'selected' : ''}`}
        onClick={() => !isAnimating && onPieceClick(piece.id)}
        style={{
          position: 'absolute',
          left: gridPos ? `${gridPos.x - CELL_SIZE * 0.35}px` : '0px',
          top: gridPos ? `${gridPos.y - CELL_SIZE * 0.35}px` : '0px',
          width: `${CELL_SIZE * 0.7}px`,
          height: `${CELL_SIZE * 0.7}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${playerColors[color].light} 0%, ${playerColors[color].main} 40%, ${playerColors[color].dark} 100%)`,
          border: isSelected ? '3px solid #ffd700' : '2.5px solid #444',
          cursor: isAnimating || isMoving ? 'wait' : 'pointer',
          pointerEvents: isAnimating || isMoving ? 'none' : 'auto',
          zIndex: isMoving ? 100 : 10,
          boxShadow: isMoving
            ? '0 0 20px rgba(255, 215, 0, 0.8), 0 5px 12px rgba(0, 0, 0, 0.6)'
            : isSelected
            ? '0 0 15px rgba(255, 215, 0, 0.8), 0 3px 8px rgba(0, 0, 0, 0.5)'
            : '0 3px 8px rgba(0, 0, 0, 0.5)',
        }}
        animate={{
          x: gridPos ? gridPos.x - CELL_SIZE * 0.35 : 0,
          y: gridPos ? gridPos.y - CELL_SIZE * 0.35 : 0,
          scale: isMoving ? 1.3 : isSelected ? 1.15 : 1,
          rotate: isMoving ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: isMoving ? 0.15 : 0.3,
          ease: 'easeInOut',
        }}
      />
    );
  };

  return (
    <div className="board" style={{ position: 'relative' }}>
      <style jsx global>{`
        .green { background-color: #009900; }
        .red { background-color: #FF0000; }
        .blue { background-color: #66CCFF; }
        .yellow { background-color: #FFCC00; }
        
        .row { display: flex; }
        
        .board {
          width: fit-content;
          border: 10px solid #11262e;
          border-radius: 5px;
          margin: 10px auto;
          position: relative;
        }
        
        .white-box {
          background-color: white;
          width: 150px;
          height: 150px;
          margin: 20% auto;
          border: 1px solid black;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          place-items: center;
          padding: 16px;
        }
        
        .red-box {
          background-color: #FF0000;
          width: 250px;
          height: 250px;
          border: 1px solid black;
        }
        
        .green-box {
          background-color: #009900;
          width: 250px;
          height: 250px;
          border: 1px solid black;
        }
        
        .blue-box {
          background-color: #66CCFF;
          width: 250px;
          height: 250px;
          border: 1px solid black;
        }
        
        .yellow-box {
          background-color: #FFCC00;
          width: 250px;
          height: 250px;
          border: 1px solid #000;
        }
        
        .white-box .circle {
          border-radius: 50%;
          width: 40px;
          height: 40px;
          border: 2px solid #444;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
        }
        
        .cell {
          width: 40px;
          height: 40px;
          border: 1px solid #000;
          position: relative;
        }
        
        .destination {
          width: 0;
          height: 0;
          border-top: 63px solid #009900;
          border-left: 63px solid #FF0000;
          border-right: 63px solid #FFCC00;
          border-bottom: 63px solid #66CCFF;
        }
        
        .track-piece {
          position: absolute;
          border-radius: 50%;
          border: 2.5px solid #444;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
        }
        
        .track-piece.selected {
          border-color: #ffd700;
          border-width: 3px;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.8), 0 3px 8px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      {/* Top Row: Red box, middle cells, Green box */}
      <div className="row">
        {/* Red Box */}
        <div className="red-box">
          <div className="white-box">
            {getHomePieces(PlayerColor.RED).map((piece) => (
              <div
                key={piece.id}
                className={`circle red ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.RED ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
                style={{
                  background: `radial-gradient(circle at 30% 30%, #ff6b6b 0%, ${playerColors[PlayerColor.RED].main} 40%, ${playerColors[PlayerColor.RED].dark} 100%)`,
                  transform: selectedPiece === piece.id && currentPlayerColor === PlayerColor.RED ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Top-Middle Cell Container */}
        <div className="cell-container">
          <div className="row">
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell green"></div>
            <div className="cell green"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell green"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell green"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell green"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell green"></div>
            <div className="cell"></div>
          </div>
        </div>

        {/* Green Box */}
        <div className="green-box">
          <div className="white-box">
            {getHomePieces(PlayerColor.GREEN).map((piece) => (
              <div
                key={piece.id}
                className={`circle green ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.GREEN ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
                style={{
                  background: `radial-gradient(circle at 30% 30%, #81c784 0%, ${playerColors[PlayerColor.GREEN].main} 40%, ${playerColors[PlayerColor.GREEN].dark} 100%)`,
                  transform: selectedPiece === piece.id && currentPlayerColor === PlayerColor.GREEN ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Left cells, destination, Right cells */}
      <div className="row">
        {/* Left Cell Container */}
        <div className="cell-container">
          <div className="row">
            <div className="cell"></div>
            <div className="cell red"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell red"></div>
            <div className="cell red"></div>
            <div className="cell red"></div>
            <div className="cell red"></div>
            <div className="cell red"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
          </div>
        </div>

        {/* Destination Triangle */}
        <div className="destination"></div>

        {/* Right Cell Container */}
        <div className="cell-container">
          <div className="row">
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell yellow"></div>
            <div className="cell yellow"></div>
            <div className="cell yellow"></div>
            <div className="cell yellow"></div>
            <div className="cell yellow"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell yellow"></div>
            <div className="cell"></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Blue box, middle cells, Yellow box */}
      <div className="row">
        {/* Blue Box */}
        <div className="blue-box">
          <div className="white-box">
            {getHomePieces(PlayerColor.BLUE).map((piece) => (
              <div
                key={piece.id}
                className={`circle blue ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.BLUE ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
                style={{
                  background: `radial-gradient(circle at 30% 30%, #64b5f6 0%, ${playerColors[PlayerColor.BLUE].main} 40%, ${playerColors[PlayerColor.BLUE].dark} 100%)`,
                  transform: selectedPiece === piece.id && currentPlayerColor === PlayerColor.BLUE ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom-Middle Cell Container */}
        <div className="cell-container">
          <div className="row">
            <div className="cell"></div>
            <div className="cell blue"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell blue"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell blue"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell blue"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell blue"></div>
            <div className="cell blue"></div>
            <div className="cell"></div>
          </div>
          <div className="row">
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
          </div>
        </div>

        {/* Yellow Box */}
        <div className="yellow-box">
          <div className="white-box">
            {getHomePieces(PlayerColor.YELLOW).map((piece) => (
              <div
                key={piece.id}
                className={`circle yellow ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.YELLOW ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
                style={{
                  background: `radial-gradient(circle at 30% 30%, #ffd54f 0%, ${playerColors[PlayerColor.YELLOW].main} 40%, ${playerColors[PlayerColor.YELLOW].dark} 100%)`,
                  transform: selectedPiece === piece.id && currentPlayerColor === PlayerColor.YELLOW ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Render all track pieces */}
      {getTrackPieces().map(({ piece, player, position }) => renderPiece(piece, player, position))}
    </div>
  );
}

