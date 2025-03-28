import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { businessAuth, customerAuth } from '../middleware/auth';
import Transaction from '../models/Transaction';
import Customer from '../models/Customer';
import Business from '../models/Business';
import mongoose from 'mongoose';

const router = Router();

// @route   POST api/transactions/payment
// @desc    Process a payment from customer to business
// @access  Private (Customer)
const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { businessId, amount } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Find customer and business
    const [customer, business] = await Promise.all([
      Customer.findById(customerId),
      Business.findById(businessId)
    ]);

    if (!customer || !business) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Customer or business not found' });
      return;
    }

    // Find customer's wallet for this business
    let wallet = customer.wallets.find(w => w.businessId.toString() === businessId);
    if (!wallet) {
      await session.abortTransaction();
      res.status(400).json({ message: 'No wallet found for this business' });
      return;
    }

    // Check if wallet has sufficient balance
    if (wallet.balance < amount) {
      await session.abortTransaction();
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    // Calculate points earned
    const pointsEarned = Math.floor(amount * business.settings.pointsPerDollar);

    // Create transaction
    const transaction = new Transaction({
      businessId,
      customerId,
      amount,
      pointsEarned,
      type: 'payment'
    });

    // Update wallet balances
    wallet.balance -= amount;
    wallet.pointsBalance += pointsEarned;

    // Save all changes
    await Promise.all([
      transaction.save({ session }),
      customer.save({ session })
    ]);

    await session.commitTransaction();
    res.json({ transaction, newBalance: wallet.balance, newPointsBalance: wallet.pointsBalance });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @route   POST api/transactions/topup
// @desc    Add funds to customer wallet
// @access  Private (Customer)
const processTopUp = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { businessId, amount } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Find customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Find or create wallet for this business
    let wallet = customer.wallets.find(w => w.businessId.toString() === businessId);
    if (!wallet) {
      const newWallet = {
        businessId: businessId,
        balance: 0,
        pointsBalance: 0
      };
      customer.wallets.push(newWallet);
      wallet = newWallet;
    }

    // Create transaction
    const transaction = new Transaction({
      businessId,
      customerId,
      amount,
      pointsEarned: 0,
      type: 'topup'
    });

    // Update wallet balance
    wallet.balance += amount;

    // Save all changes
    await Promise.all([
      transaction.save({ session }),
      customer.save({ session })
    ]);

    await session.commitTransaction();
    res.json({ transaction, newBalance: wallet.balance });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @route   POST api/transactions/refund
// @desc    Process a refund
// @access  Private (Business)
const processRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transactionId } = req.body;
    const businessId = req.user?.id;

    if (!businessId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Find original transaction
    const originalTransaction = await Transaction.findById(transactionId);
    if (!originalTransaction || originalTransaction.businessId.toString() !== businessId) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (originalTransaction.type === 'refund') {
      await session.abortTransaction();
      res.status(400).json({ message: 'Cannot refund a refund' });
      return;
    }

    // Find customer
    const customer = await Customer.findById(originalTransaction.customerId);
    if (!customer) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Find customer's wallet
    const wallet = customer.wallets.find(w => w.businessId.toString() === businessId);
    if (!wallet) {
      await session.abortTransaction();
      res.status(400).json({ message: 'No wallet found for this business' });
      return;
    }

    // Create refund transaction
    const refundTransaction = new Transaction({
      businessId,
      customerId: originalTransaction.customerId,
      amount: originalTransaction.amount,
      pointsEarned: -originalTransaction.pointsEarned,
      type: 'refund'
    });

    // Update wallet balances
    wallet.balance += originalTransaction.amount;
    wallet.pointsBalance -= originalTransaction.pointsEarned;

    // Save all changes
    await Promise.all([
      refundTransaction.save({ session }),
      customer.save({ session })
    ]);

    await session.commitTransaction();
    res.json({ 
      transaction: refundTransaction, 
      newBalance: wallet.balance,
      newPointsBalance: wallet.pointsBalance 
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @route   GET api/transactions/history
// @desc    Get transaction history
// @access  Private (Business & Customer)
const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId || !userType) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const query = userType === 'business' 
      ? { businessId: userId }
      : { customerId: userId };

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .exec();

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      hasMore: total > Number(offset) + transactions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Routes
router.post('/payment', customerAuth, processPayment);
router.post('/topup', customerAuth, processTopUp);
router.post('/refund', businessAuth, processRefund);
router.get('/history', getTransactionHistory);

export default router; 