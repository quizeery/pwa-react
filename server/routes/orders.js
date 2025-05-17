const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, isAdmin } = require('./auth');


router.post('/', async (req, res) => {
  try {
    console.log('Запрос на создание заказа:', req.body);
    const { fullName, address, phone, paymentMethod, items, totalAmount } = req.body;
    

    if (!fullName || !address || !phone || !paymentMethod || !items || !totalAmount) {
      console.error('Отсутствуют необходимые данные для создания заказа', { 
        fullName, address, phone, paymentMethod, 
        itemsExist: !!items, 
        totalAmount 
      });
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }
    

    if (!Array.isArray(items) || items.length === 0) {
      console.error('Некорректный список товаров', items);
      return res.status(400).json({ message: 'Корзина пуста' });
    }
    
    console.log('Количество товаров в заказе:', items.length);
    

    const userId = req.user ? req.user.id : null;
    console.log('ID пользователя:', userId);
    

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {

      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, full_name, address, phone, payment_method, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, fullName, address, phone, paymentMethod, totalAmount]
      );
      
      const orderId = orderResult.insertId;
      console.log('Создан заказ с ID:', orderId);
      

      for (const item of items) {
        console.log('Добавление товара в заказ:', item);
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.id, item.quantity, item.price]
        );
        

        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      }
      

      await connection.commit();
      console.log('Заказ успешно создан с ID:', orderId);
      
      res.status(201).json({
        message: 'Заказ успешно создан',
        orderId
      });
    } catch (error) {

      await connection.rollback();
      console.error('Ошибка при создании заказа (транзакция отменена):', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('Żądanie pobrania wszystkich zamówień');
    

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    

    const [orders] = await pool.query(
      `SELECT o.*, u.username 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    console.log('Znaleziono zamówień:', orders.length);
    

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM orders');
    const totalOrders = countResult[0].total;
    
    console.log('Łączna liczba zamówień w bazie:', totalOrders);
    

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.name, p.image 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      
      order.items = items;
      console.log(`Заказ #${order.id}: найдено ${items.length} товаров`);
    }
    
    res.json({
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    

    const [orders] = await pool.query(
      `SELECT o.*, u.username 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    
    const order = orders[0];
    

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    

    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.image 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );
    
    order.items = items;
    
    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    

    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    res.json({ 
      message: 'Статус заказа успешно обновлен',
      orderId,
      status
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});


router.get('/stats/summary', authenticateToken, isAdmin, async (req, res) => {
  try {

    const [totalRevenueResult] = await pool.query(
      'SELECT SUM(total_amount) as totalRevenue FROM orders'
    );
    

    const [ordersByStatus] = await pool.query(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );
    

    const [ordersByDay] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') 
       ORDER BY date`
    );
    

    const [popularProducts] = await pool.query(
      `SELECT p.id, p.name, SUM(oi.quantity) as totalSold 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       GROUP BY p.id 
       ORDER BY totalSold DESC 
       LIMIT 5`
    );
    
    res.json({
      totalRevenue: totalRevenueResult[0].totalRevenue || 0,
      ordersByStatus,
      ordersByDay,
      popularProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router; 