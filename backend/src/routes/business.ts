import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { businessAuth } from '../middleware/auth';
import Business from '../models/Business';
import Transaction from '../models/Transaction';
import Customer from '../models/Customer';
import qrcode from 'qrcode';
import mongoose from 'mongoose';

const router = Router();

// @route   GET api/business/settings
// @desc    Get business settings
// @access  Private (Business)
const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.id;
    
    const business = await Business.findById(businessId).select('-password');
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    res.json(business.settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT api/business/settings
// @desc    Update business settings
// @access  Private (Business)
const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.id;
    const { pointsPerDollar, primaryColor, logo } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Update settings
    if (typeof pointsPerDollar === 'number') {
      business.settings.pointsPerDollar = Math.max(1, Math.floor(pointsPerDollar));
    }
    if (primaryColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(primaryColor)) {
      business.settings.primaryColor = primaryColor;
    }
    if (logo && /^https?:\/\/.+/.test(logo)) {
      business.settings.logo = logo;
    }

    await business.save();
    res.json(business.settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/business/qr-code
// @desc    Get business QR code for payments
// @access  Private (Business)
const getQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.id;
    
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Generate QR code data
    const qrData = {
      businessId: business.id,
      seed: business.qrCodeSeed,
      timestamp: Date.now()
    };

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(JSON.stringify(qrData));
    
    res.json({ 
      qrCode: qrCodeUrl,
      businessName: business.businessName,
      settings: business.settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/business/analytics/overview
// @desc    Get business analytics overview
// @access  Private (Business)
const getAnalyticsOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.id;
    
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get all transactions in date range
    const transactions = await Transaction.find({
      businessId,
      timestamp: { $gte: startDate, $lte: endDate },
      type: { $in: ['payment', 'refund'] }
    });

    // Calculate metrics
    const metrics = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'payment') {
        acc.totalPayments += transaction.amount;
        acc.totalPointsAwarded += transaction.pointsEarned;
        acc.transactionCount += 1;
      } else if (transaction.type === 'refund') {
        acc.totalRefunds += transaction.amount;
        acc.refundCount += 1;
      }
      return acc;
    }, {
      totalPayments: 0,
      totalRefunds: 0,
      totalPointsAwarded: 0,
      transactionCount: 0,
      refundCount: 0
    });

    // Get total customer count
    const customerCount = await Customer.countDocuments({
      'wallets.businessId': businessId
    });

    // Get daily transaction totals
    const dailyTotals = await Transaction.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          timestamp: { $gte: startDate, $lte: endDate },
          type: 'payment'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      metrics: {
        ...metrics,
        customerCount,
        averageTransactionValue: metrics.transactionCount > 0 
          ? metrics.totalPayments / metrics.transactionCount 
          : 0
      },
      dailyTotals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/business/analytics/customers
// @desc    Get customer analytics
// @access  Private (Business)
const getCustomerAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.user?.id;
    const { limit = 10 } = req.query;

    // Get top customers by transaction volume
    const topCustomers = await Transaction.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          type: 'payment'
        }
      },
      {
        $group: {
          _id: '$customerId',
          totalSpent: { $sum: '$amount' },
          totalPoints: { $sum: '$pointsEarned' },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: '$timestamp' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: Number(limit)
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $project: {
          phoneNumber: '$customerInfo.phoneNumber',
          totalSpent: 1,
          totalPoints: 1,
          transactionCount: 1,
          lastTransaction: 1,
          averageTransactionValue: { $divide: ['$totalSpent', '$transactionCount'] }
        }
      }
    ]);

    res.json(topCustomers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Routes
router.get('/settings', businessAuth, getSettings);
router.put('/settings', businessAuth, updateSettings);
router.get('/qr-code', businessAuth, getQRCode);
router.get('/analytics/overview', businessAuth, getAnalyticsOverview);
router.get('/analytics/customers', businessAuth, getCustomerAnalytics);

export default router; 