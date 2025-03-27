import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types';
import { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

// Helper function to create a rate limiter with custom configuration
const createLimiter = (
  windowMs: number,
  max: number,
  message: string,
  skipFailedRequests = false,
  skipSuccessfulRequests = false
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: { status: 'error', message },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'rl:', // Redis key prefix for rate limiting
    }),
    skipFailedRequests,
    skipSuccessfulRequests,
    // Simplified key generator that uses IP address and optional user ID
    keyGenerator: (request) => {
      try {
        const ip = request.ip || request.socket.remoteAddress || 'unknown';
        const userId = (request as any).user?.id;
        return userId ? `${ip}-${userId}` : ip;
      } catch {
        return 'unknown';
      }
    }
  });
};

// Global rate limiter (100 requests per minute)
export const globalLimiter = createLimiter(
  60 * 1000, // 1 minute
  100,
  'Too many requests from this IP. Please try again later.'
);

// Auth endpoints rate limiter (5 requests per minute)
export const authLimiter = createLimiter(
  60 * 1000, // 1 minute
  20,
  'Too many authentication attempts. Please try again later.',
  false, // Count all requests
  true // Don't count successful authentications
);

// Business API rate limiter (30 requests per minute)
export const businessLimiter = createLimiter(
  60 * 1000, // 1 minute
  30,
  'Too many requests. Please try again later.',
  true // Skip failed requests
);

// Customer API rate limiter (60 requests per minute)
export const customerLimiter = createLimiter(
  60 * 1000, // 1 minute
  60,
  'Too many requests. Please try again later.',
  true // Skip failed requests
);

// SMS verification rate limiter (3 requests per 15 minutes)
export const smsLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  3,
  'Too many SMS verification attempts. Please try again later.',
  false, // Count all requests
  true // Don't count successful verifications
);

// QR code generation rate limiter (10 requests per minute)
export const qrCodeLimiter = createLimiter(
  60 * 1000, // 1 minute
  10,
  'Too many QR code generation requests. Please try again later.',
  true // Skip failed requests
);

// Points redemption rate limiter (5 requests per minute)
export const pointsRedemptionLimiter = createLimiter(
  60 * 1000, // 1 minute
  5,
  'Too many points redemption attempts. Please try again later.',
  false, // Count all requests
  true // Don't count successful redemptions
);

// Instead of multiple specific limiters, consider consolidating to:
export const rateLimits = {
  public: createLimiter(
    60 * 1000, // 1 minute
    100,
    'Too many requests. Please try again later.'
  ),
  
  authenticated: createLimiter(
    60 * 1000, // 1 minute
    300,
    'Too many requests. Please try again later.'
  )
}; 