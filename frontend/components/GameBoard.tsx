'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, GameState } from '@/types/socket';
import { positionToGrid, isSafePosition, isHomeStretch, calculateIntermediatePositions } from '@/lib/utils/positionCalculator';

interface GameBoardProps {
  gameState: GameState | null;
  selectedPiece: number | null;
  onPieceClick: (pieceId: number) => void;
  currentPlayerColor?: PlayerColor;
  movingPiece?: { pieceId: number; fromPosition: number; toPosition: number; diceValue: number; color: PlayerColor } | null;
  isAnimating?: boolean;
}

// CSS Variables and colors matching the reference
const CELL_SIZE = 38; // px
const BOARD_SIZE = CELL_SIZE * 15; // 15x15 grid

// Realistic color gradients for 3D effect
const playerColors: Record<PlayerColor, { main: string; light: string; dark: string }> = {
  [PlayerColor.RED]: {
    main: '#E53935',
    light: '#EF5350',
    dark: '#C62828',
  },
  [PlayerColor.GREEN]: {
    main: '#4CAF50',
    light: '#66BB6A',
    dark: '#388E3C',
  },
  [PlayerColor.BLUE]: {
    main: '#2196F3',
    light: '#42A5F5',
    dark: '#1976D2',
  },
  [PlayerColor.YELLOW]: {
    main: '#FFC107',
    light: '#FFCA28',
    dark: '#F9A825',
  },
};

// Safe zone positions (where stars appear)
const safeZones: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [0, 8, 13],
  [PlayerColor.BLUE]: [13, 21, 26],
  [PlayerColor.GREEN]: [26, 34, 39],
  [PlayerColor.YELLOW]: [39, 47, 52],
};

// Start positions for each color
const startPositions: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,
  [PlayerColor.BLUE]: 13,
  [PlayerColor.GREEN]: 26,
  [PlayerColor.YELLOW]: 39,
};

// Home stretch start positions
const homeStretchStarts: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 52,
  [PlayerColor.BLUE]: 58,
  [PlayerColor.GREEN]: 64,
  [PlayerColor.YELLOW]: 70,
};


