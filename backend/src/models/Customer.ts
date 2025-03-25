import mongoose from 'mongoose';
import { ICustomer } from '../types';

const WalletSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  pointsBalance: {
    type: Number,
    default: 0,
    min: [0, 'Points balance cannot be negative']
  }
});

const CustomerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format']
  },
  verificationCode: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  wallets: [WalletSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster wallet queries
CustomerSchema.index({ 'wallets.businessId': 1 });

export default mongoose.model<ICustomer>('Customer', CustomerSchema); 