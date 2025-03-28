import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Only keep the business registration route
router.post('/business/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);

    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Registration failed', 
        details: 'Missing required fields' 
      });
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { email }
    });

    if (existingBusiness) {
      return res.status(400).json({ 
        error: 'Registration failed', 
        details: 'Business already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const business = await prisma.business.create({
      data: {
        name,
        email,
        password: hashedPassword,
        balance: 0
      }
    });

    const token = jwt.sign(
      { id: business.id, type: 'business' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, businessId: business.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 