export function GameBoard({ gameState, selectedPiece, onPieceClick, currentPlayerColor, movingPiece, isAnimating = false }: GameBoardProps) {
  if (!gameState) return null;

  // Map piece position to CSS Grid coordinates using position calculator
  const getPieceGridPosition = (position: number, color: PlayerColor): { gridRow: number; gridColumn: number } | null => {
    const gridPos = positionToGrid(position, color);
    if (!gridPos) return null;
    return { gridRow: gridPos.row, gridColumn: gridPos.col };
  };

  // Track animation state for moving pieces
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

      // Animate through positions step-by-step
      let stepIndex = 0;
      const animateStep = () => {
        if (stepIndex < positions.length) {
          setAnimatingPieces(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(key);
            if (current) {
              // Update to next position in sequence
              current.currentPos = positions[stepIndex];
              newMap.set(key, current);
            }
            return newMap;
          });
          stepIndex++;
          // Continue animation to next step (150ms per cell)
          setTimeout(animateStep, 150);
        } else {
          // All steps completed, finalize position
          setAnimatingPieces(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(key);
            if (current) {
              // Ensure final position is set
              current.currentPos = movingPiece.toPosition;
              newMap.set(key, current);
            }
            return newMap;
          });
          
          // Clean up after a brief delay
          setTimeout(() => {
            setAnimatingPieces(prev => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }, 200);
        }
      };
      // Start animation after brief delay
      setTimeout(animateStep, 100);
    }
  }, [movingPiece]);

  // Get pieces in home area for a color
  const getHomePieces = (color: PlayerColor) => {
    const player = gameState.players.find((p) => p.color === color);
    if (!player) return [];
    return player.pieces.filter((p) => p.isHome && p.position === -1);
  };

  // Get pieces on track
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

  return (
    <div className="flex justify-center items-center p-4 w-full">
      <style jsx>{`
        .ludo-board {
          display: grid;
          grid-template-columns: repeat(6, ${CELL_SIZE}px) repeat(3, ${CELL_SIZE}px) repeat(6, ${CELL_SIZE}px);
          grid-template-rows: repeat(6, ${CELL_SIZE}px) repeat(3, ${CELL_SIZE}px) repeat(6, ${CELL_SIZE}px);
          width: ${BOARD_SIZE}px;
          height: ${BOARD_SIZE}px;
          border: 4px solid #1a1a1a;
          border-radius: 12px;
          overflow: visible;
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        }

        .house {
          display: flex;
          justify-content: center;
          align-items: center;
          border: 2px solid #444;
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 -2px 4px rgba(255, 255, 255, 0.2);
        }

        .house.red {
          grid-area: 1 / 1 / 7 / 7;
          background: linear-gradient(135deg, ${playerColors[PlayerColor.RED].light} 0%, ${playerColors[PlayerColor.RED].main} 50%, ${playerColors[PlayerColor.RED].dark} 100%);
        }

        .house.green {
          grid-area: 1 / 10 / 7 / 16;
          background: linear-gradient(135deg, ${playerColors[PlayerColor.GREEN].light} 0%, ${playerColors[PlayerColor.GREEN].main} 50%, ${playerColors[PlayerColor.GREEN].dark} 100%);
        }

        .house.blue {
          grid-area: 10 / 1 / 16 / 7;
          background: linear-gradient(135deg, ${playerColors[PlayerColor.BLUE].light} 0%, ${playerColors[PlayerColor.BLUE].main} 50%, ${playerColors[PlayerColor.BLUE].dark} 100%);
        }

        .house.yellow {
          grid-area: 10 / 10 / 16 / 16;
          background: linear-gradient(135deg, ${playerColors[PlayerColor.YELLOW].light} 0%, ${playerColors[PlayerColor.YELLOW].main} 50%, ${playerColors[PlayerColor.YELLOW].dark} 100%);
        }

        .token-base {
          width: 70%;
          height: 70%;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #d4d4d4 100%);
          border-radius: 8px;
          border: 3px solid #555;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          place-items: center;
          padding: 8px;
          box-shadow: 
            inset 0 2px 6px rgba(0, 0, 0, 0.4),
            inset 0 -2px 3px rgba(255, 255, 255, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .token {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid #444;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 
            0 3px 8px rgba(0, 0, 0, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
        }

        .token.red-token {
          background: radial-gradient(circle at 30% 30%, #ff6b6b 0%, ${playerColors[PlayerColor.RED].main} 40%, ${playerColors[PlayerColor.RED].dark} 100%);
        }

        .token.green-token {
          background: radial-gradient(circle at 30% 30%, #81c784 0%, ${playerColors[PlayerColor.GREEN].main} 40%, ${playerColors[PlayerColor.GREEN].dark} 100%);
        }

        .token.blue-token {
          background: radial-gradient(circle at 30% 30%, #64b5f6 0%, ${playerColors[PlayerColor.BLUE].main} 40%, ${playerColors[PlayerColor.BLUE].dark} 100%);
        }

        .token.yellow-token {
          background: radial-gradient(circle at 30% 30%, #ffd54f 0%, ${playerColors[PlayerColor.YELLOW].main} 40%, ${playerColors[PlayerColor.YELLOW].dark} 100%);
        }

        .token:hover {
          transform: scale(1.2) translateY(-2px);
          box-shadow: 
            0 5px 12px rgba(0, 0, 0, 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
        }

        .token.selected {
          border-color: #ffd700;
          border-width: 3px;
          box-shadow: 
            0 0 15px rgba(255, 215, 0, 0.8),
            0 3px 8px rgba(0, 0, 0, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
          transform: scale(1.15);
        }

        .token::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 60%, rgba(255, 255, 255, 0.3) 100%);
          border-radius: 50%;
          border: 1.5px solid rgba(0, 0, 0, 0.3);
          top: 25%;
          left: 25%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .token.red-token::before {
          border-color: ${playerColors[PlayerColor.RED].dark};
        }

        .token.green-token::before {
          border-color: ${playerColors[PlayerColor.GREEN].dark};
        }

        .token.blue-token::before {
          border-color: ${playerColors[PlayerColor.BLUE].dark};
        }

        .token.yellow-token::before {
          border-color: ${playerColors[PlayerColor.YELLOW].dark};
        }

        .center-home {
          grid-area: 7 / 7 / 10 / 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          border: 3px solid #333;
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.2),
            inset 0 -2px 4px rgba(255, 255, 255, 0.3);
        }

        .center-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
          transition: transform 0.2s ease;
        }

        .center-triangle:hover {
          transform: scale(1.05);
        }

        .center-triangle.red-bg {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.RED].light} 0%, ${playerColors[PlayerColor.RED].main} 50%, ${playerColors[PlayerColor.RED].dark} 100%);
          transform: rotate(270deg);
          box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        }

        .center-triangle.green-bg {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.GREEN].light} 0%, ${playerColors[PlayerColor.GREEN].main} 50%, ${playerColors[PlayerColor.GREEN].dark} 100%);
          transform: rotate(0deg);
          box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        }

        .center-triangle.blue-bg {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.BLUE].light} 0%, ${playerColors[PlayerColor.BLUE].main} 50%, ${playerColors[PlayerColor.BLUE].dark} 100%);
          transform: rotate(180deg);
          box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        }

        .center-triangle.yellow-bg {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.YELLOW].light} 0%, ${playerColors[PlayerColor.YELLOW].main} 50%, ${playerColors[PlayerColor.YELLOW].dark} 100%);
          transform: rotate(90deg);
          box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        }

        .pathway {
          display: grid;
          background-color: #f5f5f5;
        }

        .pathway.top-middle {
          grid-area: 1 / 7 / 7 / 10;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(6, 1fr);
        }

        .pathway.center-left {
          grid-area: 7 / 1 / 10 / 7;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(3, 1fr);
        }

        .pathway.center-right {
          grid-area: 7 / 10 / 10 / 16;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(3, 1fr);
        }

        .pathway.bottom-middle {
          grid-area: 10 / 7 / 16 / 10;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(6, 1fr);
        }

        .cell {
          width: ${CELL_SIZE}px;
          height: ${CELL_SIZE}px;
          border: 1px solid #bbb;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .cell.star::before {
          content: '⭐';
          font-size: 1.2em;
          position: absolute;
          color: #888;
        }

        .cell.green-entry,
        .cell.green-path {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.GREEN].light} 0%, ${playerColors[PlayerColor.GREEN].main} 100%);
          border-color: ${playerColors[PlayerColor.GREEN].dark};
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .cell.red-entry,
        .cell.red-path {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.RED].light} 0%, ${playerColors[PlayerColor.RED].main} 100%);
          border-color: ${playerColors[PlayerColor.RED].dark};
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .cell.yellow-entry,
        .cell.yellow-path {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.YELLOW].light} 0%, ${playerColors[PlayerColor.YELLOW].main} 100%);
          border-color: ${playerColors[PlayerColor.YELLOW].dark};
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .cell.blue-entry,
        .cell.blue-path {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.BLUE].light} 0%, ${playerColors[PlayerColor.BLUE].main} 100%);
          border-color: ${playerColors[PlayerColor.BLUE].dark};
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .cell.green-start {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.GREEN].light} 0%, ${playerColors[PlayerColor.GREEN].main} 50%, ${playerColors[PlayerColor.GREEN].dark} 100%);
          border: 3px solid ${playerColors[PlayerColor.GREEN].dark};
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .cell.red-start {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.RED].light} 0%, ${playerColors[PlayerColor.RED].main} 50%, ${playerColors[PlayerColor.RED].dark} 100%);
          border: 3px solid ${playerColors[PlayerColor.RED].dark};
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .cell.blue-start {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.BLUE].light} 0%, ${playerColors[PlayerColor.BLUE].main} 50%, ${playerColors[PlayerColor.BLUE].dark} 100%);
          border: 3px solid ${playerColors[PlayerColor.BLUE].dark};
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .cell.yellow-start {
          background: linear-gradient(135deg, ${playerColors[PlayerColor.YELLOW].light} 0%, ${playerColors[PlayerColor.YELLOW].main} 50%, ${playerColors[PlayerColor.YELLOW].dark} 100%);
          border: 3px solid ${playerColors[PlayerColor.YELLOW].dark};
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .arrow-down::after,
        .arrow-up::after,
        .arrow-left::after,
        .arrow-right::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-style: solid;
        }

        .arrow-down::after {
          border-width: 8px 8px 0 8px;
          border-color: #fff transparent transparent transparent;
          top: 55%;
        }

        .arrow-up::after {
          border-width: 0 8px 8px 8px;
          border-color: transparent transparent #fff transparent;
          top: 25%;
        }

        .arrow-left::after {
          border-width: 8px 8px 8px 0;
          border-color: transparent #fff transparent transparent;
          left: 25%;
        }

        .arrow-right::after {
          border-width: 8px 0 8px 8px;
          border-color: transparent transparent transparent #fff;
          left: 55%;
        }

        .track-piece {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid #444;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: auto;
          position: relative;
          box-shadow: 
            0 3px 8px rgba(0, 0, 0, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
        }

        .track-piece.red-token {
          background: radial-gradient(circle at 30% 30%, #ff6b6b 0%, ${playerColors[PlayerColor.RED].main} 40%, ${playerColors[PlayerColor.RED].dark} 100%);
        }

        .track-piece.green-token {
          background: radial-gradient(circle at 30% 30%, #81c784 0%, ${playerColors[PlayerColor.GREEN].main} 40%, ${playerColors[PlayerColor.GREEN].dark} 100%);
        }

        .track-piece.blue-token {
          background: radial-gradient(circle at 30% 30%, #64b5f6 0%, ${playerColors[PlayerColor.BLUE].main} 40%, ${playerColors[PlayerColor.BLUE].dark} 100%);
        }

        .track-piece.yellow-token {
          background: radial-gradient(circle at 30% 30%, #ffd54f 0%, ${playerColors[PlayerColor.YELLOW].main} 40%, ${playerColors[PlayerColor.YELLOW].dark} 100%);
        }

        .track-piece:hover {
          transform: scale(1.2) translateY(-2px);
          box-shadow: 
            0 5px 12px rgba(0, 0, 0, 0.6),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
        }

        .track-piece.selected {
          border-color: #ffd700;
          border-width: 3px;
          box-shadow: 
            0 0 15px rgba(255, 215, 0, 0.8),
            0 3px 8px rgba(0, 0, 0, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
          transform: scale(1.15);
        }

        .track-piece::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 60%, rgba(255, 255, 255, 0.3) 100%);
          border-radius: 50%;
          border: 1.5px solid rgba(0, 0, 0, 0.3);
          top: 25%;
          left: 25%;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .track-piece.red-token::before {
          border-color: ${playerColors[PlayerColor.RED].dark};
        }

        .track-piece.green-token::before {
          border-color: ${playerColors[PlayerColor.GREEN].dark};
        }

        .track-piece.blue-token::before {
          border-color: ${playerColors[PlayerColor.BLUE].dark};
        }

        .track-piece.yellow-token::before {
          border-color: ${playerColors[PlayerColor.YELLOW].dark};
        }
      `}</style>

      <div className="ludo-board">
        {/* Red House (Top-Left) */}
        <div className="house red">
          <div className="token-base">
            {getHomePieces(PlayerColor.RED).map((piece) => (
              <div
                key={piece.id}
                className={`token red-token ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.RED ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
              />
            ))}
          </div>
        </div>

        {/* Top-Middle Pathway */}
        <div className="pathway top-middle">
          {Array.from({ length: 18 }, (_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isGreenEntry = row === 0 && col === 0;
            const isGreenStart = row === 1 && col === 1;
            const isGreenPath = row > 1 && col === 1;
            const isStar = row === 4 && col === 2;

            return (
              <div
                key={`top-${i}`}
                className={`cell ${isGreenEntry ? 'green-entry arrow-down' : ''} ${isGreenStart ? 'green-start' : ''} ${isGreenPath ? 'green-path' : ''} ${isStar ? 'star' : ''}`}
              />
            );
          })}
        </div>

        {/* Green House (Top-Right) */}
        <div className="house green">
          <div className="token-base">
            {getHomePieces(PlayerColor.GREEN).map((piece) => (
              <div
                key={piece.id}
                className={`token green-token ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.GREEN ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
              />
            ))}
          </div>
        </div>

        {/* Center-Left Pathway */}
        <div className="pathway center-left">
          {Array.from({ length: 18 }, (_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const isRedEntry = col === 5 && row === 0;
            const isRedStart = col === 5 && row === 1;
            const isRedPath = row === 0 && col < 5;
            const isStar = row === 2 && col === 2;

            return (
              <div
                key={`left-${i}`}
                className={`cell ${isRedEntry ? 'red-entry arrow-right' : ''} ${isRedStart ? 'red-start' : ''} ${isRedPath ? 'red-path' : ''} ${isStar ? 'star' : ''}`}
              />
            );
          })}
        </div>

        {/* Center Home */}
        <div className="center-home">
          <div className="center-triangle red-bg" />
          <div className="center-triangle green-bg" />
          <div className="center-triangle blue-bg" />
          <div className="center-triangle yellow-bg" />
        </div>

        {/* Center-Right Pathway */}
        <div className="pathway center-right">
          {Array.from({ length: 18 }, (_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const isYellowEntry = col === 5 && row === 0;
            const isYellowStart = col === 5 && row === 1;
            const isYellowPath = row === 0 && col < 5;
            const isStar = row === 2 && col === 2;

            return (
              <div
                key={`right-${i}`}
                className={`cell ${isYellowEntry ? 'yellow-entry arrow-left' : ''} ${isYellowStart ? 'yellow-start' : ''} ${isYellowPath ? 'yellow-path' : ''} ${isStar ? 'star' : ''}`}
              />
            );
          })}
        </div>

        {/* Blue House (Bottom-Left) */}
        <div className="house blue">
          <div className="token-base">
            {getHomePieces(PlayerColor.BLUE).map((piece) => (
              <div
                key={piece.id}
                className={`token blue-token ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.BLUE ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
              />
            ))}
          </div>
        </div>

        {/* Bottom-Middle Pathway */}
        <div className="pathway bottom-middle">
          {Array.from({ length: 18 }, (_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const isBlueEntry = row === 0 && col === 0;
            const isBlueStart = row === 1 && col === 1;
            const isBluePath = row > 1 && col === 1;
            const isStar = row === 4 && col === 2;

            return (
              <div
                key={`bottom-${i}`}
                className={`cell ${isBlueEntry ? 'blue-entry arrow-up' : ''} ${isBlueStart ? 'blue-start' : ''} ${isBluePath ? 'blue-path' : ''} ${isStar ? 'star' : ''}`}
              />
            );
          })}
        </div>

        {/* Yellow House (Bottom-Right) */}
        <div className="house yellow">
          <div className="token-base">
            {getHomePieces(PlayerColor.YELLOW).map((piece) => (
              <div
                key={piece.id}
                className={`token yellow-token ${selectedPiece === piece.id && currentPlayerColor === PlayerColor.YELLOW ? 'selected' : ''}`}
                onClick={() => onPieceClick(piece.id)}
              />
            ))}
          </div>
        </div>

        {/* Pieces on track - positioned using Framer Motion for smooth animation */}
        {getTrackPieces().map(({ piece, player, position }) => {
          const pieceKey = `${player.color}-${piece.id}`;
          const animatingState = animatingPieces.get(pieceKey);
          // Use animated position if moving, otherwise use actual position
          const currentPos = animatingState !== undefined ? animatingState.currentPos : position;
          
          const gridPos = positionToGrid(currentPos, player.color as PlayerColor);
          if (!gridPos) {
            // If position is invalid or out of bounds, don't render
            return null;
          }

          const isSelected = selectedPiece === piece.id && currentPlayerColor === player.color;
          const isMoving = animatingState !== undefined;
          const isSafe = isSafePosition(currentPos, player.color as PlayerColor);
          const isInHome = isHomeStretch(currentPos, player.color as PlayerColor);
          const colorClass = `${player.color.toLowerCase()}-token`;

          const getColorGradient = () => {
            const gradients = {
              [PlayerColor.RED]: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #E53935 40%, #C62828 100%)',
              [PlayerColor.GREEN]: 'radial-gradient(circle at 30% 30%, #81c784 0%, #4CAF50 40%, #388E3C 100%)',
              [PlayerColor.BLUE]: 'radial-gradient(circle at 30% 30%, #64b5f6 0%, #2196F3 40%, #1976D2 100%)',
              [PlayerColor.YELLOW]: 'radial-gradient(circle at 30% 30%, #ffd54f 0%, #FFC107 40%, #F9A825 100%)',
            };
            return gradients[player.color as PlayerColor] || '';
          };

          return (
            <motion.div
              key={`track-piece-${player.userId}-${piece.id}`}
              className={`track-piece ${colorClass} ${isSelected ? 'selected' : ''} ${isMoving ? 'moving' : ''}`}
              onClick={() => !isAnimating && onPieceClick(piece.id)}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${CELL_SIZE * 0.7}px`,
                height: `${CELL_SIZE * 0.7}px`,
                borderRadius: '50%',
                background: getColorGradient(),
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
                x: gridPos.x - (CELL_SIZE * 0.7) / 2,
                y: gridPos.y - (CELL_SIZE * 0.7) / 2,
                scale: isMoving ? 1.3 : isSelected ? 1.15 : 1,
                rotate: isMoving ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: isMoving ? 0.15 : 0.3,
                ease: 'easeInOut',
                type: 'tween',
                stiffness: 300,
                damping: 30,
              }}
              whileHover={{
                scale: 1.2,
                transition: { duration: 0.2 },
              }}
            >
              {/* Glow effect for safe zones */}
              {isSafe && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 0, 0.5) 0%, transparent 70%)',
                    filter: 'blur(8px)',
                    zIndex: -1,
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Glow effect for home */}
              {isInHome && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: getColorGradient(),
                    filter: 'blur(12px)',
                    zIndex: -1,
                    opacity: 0.7,
                  }}
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Highlight dot */}
              <div
                className="absolute"
                style={{
                  width: '40%',
                  height: '40%',
                  top: '25%',
                  left: '25%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 60%, rgba(255, 255, 255, 0.3) 100%)',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(0, 0, 0, 0.3)',
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
