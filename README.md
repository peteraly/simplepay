# SimplePay

A secure payment and loyalty system API with rate limiting and robust security features.

## Features

- Business and customer authentication
- QR code-based payments
- Points and loyalty system
- Secure transaction processing
- Rate limiting and security measures
- MongoDB for data persistence
- Redis for rate limiting and caching

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- TypeScript

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/simplepay.git
cd simplepay
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

4. Start MongoDB and Redis:
```bash
# Start MongoDB (if not running as a service)
mongod

# Start Redis (if not running as a service)
redis-server
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/business/register` - Register a new business
- `POST /api/auth/business/login` - Business login
- `POST /api/auth/customer/register` - Register a new customer
- `POST /api/auth/customer/verify` - Verify customer phone number
- `GET /api/auth/me` - Get current user info

### Business
- `GET /api/business/settings` - Get business settings
- `PUT /api/business/settings` - Update business settings
- `GET /api/business/qr-code` - Generate payment QR code

### Transactions
- `POST /api/transactions/payment` - Process payment
- `POST /api/transactions/points/redeem` - Redeem points
- `GET /api/transactions/history` - Get transaction history

## Security Features

1. **Rate Limiting**
   - Global rate limiting
   - Endpoint-specific limits
   - Redis-based rate limiting persistence

2. **Security Headers**
   - Helmet security headers
   - CORS configuration
   - Content Security Policy
   - XSS Protection

3. **Input Validation**
   - Request sanitization
   - MongoDB query sanitization
   - Parameter pollution prevention
   - Content type validation

4. **Authentication**
   - JWT-based authentication
   - Phone verification for customers
   - Secure password hashing

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Error Handling

The API uses a centralized error handling system with custom error classes:
- `AppError` - Base error class
- `NotFoundError` - Resource not found
- `ValidationError` - Input validation errors
- `AuthenticationError` - Authentication failures
- `AuthorizationError` - Permission denied

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 