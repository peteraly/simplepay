import { Request, Response, NextFunction } from 'express';

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  errors: Record<string, string>;

  constructor(message: string = 'Validation failed', errors: Record<string, string> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized to access this resource') {
    super(message, 403);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);

  if (err instanceof AppError) {
    // Handle operational errors
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        errors: err.errors
      });
      return;
    }

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    return;
  }

  // Handle mongoose errors
  if (err.name === 'CastError') {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid ID format'
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid input data',
      errors: err.message
    });
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(400).json({
      status: 'fail',
      message: `Duplicate ${field}. Please use another value.`
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'fail',
      message: 'Token expired. Please log in again.'
    });
    return;
  }

  // Handle unknown errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
    return;
  }

  // Send detailed error in development
  res.status(500).json({
    status: 'error',
    message: err.message,
    stack: err.stack,
    error: err
  });
}; 