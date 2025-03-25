import mongoose from 'mongoose';
import { ITransaction } from '../types';

const TransactionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be at least 0.01']
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Points earned cannot be negative']
  },
  type: {
    type: String,
    enum: ['payment', 'topup', 'refund'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
TransactionSchema.index({ businessId: 1, timestamp: -1 });
TransactionSchema.index({ customerId: 1, timestamp: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema); 