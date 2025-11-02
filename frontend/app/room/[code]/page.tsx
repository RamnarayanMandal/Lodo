'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSocket } from '@/lib/hooks/useSocket';
import { VideoChat } from '@/components/VideoChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Room } from '@/types/socket';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  
  const { socket, isConnected } = useSocket('room');
  const [room, setRoom] = useState<Room | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join room
    socket.emit('join-room', { roomCode });

    // Event listeners
    socket.on('room-joined', (data: { room: Room }) => {
      setRoom(data.room);
      setError(null);
    });

    socket.on('player-joined', (data: { userId: string; username: string; room: Room; message: string }) => {
      setRoom(data.room);
      console.log(`${data.username} joined`);
    });

    socket.on('player-left', (data: { userId: string; username: string; room: Room }) => {
      setRoom(data.room);
    });

    socket.on('player-disconnected', (data: { userId: string; username: string; room: Room }) => {
      setRoom(data.room);
    });

    socket.on('player-ready-updated', (data: { room: Room }) => {
      setRoom(data.room);
    });

    socket.on('room-updated', (data: { room: Room }) => {
      setRoom(data.room);
    });

    socket.on('countdown-started', (data: { countdown: number; roomCode: string }) => {
      setCountdown(data.countdown);
    });

    socket.on('countdown-update', (data: { countdown: number; roomCode: string }) => {
      setCountdown(data.countdown);
    });

    socket.on('game-start', (data: { gameId: string; gameState: any; room: Room }) => {
      // Redirect to game page
      router.push(`/game/${data.gameId}?roomCode=${roomCode}`);
    });

    socket.on('room-full', (data: { message: string }) => {
      setError(data.message);
      // Show toast or alert
      alert(data.message);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      console.error('Socket error:', data.message);
    });

    return () => {
      socket.off('room-joined');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('player-disconnected');
      socket.off('player-ready-updated');
      socket.off('room-updated');
      socket.off('countdown-started');
      socket.off('countdown-update');
      socket.off('game-start');
      socket.off('room-full');
      socket.off('error');
    };
  }, [socket, isConnected, roomCode, router]);

  const handleReady = () => {
    if (socket && roomCode) {
      socket.emit('player-ready', { roomCode });
      setIsReady(true);
    }
  };

  const handleLeave = () => {
    if (socket && roomCode) {
      socket.emit('leave-room', { roomCode });
    }
    router.push('/lobby');
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading room...</div>
      </div>
    );
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPlayer = room.players.find(p => p.userId === currentUser.id);
  const connectedPlayers = room.players.filter(p => p.socketId && p.socketId !== '');
  const readyPlayers = room.players.filter(p => p.isReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room: {room.code}</CardTitle>
                <CardDescription>
                  Waiting for players to join and get ready...
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Countdown Display */}
                {countdown !== null && countdown > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-center">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">
                      {countdown}
                    </div>
                    <div className="text-sm text-yellow-700">
                      Game starting in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    👥 Players in Room: {room.players.length}/{room.maxPlayers}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    🟢 Connected: {connectedPlayers.length} | 
                    ✅ Ready: {readyPlayers.length}
                  </div>
                  {room.players.length >= 2 && readyPlayers.length === connectedPlayers.length && connectedPlayers.length >= 2 && !countdown && (
                    <div className="text-sm font-semibold text-green-600 mt-2">
                      🎮 All players ready! Starting game in 5 seconds...
                    </div>
                  )}
                  {room.players.length < 2 && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⏳ Waiting for {2 - room.players.length} more player(s)...
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Players List */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm mb-2">Connected Users:</h4>
                  {room.players.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">
                      No players yet. Waiting for players to join...
                    </div>
                  ) : (
                    room.players.map((player) => {
                      const isConnected = player.socketId && player.socketId !== '';
                      const isCurrentUser = player.userId === currentUser.id;
                      return (
                        <div
                          key={player.userId}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg ${
                            isConnected 
                              ? isCurrentUser
                                ? 'bg-blue-100 border-blue-400'
                                : 'bg-green-50 border-green-300'
                              : 'bg-gray-50 border-gray-300 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${
                              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                            }`} title={isConnected ? 'Online' : 'Offline'}></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{player.username}</span>
                                {isCurrentUser && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-semibold">
                                    You
                                  </span>
                                )}
                                {player.color && (
                                  <span
                                    className="px-2 py-1 text-xs rounded text-white font-semibold"
                                    style={{
                                      backgroundColor: player.color.toLowerCase(),
                                    }}
                                  >
                                    {player.color}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {isConnected ? '🟢 Online & Connected' : '🔴 Offline'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {player.isReady ? (
                              <span className="text-green-600 font-semibold flex items-center gap-1">
                                <span>✓</span> Ready
                              </span>
                            ) : (
                              <span className="text-gray-400">⏳ Not ready</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 space-x-2">
                  {!currentPlayer?.isReady && (
                    <Button onClick={handleReady} disabled={!isConnected}>
                      I'm Ready
                    </Button>
                  )}
                  <Button onClick={handleLeave} variant="outline">
                    Leave Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video/Audio Section */}
          <div className="space-y-4">
            <VideoChat socket={socket} roomCode={roomCode} enabled={isConnected} />
          </div>
        </div>
      </div>
    </div>
  );
}
