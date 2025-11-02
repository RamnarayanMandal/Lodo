import { Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Game } from '../models/Game';
import { PlayerColor } from '../types/game';
import { rollDice } from '../utils/gameLogic';
import { RTCSessionDescriptionInit, RTCIceCandidateInit } from '../types/webrtc';

export function setupGameSocket(gameNamespace: Namespace) {
  // Authentication middleware
  gameNamespace.use(async (socket, next) => {
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

  gameNamespace.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;

    console.log(`[Game] User connected: ${username} (${socket.id})`);

    // Join game
    socket.on('join-game', async (data: { gameId: string; roomCode: string }) => {
      try {
        const { gameId, roomCode } = data;
        const game = await Game.findById(gameId);

        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        socket.join(gameId);
        socket.join(roomCode); // Also join room for WebRTC signaling

        socket.emit('game-joined', { gameId, gameState: game });

        // Notify other players
        gameNamespace.to(gameId).emit('player-joined-game', {
          userId,
          username,
          gameState: game
        });
      } catch (error) {
        console.error('[Game] Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
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

        const diceValue = rollDice();
        game.diceValue = diceValue;
        game.hasRolledDice = true;

        // Check if player has valid moves
        const canMove = hasValidMoves(game, userId);
        game.canMove = canMove;

        await game.save();

        gameNamespace.to(gameId).emit('dice-rolled', {
          gameId: game._id,
          diceValue,
          playerId: userId,
          canMove,
          gameState: game
        });

        // Auto-switch turn if no valid moves and dice is not 6
        if (!canMove && diceValue !== 6) {
          game.currentTurn = getNextTurn(game.currentTurn, game.players.length);
          game.hasRolledDice = false;
          game.diceValue = 0;
          game.canMove = false;
          
          await game.save();

          // Emit turn-changed event
          gameNamespace.to(gameId).emit('turn-changed', {
            gameId: game._id,
            gameState: game,
            playerId: game.players[game.currentTurn].userId
          });
        }
      } catch (error) {
        console.error('[Game] Roll dice error:', error);
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

        const playerIndex = game.players.findIndex(p => p.userId === userId);
        const player = game.players[playerIndex];
        
        if (!player) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }
        
        // Ensure player can only move their own pieces
        if (player.userId !== userId) {
          socket.emit('error', { message: 'You can only move your own pieces' });
          return;
        }
        
        const piece = player.pieces.find(p => p.id === pieceId);

        if (!piece) {
          socket.emit('error', { message: 'Piece not found' });
          return;
        }

        const fromPosition = piece.position;
        const targetPosition = calculateTargetPosition(
          player.color as PlayerColor,
          piece.position,
          game.diceValue
        );

        if (targetPosition === -1) {
          socket.emit('error', { message: 'Invalid move: goti out of board.' });
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

        // Store dice value before resetting
        const rolledSix = game.diceValue === 6;
        
        // Check win condition
        const winner = checkWinCondition(game);
        if (winner) {
          game.status = 'finished';
          game.winner = winner;
          game.hasRolledDice = false;
          game.diceValue = 0;
          game.canMove = false;
        } else {
          if (!rolledSix) {
            // Switch turn if not a 6
            game.currentTurn = getNextTurn(game.currentTurn, game.players.length);
            game.hasRolledDice = false;
            game.diceValue = 0;
            game.canMove = false;
          } else {
            // If rolled 6, player can roll again (their turn continues)
            game.hasRolledDice = false;
            game.canMove = false;
            game.diceValue = 0;
          }
        }

        await game.save();

        // Emit piece moved event
        gameNamespace.to(gameId).emit('piece-moved', {
          gameId: game._id,
          playerId: userId,
          pieceId,
          fromPosition,
          toPosition: targetPosition,
          capturedPiece,
          winner,
          gameState: game
        });

        // Emit turn-changed if turn actually changed or if same player's turn continues (rolled 6)
        if (!winner) {
          gameNamespace.to(gameId).emit('turn-changed', {
            gameId: game._id,
            gameState: game,
            playerId: game.players[game.currentTurn].userId
          });
        }
      } catch (error) {
        console.error('[Game] Move piece error:', error);
        socket.emit('error', { message: 'Failed to move piece' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Game] User disconnected: ${username} (${socket.id})`);
    });
  });
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
    // If piece is at home (position -1) and dice is 6, can move
    if (piece.position === -1 && game.diceValue === 6) {
      return true;
    }
    
    // If piece is on the board (not at home), check if it can move
    if (piece.position !== -1) {
      const target = calculateTargetPosition(player.color as PlayerColor, piece.position, game.diceValue);
      if (target !== -1) {
        // Additional check: make sure target position isn't occupied by own piece
        const ownPieceAtTarget = player.pieces.find(
          (p: any) => p.id !== piece.id && !p.isHome && p.position === target
        );
        if (!ownPieceAtTarget) {
          return true;
        }
      }
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

