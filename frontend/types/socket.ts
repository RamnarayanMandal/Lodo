export { PlayerColor } from './game';
export type { PlayerColor as PlayerColorType } from './game';

// GameState interface - also defined in socket.d.ts for event types
export interface GameState {
  _id?: string;
  roomId: string;
  players: Array<{
    userId: string;
    username: string;
    color: string;
    pieces: Array<{
      id: number;
      position: number;
      isHome: boolean;
      isSafe: boolean;
    }>;
    isReady: boolean;
  }>;
  currentTurn: number;
  diceValue: number;
  hasRolledDice: boolean;
  canMove: boolean;
  winner: string | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

