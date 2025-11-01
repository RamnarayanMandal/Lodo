'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { WebRTCManager } from '@/lib/webrtc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerColor } from '@/types/game';

interface Piece {
  id: number;
  position: number;
  isHome: boolean;
  isSafe: boolean;
}

interface Player {
  userId: string;
  username: string;
  color: PlayerColor;
  pieces: Piece[];
  isReady: boolean;
}

interface GameState {
  id: string;
  roomId: string;
  players: Player[];
  currentTurn: number;
  diceValue: number;
  hasRolledDice: boolean;
  canMove: boolean;
  winner: string | null;
  status: string;
}

const BOARD_SIZE = 600;
const PIECE_SIZE = 20;
const START_POSITIONS: Record<PlayerColor, { x: number; y: number }> = {
  [PlayerColor.RED]: { x: 50, y: 50 },
  [PlayerColor.BLUE]: { x: 550, y: 50 },
  [PlayerColor.GREEN]: { x: 550, y: 550 },
  [PlayerColor.YELLOW]: { x: 50, y: 550 },
};

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [diceValue, setDiceValue] = useState(0);
  const [canRoll, setCanRoll] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const socketRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('dice-rolled', (data: { diceValue: number; canMove: boolean; gameState: GameState }) => {
      setDiceValue(data.diceValue);
      setCanRoll(false);
      setCanMove(data.canMove);
      setGameState(data.gameState);
    });

    socket.on('piece-moved', (data: { gameState: GameState; winner: string | null }) => {
      setGameState(data.gameState);
      setCanRoll(data.gameState.currentTurn === getCurrentPlayerIndex());
      setCanMove(false);
      setSelectedPiece(null);
      
      if (data.winner) {
        setTimeout(() => {
          alert(`Game Over! ${data.gameState.players.find(p => p.userId === data.winner)?.username} wins!`);
          router.push('/lobby');
        }, 1000);
      }
    });

    socket.on('game-started', (data: { gameState: GameState }) => {
      setGameState(data.gameState);
      setCanRoll(true);
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Game error:', data.message);
      alert(data.message);
    });

    return () => {
      socket.off('dice-rolled');
      socket.off('piece-moved');
      socket.off('game-started');
      socket.off('error');
    };
  }, [gameId, router]);

  useEffect(() => {
    if (gameState && canvasRef.current) {
      drawBoard();
    }
  }, [gameState, diceValue]);

  const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const getCurrentPlayerIndex = () => {
    if (!gameState) return -1;
    const userId = getCurrentUser();
    return gameState.players.findIndex(p => p.userId === userId);
  };

  const isMyTurn = () => {
    if (!gameState) return false;
    const currentPlayerIndex = getCurrentPlayerIndex();
    return gameState.currentTurn === currentPlayerIndex;
  };

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Draw board background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Draw center home areas
    const colors: Record<PlayerColor, string> = {
      [PlayerColor.RED]: '#ef4444',
      [PlayerColor.BLUE]: '#3b82f6',
      [PlayerColor.GREEN]: '#10b981',
      [PlayerColor.YELLOW]: '#eab308',
    };

    // Draw pieces
    gameState.players.forEach((player) => {
      const color = colors[player.color];
      player.pieces.forEach((piece, index) => {
        ctx.fillStyle = color;
        ctx.beginPath();

        if (piece.isHome) {
          // Draw in home area
          const startPos = START_POSITIONS[player.color];
          const offsetX = (index % 2) * 40;
          const offsetY = Math.floor(index / 2) * 40;
          ctx.arc(startPos.x + offsetX, startPos.y + offsetY, PIECE_SIZE, 0, Math.PI * 2);
        } else {
          // Draw on board
          const pos = calculateBoardPosition(player.color, piece.position);
          ctx.arc(pos.x, pos.y, PIECE_SIZE, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight selected piece
        if (selectedPiece === piece.id && isMyTurn()) {
          ctx.strokeStyle = '#ff0';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });
    });
  };

  const calculateBoardPosition = (color: PlayerColor, position: number): { x: number; y: number } => {
    // Simplified position calculation
    // In a real implementation, this would map position 0-51 to actual board coordinates
    const trackPositions: number[][] = [];
    
    // Outer track positions (0-51)
    for (let i = 0; i < 52; i++) {
      const angle = (i / 52) * Math.PI * 2;
      const radius = 200;
      trackPositions.push([
        BOARD_SIZE / 2 + radius * Math.cos(angle),
        BOARD_SIZE / 2 + radius * Math.sin(angle),
      ]);
    }

    if (position >= 0 && position < 52) {
      return { x: trackPositions[position][0], y: trackPositions[position][1] };
    }

    // Home stretch positions
    const homeStretchStarts: Record<PlayerColor, number> = {
      [PlayerColor.RED]: 0,
      [PlayerColor.BLUE]: 13,
      [PlayerColor.GREEN]: 26,
      [PlayerColor.YELLOW]: 39,
    };

    const startPos = START_POSITIONS[color];
    const homeStretchIndex = position - 52 - (homeStretchStarts[color] === 0 ? 0 : homeStretchStarts[color]);
    
    if (homeStretchIndex >= 0 && homeStretchIndex < 6) {
      return {
        x: startPos.x + (homeStretchIndex + 1) * 50,
        y: startPos.y,
      };
    }

    return { x: BOARD_SIZE / 2, y: BOARD_SIZE / 2 };
  };

  const handleRollDice = () => {
    if (socketRef.current && canRoll && isMyTurn()) {
      socketRef.current.emit('roll-dice', { gameId });
      setCanRoll(false);
    }
  };

  const handlePieceClick = (pieceId: number) => {
    if (!canMove || !isMyTurn()) return;

    const player = gameState?.players[getCurrentPlayerIndex()];
    const piece = player?.pieces.find(p => p.id === pieceId);
    
    if (!piece || (piece.isHome && diceValue !== 6)) return;

    setSelectedPiece(pieceId);
    
    // Move piece
    if (socketRef.current) {
      socketRef.current.emit('move-piece', { gameId, pieceId });
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentTurn];
  const myPlayer = gameState.players[getCurrentPlayerIndex()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={BOARD_SIZE}
                    height={BOARD_SIZE}
                    className="border-2 border-gray-300 rounded-lg bg-white"
                    onClick={(e) => {
                      // Handle piece clicks
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (rect) {
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        // Check which piece was clicked
                        if (myPlayer) {
                          myPlayer.pieces.forEach((piece) => {
                            if (piece.isHome) {
                              const startPos = START_POSITIONS[myPlayer.color];
                              const pieceIndex = myPlayer.pieces.indexOf(piece);
                              const offsetX = (pieceIndex % 2) * 40;
                              const offsetY = Math.floor(pieceIndex / 2) * 40;
                              const pieceX = startPos.x + offsetX;
                              const pieceY = startPos.y + offsetY;
                              if (Math.abs(x - pieceX) < PIECE_SIZE && Math.abs(y - pieceY) < PIECE_SIZE) {
                                handlePieceClick(piece.id);
                              }
                            } else {
                              const pos = calculateBoardPosition(myPlayer.color, piece.position);
                              if (Math.abs(x - pos.x) < PIECE_SIZE && Math.abs(y - pos.y) < PIECE_SIZE) {
                                handlePieceClick(piece.id);
                              }
                            }
                          });
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg">Current Turn</h3>
                  <p className="text-sm text-gray-600">{currentPlayer?.username}</p>
                </div>

                <div>
                  <h3 className="font-bold text-lg">Dice</h3>
                  {diceValue > 0 ? (
                    <div className="text-4xl font-bold text-center">{diceValue}</div>
                  ) : (
                    <div className="text-center text-gray-400">Roll dice</div>
                  )}
                </div>

                {isMyTurn() && (
                  <Button
                    onClick={handleRollDice}
                    disabled={!canRoll}
                    className="w-full"
                  >
                    Roll Dice
                  </Button>
                )}

                {canMove && (
                  <div className="text-sm text-blue-600">
                    Select a piece to move
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg mb-2">Players</h3>
                  <div className="space-y-2">
                    {gameState.players.map((player) => (
                      <div
                        key={player.userId}
                        className={`p-2 rounded ${
                          player.userId === currentPlayer?.userId
                            ? 'bg-blue-100'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{player.username}</div>
                        <div className="text-xs text-gray-600">{player.color}</div>
                        <div className="text-xs">
                          Pieces home: {player.pieces.filter(p => p.isHome && p.position >= 52).length}/4
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
