import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define the structure of our JWT payload
interface JwtPayload {
  id: string;
  type: 'business' | 'customer' | 'admin';
}

// Extend Express Request type to include our user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Single authentication middleware
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const businessAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'business') {
    return res.status(403).json({ error: 'Business access required' });
  }
  next();
};

export const customerAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
}; 