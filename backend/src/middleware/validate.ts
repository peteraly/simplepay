import { Request, Response, NextFunction } from 'express';
import { 
  body, 
  query, 
  param,
  ValidationChain, 
  validationResult,
  ValidationError as ExpressValidationError
} from 'express-validator';
import { ValidationError } from './error';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Get validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors: Record<string, string> = {};
    errors.array().forEach((error: ExpressValidationError) => {
      if ('param' in error && 'msg' in error) {
        formattedErrors[error.param as string] = error.msg as string;
      }
    });

    // Throw validation error
    next(new ValidationError('Validation failed', formattedErrors));
  };
};

// Common validation chains
export const commonValidations = {
  pagination: [
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  
  mongoId: (field: string) => [
    param(field).isMongoId()
      .withMessage('Invalid ID format')
  ],

  phoneNumber: [
    body('phoneNumber').matches(/^\+[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in E.164 format (e.g., +1234567890)')
  ],

  businessRegistration: [
    body('businessName').trim().notEmpty()
      .withMessage('Business name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2 and 100 characters'),
    body('ownerEmail').trim().notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('password').notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],

  businessSettings: [
    body('pointsPerDollar').optional()
      .isInt({ min: 1 })
      .withMessage('Points per dollar must be at least 1'),
    body('primaryColor').optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Invalid hex color format'),
    body('logo').optional()
      .isURL()
      .withMessage('Logo must be a valid URL')
  ],

  payment: [
    body('amount').isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('businessId').isMongoId()
      .withMessage('Invalid business ID')
  ],

  pointsRedemption: [
    body('points').isInt({ min: 1 })
      .withMessage('Points must be a positive integer')
  ]
}; 