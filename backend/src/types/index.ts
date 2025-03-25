import { Request } from 'express';
import { Document } from 'mongoose';

// User types
export interface IUser {
  id: string;
  type: 'business' | 'customer';
}

// Auth request extension
export interface AuthRequest extends Request {
  user?: IUser;
}

// JWT payload type
export interface JWTPayload {
  user: IUser;
}

// Business interface
export interface IBusiness extends Document {
  businessName: string;
  ownerEmail: string;
  password: string;
  settings: {
    pointsPerDollar: number;
    primaryColor: string;
    logo?: string;
  };
  qrCodeSeed: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Customer interface
export interface ICustomer extends Document {
  phoneNumber: string;
  verificationCode?: string;
  verified: boolean;
  wallets: Array<{
    businessId: string;
    balance: number;
    pointsBalance: number;
  }>;
  createdAt: Date;
}

// Transaction interface
export interface ITransaction extends Document {
  businessId: string;
  customerId: string;
  amount: number;
  pointsEarned: number;
  type: 'payment' | 'refund' | 'points_redemption';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
} 