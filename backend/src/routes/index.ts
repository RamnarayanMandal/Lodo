import express from 'express';
import authRoutes from './auth';
import roomRoutes from './rooms';

export function setupRoutes(app: express.Application) {
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', roomRoutes);
}
