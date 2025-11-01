export class WebRTCManager {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private onRemoteStream: ((userId: string, stream: MediaStream) => void) | null = null;

  constructor(
    private userId: string,
    private socket: any,
    private roomCode: string
  ) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.pc = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          roomCode,
          candidate: event.candidate,
          targetUserId: 'all', // Send to all for now
        });
      }
    };

    // Handle remote streams
    this.pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.remoteStreams.set('remote', stream);
        if (this.onRemoteStream) {
          this.onRemoteStream('remote', stream);
        }
      }
    };

    // Setup socket listeners
    socket.on('webrtc-offer', this.handleOffer.bind(this));
    socket.on('webrtc-answer', this.handleAnswer.bind(this));
    socket.on('webrtc-ice-candidate', this.handleIceCandidate.bind(this));
  }

  async startLocalStream(video: boolean = true, audio: boolean = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video,
        audio,
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.localStream!);
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  async createOffer() {
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.socket.emit('webrtc-offer', {
        roomCode: this.roomCode,
        offer,
        targetUserId: 'all',
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async handleOffer(data: { offer: RTCSessionDescriptionInit; fromUserId: string }) {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.socket.emit('webrtc-answer', {
        roomCode: this.roomCode,
        answer,
        targetUserId: data.fromUserId,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async handleAnswer(data: { answer: RTCSessionDescriptionInit; fromUserId: string }) {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  async handleIceCandidate(data: { candidate: RTCIceCandidateInit; fromUserId: string }) {
    try {
      if (data.candidate) {
        await this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  setOnRemoteStream(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream(userId: string) {
    return this.remoteStreams.get(userId);
  }

  close() {
    this.stopLocalStream();
    this.pc.close();
    this.remoteStreams.clear();
  }
}
