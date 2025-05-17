const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, isAdmin } = require('./auth');


router.get('/', async (req, res) => {
  try {
   
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    

    const [products] = await pool.query(
      'SELECT * FROM products ORDER BY id LIMIT ? OFFSET ?',
      [limit, offset]
    );
    

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM products');
    const totalProducts = countResult[0].total;
    
    res.json({
      products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    

    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Продукт не найден' });
    }
    
    res.json({ product: products[0] });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, price, image, specs, stock } = req.body;
    

    if (!name || !price || !image || !specs) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }
    

    const [result] = await pool.query(
      'INSERT INTO products (name, price, image, specs, stock) VALUES (?, ?, ?, ?, ?)',
      [name, price, image, specs, stock || 10]
    );
    
    res.status(201).json({
      message: 'Продукт успешно создан',
      productId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, image, specs, stock } = req.body;
    

    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Продукт не найден' });
    }
    

    await pool.query(
      'UPDATE products SET name = ?, price = ?, image = ?, specs = ?, stock = ? WHERE id = ?',
      [name, price, image, specs, stock, productId]
    );
    
    res.json({ 
      message: 'Продукт успешно обновлен',
      productId
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    

    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Продукт не найден' });
    }
    

    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    
    res.json({ 
      message: 'Продукт успешно удален',
      productId
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router; 