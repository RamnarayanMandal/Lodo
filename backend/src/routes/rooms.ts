import express, { Request, Response } from 'express';
import { Room } from '../models/Room';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    (req as any).userId = decoded.userId;
    (req as any).username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Create room
router.post('/create', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const username = (req as any).username;

    // Generate unique room code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = new Room({
      code,
      hostId: userId,
      players: [],
      maxPlayers: 4,
      status: 'waiting'
    });

    await room.save();

    res.status(201).json({
      room: {
        id: room._id,
        code: room.code,
        hostId: room.hostId,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join room
router.post('/join', verifyToken, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = (req as any).userId;
    const username = (req as any).username;

    if (!code) {
      return res.status(400).json({ error: 'Room code required' });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Room is not accepting players' });
    }

    // Check if user is already in room
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      return res.json({
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          players: room.players,
          maxPlayers: room.maxPlayers,
          status: room.status
        }
      });
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Add player
    room.players.push({
      userId,
      socketId: '', // Will be set when connecting via WebSocket
      username,
      isReady: false
    });

    await room.save();

    res.json({
      room: {
        id: room._id,
        code: room.code,
        hostId: room.hostId,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get room
router.get('/:code', verifyToken, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      room: {
        id: room._id,
        code: room.code,
        hostId: room.hostId,
        players: room.players,
        maxPlayers: room.maxPlayers,
        status: room.status,
        gameId: room.gameId
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
