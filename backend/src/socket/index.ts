import { Server } from 'socket.io';
import { setupRoomSocket } from './roomSocket';
import { setupGameSocket } from './gameSocket';

export function setupSocketIO(io: Server) {
  // Create namespaces
  const roomNamespace = io.of('/room');
  const gameNamespace = io.of('/game');

  // Setup room socket handlers
  setupRoomSocket(roomNamespace);
  
  // Setup game socket handlers
  setupGameSocket(gameNamespace);

  console.log('Socket.IO namespaces initialized: /room, /game');
}
