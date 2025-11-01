import { GameState, Player, PlayerColor, Move, Piece } from '../types/game';

// Starting positions for each color
const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,
  [PlayerColor.BLUE]: 13,
  [PlayerColor.GREEN]: 26,
  [PlayerColor.YELLOW]: 39
};

// Safe zones (home areas)
const SAFE_ZONES: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [0, 8, 13],
  [PlayerColor.BLUE]: [13, 21, 26],
  [PlayerColor.GREEN]: [26, 34, 39],
  [PlayerColor.YELLOW]: [39, 47, 0]
};

// Home stretch positions (final 6 positions before home)
const HOME_STRETCH: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [52, 53, 54, 55, 56, 57],
  [PlayerColor.BLUE]: [58, 59, 60, 61, 62, 63],
  [PlayerColor.GREEN]: [64, 65, 66, 67, 68, 69],
  [PlayerColor.YELLOW]: [70, 71, 72, 73, 74, 75]
};

export function initializePieces(color: PlayerColor): Piece[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    position: -1,
    isHome: true,
    isSafe: false
  }));
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function canMovePiece(gameState: GameState, playerId: string, pieceId: number): boolean {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  const currentPlayer = gameState.players[gameState.currentTurn];
  if (currentPlayer.id !== playerId) return false;

  if (!gameState.hasRolledDice) return false;

  const piece = player.pieces.find(p => p.id === pieceId);
  if (!piece) return false;

  // If piece is at home, can only move if dice is 6
  if (piece.isHome && gameState.diceValue !== 6) {
    return false;
  }

  // Calculate target position
  const targetPosition = calculateTargetPosition(player.color, piece.position, gameState.diceValue);
  
  // Check if target position is valid
  if (targetPosition === -1) return false; // Can't move

  // Check if target position is occupied by own piece
  const ownPieceAtTarget = player.pieces.find(
    p => !p.isHome && p.position === targetPosition && p.id !== pieceId
  );
  if (ownPieceAtTarget) return false;

  return true;
}

export function calculateTargetPosition(color: PlayerColor, currentPosition: number, diceValue: number): number {
  // If piece is at home
  if (currentPosition === -1) {
    if (diceValue === 6) {
      return START_POSITIONS[color];
    }
    return -1;
  }

  // If piece is in home stretch
  const homeStretch = HOME_STRETCH[color];
  const isInHomeStretch = homeStretch.includes(currentPosition);
  
  if (isInHomeStretch) {
    const currentIndex = homeStretch.indexOf(currentPosition);
    const targetIndex = currentIndex + diceValue;
    
    // Check if target is beyond home
    if (targetIndex >= homeStretch.length) {
      return -1; // Can't move beyond home
    }
    
    return homeStretch[targetIndex];
  }

  // Normal movement on track
  let newPosition = (currentPosition + diceValue) % 52;
  
  // Check if entering home stretch
  const startPos = START_POSITIONS[color];
  
  if (currentPosition < startPos) {
    // Crossed the start line
    if (newPosition >= startPos) {
      // Entering home stretch
      const stepsIntoHomeStretch = newPosition - startPos;
      if (stepsIntoHomeStretch < homeStretch.length) {
        return homeStretch[stepsIntoHomeStretch];
      }
      // Overshot home stretch, can't move
      return -1;
    }
  } else {
    // Haven't crossed start line yet
    if (newPosition < currentPosition) {
      // Crossed start line
      const stepsIntoHomeStretch = newPosition;
      if (stepsIntoHomeStretch < homeStretch.length) {
        return homeStretch[stepsIntoHomeStretch];
      }
      // Overshot home stretch, can't move
      return -1;
    }
  }

  // Check if piece completes a full lap
  if (newPosition === startPos && currentPosition !== startPos) {
    return newPosition; // Stay at start position
  }

  return newPosition;
}

export function movePiece(gameState: GameState, playerId: string, pieceId: number): Move | null {
  if (!canMovePiece(gameState, playerId, pieceId)) {
    return null;
  }

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  const piece = player.pieces.find(p => p.id === pieceId);
  if (!piece) return null;

  const fromPosition = piece.position;
  const toPosition = calculateTargetPosition(player.color, piece.position, gameState.diceValue);

  if (toPosition === -1) return null;

  // Check if there's an opponent piece at target position to capture
  const opponentPiece = findPieceAtPosition(gameState, toPosition, playerId);
  
  if (opponentPiece) {
    // Send opponent piece home
    opponentPiece.position = -1;
    opponentPiece.isHome = true;
    opponentPiece.isSafe = false;
  }

  // Move piece
  piece.position = toPosition;
  piece.isHome = false;
  
  // Check if piece entered safe zone
  piece.isSafe = SAFE_ZONES[player.color].includes(toPosition);

  // Check if piece reached home
  const homeStretch = HOME_STRETCH[player.color];
  if (homeStretch.includes(toPosition) && toPosition === homeStretch[homeStretch.length - 1]) {
    // Piece reached home - win condition checked elsewhere
    piece.isHome = true;
  }

  return {
    pieceId,
    fromPosition,
    toPosition
  };
}

function findPieceAtPosition(gameState: GameState, position: number, excludePlayerId: string): Piece | null {
  for (const player of gameState.players) {
    if (player.id === excludePlayerId) continue;
    
    const piece = player.pieces.find(p => !p.isHome && p.position === position);
    if (piece) {
      return piece;
    }
  }
  return null;
}

export function checkWinCondition(gameState: GameState): string | null {
  for (const player of gameState.players) {
    const allPiecesHome = player.pieces.every(p => {
      const homeStretch = HOME_STRETCH[player.color];
      return p.isHome && homeStretch.includes(p.position) && 
             p.position === homeStretch[homeStretch.length - 1];
    });
    
    if (allPiecesHome) {
      return player.id;
    }
  }
  return null;
}

export function getNextTurn(currentTurn: number, totalPlayers: number): number {
  return (currentTurn + 1) % totalPlayers;
}

export function hasValidMoves(gameState: GameState, playerId: string): boolean {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  for (const piece of player.pieces) {
    if (canMovePiece(gameState, playerId, piece.id)) {
      return true;
    }
  }
  return false;
}
