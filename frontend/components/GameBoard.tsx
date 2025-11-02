'use client';

import React from 'react';
import { PlayerColor, GameState } from '@/types/socket';

interface GameBoardProps {
  gameState: GameState | null;
  selectedPiece: number | null;
  onPieceClick: (pieceId: number) => void;
  currentPlayerColor?: PlayerColor;
}

// CSS Variables and colors matching the reference
const CELL_SIZE = 38; // px
const BOARD_SIZE = CELL_SIZE * 15; // 15x15 grid

const playerColors: Record<PlayerColor, string> = {
  [PlayerColor.RED]: '#E53935',
  [PlayerColor.GREEN]: '#4CAF50',
  [PlayerColor.BLUE]: '#2196F3',
  [PlayerColor.YELLOW]: '#FFC107',
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


export function GameBoard({ gameState, selectedPiece, onPieceClick, currentPlayerColor }: GameBoardProps) {
  if (!gameState) return null;

  // Map piece position to CSS Grid coordinates
  const getPieceGridPosition = (position: number, color: PlayerColor): { gridRow: number; gridColumn: number } | null => {
    if (position < 0) return null; // Piece in home
    
    // Home stretch paths (positions 52+)
    if (position >= 52) {
      const homeStretchIndex = position - 52;
      const colorIndex = Object.values(PlayerColor).indexOf(color);
      const stretchStart = colorIndex * 6;
      
      if (homeStretchIndex >= stretchStart && homeStretchIndex < stretchStart + 6) {
        const indexInStretch = homeStretchIndex - stretchStart;
        // Map to center home paths
        switch (color) {
          case PlayerColor.RED:
            return { gridRow: 7 + indexInStretch, gridColumn: 7 };
          case PlayerColor.BLUE:
            return { gridRow: 8, gridColumn: 7 + indexInStretch };
          case PlayerColor.GREEN:
            return { gridRow: 10 - indexInStretch, gridColumn: 9 };
          case PlayerColor.YELLOW:
            return { gridRow: 9, gridColumn: 10 - indexInStretch };
        }
      }
      return null;
    }
    
    // Outer track (positions 0-51) - simplified mapping
    // This is a complex calculation that maps the circular track to grid cells
    // For now, return center position - full implementation would calculate exact grid cells
    return null;
  };

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
          border: 3px solid #333;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          position: relative;
          background: #f5f5f5;
        }

        .house {
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #777;
        }

        .house.red {
          grid-area: 1 / 1 / 7 / 7;
          background-color: ${playerColors[PlayerColor.RED]};
        }

        .house.green {
          grid-area: 1 / 10 / 7 / 16;
          background-color: ${playerColors[PlayerColor.GREEN]};
        }

        .house.blue {
          grid-area: 10 / 1 / 16 / 7;
          background-color: ${playerColors[PlayerColor.BLUE]};
        }

        .house.yellow {
          grid-area: 10 / 10 / 16 / 16;
          background-color: ${playerColors[PlayerColor.YELLOW]};
        }

        .token-base {
          width: 70%;
          height: 70%;
          background-color: #ececec;
          border-radius: 5px;
          border: 2px solid #555;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          place-items: center;
          padding: 5px;
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
        }

        .token {
          width: 25px;
          height: 25px;
          background-color: #e0e0e0;
          border-radius: 50%;
          border: 2px solid #555;
          position: relative;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .token:hover {
          transform: scale(1.15);
        }

        .token.selected {
          border-color: #ffd700;
          border-width: 3px;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .token::before {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          border: 1px solid #555;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .token.red-token::before {
          border-color: ${playerColors[PlayerColor.RED]};
        }

        .token.green-token::before {
          border-color: ${playerColors[PlayerColor.GREEN]};
        }

        .token.blue-token::before {
          border-color: ${playerColors[PlayerColor.BLUE]};
        }

        .token.yellow-token::before {
          border-color: ${playerColors[PlayerColor.YELLOW]};
        }

        .center-home {
          grid-area: 7 / 7 / 10 / 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          background: white;
          border: 2px solid #333;
        }

        .center-triangle {
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        .center-triangle.red-bg {
          background-color: ${playerColors[PlayerColor.RED]};
          transform: rotate(270deg);
        }

        .center-triangle.green-bg {
          background-color: ${playerColors[PlayerColor.GREEN]};
          transform: rotate(0deg);
        }

        .center-triangle.blue-bg {
          background-color: ${playerColors[PlayerColor.BLUE]};
          transform: rotate(180deg);
        }

        .center-triangle.yellow-bg {
          background-color: ${playerColors[PlayerColor.YELLOW]};
          transform: rotate(90deg);
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
          border: 1px solid #ccc;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          background: white;
        }

        .cell.star::before {
          content: '⭐';
          font-size: 1.2em;
          position: absolute;
          color: #888;
        }

        .cell.green-entry,
        .cell.green-path {
          background-color: ${playerColors[PlayerColor.GREEN]};
        }

        .cell.red-entry,
        .cell.red-path {
          background-color: ${playerColors[PlayerColor.RED]};
        }

        .cell.yellow-entry,
        .cell.yellow-path {
          background-color: ${playerColors[PlayerColor.YELLOW]};
        }

        .cell.blue-entry,
        .cell.blue-path {
          background-color: ${playerColors[PlayerColor.BLUE]};
        }

        .cell.green-start {
          background-color: ${playerColors[PlayerColor.GREEN]};
          border: 2px solid #555;
        }

        .cell.red-start {
          background-color: ${playerColors[PlayerColor.RED]};
          border: 2px solid #555;
        }

        .cell.blue-start {
          background-color: ${playerColors[PlayerColor.BLUE]};
          border: 2px solid #555;
        }

        .cell.yellow-start {
          background-color: ${playerColors[PlayerColor.YELLOW]};
          border: 2px solid #555;
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
          width: 25px;
          height: 25px;
          background-color: #e0e0e0;
          border-radius: 50%;
          border: 2px solid #555;
          cursor: pointer;
          transition: transform 0.2s ease;
          z-index: 10;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          margin: auto;
          position: relative;
        }

        .track-piece:hover {
          transform: scale(1.15);
        }

        .track-piece.selected {
          border-color: #ffd700;
          border-width: 3px;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .track-piece::before {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          border: 1px solid #555;
        }

        .track-piece.red-token::before {
          border-color: ${playerColors[PlayerColor.RED]};
        }

        .track-piece.green-token::before {
          border-color: ${playerColors[PlayerColor.GREEN]};
        }

        .track-piece.blue-token::before {
          border-color: ${playerColors[PlayerColor.BLUE]};
        }

        .track-piece.yellow-token::before {
          border-color: ${playerColors[PlayerColor.YELLOW]};
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

        {/* Pieces on track - positioned using CSS Grid */}
        {getTrackPieces().map(({ piece, player, position }) => {
          const gridPos = getPieceGridPosition(position, player.color as PlayerColor);
          if (!gridPos) return null;

          const isSelected = selectedPiece === piece.id && currentPlayerColor === player.color;
          const colorClass = `${player.color.toLowerCase()}-token`;

          return (
            <div
              key={`track-piece-${player.userId}-${piece.id}`}
              className={`track-piece ${colorClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => onPieceClick(piece.id)}
              style={{
                gridRow: gridPos.gridRow,
                gridColumn: gridPos.gridColumn,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
