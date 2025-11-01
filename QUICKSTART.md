# Quick Start Guide

## Quick Setup (Development)

### 1. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or use your local MongoDB instance
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Edit .env with your settings
npm run dev
```

Backend will run on http://localhost:3001

### 3. Frontend Setup (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

### 4. Access the Application
1. Open http://localhost:3000
2. Register a new account or login
3. Create a room or join with a room code
4. Wait for players to join and get ready
5. Game starts automatically when at least 2 players are ready

## Using Docker Compose (Production-like)

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## Testing Multi-Player

1. Open multiple browser windows/tabs
2. Register different accounts in each
3. Use the same room code to join
4. All players should see each other and game updates in real-time

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `docker ps` (should see mongodb container)
- Check connection string in `.env` file
- Try: `mongodb://localhost:27017/ludo`

### WebRTC Not Working
- Ensure HTTPS or localhost (required for getUserMedia)
- Check browser permissions for camera/microphone
- Try different browsers (Chrome, Firefox, Edge)

### Socket Connection Failed
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_SOCKET_URL` in frontend `.env.local`
- Check browser console for connection errors
