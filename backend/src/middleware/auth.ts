import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const businessAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  auth(req, res, () => {
    if (req.user?.type !== 'business') {
      return res.status(403).json({ message: 'Access denied. Business only.' });
    }
    next();
  });
};

export const customerAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  auth(req, res, () => {
    if (req.user?.type !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }
    next();
  });
}; 