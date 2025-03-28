import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define the structure of our JWT payload
interface JwtPayload {
  id: string;
  type: 'business';
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
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const auth = async (
  req: TypedRequestUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }

      // Add type information to decoded user
      const user: JwtPayload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        type: decoded.type
      };

      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Alias for backward compatibility
export const authenticateToken = auth;

export const businessAuth = (req: TypedRequestUser, res: Response, next: NextFunction) => {
  auth(req, res, () => {
    if (req.user?.type !== 'business') {
      return res.status(403).json({ message: 'Access denied. Business only.' });
    }
    next();
  });
};

export const customerAuth = (req: TypedRequestUser, res: Response, next: NextFunction) => {
  auth(req, res, () => {
    if (req.user?.type !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }
    next();
  });
}; 