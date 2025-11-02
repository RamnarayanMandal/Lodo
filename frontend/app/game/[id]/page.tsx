'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { VideoChat } from '@/components/VideoChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerColor, GameState } from '@/types/socket';
import { useToast } from '@/lib/hooks/useToast';
import { GameBoard } from '@/components/GameBoard';

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

    socket.on('piece-moved', (data: { gameState: GameState; winner: string | null; playerId: string }) => {
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
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
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

  const handlePieceClick = (pieceId: number) => {
    if (!canMove || !isMyTurn() || !socket || !gameState) return;

    const player = gameState.players[getCurrentPlayerIndex()];
    const piece = player?.pieces.find(p => p.id === pieceId);
    
    if (!piece) return;

    // Validate move on client side
    if (piece.isHome && diceValue !== 6) return;
    if (piece.position === -1 && diceValue !== 6) return;

    setSelectedPiece(pieceId);
    socket.emit('move-piece', { gameId, pieceId });
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
                  <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    🎮 LUDO GAME
                  </h2>
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
                    <GameBoard
                      gameState={gameState}
                      selectedPiece={selectedPiece}
                      onPieceClick={handlePieceClick}
                      currentPlayerColor={myPlayer?.color as PlayerColor}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Info & Video Chat */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 text-center">🎲 Dice</h3>
                  {diceValue > 0 ? (
                    <div className="text-8xl font-bold text-center text-blue-600 py-8 border-4 border-blue-400 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl animate-pulse">
                      {diceValue}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 border-2 border-gray-300 rounded-lg bg-gray-50">
                      <div className="text-6xl mb-2">🎲</div>
                      <div className="text-sm">Click to Roll</div>
                    </div>
                  )}
                </div>

                {isMyTurn() && (
                  <Button
                    onClick={handleRollDice}
                    disabled={!canRoll}
                    className="w-full text-lg py-6 font-bold"
                    size="lg"
                  >
                    {canRoll ? '🎲 Roll Dice' : '⏳ Waiting...'}
                  </Button>
                )}

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
   