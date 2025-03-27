import express, { RequestHandler } from 'express';
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
import http from 'http';
import { findAvailablePort } from './utils/portFinder';

// Import routes
import authRoutes from './routes/auth';
import businessRoutes from './routes/business';
import transactionRoutes from './routes/transactions';

const app = express();

// Security middleware
app.use(securityConfig.helmet);
app.use(securityHeaders);
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Request parsing and sanitization
app.use(express.json({ limit: '10kb' }));
app.use(securityConfig.mongoSanitize as unknown as RequestHandler);
app.use(securityConfig.xss as unknown as RequestHandler);
app.use(preventParameterPollution);
app.use(validateContentType);

// Apply specific rate limiters to routes (most specific first)
app.use('/api/auth/customer/verify', smsLimiter as unknown as RequestHandler);
app.use('/api/auth/business', authLimiter as unknown as RequestHandler);
app.use('/api/auth/customer', authLimiter as unknown as RequestHandler);
app.use('/api/business/qr-code', qrCodeLimiter as unknown as RequestHandler);
app.use('/api/business', businessLimiter as unknown as RequestHandler);
app.use('/api/transactions/points/redeem', pointsRedemptionLimiter as unknown as RequestHandler);
app.use('/api/transactions', customerLimiter as unknown as RequestHandler);

// Apply global limiter to all other routes that haven't been rate-limited yet
app.use(globalLimiter as unknown as RequestHandler);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/transactions', transactionRoutes);

// Add this after your middleware setup but before error handling
app.get('/', (req, res) => {
  res.json({ message: 'SimplePay API is running' });
});

// Add a 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling
app.use(errorHandler);

// Connect to databases
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Connect to Redis
    await connectRedis();
    
    // Find available port
    const PORT = await findAvailablePort();
    
    // Create server
    const server = http.createServer(app);
    server.listen(PORT, () => {
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