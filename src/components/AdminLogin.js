import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Admin.css';

const AdminLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { username });
      
      const response = await axios.post('/api/auth/login', { username, password });
      console.log('Login response:', response.data);
      

      if (response.data.user.role !== 'admin') {
        setError('Dostęp zabroniony. Tylko administratorzy mogą wejść do panelu administracyjnego.');
        setLoading(false);
        return;
      }
      

      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminUser', JSON.stringify(response.data.user));
      

      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      

      onLogin(response.data.user);
      
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error.response || error);
      const errorMessage = error.response?.data?.message || 
                           'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
      
      setError(`${errorMessage} (${error.message})`);
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <h2>Logowanie do panelu administratora</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        
        <div className="login-help">
          <p>Domyślna nazwa użytkownika: <strong>admin</strong></p>
          <p>Domyślne hasło: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 