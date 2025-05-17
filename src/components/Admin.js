import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import '../styles/Admin.css';

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
 
  const [user, setUser] = useState(null);


  useEffect(() => {
    console.log('Admin component mounted, checking auth...');
    const adminUser = localStorage.getItem('adminUser');
    const adminToken = localStorage.getItem('adminToken');
    
    console.log('adminUser from localStorage:', adminUser);
    console.log('adminToken exists:', !!adminToken);
    
    if (adminUser && adminToken) {
      try {
        const parsedUser = JSON.parse(adminUser);
        console.log('Parsed user:', parsedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
        console.log('User is logged in');
      } catch (error) {
        console.error('Error parsing adminUser:', error);
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
      }
    } else {
      console.log('No auth data found, showing login form');
    }
  }, []);


  const handleLogin = (userData) => {
    console.log('Login successful, userData:', userData);
    setUser(userData);
    setIsLoggedIn(true);
  };

 
  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    setUser(null);
    setIsLoggedIn(false);

    window.location.href = '/';
  };

  return (
    <div className="admin-container">
      {isLoggedIn ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
};

export default Admin; 