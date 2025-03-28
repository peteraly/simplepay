import React, { useState, useEffect } from 'react';
import './CustomerPortal.css';
import QRScanner from './QRScanner';
import PaymentModal from './PaymentModal';

interface CustomerPortalProps {
  token: string;
  customerId: string;
}

interface Wallet {
  businessName: string;
  balance: number;
  pointsBalance: number;
}

interface PaymentData {
  businessId: string;
  businessName: string;
  amount: number;
}

function CustomerPortal({ token, customerId }: CustomerPortalProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [balance, setBalance] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchBalance();
  }, [token]);

  const fetchWallets = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setWallets(data);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const handleTopUp = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/transactions/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedWallet,
          amount: parseFloat(topUpAmount)
        })
      });
      
      if (response.ok) {
        setShowTopUp(false);
        setTopUpAmount('');
        fetchWallets(); // Refresh wallets
      }
    } catch (error) {
      console.error('Error topping up:', error);
    }
  };

  const handleScanResult = (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.businessId && parsedData.amount) {
        setPaymentData({
          businessId: parsedData.businessId,
          businessName: parsedData.businessName,
          amount: parsedData.amount
        });
        setShowScanner(false);
      }
    } catch (error) {
      console.error('Invalid QR code data:', error);
    }
  };

  const handlePayment = async (qrData: string) => {
    try {
      setProcessing(true);
      const paymentData = JSON.parse(qrData);
      
      const response = await fetch('http://localhost:3000/api/transactions/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          businessId: paymentData.businessId,
          amount: paymentData.amount
        })
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      // Update balance and show success
      fetchBalance();
      alert('Payment successful!');
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
      setShowScanner(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  return (
    <div className="customer-portal">
      <div className="wallets-section">
        <div className="section-header">
          <h2>My Wallets</h2>
          <div className="header-buttons">
            <button onClick={() => setShowTopUp(true)} className="add-funds-btn">
              Add Funds
            </button>
            <button onClick={() => setShowScanner(true)} className="scan-btn">
              Scan to Pay
            </button>
          </div>
        </div>

        <div className="wallets-grid">
          {wallets.map((wallet) => (
            <div key={wallet.businessName} className="wallet-card">
              <h3>{wallet.businessName}</h3>
              <div className="balance-info">
                <div className="balance">
                  <span>Balance</span>
                  <p>${wallet.balance.toFixed(2)}</p>
                </div>
                <div className="points">
                  <span>Points</span>
                  <p>{wallet.pointsBalance}</p>
                </div>
              </div>
              <button className="pay-btn">Pay Now</button>
            </div>
          ))}
        </div>
      </div>

      <div className="balance-section">
        <h2>Your Balance</h2>
        <p className="balance">${balance.toFixed(2)}</p>
        <button onClick={() => setShowScanner(true)} className="pay-button">
          Scan to Pay
        </button>
      </div>

      {showScanner && (
        <QRScanner
          onScan={handlePayment}
          onClose={() => setShowScanner(false)}
          disabled={processing}
        />
      )}

      {showTopUp && (
        <div className="top-up-modal">
          <div className="modal-content">
            <h3>Add Funds</h3>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
            >
              <option value="">Select Business</option>
              {wallets.map((wallet) => (
                <option key={wallet.businessName} value={wallet.businessName}>
                  {wallet.businessName}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Amount"
              min="1"
              step="0.01"
            />
            <div className="modal-buttons">
              <button onClick={handleTopUp} className="confirm-btn">
                Confirm
              </button>
              <button onClick={() => setShowTopUp(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPortal; 