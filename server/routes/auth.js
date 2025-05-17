const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');


const JWT_SECRET = 'pwa_laptop_store_secret_key_2024';


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


const isAdmin = async (req, res, next) => {
  try {
    console.log('Sprawdzanie uprawnień administratora dla użytkownika:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('Błąd autoryzacji: brak ID użytkownika w tokenie');
      return res.status(403).json({ message: 'Dostęp zabroniony. Wymagana ponowna autoryzacja.' });
    }
    
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [req.user.id]);
    console.log('Wynik zapytania o użytkownika:', rows);
    
    if (rows.length === 0) {
      console.log('Użytkownik nie znaleziony w bazie danych:', req.user.id);
      return res.status(403).json({ message: 'Dostęp zabroniony. Użytkownik nie znaleziony.' });
    }
    
    if (rows[0].role !== 'admin') {
      console.log('Użytkownik nie jest administratorem:', rows[0].username, 'Rola:', rows[0].role);
      return res.status(403).json({ message: 'Dostęp zabroniony. Wymagane uprawnienia administratora.' });
    }
    
    console.log('Dostęp administratora potwierdzony dla użytkownika:', rows[0].username);
    next();
  } catch (error) {
    console.error('Błąd podczas weryfikacji uprawnień administratora:', error);
    res.status(500).json({ message: 'Błąd serwera podczas weryfikacji uprawnień' });
  }
};


router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        message: 'Użytkownik o tej nazwie lub adresie email już istnieje' 
      });
    }
    
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    
    const token = jwt.sign({ id: result.insertId }, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({
      message: 'Użytkownik został pomyślnie zarejestrowany',
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Próba logowania dla użytkownika:', username);
    
    
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    console.log('Znalezieni użytkownicy:', users.length);
    
    if (users.length === 0) {
      console.log('Nie znaleziono użytkownika o nazwie:', username);
      return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }
    
   
    const user = users[0];
    console.log('Rola użytkownika:', user.role);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Hasło poprawne:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Nieprawidłowe hasło dla użytkownika:', username);
      return res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }
    
   
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    console.log('Logowanie pomyślne dla użytkownika:', username);
    
    res.json({
      message: 'Pomyślna autoryzacja',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Błąd logowania:', error);
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});


router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera', error: error.message });
  }
});

module.exports = {
  router,
  authenticateToken,
  isAdmin
}; 