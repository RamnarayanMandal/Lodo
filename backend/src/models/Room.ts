import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  code: string;
  hostId: string;
  players: Array<{
    userId: string;
    socketId: string;
    username: string;
    color?: string;
    isReady: boolean;
  }>;
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  gameId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  players: [{
    userId: { type: String, required: true },
    socketId: { type: String, required: true },
    username: { type: String, required: true },
    color: { type: String },
    isReady: { type: Boolean, default: false }
  }],
  maxPlayers: { type: Number, default: 4 },
  status: { type: String, default: 'waiting' },
  gameId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
