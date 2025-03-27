import React, { useState } from 'react';
import './App.css';
import BusinessDashboard from './components/BusinessDashboard';

function App() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerEmail: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [businessId, setBusinessId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Registering...');
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Registration successful!');
        setAuthToken(data.token);
        setBusinessId(data.businessId);
        setIsRegistered(true);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('Error connecting to server');
      console.error('Error:', error);
    }
  };

  if (isRegistered) {
    return <BusinessDashboard token={authToken} businessId={businessId} />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>SimplePay</h1>
        <div className="form-container">
          <h2>Business Registration</h2>
          {message && <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Business Name:</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <button type="submit">Register Business</button>
          </form>
        </div>
      </header>
    </div>
  );
}

export default App;
