import { Router, Response, Request, NextFunction } from 'express';
import { AuthRequest } from '../types';
import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Business from '../models/Business';
import Customer from '../models/Customer';
import { auth } from '../middleware/auth';

const router = Router();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'defaultsecret';
const JWT_EXPIRE = '7d';

const signToken = (payload: JwtPayload): Promise<string> => {
  const options: SignOptions = { expiresIn: JWT_EXPIRE };
  return new Promise((resolve, reject) => {
    const token = jwt.sign(payload, JWT_SECRET, options);
    if (!token) {
      reject(new Error('Token generation failed'));
      return;
    }
    resolve(token);
  });
};

// @route   POST api/auth/business/register
// @desc    Register a business
// @access  Public
const registerBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessName, ownerEmail, password } = req.body;
    
    // Check if business already exists
    let business = await Business.findOne({ ownerEmail });
    if (business) {
      res.status(400).json({ message: 'Business already exists' });
      return;
    }
    
    // Generate unique QR code seed
    const qrCodeSeed = crypto.randomBytes(20).toString('hex');
    
    // Create new business
    business = new Business({
      businessName,
      ownerEmail,
      password,
      qrCodeSeed
    });
    
    await business.save();
    
    // Create JWT token
    const payload = {
      user: {
        id: business.id,
        type: 'business' as const
      }
    };
    
    const token = await signToken(payload);
    res.json({ token, businessId: business.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST api/auth/business/login
// @desc    Authenticate business & get token
// @access  Public
const loginBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Check if business exists
    const business = await Business.findOne({ ownerEmail: email });
    if (!business) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Check password
    const isMatch = await business.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Create JWT token
    const payload = {
      user: {
        id: business.id,
        type: 'business' as const
      }
    };
    
    const token = await signToken(payload);
    res.json({ token, businessId: business.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST api/auth/customer/register
// @desc    Register a customer
// @access  Public
const registerCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    
    // Check if customer already exists
    let customer = await Customer.findOne({ phoneNumber });
    if (customer) {
      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      customer.verificationCode = verificationCode;
      customer.verified = false;
      await customer.save();
      
      // TODO: Send SMS with verification code
      console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
      
      res.json({ message: 'Verification code sent' });
      return;
    }
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create new customer
    customer = new Customer({
      phoneNumber,
      verificationCode,
      verified: false
    });
    
    await customer.save();
    
    // TODO: Send SMS with verification code
    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
    
    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST api/auth/customer/verify
// @desc    Verify customer phone number
// @access  Public
const verifyCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, code } = req.body;
    
    // Find customer
    const customer = await Customer.findOne({ phoneNumber });
    if (!customer) {
      res.status(400).json({ message: 'Customer not found' });
      return;
    }
    
    // Check verification code
    if (customer.verificationCode !== code) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }
    
    // Update customer
    customer.verified = true;
    customer.verificationCode = undefined;
    await customer.save();
    
    // Create JWT token
    const payload = {
      user: {
        id: customer.id,
        type: 'customer' as const
      }
    };
    
    const token = await signToken(payload);
    res.json({ token, customerId: customer.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (req.user.type === 'business') {
      const business = await Business.findById(req.user.id).select('-password');
      if (!business) {
        res.status(404).json({ message: 'Business not found' });
        return;
      }
      res.json({ type: 'business', business });
    } else if (req.user.type === 'customer') {
      const customer = await Customer.findById(req.user.id);
      if (!customer) {
        res.status(404).json({ message: 'Customer not found' });
        return;
      }
      res.json({ type: 'customer', customer });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Routes
router.post('/business/register', registerBusiness);
router.post('/business/login', loginBusiness);
router.post('/customer/register', registerCustomer);
router.post('/customer/verify', verifyCustomer);
router.get('/me', auth as (req: Request, res: Response, next: NextFunction) => void, getCurrentUser);

export default router; 