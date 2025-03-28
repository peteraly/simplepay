import React, { useState } from 'react';
import BusinessDashboard from './components/BusinessDashboard';
import './App.css';

function App() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Attempting registration...');
      const response = await fetch('http://localhost:3000/api/auth/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName,
          email,
          password,
        }),
      });

      console.log('Response received:', response.status);
      
      // Try to get the response body as text first
      const rawResponse = await response.text();
      console.log('Raw response:', rawResponse);

      // Parse the response if it's JSON
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store the token
      localStorage.setItem('token', data.token);
      localStorage.setItem('businessId', data.businessId);

      setMessage('Registration successful! Redirecting to dashboard...');
      setIsError(false);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        setShowDashboard(true);
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error instanceof Error ? error.message : 'Registration failed');
      setIsError(true);
    }
  };

  return (
    <div className="container">
      {!showDashboard ? (
        <div className="registration-form">
          <h1>SimplePay</h1>
          <h2>Business Registration</h2>
          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div>
              <label>Business Name:</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Register Business</button>
          </form>
        </div>
      ) : (
        <BusinessDashboard />
      )}
    </div>
  );
}

export default App;
