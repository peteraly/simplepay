import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../db';

const router = express.Router();

// Get business profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const business = await prisma.business.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        createdAt: true
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 