// Socket.IO event types

// Room namespace events
export interface RoomSocketEvents {
  // Client -> Server
  'join-room': (data: { roomCode: string }) => void;
  'leave-room': (data: { roomCode: string }) => void;
  'player-ready': (data: { roomCode: string }) => void;
  
  // Server -> Client
  'room-joined': (data: { room: Room }) => void;
  'player-joined': (data: { userId: string; username: string; room: Room; message: string }) => void;
  'player-left': (data: { userId: string; username: string; room: Room }) => void;
  'player-disconnected': (data: { userId: string; username: string; room: Room }) => void;
  'player-ready-updated': (data: { room: Room }) => void;
  'room-updated': (data: { room: Room }) => void;
  'countdown-started': (data: { countdown: number; roomCode: string }) => void;
  'countdown-update': (data: { countdown: number; roomCode: string }) => void;
  'game-start': (data: { gameId: string; gameState: GameState; room: Room }) => void;
  'room-full': (data: { message: string }) => void;
  'error': (data: { message: string }) => void;
}

// Game namespace events
export interface GameSocketEvents {
  // Client -> Server
  'join-game': (data: { gameId: string; roomCode: string }) => void;
  'roll-dice': (data: { gameId: string }) => void;
  'move-piece': (data: { gameId: string; pieceId: number }) => void;
  'webrtc-offer': (data: { roomCode: string; offer: RTCSessionDescriptionInit; targetUserId: string }) => void;
  'webrtc-answer': (data: { roomCode: string; answer: RTCSessionDescriptionInit; targetUserId: string }) => void;
  'webrtc-ice-candidate': (data: { roomCode: string; candidate: RTCIceCandidateInit; targetUserId: string }) => void;
  
  // Server -> Client
  'game-joined': (data: { gameId: string; gameState: GameState }) => void;
  'player-joined-game': (data: { userId: string; username: string; gameState: GameState }) => void;
  'dice-rolled': (data: { gameId: string; diceValue: number; playerId: string; canMove: boolean; gameState: GameState }) => void;
  'piece-moved': (data: { gameId: string; playerId: string; pieceId: number; fromPosition: number; toPosition: number; capturedPiece: any; winner: string | null; gameState: GameState }) => void;
  'webrtc-offer': (data: { offer: RTCSessionDescriptionInit; fromUserId: string; targetUserId: string }) => void;
  'webrtc-answer': (data: { answer: RTCSessionDescriptionInit; fromUserId: string; targetUserId: string }) => void;
  'webrtc-ice-candidate': (data: { candidate: RTCIceCandidateInit; fromUserId: string; targetUserId: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface Room {
  _id?: string;
  code: string;
  hostId: string;
  players: Array<{
    userId: string;
    socketId?: string;
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

