import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/error';
import { 
  globalLimiter, 
  authLimiter, 
  businessLimiter, 
  customerLimiter, 
  smsLimiter,
  qrCodeLimiter,
  pointsRedemptionLimiter 
} from './middleware/rateLimit';
import {
  securityConfig,
  securityHeaders,
  preventParameterPollution,
  validateContentType
} from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import transactionRoutes from './routes/transactions';

const app = express();

// Security middleware
app.use(securityConfig.helmet);
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Request parsing and sanitization
app.use(express.json({ limit: '10kb' }));
app.use(securityConfig.mongoSanitize);
app.use(securityConfig.xss);
app.use(preventParameterPollution);
app.use(validateContentType);

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Apply specific rate limiters to routes
app.use('/api/auth/business', authLimiter);
app.use('/api/auth/customer', authLimiter);
app.use('/api/auth/customer/verify', smsLimiter);
app.use('/api/business', businessLimiter);
app.use('/api/business/qr-code', qrCodeLimiter);
app.use('/api/transactions/points/redeem', pointsRedemptionLimiter);
app.use('/api/transactions', customerLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/transactions', transactionRoutes);

// Error handling
app.use(errorHandler);

// Connect to databases
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Connect to Redis
    await connectRedis();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 