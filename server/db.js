const mysql = require('mysql2');


const pool = mysql.createPool({
  host: 'clancore.ru',
  user: 'root',     
  password: 'q0llM7xvHjzG',    
  database: 'laptop_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


const promisePool = pool.promise();


const createDatabase = async () => {
  try {

    const tempPool = mysql.createPool({
      host: 'clancore.ru',
      user: 'root', 
      password: 'q0llM7xvHjzG',    
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }).promise();

    await tempPool.query('CREATE DATABASE IF NOT EXISTS laptop_store');
    console.log('Baza danych została utworzona lub już istnieje');
    
    await tempPool.end();
    

    await createTables();
  } catch (error) {
    console.error('Błąd przy tworzeniu bazy danych:', error);
  }
};


const createTables = async () => {
  try {

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela użytkowników została utworzona lub już istnieje');


    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255) NOT NULL,
        specs TEXT NOT NULL,
        stock INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela produktów została utworzona lub już istnieje');

 
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        full_name VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Tabela zamówień została utworzona lub już istnieje');


    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabela elementów zamówienia została utworzona lub już istnieje');


    await createDefaultAdmin();

    await addDemoProducts();
    
  } catch (error) {
    console.error('Błąd przy tworzeniu tabel:', error);
  }
};


const createDefaultAdmin = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    

    const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (rows.length === 0) {
      await promisePool.query(
        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@example.com', 'admin']
      );
      console.log('Domyślny administrator został utworzony');
    } else {
      console.log('Administrator już istnieje');
    }
  } catch (error) {
    console.error('Błąd podczas tworzenia administratora:', error);
  }
};


const addDemoProducts = async () => {
  try {

    const [rows] = await promisePool.query('SELECT * FROM products LIMIT 1');
    
    if (rows.length === 0) {

      const demoProducts = [
        {
          name: "Ultrabook Pro X13",
          price: 79990,
          image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1771&auto=format&fit=crop",
          specs: "Intel Core i7, 16GB RAM, 512GB SSD, 13.3\" FHD"
        },
        {
          name: "Gaming Master G15",
          price: 119990,
          image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=1768&auto=format&fit=crop",
          specs: "AMD Ryzen 9, 32GB RAM, 1TB SSD, RTX 3070, 15.6\" QHD"
        },
        {
          name: "Business Elite B14",
          price: 89990,
          image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1770&auto=format&fit=crop",
          specs: "Intel Core i5, 16GB RAM, 256GB SSD, 14\" FHD"
        },
        {
          name: "Studio Creative S17",
          price: 129990,
          image: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=1774&auto=format&fit=crop",
          specs: "Intel Core i9, 64GB RAM, 2TB SSD, RTX 3080, 17\" 4K"
        }
      ];
      
      for (const product of demoProducts) {
        await promisePool.query(
          'INSERT INTO products (name, price, image, specs) VALUES (?, ?, ?, ?)',
          [product.name, product.price, product.image, product.specs]
        );
      }
      console.log('Produkty demo zostały dodane');
    } else {
      console.log('Produkty już istnieją');
    }
  } catch (error) {
    console.error('Błąd przy dodawaniu produktów demo:', error);
  }
};


module.exports = {
  pool: promisePool,
  initDB: createDatabase
}; 