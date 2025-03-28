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

const PORT = process.env.PORT || 3000;

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to database');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

export default app; 