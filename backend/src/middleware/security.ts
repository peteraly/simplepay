import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Custom middleware to add security headers
export const securityHeaders: RequestHandler = (req, res, next) => {
  // Set strict transport security header
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Set content type options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Set frame options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Set XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Set referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=()'
  );
  
  next();
};

// Middleware to prevent parameter pollution
export const preventParameterPollution: RequestHandler = (req, res, next) => {
  // Convert query parameters to single values
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        req.query[key] = value[value.length - 1];
        // Log potential parameter pollution attempt
        console.warn(`Parameter pollution attempt detected - Key: ${key}, IP: ${req.ip}`);
      }
    }
  }
  next();
};

// Middleware to validate content type
export const validateContentType: RequestHandler = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      res.status(415).json({
        status: 'error',
        message: 'Unsupported Media Type - API only accepts application/json'
      });
      return;
    }
  }
  next();
};

// Security configuration object
export const securityConfig = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.simplepay.com'], // Add your API domain
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
        baseUri: ["'self'"],
        // Add require-trusted-types-for directive
        requireTrustedTypesFor: ["'script'"]
      }
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    originAgentCluster: true
  }),
  
  mongoSanitize: mongoSanitize({
    allowDots: true,
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Attempted NoSQL injection detected - Key: ${key}, IP: ${req.ip}`);
    }
  }),
  
  xss: xss()
}; 