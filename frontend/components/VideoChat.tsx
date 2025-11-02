'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebRTC } from '@/lib/hooks/useWebRTC';
import { Socket } from 'socket.io-client';

interface VideoChatProps {
  socket: Socket | null;
  roomCode: string;
  enabled?: boolean;
  className?: string;
}

export function VideoChat({ socket, roomCode, enabled = true, className }: VideoChatProps) {
  const {
    localStream,
    remoteStreams,
    videoEnabled,
    audioEnabled,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
    createOffer,
    localVideoRef,
    remoteVideoRefsRef,
  } = useWebRTC(socket, roomCode, enabled);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (enabled && socket && socket.connected) {
      startLocalStream().then(() => {
        // Create offer after a short delay to ensure other peers are ready
        setTimeout(() => {
          createOffer();
        }, 1000);
      }).catch(error => {
        console.error('Failed to start local stream:', error);
      });
    }

    return () => {
      stopLocalStream();
    };
  }, [enabled, socket, startLocalStream, stopLocalStream, createOffer]);

  useEffect(() => {
    // Set up remote video ref
    if (remoteVideoRef.current) {
      remoteVideoRefsRef.current.set('remote', remoteVideoRef.current);
    }

    const remoteStream = remoteStreams.get('remote');
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStreams, remoteVideoRefsRef]);

  if (!enabled) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">🎥 Video & Audio Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Video */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Video</label>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg border-2 border-blue-300 bg-black aspect-video"
            />
          </div>

          {/* Remote Video */}
          <div>
            <label className="text-sm font-medium mb-2 block">Remote Video</label>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg border-2 border-green-300 bg-black aspect-video"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={toggleVideo}
            variant={videoEnabled ? 'default' : 'secondary'}
            size="sm"
          >
            {videoEnabled ? '🔴 Video On' : '⚫ Video Off'}
          </Button>
          <Button
            onClick={toggleAudio}
            variant={audioEnabled ? 'default' : 'secondary'}
            size="sm"
          >
            {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

