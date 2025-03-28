import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import { prisma } from './db';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);

const tryPort = async (port: number): Promise<number> => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        server.close();
        resolve(port);
      });
      server.on('error', reject);
    });
    return port;
  } catch (error) {
    if (port < 3010) {
      return tryPort(port + 1);
    }
    throw error;
  }
};

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    const port = await tryPort(3000);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 