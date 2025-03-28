import React, { useEffect, useState } from 'react';
import './BusinessDashboard.css';

interface BusinessData {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

export const BusinessDashboard: React.FC = () => {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3000/api/business/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch business data');
        }

        const data = await response.json();
        setBusinessData(data);
        setError(null);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );
  if (!businessData) return <div>No business data found</div>;

  return (
    <div className="dashboard">
      <h1>Business Dashboard</h1>
      <div className="business-info">
        <h2>Welcome, {businessData.name}!</h2>
        <p>Email: {businessData.email}</p>
        <p>Balance: ${businessData.balance.toFixed(2)}</p>
      </div>
      
      <div className="dashboard-actions">
        <button onClick={() => alert('Feature coming soon!')}>
          View QR Code
        </button>
        <button onClick={() => alert('Feature coming soon!')}>
          View Transactions
        </button>
        <button onClick={() => alert('Feature coming soon!')}>
          Settings
        </button>
      </div>
    </div>
  );
};

export default BusinessDashboard; 