'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { WebRTCManager } from '@/lib/webrtc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Player {
  userId: string;
  socketId: string;
  username: string;
  color?: string;
  isReady: boolean;
}

interface Room {
  code: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  status: string;
  gameId?: string;
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.emit('join-room', { roomCode });

    socket.on('room-joined', (data: { room: Room }) => {
      setRoom(data.room);
    });

    socket.on('room-updated', (data: { room: Room }) => {
      setRoom(data.room);
    });

    socket.on('game-started', (data: { gameId: string; gameState: any; room: Room }) => {
      router.push(`/game/${data.gameId}`);
    });

    socket.on('error', (data: { message: string }) => {
      console.error('Socket error:', data.message);
    });

    // Initialize WebRTC
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const manager = new WebRTCManager(user.id, socket, roomCode);
    webrtcManagerRef.current = manager;
    setWebrtcManager(manager);

    manager.setOnRemoteStream((userId, stream) => {
      setRemoteStream(stream);
    });

    manager.startLocalStream(videoEnabled, audioEnabled).then((stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      // Create offer after a short delay
      setTimeout(() => {
        manager.createOffer();
      }, 1000);
    });

    return () => {
      socket.off('room-joined');
      socket.off('room-updated');
      socket.off('game-started');
      socket.off('error');
      manager.close();
    };
  }, [roomCode, router, videoEnabled, audioEnabled]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleReady = () => {
    if (socketRef.current) {
      socketRef.current.emit('player-ready', { roomCode });
      setIsReady(true);
    }
  };

  const handleToggleVideo = () => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.toggleVideo();
      setVideoEnabled(!videoEnabled);
    }
  };

  const handleToggleAudio = () => {
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.toggleAudio();
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleLeave = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomCode });
    }
    if (webrtcManagerRef.current) {
      webrtcManagerRef.current.close();
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
                <div className="space-y-2">
                  {room.players.map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{player.username}</span>
                        {player.color && (
                          <span
                            className="px-2 py-1 text-xs rounded"
                            style={{
                              backgroundColor: player.color.toLowerCase(),
                              color: 'white',
                            }}
                          >
                            {player.color}
                          </span>
                        )}
                      </div>
                      <div>
                        {player.isReady ? (
                          <span className="text-green-600">✓ Ready</span>
                        ) : (
                          <span className="text-gray-400">Not ready</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-x-2">
                  {!currentPlayer?.isReady && (
                    <Button onClick={handleReady}>I'm Ready</Button>
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
            <Card>
              <CardHeader>
                <CardTitle>Video & Audio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Your Video</label>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full rounded-lg border mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Remote Video</label>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border mt-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleToggleVideo}
                    variant={videoEnabled ? 'default' : 'secondary'}
                    size="sm"
                  >
                    {videoEnabled ? '🔴 Video On' : '⚫ Video Off'}
                  </Button>
                  <Button
                    onClick={handleToggleAudio}
                    variant={audioEnabled ? 'default' : 'secondary'}
                    size="sm"
                  >
                    {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
