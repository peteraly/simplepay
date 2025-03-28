import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { processPayment } from '../controllers/transactionController';

const router = Router();

// Apply authentication middleware
router.use(auth);

// Transaction routes
router.post('/pay', processPayment);

export default router; 