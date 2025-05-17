const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDB } = require('./db');
const { router: authRoutes } = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');


initDB();


const db = require('./db');
const bcrypt = require('bcryptjs');
const ensureAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    

    await db.pool.query('DELETE FROM users WHERE username = ?', ['admin']);
    

    await db.pool.query(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, 'admin@example.com', 'admin']
    );
    console.log('Administrator został ponownie utworzony');
  } catch (error) {
    console.error('Błąd przy tworzeniu administratora:', error);
  }
};


ensureAdmin();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}


app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
}); 
