import React, { useState } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerEmail: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3002/api/auth/business/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>SimplePay</h1>
        <div className="form-container">
          <h2>Business Registration</h2>
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
