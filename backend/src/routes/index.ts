import express from 'express';
import authRoutes from './auth';
import roomRoutes from './rooms';
import gameRoutes from './games';

export function setupRoutes(app: express.Application) {
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
  app.use('/api/games', gameRoutes);
}
