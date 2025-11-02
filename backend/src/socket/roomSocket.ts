import { Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Room } from '../models/Room';
import { PlayerColor } from '../types/game';

interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

export function setupRoomSocket(roomNamespace: Namespace) {
  // Authentication middleware
  roomNamespace.use(async (socket, next) => {
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

  roomNamespace.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;

    console.log(`[Room] User connected: ${username} (${socket.id})`);

    // Join room
    socket.on('join-room', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        const room = await Room.findOne({ code: roomCode.toUpperCase() });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if room is full
        if (room.players.length >= room.maxPlayers) {
          socket.emit('room-full', { message: 'Room is full. Maximum 4 players allowed.' });
          return;
        }

        // Update or add player
        let player = room.players.find(p => p.userId === userId);
        if (player) {
          player.socketId = socket.id;
        } else {
          room.players.push({
            userId,
            socketId: socket.id,
            username,
            isReady: false
          });
        }

        await room.save();

        socket.join(roomCode);
        
        // Notify all players
        roomNamespace.to(roomCode).emit('player-joined', {
          userId,
          username,
          room,
          message: `${username} joined the room`
        });

        socket.emit('room-joined', { room });

        // Auto-start countdown if 2+ players are connected and ready
        const connectedPlayers = room.players.filter(p => p.socketId && p.socketId !== '');
        const readyPlayers = connectedPlayers.filter(p => p.isReady);
        if (connectedPlayers.length >= 2 && readyPlayers.length >= 2 && room.status === 'waiting') {
          startCountdown(roomCode, roomNamespace);
        }
      } catch (error) {
        console.error('[Room] Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
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

          roomNamespace.to(roomCode).emit('player-ready-updated', { room });

          // Auto-start countdown if 2+ players are ready
          const connectedPlayers = room.players.filter(p => p.socketId && p.socketId !== '');
          const readyPlayers = connectedPlayers.filter(p => p.isReady);
          if (connectedPlayers.length >= 2 && 
              readyPlayers.length >= 2 && 
              room.status === 'waiting') {
            startCountdown(roomCode, roomNamespace);
          }
        }
      } catch (error) {
        console.error('[Room] Player ready error:', error);
        socket.emit('error', { message: 'Failed to set ready status' });
      }
    });

    // Leave room
    socket.on('leave-room', async (data: { roomCode: string }) => {
      try {
        const { roomCode } = data;
        socket.leave(roomCode);
        
        const room = await Room.findOne({ code: roomCode.toUpperCase() });
        if (room) {
          const player = room.players.find(p => p.userId === userId);
          if (player) {
            player.socketId = '';
          }
          await room.save();
          roomNamespace.to(roomCode).emit('player-left', {
            userId,
            username,
            room
          });
        }
      } catch (error) {
        console.error('[Room] Leave room error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`[Room] User disconnected: ${username} (${socket.id})`);
      
      const rooms = await Room.find({ 'players.socketId': socket.id });
      for (const room of rooms) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          player.socketId = '';
          await room.save();
          roomNamespace.to(room.code).emit('player-disconnected', {
            userId,
            username,
            room
          });
        }
      }
    });
  });
}

let countdownIntervals: Map<string, NodeJS.Timeout> = new Map();

async function startCountdown(roomCode: string, roomNamespace: Namespace) {
  // Cancel existing countdown if any
  const existing = countdownIntervals.get(roomCode);
  if (existing) {
    clearInterval(existing);
  }

  const room = await Room.findOne({ code: roomCode.toUpperCase() });
  if (!room || room.status !== 'waiting') return;

  let countdown = 5;
  roomNamespace.to(roomCode).emit('countdown-started', { countdown, roomCode });

  const interval = setInterval(async () => {
        countdown--;
        
        if (countdown > 0) {
          roomNamespace.to(roomCode).emit('countdown-update', { countdown, roomCode });
        } else {
          clearInterval(interval);
          countdownIntervals.delete(roomCode);
          
          // Start the game
          const updatedRoom = await Room.findOne({ code: roomCode.toUpperCase() });
          if (!updatedRoom || updatedRoom.status !== 'waiting') return;

          const connectedPlayers = updatedRoom.players.filter(p => p.socketId && p.socketId !== '');
          const readyPlayers = connectedPlayers.filter(p => p.isReady);
          // Start game if at least 2 players are ready (supports 2-4 players)
          if (readyPlayers.length >= 2) {
            const gameData = await startGameFromRoom(roomCode);
            if (gameData) {
              roomNamespace.to(roomCode).emit('game-start', {
                gameId: gameData.gameId,
                gameState: gameData.gameState,
                room: gameData.room
              });
            }
          }
        }
  }, 1000);

  countdownIntervals.set(roomCode, interval);
}

async function startGameFromRoom(roomCode: string) {
  try {
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room || room.players.length < 2) return null;

    // Assign colors
    const colors = [PlayerColor.RED, PlayerColor.BLUE, PlayerColor.GREEN, PlayerColor.YELLOW];
    const connectedPlayers = room.players.filter(p => p.socketId && p.socketId !== '');
    
    connectedPlayers.forEach((player, index) => {
      player.color = colors[index];
      player.isReady = true;
    });

    room.status = 'starting';
    await room.save();

    // Import Game model and utilities
    const { Game } = await import('../models/Game');
    const { initializePieces } = await import('../utils/gameLogic');

    // Create game
    const game = new Game({
      roomId: room._id.toString(),
      players: connectedPlayers.map(player => ({
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

    return {
      gameId: game._id.toString(),
      gameState: game,
      room
    };
  } catch (error) {
    console.error('[Room] Start game error:', error);
    return null;
  }
}

