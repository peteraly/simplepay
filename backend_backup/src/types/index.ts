import { Request } from 'express';
import { Prisma } from '@prisma/client';

// Use Prisma's generated types
export type ICustomer = Prisma.CustomerGetPayload<{
  include: { wallets: true }
}>;

export type IBusiness = Prisma.BusinessGetPayload<{
  include: { wallets: true }
}>;

// User types
export interface IUser {
  id: string;
  type: 'business' | 'customer';
}

// Request types
export interface AuthRequest extends Request {
  user?: IUser;
}

export type IWallet = Prisma.WalletGetPayload<{
  include: { transactions: true }
}>;

export interface ITransaction {
  id: string;
  amount: number;
  type: 'PAYMENT' | 'TOP_UP';
  walletId: string;
  createdAt: Date;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  password: string;
  balance: number;
  createdAt: Date;
}

export interface JwtPayload {
  id: string;
  type: 'business';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
