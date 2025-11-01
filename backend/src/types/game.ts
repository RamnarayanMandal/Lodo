export enum PlayerColor {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW'
}

export interface Player {
  id: string;
  userId: string;
  username: string;
  color: PlayerColor;
  pieces: Piece[];
  isReady: boolean;
}

export interface Piece {
  id: number;
  position: number; // -1 means in home, 0-51 means on track
  isHome: boolean;
  isSafe: boolean;
}

export interface GameState {
  id: string;
  roomId: string;
  players: Player[];
  currentTurn: number; // Index of current player
  diceValue: number;
  hasRolledDice: boolean;
  canMove: boolean;
  winner: string | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

export interface Move {
  pieceId: number;
  fromPosition: number;
  toPosition: number;
}

export interface DiceRoll {
  playerId: string;
  value: number;
  timestamp: Date;
}
