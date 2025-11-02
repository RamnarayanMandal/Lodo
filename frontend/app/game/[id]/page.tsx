'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { VideoChat } from '@/components/VideoChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerColor, GameState } from '@/types/socket';
import { useToast } from '@/lib/hooks/useToast';
import { GameBoard } from '@/components/GameBoardNew';
import { validateMove } from '@/lib/utils/positionValidator';
import { calculateIntermediatePositions } from '@/lib/utils/positionCalculator';

// Board constants moved to GameBoard component

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const roomCode = searchParams.get('roomCode') || '';
  const { toast } = useToast();

  const { socket, isConnected } = useSocket('game');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [diceValue, setDiceValue] = useState(0);
  const [canRoll, setCanRoll] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [movingPiece, setMovingPiece] = useState<{ pieceId: number; fromPosition: number; toPosition: number; diceValue: number; color: PlayerColor } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Player colors with proper Ludo colors
  const playerColors: Record<PlayerColor, string> = {
    [PlayerColor.RED]: '#dc2626',
    [PlayerColor.BLUE]: '#2563eb',
    [PlayerColor.GREEN]: '#16a34a',
    [PlayerColor.YELLOW]: '#ca8a04',
  };

  const getCurrentUser = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }, []);

  const getCurrentPlayerIndex = useCallback(() => {
    if (!gameState) return -1;
    const userId = getCurrentUser();
    return gameState.players.findIndex(p => p.userId === userId);
  }, [gameState, getCurrentUser]);

  const isMyTurn = useCallback(() => {
    if (!gameState) return false;
    const currentPlayerIndex = getCurrentPlayerIndex();
    return gameState.currentTurn === currentPlayerIndex && gameState.status === 'playing';
  }, [gameState, getCurrentPlayerIndex]);

  useEffect(() => {
    if (!socket || !isConnected || !gameId) return;

    // Join game
    socket.emit('join-game', { gameId, roomCode });

    // Event listeners
    socket.on('game-joined', (data: { gameId: string; gameState: GameState }) => {
      setGameState(data.gameState);
      const myIndex = data.gameState.players.findIndex(p => p.userId === getCurrentUser());
      const isMyTurnNow = data.gameState.currentTurn === myIndex && !data.gameState.hasRolledDice;
      setCanRoll(isMyTurnNow && data.gameState.status === 'playing');
      setCanMove(false);
    });

    socket.on('player-joined-game', (data: { userId: string; username: string; gameState: GameState }) => {
      setGameState(data.gameState);
      toast({
        title: `${data.username} joined the game`,
      });
    });

    socket.on('turn-changed', (data: { gameState: GameState; playerId: string }) => {
      setGameState(data.gameState);
      const myIndex = data.gameState.players.findIndex(p => p.userId === getCurrentUser());
      const isMyTurnNow = data.gameState.currentTurn === myIndex && !data.gameState.hasRolledDice;
      setCanRoll(isMyTurnNow && data.gameState.status === 'playing');
      setCanMove(false);
      setDiceValue(0);
      setSelectedPiece(null);
      
      const player = data.gameState.players[data.gameState.currentTurn];
      if (player) {
        toast({
          title: `🎯 ${player.username}'s Turn`,
          description: 'Roll the dice!',
        });
      }
    });

    socket.on('dice-rolled', (data: { diceValue: number; canMove: boolean; gameState: GameState; playerId: string }) => {
      setDiceValue(data.diceValue);
      setCanMove(data.canMove);
      setGameState(data.gameState);
      setCanRoll(false);
      setSelectedPiece(null);
      
      const myIndex = data.gameState.players.findIndex(p => p.userId === getCurrentUser());
      if (data.playerId === getCurrentUser()) {
        if (!data.canMove && data.diceValue !== 6) {
          toast({
            title: `Rolled ${data.diceValue}`,
            description: 'No valid moves available',
            variant: 'destructive',
          });
        } else if (data.canMove) {
          toast({
            title: `🎲 Rolled ${data.diceValue}!`,
            description: 'Select a piece to move',
          });
        } else if (data.diceValue === 6) {
          toast({
            title: '🎉 Rolled 6!',
            description: 'Roll again after moving!',
          });
        }
      }
    });

    socket.on('piece-moved', (data: { gameState: GameState; winner: string | null; playerId: string; pieceId: number; fromPosition: number; toPosition: number; capturedPiece: any }) => {
      // Track movement for animation
      const player = data.gameState.players.find(p => p.userId === data.playerId);
      if (player) {
        const color = player.color as PlayerColor;
        
        // Validate move before animating
        const validation = validateMove(
          data.fromPosition,
          data.toPosition,
          color,
          diceValue
        );
        
        if (!validation.isValid) {
          toast({
            title: '❌ Invalid Move',
            description: validation.error || 'Invalid move: goti out of board.',
            variant: 'destructive',
          });
          setMovingPiece(null);
          setIsAnimating(false);
          return;
        }

        // Show capture notification if piece was captured
        if (data.capturedPiece) {
          const capturedPlayer = data.gameState.players.find(p => p.color === data.capturedPiece.playerColor);
          toast({
            title: '⚔️ Capture!',
            description: `${player.username} captured ${capturedPlayer?.username || 'opponent'}'s goti!`,
            variant: 'default',
          });
        }

        setIsAnimating(true);
        setMovingPiece({
          pieceId: data.pieceId,
          fromPosition: data.fromPosition,
          toPosition: data.toPosition,
          diceValue: diceValue,
          color,
        });

        // Calculate animation duration based on actual steps (150ms per cell)
        // Use intermediate positions to get accurate step count
        const intermediatePositions = calculateIntermediatePositions(
          data.fromPosition,
          data.toPosition,
          color,
          diceValue
        );
        const steps = intermediatePositions.length || diceValue;
        const animationDuration = Math.max(1000, steps * 150 + 300); // Add buffer for completion

        // Clear moving piece after animation completes
        setTimeout(() => {
          setMovingPiece(null);
          setIsAnimating(false);
        }, animationDuration);
      }

      setGameState(data.gameState);
      setCanMove(false);
      setSelectedPiece(null);
      setDiceValue(0);
      
      const myIndex = data.gameState.players.findIndex(p => p.userId === getCurrentUser());
      if (data.gameState.diceValue === 6 && data.gameState.currentTurn === myIndex) {
        setCanRoll(true);
      } else {
        setCanRoll(false);
      }
      
      if (data.winner) {
        setTimeout(() => {
          const winnerName = data.gameState.players.find(p => p.userId === data.winner)?.username;
          toast({
            title: `🎉 Game Over!`,
            description: `${winnerName} wins!`,
          });
          setTimeout(() => {
            router.push('/lobby');
          }, 5000);
        }, 500);
      }
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Game error:', data.message);
      
      // Check if it's an invalid move error and customize message
      let errorTitle = 'Error';
      let errorDescription = data.message;
      
      if (data.message.toLowerCase().includes('invalid move') || data.message.toLowerCase().includes('cannot move')) {
        errorTitle = '❌ Invalid Move';
        if (data.message.toLowerCase().includes('out of board') || data.message.toLowerCase().includes('invalid move')) {
          errorDescription = 'Invalid move: goti out of board.';
        } else {
          errorDescription = data.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
      
      // Reset animation state on error
      setIsAnimating(false);
      setMovingPiece(null);
    });

    return () => {
      socket.off('game-joined');
      socket.off('player-joined-game');
      socket.off('turn-changed');
      socket.off('dice-rolled');
      socket.off('piece-moved');
      socket.off('error');
    };
  }, [socket, isConnected, gameId, roomCode, router, getCurrentUser, toast]);

  // All board rendering is now handled by GameBoard component

  const handleRollDice = () => {
    if (socket && canRoll && isMyTurn()) {
      socket.emit('roll-dice', { gameId });
      setCanRoll(false);
    }
  };

  const handleLeaveGame = () => {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to leave the game? Your progress will be lost.')) {
      return;
    }

    // Show notification
    toast({
      title: 'Leaving Game',
      description: 'You are leaving the game...',
    });

    // Disconnect socket if connected
    if (socket && isConnected) {
      socket.disconnect();
    }

    // Redirect to lobby after brief delay
    setTimeout(() => {
      router.push('/lobby');
    }, 500);
  };

  const handlePieceClick = (pieceId: number) => {
    // Block clicks during animation
    if (isAnimating) {
      toast({
        title: 'Wait',
        description: 'Please wait for the goti to finish moving.',
        variant: 'default',
      });
      return;
    }
    
    if (!canMove || !isMyTurn() || !socket || !gameState) return;

    const player = gameState.players[getCurrentPlayerIndex()];
    const piece = player?.pieces.find(p => p.id === pieceId);
    
    if (!piece) return;

    // Each goti should have ID, position, and color
    if (!piece.id || piece.position === undefined || !player.color) {
      toast({
        title: 'Error',
        description: 'Goti data is invalid.',
        variant: 'destructive',
      });
      return;
    }

    // Validate move on client side
    if (piece.isHome && diceValue !== 6) {
      toast({
        title: 'Invalid Move',
        description: 'You need to roll a 6 to move a goti from home.',
        variant: 'destructive',
      });
      return;
    }
    
    if (piece.position === -1 && diceValue !== 6) {
      toast({
        title: 'Invalid Move',
        description: 'You need to roll a 6 to move a goti from home.',
        variant: 'destructive',
      });
      return;
    }

    // Validate move using position validator
    const targetPosition = calculateTargetPosition(player.color as PlayerColor, piece.position, diceValue);
    
    const validation = validateMove(
      piece.position,
      targetPosition,
      player.color as PlayerColor,
      diceValue
    );

    if (!validation.isValid) {
      toast({
        title: '❌ Invalid Move',
        description: validation.error || 'Invalid move: goti out of board.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedPiece(pieceId);
    socket.emit('move-piece', { gameId, pieceId });
  };

  // Helper function to calculate target position (simplified version)
  const calculateTargetPosition = (color: PlayerColor, currentPos: number, diceValue: number): number => {
    if (currentPos === -1 && diceValue === 6) {
      // Move from home to start position
      const startPositions: Record<PlayerColor, number> = {
        [PlayerColor.RED]: 0,
        [PlayerColor.BLUE]: 13,
        [PlayerColor.GREEN]: 26,
        [PlayerColor.YELLOW]: 39,
      };
      return startPositions[color];
    }
    
    if (currentPos === -1) return -1;
    
    // Simple calculation - backend will validate
    return (currentPos + diceValue) % 52;
  };

  // Piece clicking is now handled directly by GameBoard component via onPieceClick prop

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading game...</div>
          <div className="text-gray-600">Please wait while we set up your game</div>
        </div>
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
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      onClick={handleLeaveGame}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      ← Leave
                    </Button>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      🎮 LUDO GAME
                    </h2>
                    <div className="w-16"></div> {/* Spacer for alignment */}
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-6 py-3 rounded-full shadow-lg transition-all ${
                      gameState.status === 'playing'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      <span className="text-xl font-bold">
                        {currentPlayer ? `🎯 ${currentPlayer.username}'s Turn` : 'Waiting...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="flex justify-center items-center">
                    <div className={`relative ${isAnimating ? 'cursor-wait pointer-events-none' : ''}`}>
                      <GameBoard
                        gameState={gameState}
                        selectedPiece={selectedPiece}
                        onPieceClick={handlePieceClick}
                        currentPlayerColor={myPlayer?.color as PlayerColor}
                        movingPiece={movingPiece}
                        isAnimating={isAnimating}
                      />
                      {isAnimating && (
                        <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none flex items-center justify-center">
                          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm font-semibold">Moving goti...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info & Video Chat */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Dice Section - Prominent and separated */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-md">
                  <h3 className="font-bold text-lg mb-3 text-center text-blue-700">🎲 Dice</h3>
                  {diceValue > 0 ? (
                    <div className="text-8xl font-bold text-center text-blue-600 py-8 border-4 border-blue-400 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl animate-pulse mb-4">
                      {diceValue}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 border-2 border-gray-300 rounded-lg bg-white mb-4">
                      <div className="text-6xl mb-2">🎲</div>
                      <div className="text-sm font-semibold">Ready to Roll</div>
                    </div>
                  )}

                  {isMyTurn() && (
                    <Button
                      onClick={handleRollDice}
                      disabled={!canRoll}
                      className="w-full text-xl py-6 font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {canRoll ? '🎲 Roll Dice' : '⏳ Waiting...'}
                    </Button>
                  )}
                </div>

                {canMove && isMyTurn() && (
                  <div className="p-3 bg-green-50 border-2 border-green-400 rounded-lg animate-pulse">
                    <p className="text-sm font-semibold text-green-700 text-center">
                      ✅ Select a piece to move
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg mb-3 text-center">👥 Players ({gameState.players.length})</h3>
                  <div className="space-y-2">
                    {gameState.players.map((player) => {
                      const isCurrentTurn = player.userId === currentPlayer?.userId;
                      const isMyPlayer = player.userId === myPlayer?.userId;
                      const piecesHome = player.pieces.filter(p => p.isHome && p.position >= 52).length;
                      const colors: Record<PlayerColor, string> = {
                        [PlayerColor.RED]: 'bg-red-500',
                        [PlayerColor.BLUE]: 'bg-blue-500',
                        [PlayerColor.GREEN]: 'bg-green-500',
                        [PlayerColor.YELLOW]: 'bg-yellow-500',
                      };
                      
                      return (
                        <div
                          key={player.userId}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isCurrentTurn
                              ? 'bg-gradient-to-r from-blue-400 to-purple-400 border-blue-600 shadow-lg scale-105 text-white'
                              : isMyPlayer
                              ? 'bg-gray-100 border-gray-400'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 rounded-full ${colors[player.color as PlayerColor]} border-2 border-gray-800`}></div>
                            <div className={`font-bold ${isCurrentTurn ? 'text-white' : ''}`}>{player.username}</div>
                            {isCurrentTurn && (
                              <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded-full font-bold">
                                🎯 Playing
                              </span>
                            )}
                            {isMyPlayer && !isCurrentTurn && (
                              <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className={`text-xs mt-1 ${isCurrentTurn ? 'text-white' : 'text-gray-600'}`}>
                            Color: {player.color}
                          </div>
                          <div className={`text-xs mt-1 ${isCurrentTurn ? 'text-white' : 'text-gray-600'}`}>
                            🏠 Pieces Home: {piecesHome}/4
                          </div>
                          {piecesHome === 4 && (
                            <div className="text-xs font-bold text-yellow-300 mt-1">
                              🎉 Winner!
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave Game Button - At bottom, separated */}
                <div className="mt-6 pt-4 border-t-2 border-gray-200">
                  <Button
                    onClick={handleLeaveGame}
                    variant="destructive"
                    className="w-full text-base py-4 font-bold"
                    size="lg"
                  >
                    🚪 Leave Game
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Chat */}
            {roomCode && (
              <VideoChat socket={socket} roomCode={roomCode} enabled={isConnected} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
   