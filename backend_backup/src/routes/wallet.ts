import { Router, Response } from 'express';
import { AuthRequest, IBusiness } from '../types';
import { customerAuth } from '../middleware/auth';
import Customer from '../models/Customer';
import Business from '../models/Business';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

const router = Router();

// @route   GET api/wallet
// @desc    Get all wallets for a customer
// @access  Private (Customer)
const getWallets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.id;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Get business details for each wallet
    const walletsWithDetails = await Promise.all(
      customer.wallets.map(async (wallet) => {
        const business = await Business.findById(wallet.businessId)
          .select('businessName settings');
        return {
          businessId: wallet.businessId,
          balance: wallet.balance,
          pointsBalance: wallet.pointsBalance,
          businessName: business?.businessName,
          settings: business?.settings
        };
      })
    );

    res.json(walletsWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/wallet/:businessId
// @desc    Get specific wallet for a business
// @access  Private (Customer)
const getWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.id;
    const { businessId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const wallet = customer.wallets.find(w => w.businessId.toString() === businessId);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const business = await Business.findById(businessId).select('businessName settings');
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      customerId,
      businessId
    })
    .sort({ timestamp: -1 })
    .limit(10);

    res.json({
      wallet: {
        businessId: wallet.businessId,
        balance: wallet.balance,
        pointsBalance: wallet.pointsBalance
      },
      businessName: business.businessName,
      settings: business.settings,
      recentTransactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST api/wallet/redeem-points/:businessId
// @desc    Redeem points for wallet balance
// @access  Private (Customer)
const redeemPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user?.id;
    const { businessId } = req.params;
    const { points } = req.body;

    if (!points || points <= 0) {
      res.status(400).json({ message: 'Invalid points amount' });
      return;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const wallet = customer.wallets.find(w => w.businessId.toString() === businessId);
    if (!wallet) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    if (wallet.pointsBalance < points) {
      await session.abortTransaction();
      res.status(400).json({ message: 'Insufficient points balance' });
      return;
    }

    const business = await Business.findById(businessId);
    if (!business) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Convert points to wallet balance (1 point = $0.01)
    const balanceToAdd = points * 0.01;

    // Update wallet
    wallet.pointsBalance -= points;
    wallet.balance += balanceToAdd;

    // Create transaction record
    const transaction = new Transaction({
      businessId,
      customerId,
      amount: balanceToAdd,
      pointsEarned: -points,
      type: 'topup'
    });

    // Save changes
    await Promise.all([
      transaction.save({ session }),
      customer.save({ session })
    ]);

    await session.commitTransaction();
    res.json({
      transaction,
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

// @route   GET api/wallet/discover
// @desc    Discover businesses
// @access  Private (Customer)
const discoverBusinesses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.id;
    const { search, limit = 20, offset = 0 } = req.query;

    // Build search query
    const searchQuery: any = {};
    if (search) {
      searchQuery.businessName = new RegExp(search as string, 'i');
    }

    // Get businesses
    const businesses = await Business.find(searchQuery)
      .select('businessName settings')
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    // Get customer's existing wallets
    const customer = await Customer.findById(customerId);
    const existingWalletIds = customer?.wallets.map(w => w.businessId.toString()) || [];

    // Add hasWallet flag to businesses
    const businessesWithWalletInfo = businesses.map(business => ({
      businessId: (business._id as mongoose.Types.ObjectId).toString(),
      businessName: business.businessName,
      settings: business.settings,
      hasWallet: existingWalletIds.includes((business._id as mongoose.Types.ObjectId).toString())
    }));

    const total = await Business.countDocuments(searchQuery);

    res.json({
      businesses: businessesWithWalletInfo,
      total,
      hasMore: total > Number(offset) + businesses.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/wallet/transactions
// @desc    Get all transactions across all wallets
// @access  Private (Customer)
const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.id;
    const { limit = 20, offset = 0 } = req.query;

    const transactions = await Transaction.find({ customerId })
      .sort({ timestamp: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('businessId', 'businessName');

    const total = await Transaction.countDocuments({ customerId });

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
router.get('/', customerAuth, getWallets);
router.get('/discover', customerAuth, discoverBusinesses);
router.get('/transactions', customerAuth, getAllTransactions);
router.get('/:businessId', customerAuth, getWallet);
router.post('/redeem-points/:businessId', customerAuth, redeemPoints);

export default router; 