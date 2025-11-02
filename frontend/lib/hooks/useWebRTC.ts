import { useRef, useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export function useWebRTC(socket: Socket | null, roomCode: string, enabled: boolean = true) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (!socket || !enabled) return;

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          roomCode,
          candidate: event.candidate,
          targetUserId: 'all',
        });
      }
    };

    // Handle remote streams
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set('remote', stream);
          return newMap;
        });
      }
    };

    // Setup socket listeners for WebRTC signaling
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      pc.close();
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
    };
  }, [socket, roomCode, enabled]);

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; fromUserId: string }) => {
    if (!pcRef.current || !socket) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        roomCode,
        answer,
        targetUserId: data.fromUserId,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; fromUserId: string }) => {
    if (!pcRef.current) return;
    
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
    if (!pcRef.current || !data.candidate) return;
    
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled,
      });

      setLocalStream(stream);
      
      if (pcRef.current) {
        stream.getTracks().forEach(track => {
          pcRef.current?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, [videoEnabled, audioEnabled]);

  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const createOffer = useCallback(async () => {
    if (!pcRef.current || !socket) return;
    
    try {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit('webrtc-offer', {
        roomCode,
        offer,
        targetUserId: 'all',
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [socket, roomCode]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const remoteStream = remoteStreams.get('remote');
    if (remoteStream && remoteVideoRefsRef.current.has('remote')) {
      const videoElement = remoteVideoRefsRef.current.get('remote');
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    }
  }, [remoteStreams]);

  return {
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
    isConnected: pcRef.current?.connectionState === 'connected',
  };
}

