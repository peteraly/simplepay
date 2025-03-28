import { createClient } from 'redis';

// Redis client configuration
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Redis connection function
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    redisClient.on('reconnecting', () => {
      console.warn('Redis reconnecting...');
    });
    
    process.on('SIGINT', async () => {
      try {
        await redisClient.quit();
        console.log('Redis connection closed through app termination');
      } catch (err) {
        console.error('Error closing Redis connection:', err);
      }
    });
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
}; 