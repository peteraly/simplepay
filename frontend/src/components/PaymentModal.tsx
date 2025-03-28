import React, { useState } from 'react';
import './PaymentModal.css';

interface PaymentModalProps {
  businessName: string;
  amount: number;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

function PaymentModal({ businessName, amount, onConfirm, onCancel }: PaymentModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    onConfirm(pin);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <h2>Confirm Payment</h2>
        <div className="payment-details">
          <p>Business: {businessName}</p>
          <p className="amount">Amount: ${amount.toFixed(2)}</p>
        </div>
        
        <div className="pin-section">
          <label htmlFor="pin">Enter PIN</label>
          <input
            type="password"
            id="pin"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="****"
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="button-group">
          <button className="confirm-button" onClick={handleSubmit}>
            Confirm Payment
          </button>
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal; 