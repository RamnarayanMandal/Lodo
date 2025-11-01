import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Room } from '../models/Room';
import { Game } from '../models/Game';
import { PlayerColor } from '../types/game';
import { RTCSessionDescriptionInit, RTCIceCandidateInit } from '../types/webrtc';
import { 
  initializePieces, 
  rollDice
} from '../utils/gameLogic';

interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

const playerColors: PlayerColor[] = [PlayerColor.RED, PlayerColor.BLUE, PlayerColor.GREEN, PlayerColor.YELLOW];

export function setupSocketIO(io: Server) {
  // Middleware for authentication
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      (socket as any).userId = decoded.userId;
      (socket as any).username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;

    console.log(`User connected: ${username} (${socket.id})`);

    // Join room
    socket.on('join-room', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        const room = await Room.findOne({ code: roomCode.toUpperCase() });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Update player's socket ID
        const player = room.players.find(p => p.userId === userId);
        if (player) {
          player.socketId = socket.id;
          await room.save();
          
          // Notify other players that a player connected
          io.to(roomCode).emit('player-connected', {
            userId,
            username,
            room,
            message: `${username} joined the room`
          });
        }

        socket.join(roomCode);
        io.to(roomCode).emit('room-updated', { room });

        // Send current room state
        socket.emit('room-joined', { room });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        socket.leave(roomCode);
        
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (room) {
          room.players = room.players.filter(p => p.userId !== userId);
          await room.save();
          io.to(roomCode).emit('room-updated', { room });
        }
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // Player ready
    socket.on('player-ready', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        const room = await Room.findOne({ code: roomCode.toUpperCase() });

        if (!room) return;

        const player = room.players.find(p => p.userId === userId);
        if (player) {
          player.isReady = true;
          await room.save();

          io.to(roomCode).emit('player-ready-updated', { room });

          // Check if all players are ready and at least 2 players connected
          const connectedPlayers = room.players.filter(p => p.socketId && p.socketId !== '');
          const allReady = connectedPlayers.length >= 2 && 
                          connectedPlayers.length === room.players.length &&
                          connectedPlayers.every(p => p.isReady);
          
          if (allReady && room.status === 'waiting') {
            // Start game when at least 2 players are ready and connected
            await startGame(roomCode);
          }
        }
      } catch (error) {
        console.error('Player ready error:', error);
        socket.emit('error', { message: 'Failed to set ready status' });
      }
    });

    // WebRTC signaling
    socket.on('webrtc-offer', (data: { roomCode: string; offer: RTCSessionDescriptionInit; targetUserId: string }) => {
      const { roomCode, offer, targetUserId } = data;
      socket.to(roomCode).emit('webrtc-offer', {
        offer,
        fromUserId: userId,
        targetUserId
      });
    });

    socket.on('webrtc-answer', (data: { roomCode: string; answer: RTCSessionDescriptionInit; targetUserId: string }) => {
      const { roomCode, answer, targetUserId } = data;
      socket.to(roomCode).emit('webrtc-answer', {
        answer,
        fromUserId: userId,
        targetUserId
      });
    });

    socket.on('webrtc-ice-candidate', (data: { roomCode: string; candidate: RTCIceCandidateInit; targetUserId: string }) => {
      const { roomCode, candidate, targetUserId } = data;
      socket.to(roomCode).emit('webrtc-ice-candidate', {
        candidate,
        fromUserId: userId,
        targetUserId
      });
    });

    // Game events
    socket.on('roll-dice', async (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        const game = await Game.findById(gameId);

        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const currentPlayer = game.players[game.currentTurn];
        if (currentPlayer.userId !== userId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        if (game.hasRolledDice) {
          socket.emit('error', { message: 'Already rolled dice' });
          return;
        }

        // Roll dice
        const diceValue = rollDice();
        game.diceValue = diceValue;
        game.hasRolledDice = true;

        // Check if player has valid moves
        const canMove = hasValidMoves(game as any, userId);
        game.canMove = canMove;

        if (!canMove && diceValue !== 6) {
          // Skip turn
          game.currentTurn = getNextTurn(game.currentTurn, game.players.length);
          game.hasRolledDice = false;
          game.diceValue = 0;
        }

        await game.save();

        io.to(game.roomId).emit('dice-rolled', {
          gameId: game._id,
          diceValue,
          playerId: userId,
          canMove,
          gameState: game
        });
      } catch (error) {
        console.error('Roll dice error:', error);
        socket.emit('error', { message: 'Failed to roll dice' });
      }
    });

    socket.on('move-piece', async (data: { gameId: string; pieceId: number }) => {
      try {
        const { gameId, pieceId } = data;
        const game = await Game.findById(gameId);

        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const currentPlayer = game.players[game.currentTurn];
        if (currentPlayer.userId !== userId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        if (!game.hasRolledDice || !game.canMove) {
          socket.emit('error', { message: 'Cannot move piece' });
          return;
        }

        // Move piece using game logic
        const playerIndex = game.players.findIndex(p => p.userId === userId);
        const player = game.players[playerIndex];
        const piece = player.pieces.find(p => p.id === pieceId);

        if (!piece) {
          socket.emit('error', { message: 'Piece not found' });
          return;
        }

        const fromPosition = piece.position;
        
        // Calculate target position
        const targetPosition = calculateTargetPosition(
          player.color as PlayerColor,
          piece.position,
          game.diceValue
        );

        if (targetPosition === -1) {
          socket.emit('error', { message: 'Invalid move' });
          return;
        }

        // Check for captures
        let capturedPiece = null;
        for (let i = 0; i < game.players.length; i++) {
          if (i === playerIndex) continue;
          const opponent = game.players[i];
          const opponentPiece = opponent.pieces.find(
            p => !p.isHome && p.position === targetPosition
          );
          if (opponentPiece) {
            opponentPiece.position = -1;
            opponentPiece.isHome = true;
            opponentPiece.isSafe = false;
            capturedPiece = { playerColor: opponent.color, pieceId: opponentPiece.id };
            break;
          }
        }

        // Move piece
        piece.position = targetPosition;
        piece.isHome = false;

        // Check if reached home
        const homeStretch = getHomeStretch(player.color as PlayerColor);
        if (homeStretch.includes(targetPosition)) {
          piece.isSafe = true;
          if (targetPosition === homeStretch[homeStretch.length - 1]) {
            piece.isHome = true;
          }
        }

        // Check win condition
        const winner = checkWinCondition(game as any);
        if (winner) {
          game.status = 'finished';
          game.winner = winner;
        } else {
          // Next turn (unless rolled 6)
          if (game.diceValue !== 6) {
            game.currentTurn = getNextTurn(game.currentTurn, game.players.length);
          }
          game.hasRolledDice = false;
          game.diceValue = 0;
          game.canMove = false;
        }

        await game.save();

        io.to(game.roomId).emit('piece-moved', {
          gameId: game._id,
          playerId: userId,
          pieceId,
          fromPosition,
          toPosition: targetPosition,
          capturedPiece,
          winner,
          gameState: game
        });
      } catch (error) {
        console.error('Move piece error:', error);
        socket.emit('error', { message: 'Failed to move piece' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${username} (${socket.id})`);
      
      // Handle reconnection logic if needed
      const rooms = await Room.find({ 'players.socketId': socket.id });
      for (const room of rooms) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          player.socketId = '';
          await room.save();
          
          // Notify other players that a player disconnected
          io.to(room.code).emit('player-disconnected', {
            userId,
            username,
            room,
            message: `${username} left the room`
          });
          
          io.to(room.code).emit('room-updated', { room });
        }
      }
    });
  });
}

async function startGame(roomCode: string) {
  try {
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    // Game starts when at least 2 players are ready
    if (!room || room.players.length < 2) {
      console.log(`Cannot start game: room has ${room?.players.length || 0} players, need at least 2`);
      return;
    }

    // Assign colors
    const colors = [PlayerColor.RED, PlayerColor.BLUE, PlayerColor.GREEN, PlayerColor.YELLOW];
    room.players.forEach((player, index) => {
      player.color = colors[index];
    });

    room.status = 'starting';
    await room.save();

    // Create game
    const game = new Game({
      roomId: room._id.toString(),
      players: room.players.map(player => ({
        userId: player.userId,
        username: player.username,
        color: player.color!,
        pieces: initializePieces(player.color as PlayerColor),
        isReady: true
      })),
      currentTurn: 0,
      status: 'playing'
    });

    await game.save();

    room.gameId = game._id.toString();
    room.status = 'playing';
    await room.save();

    // Notify all players
    const ioInstance = (global as any).ioInstance;
    if (ioInstance) {
      ioInstance.to(roomCode).emit('game-started', {
        gameId: game._id,
        gameState: game,
        room
      });
    }
  } catch (error) {
    console.error('Start game error:', error);
  }
}

// Helper functions
function calculateTargetPosition(color: PlayerColor, currentPosition: number, diceValue: number): number {
  if (currentPosition === -1) {
    return diceValue === 6 ? getStartPosition(color) : -1;
  }

  const homeStretch = getHomeStretch(color);
  const isInHomeStretch = homeStretch.includes(currentPosition);

  if (isInHomeStretch) {
    const currentIndex = homeStretch.indexOf(currentPosition);
    const targetIndex = currentIndex + diceValue;
    if (targetIndex >= homeStretch.length) return -1;
    return homeStretch[targetIndex];
  }

  const startPos = getStartPosition(color);
  let newPosition = (currentPosition + diceValue) % 52;

  if (currentPosition < startPos && newPosition >= startPos) {
    const stepsIntoHomeStretch = newPosition - startPos;
    const homeStretch = getHomeStretch(color);
    if (stepsIntoHomeStretch < homeStretch.length) {
      return homeStretch[stepsIntoHomeStretch];
    }
    return -1;
  }

  if (currentPosition >= startPos && newPosition < currentPosition) {
    const stepsIntoHomeStretch = newPosition;
    const homeStretch = getHomeStretch(color);
    if (stepsIntoHomeStretch < homeStretch.length) {
      return homeStretch[stepsIntoHomeStretch];
    }
    return -1;
  }

  return newPosition;
}

function getStartPosition(color: PlayerColor): number {
  const positions: Record<PlayerColor, number> = {
    [PlayerColor.RED]: 0,
    [PlayerColor.BLUE]: 13,
    [PlayerColor.GREEN]: 26,
    [PlayerColor.YELLOW]: 39
  };
  return positions[color];
}

function getHomeStretch(color: PlayerColor): number[] {
  const stretches: Record<PlayerColor, number[]> = {
    [PlayerColor.RED]: [52, 53, 54, 55, 56, 57],
    [PlayerColor.BLUE]: [58, 59, 60, 61, 62, 63],
    [PlayerColor.GREEN]: [64, 65, 66, 67, 68, 69],
    [PlayerColor.YELLOW]: [70, 71, 72, 73, 74, 75]
  };
  return stretches[color];
}

function hasValidMoves(game: any, playerId: string): boolean {
  const player = game.players.find((p: any) => p.userId === playerId);
  if (!player) return false;

  for (const piece of player.pieces) {
    if (piece.isHome && game.diceValue === 6) return true;
    if (!piece.isHome) {
      const target = calculateTargetPosition(player.color as PlayerColor, piece.position, game.diceValue);
      if (target !== -1) return true;
    }
  }
  return false;
}

function checkWinCondition(game: any): string | null {
  for (const player of game.players) {
    const homeStretch = getHomeStretch(player.color as PlayerColor);
    const allHome = player.pieces.every((piece: any) => {
      return piece.isHome && homeStretch.includes(piece.position) && 
             piece.position === homeStretch[homeStretch.length - 1];
    });
    if (allHome) return player.userId;
  }
  return null;
}

function getNextTurn(currentTurn: number, totalPlayers: number): number {
  return (currentTurn + 1) % totalPlayers;
}
