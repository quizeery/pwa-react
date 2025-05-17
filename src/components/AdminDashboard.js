import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Admin.css';

const AdminDashboard = ({ onLogout }) => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersByStatus: [],
    ordersByDay: [],
    popularProducts: []
  });
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeSection, setActiveSection] = useState('dashboard');
  

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '',
    specs: '',
    stock: 10
  });
  

  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  

  const fetchStats = async () => {
    try {
      console.log('Ładowanie statystyk zamówień');
      
 
      const token = localStorage.getItem('adminToken');
      

      const response = await axios.get('/api/orders/stats/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Odpowiedź API statystyk:', response.data);
      
      setStats(response.data);
      setError(''); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas ładowania statystyk';
      setError(`Błąd podczas ładowania statystyk: ${errorMessage}`);
      console.error('Błąd podczas ładowania statystyk:', error);
    }
  };
  

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      console.log('Ładowanie zamówień, strona:', page);
      

      const token = localStorage.getItem('adminToken');
      

      const response = await axios.get(`/api/orders?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Odpowiedź API zamówień:', response.data);
      
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.pages);
      setCurrentPage(page);
      setLoading(false);
      setError(''); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas ładowania zamówień';
      setError(`Błąd podczas ładowania zamówień: ${errorMessage}`);
      setLoading(false);
      console.error('Błąd podczas ładowania zamówień:', error);
    }
  };
  

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      console.log('Ładowanie produktów, strona:', page);
      

      const token = localStorage.getItem('adminToken');
      

      const response = await axios.get(`/api/products?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Odpowiedź API produktów:', response.data);
      
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.pages);
      setCurrentPage(page);
      setLoading(false);
      setError(''); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas ładowania produktów';
      setError(`Błąd podczas ładowania produktów: ${errorMessage}`);
      setLoading(false);
      console.error('Błąd podczas ładowania produktów:', error);
    }
  };
  
  
  const addProduct = async (e) => {
    e.preventDefault();
    
    try {

      if (!newProduct.name || !newProduct.price || !newProduct.image || !newProduct.specs) {
        setError('Wszystkie pola są wymagane');
        return;
      }
      

      if (isNaN(parseFloat(newProduct.price)) || parseFloat(newProduct.price) <= 0) {
        setError('Cena musi być liczbą dodatnią');
        return;
      }
      

      const token = localStorage.getItem('adminToken');
      

      const response = await axios.post('/api/products', 
        {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          image: newProduct.image,
          specs: newProduct.specs,
          stock: parseInt(newProduct.stock)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Produkt dodany:', response.data);
      

      setNewProduct({
        name: '',
        price: '',
        image: '',
        specs: '',
        stock: 10
      });
      

      fetchProducts(currentPage);
      

      alert('Produkt został pomyślnie dodany!');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas dodawania produktu';
      setError(`Błąd podczas dodawania produktu: ${errorMessage}`);
      console.error('Błąd podczas dodawania produktu:', error);
    }
  };
  

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };
  

  const handleEditProductInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct({
      ...editingProduct,
      [name]: value
    });
  };
  

  const deleteProduct = async (productId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten produkt?')) {
      return;
    }
    
    try {

      const token = localStorage.getItem('adminToken');
      

      await axios.delete(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      

      fetchProducts(currentPage);
      

      alert('Produkt został pomyślnie usunięty!');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas usuwania produktu';
      setError(`Błąd podczas usuwania produktu: ${errorMessage}`);
      console.error('Błąd podczas usuwania produktu:', error);
    }
  };
  

  const openEditForm = (product) => {
    setEditingProduct({
      ...product,
      price: product.price.toString()
    });
    setShowEditForm(true);
  };
  

  const closeEditForm = () => {
    setEditingProduct(null);
    setShowEditForm(false);
  };
  

  const saveProductChanges = async (e) => {
    e.preventDefault();
    
    try {

      if (!editingProduct.name || !editingProduct.price || !editingProduct.image || !editingProduct.specs) {
        setError('Wszystkie pola są wymagane');
        return;
      }
      

      if (isNaN(parseFloat(editingProduct.price)) || parseFloat(editingProduct.price) <= 0) {
        setError('Cena musi być liczbą dodatnią');
        return;
      }
      

      const token = localStorage.getItem('adminToken');
      

      await axios.put(`/api/products/${editingProduct.id}`, 
        {
          name: editingProduct.name,
          price: parseFloat(editingProduct.price),
          image: editingProduct.image,
          specs: editingProduct.specs,
          stock: parseInt(editingProduct.stock)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      

      closeEditForm();
      

      fetchProducts(currentPage);
      

      alert('Produkt został pomyślnie zaktualizowany!');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas aktualizacji produktu';
      setError(`Błąd podczas aktualizacji produktu: ${errorMessage}`);
      console.error('Błąd podczas aktualizacji produktu:', error);
    }
  };
  

  useEffect(() => {

    const initAdmin = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          console.log('Brak tokenu autoryzacji');
          onLogout();
          return;
        }
        
        console.log('Weryfikacja ważności tokenu administratora');
        
        const response = await axios.get('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const user = response.data.user;
        console.log('Informacje o użytkowniku:', user);
        
        if (user.role !== 'admin') {
          console.log('Użytkownik nie jest administratorem');
          setError('Dostęp zabroniony. Wymagane uprawnienia administratora.');
          onLogout();
          return;
        }
        
        console.log('Token administratora potwierdzony');
        

        if (activeSection === 'dashboard') {
          await fetchStats();
        } else if (activeSection === 'orders') {
          await fetchOrders(1);
        } else if (activeSection === 'products') {
          await fetchProducts(1);
        }
      } catch (error) {
        console.error('Błąd podczas weryfikacji tokenu:', error);
        setError('Błąd autoryzacji. Zaloguj się ponownie.');
        onLogout();
      }
    };
    
    initAdmin();
  }, [activeSection, onLogout]);
  

  const updateOrderStatus = async (orderId, newStatus) => {
    try {

      const token = localStorage.getItem('adminToken');
      

      await axios.put(`/api/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      

      fetchOrders(currentPage);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Błąd podczas aktualizacji statusu';
      setError(`Błąd podczas aktualizacji statusu zamówienia: ${errorMessage}`);
      console.error('Błąd podczas aktualizacji statusu zamówienia:', error);
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    delete axios.defaults.headers.common['Authorization'];

    onLogout();
  };
  

  const getStatusLabel = (status) => {
    const statuses = {
      pending: 'Oczekujące',
      processing: 'W realizacji',
      shipped: 'Wysłane',
      delivered: 'Dostarczone',
      cancelled: 'Anulowane'
    };
    
    return statuses[status] || status;
  };
  

  const getStatusClass = (status) => {
    return `order-status status-${status}`;
  };
  

  const renderDashboard = () => {
    return (
      <>
        <div className="admin-header">
          <h1>Panel sterowania</h1>
          <button className="refresh-btn" onClick={fetchStats}>
            Odśwież dane
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Całkowity przychód</h3>
            <p className="value">{stats.totalRevenue?.toLocaleString() || '0'} zł</p>
          </div>
          
          {stats.ordersByStatus && stats.ordersByStatus.map((statusGroup) => (
            <div className="dashboard-card" key={statusGroup.status}>
              <h3>Zamówienia - {getStatusLabel(statusGroup.status)}</h3>
              <p className="value">{statusGroup.count}</p>
            </div>
          ))}
        </div>
        
        <div className="dashboard-section">
          <h2>Popularne produkty</h2>
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nazwa</th>
                <th>Sprzedane (szt.)</th>
              </tr>
            </thead>
            <tbody>
              {!stats.popularProducts || stats.popularProducts.length === 0 ? (
                <tr>
                  <td colSpan="3">Brak danych o sprzedaży</td>
                </tr>
              ) : (
                stats.popularProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.totalSold}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };
  

  const renderOrders = () => {
    return (
      <>
        <div className="admin-header">
          <h1>Zarządzanie zamówieniami</h1>
          <button className="refresh-btn" onClick={() => fetchOrders(currentPage)}>
            Odśwież zamówienia
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <p>Ładowanie...</p>
        ) : (
          <>
            <div className="dashboard-section">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Klient</th>
                    <th>Kwota</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6">Brak zamówień</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.full_name}</td>
                        <td>{order.total_amount.toLocaleString()} zł</td>
                        <td>
                          <span className={getStatusClass(order.status)}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td>
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          >
                            <option value="pending">Oczekujące</option>
                            <option value="processing">W realizacji</option>
                            <option value="shipped">Wysłane</option>
                            <option value="delivered">Dostarczone</option>
                            <option value="cancelled">Anulowane</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Paginacja */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => fetchOrders(1)}
                    disabled={currentPage === 1}
                  >
                    &laquo;
                  </button>
                  
                  <button 
                    onClick={() => fetchOrders(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &lsaquo;
                  </button>
                  
                  {[...Array(totalPages).keys()].map((page) => (
                    <button 
                      key={page + 1}
                      onClick={() => fetchOrders(page + 1)}
                      className={currentPage === page + 1 ? 'active' : ''}
                    >
                      {page + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => fetchOrders(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &rsaquo;
                  </button>
                  
                  <button 
                    onClick={() => fetchOrders(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </>
    );
  };
  

  const renderProducts = () => {
    return (
      <>
        <div className="admin-header">
          <h1>Zarządzanie produktami</h1>
          <button className="refresh-btn" onClick={() => fetchProducts(currentPage)}>
            Odśwież produkty
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Okno modalne edycji produktu */}
        {showEditForm && editingProduct && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Edytuj produkt #{editingProduct.id}</h2>
                <button className="close-button" onClick={closeEditForm}>×</button>
              </div>
              
              <form className="product-form" onSubmit={saveProductChanges}>
                <div className="form-group">
                  <label htmlFor="edit-name">Nazwa produktu</label>
                  <input 
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editingProduct.name}
                    onChange={handleEditProductInputChange}
                    placeholder="Wprowadź nazwę produktu"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-price">Cena (zł)</label>
                  <input 
                    type="number"
                    id="edit-price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={handleEditProductInputChange}
                    placeholder="Wprowadź cenę"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-image">URL obrazka</label>
                  <input 
                    type="url"
                    id="edit-image"
                    name="image"
                    value={editingProduct.image}
                    onChange={handleEditProductInputChange}
                    placeholder="Wprowadź URL obrazka produktu"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-specs">Specyfikacja</label>
                  <textarea 
                    id="edit-specs"
                    name="specs"
                    value={editingProduct.specs}
                    onChange={handleEditProductInputChange}
                    placeholder="Wprowadź specyfikację produktu"
                    required
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-stock">Ilość w magazynie</label>
                  <input 
                    type="number"
                    id="edit-stock"
                    name="stock"
                    min="0"
                    value={editingProduct.stock}
                    onChange={handleEditProductInputChange}
                    required
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeEditForm}>
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary">
                    Zapisz zmiany
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Formularz dodawania nowego produktu */}
        <div className="dashboard-section">
          <h2>Dodaj nowy produkt</h2>
          <form className="product-form" onSubmit={addProduct}>
            <div className="form-group">
              <label htmlFor="name">Nazwa produktu</label>
              <input 
                type="text"
                id="name"
                name="name"
                value={newProduct.name}
                onChange={handleProductInputChange}
                placeholder="Wprowadź nazwę produktu"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Cena (zł)</label>
              <input 
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={handleProductInputChange}
                placeholder="Wprowadź cenę"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="image">URL obrazka</label>
              <input 
                type="url"
                id="image"
                name="image"
                value={newProduct.image}
                onChange={handleProductInputChange}
                placeholder="Wprowadź URL obrazka produktu"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="specs">Specyfikacja</label>
              <textarea 
                id="specs"
                name="specs"
                value={newProduct.specs}
                onChange={handleProductInputChange}
                placeholder="Wprowadź specyfikację produktu"
                required
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stock">Ilość w magazynie</label>
              <input 
                type="number"
                id="stock"
                name="stock"
                min="0"
                value={newProduct.stock}
                onChange={handleProductInputChange}
                required
              />
            </div>
            
            <button type="submit" className="btn-primary">
              Dodaj produkt
            </button>
          </form>
        </div>
        
        {/* Tabela produktów */}
        {loading ? (
          <p>Ładowanie...</p>
        ) : (
          <div className="dashboard-section">
            <h2>Lista produktów</h2>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Obraz</th>
                  <th>Nazwa</th>
                  <th>Cena</th>
                  <th>W magazynie</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6">Brak produktów</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="product-thumbnail" 
                        />
                      </td>
                      <td>{product.name}</td>
                      <td>{parseFloat(product.price).toLocaleString()} zł</td>
                      <td>{product.stock}</td>
                      <td className="action-buttons">
                        <button 
                          className="btn-edit" 
                          onClick={() => openEditForm(product)}
                          title="Edytuj produkt"
                        >
                          ✎
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => deleteProduct(product.id)}
                          title="Usuń produkt"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Paginacja */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => fetchProducts(1)}
                  disabled={currentPage === 1}
                >
                  &laquo;
                </button>
                
                <button 
                  onClick={() => fetchProducts(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &lsaquo;
                </button>
                
                {[...Array(totalPages).keys()].map((page) => (
                  <button 
                    key={page + 1}
                    onClick={() => fetchProducts(page + 1)}
                    className={currentPage === page + 1 ? 'active' : ''}
                  >
                    {page + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => fetchProducts(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  &rsaquo;
                </button>
                
                <button 
                  onClick={() => fetchProducts(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  };
  
  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <h2>Panel Admin</h2>
        <ul>
          <li>
            <a 
              href="#dashboard" 
              className={activeSection === 'dashboard' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('dashboard');
              }}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a 
              href="#products" 
              className={activeSection === 'products' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('products');
              }}
            >
              Produkty
            </a>
          </li>
          <li>
            <a 
              href="#orders" 
              className={activeSection === 'orders' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection('orders');
              }}
            >
              Zamówienia
            </a>
          </li>
        </ul>
        <button className="logout-btn" onClick={handleLogout}>
          Wyloguj
        </button>
      </div>
      
      <div className="admin-content">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'orders' && renderOrders()}
        {activeSection === 'products' && renderProducts()}
      </div>
    </div>
  );
};

export default AdminDashboard; 