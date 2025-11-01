import mongoose, { Schema, Document } from 'mongoose';
import { PlayerColor } from '../types/game';

export interface IPiece {
  id: number;
  position: number;
  isHome: boolean;
  isSafe: boolean;
}

export interface IPlayer {
  userId: string;
  username: string;
  color: PlayerColor;
  pieces: IPiece[];
  isReady: boolean;
}

export interface IGame extends Document {
  roomId: string;
  players: IPlayer[];
  currentTurn: number;
  diceValue: number;
  hasRolledDice: boolean;
  canMove: boolean;
  winner: string | null;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  updatedAt: Date;
}

const PieceSchema = new Schema<IPiece>({
  id: { type: Number, required: true },
  position: { type: Number, default: -1 },
  isHome: { type: Boolean, default: true },
  isSafe: { type: Boolean, default: false }
});

const PlayerSchema = new Schema<IPlayer>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  color: { type: String, required: true, enum: ['RED', 'BLUE', 'GREEN', 'YELLOW'] },
  pieces: [PieceSchema],
  isReady: { type: Boolean, default: false }
});

const GameSchema = new Schema<IGame>({
  roomId: { type: String, required: true },
  players: [PlayerSchema],
  currentTurn: { type: Number, default: 0 },
  diceValue: { type: Number, default: 0 },
  hasRolledDice: { type: Boolean, default: false },
  canMove: { type: Boolean, default: false },
  winner: { type: String, default: null },
  status: { type: String, default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Game = mongoose.model<IGame>('Game', GameSchema);
