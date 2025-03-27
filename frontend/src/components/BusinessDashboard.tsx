import React, { useState, useEffect } from 'react';

interface DashboardProps {
  token: string;
  businessId: string;
}

interface Transaction {
  amount: number;
  timestamp: string;
  type: string;
}

const API_URL = 'http://localhost:3000';

function BusinessDashboard({ token, businessId }: DashboardProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState({
    pointsPerDollar: 10,
    primaryColor: '#4B2D83'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total sales safely
  const calculateTotalSales = () => {
    if (!transactions.length) return 0;
    return transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch QR Code
        const qrResponse = await fetch(`${API_URL}/api/business/qr-code`, {
          headers: {
            'x-auth-token': token
          }
        });
        const qrData = await qrResponse.json();
        setQrCode(qrData.qrCode);

        // Fetch transactions
        const transResponse = await fetch(`${API_URL}/api/transactions/history`, {
          headers: {
            'x-auth-token': token
          }
        });
        const transData = await transResponse.json();
        setTransactions(transData.transactions || []);

        // Fetch settings
        const settingsResponse = await fetch(`${API_URL}/api/business/settings`, {
          headers: {
            'x-auth-token': token
          }
        });
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>Business Dashboard</h2>
      
      <div className="dashboard-section">
        <h3>Payment QR Code</h3>
        {qrCode ? (
          <img src={qrCode} alt="Payment QR Code" />
        ) : (
          <p>QR Code not available</p>
        )}
      </div>

      <div className="dashboard-section">
        <h3>Quick Stats</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <h4>Today's Sales</h4>
            <p>${calculateTotalSales().toFixed(2)}</p>
          </div>
          <div className="stat-box">
            <h4>Points Rate</h4>
            <p>{settings.pointsPerDollar} per $1</p>
          </div>
          <div className="stat-box">
            <h4>Transactions</h4>
            <p>{transactions.length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {transactions.length > 0 ? (
            transactions.map((t, i) => (
              <div key={i} className="transaction-item">
                <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                <span>${t.amount.toFixed(2)}</span>
                <span>{t.type}</span>
              </div>
            ))
          ) : (
            <p>No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BusinessDashboard; 