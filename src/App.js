import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Admin from './components/Admin';
import axios from 'axios';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  const [isInstalled, setIsInstalled] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [cart, setCart] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  const fullNameRef = useRef();
  const addressRef = useRef();
  const phoneRef = useRef();
  const paymentMethodRef = useRef();


  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      console.log('Loaded products:', response.data);
      
      if (response.data && response.data.products) {
        setLaptops(response.data.products);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Nie udało się załadować produktów. Spróbuj odświeżyć stronę.');
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchProducts();
    

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);


    window.addEventListener('beforeinstallprompt', (e) => {

      e.preventDefault();

      setInstallPrompt(e);
    });


    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);


  const handleInstallClick = async () => {
    if (!installPrompt) return;
    

    installPrompt.prompt();
    

    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };


  const openLaptop = (laptop) => {
    setSelectedLaptop(laptop);
  };


  const addToCart = (laptop) => {
    const existingItem = cart.find(item => item.id === laptop.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === laptop.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...laptop, quantity: 1 }]);
    }
  };


  const checkout = () => {
    setShowPayment(true);
  };

  const completePayment = async () => {
    try {

      const fullName = fullNameRef.current.value;
      const address = addressRef.current.value;
      const phone = phoneRef.current.value;
      const paymentMethod = paymentMethodRef.current.value;
      
      if (!fullName || !address || !phone) {
        alert('Proszę wypełnić wszystkie pola formularza.');
        return;
      }
      
      setOrderProcessing(true);
      

      const orderData = {
        fullName,
        address,
        phone,
        paymentMethod,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: cartTotal
      };
      
      console.log('Sending order data:', orderData);
      

      const response = await axios.post('/api/orders', orderData);
      
      console.log('Order created:', response.data);
      
      setOrderSuccess(true);
      setOrderProcessing(false);
      alert('Zamówienie zostało opłacone pomyślnie!');
      setCart([]);
      setShowPayment(false);
    } catch (error) {
      console.error('Error creating order:', error);
      setOrderProcessing(false);
      alert('Wystąpił błąd podczas składania zamówienia. Spróbuj ponownie.');
    }
  };


  const closeLaptopDetails = () => {
    setSelectedLaptop(null);
  };


  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };


  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);


  const Store = () => (
    <div className="App">
      <header className="App-header">
        <h1>NoteBookHub</h1>
        <p>Najlepsze laptopy do pracy i rozrywki</p>
        
        {!isOnline && (
          <div className="offline-notice">
            Jesteś w trybie offline. Niektóre funkcje mogą być niedostępne.
          </div>
        )}
        
        <div className="header-controls">
          <Link to="/admin" className="admin-button">
            Panel administracyjny
          </Link>
        </div>
      </header>

      <main className="content">
        {!selectedLaptop && !showPayment && (
          <>
            {loading ? (
              <div className="loading">Ładowanie produktów...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : laptops.length === 0 ? (
              <div className="no-products">Brak dostępnych produktów</div>
            ) : (
              <div className="laptop-grid">
                {laptops.map(laptop => (
                  <div key={laptop.id} className="laptop-card">
                    <img src={laptop.image} alt={laptop.name} />
                    <h3>{laptop.name}</h3>
                    <p className="specs">{laptop.specs}</p>
                    <p className="price">{parseFloat(laptop.price).toLocaleString()} zł</p>
                    <div className="laptop-buttons">
                      <button onClick={() => openLaptop(laptop)} className="btn view-btn">
                        Otwórz produkt
                      </button>
                      <button onClick={() => addToCart(laptop)} className="btn cart-btn">
                        Do koszyka
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedLaptop && !showPayment && (
          <div className="laptop-details">
            <button className="back-btn" onClick={closeLaptopDetails}>← Wstecz</button>
            <div className="details-content">
              <div className="details-image">
                <img src={selectedLaptop.image} alt={selectedLaptop.name} />
              </div>
              <div className="details-info">
                <h2>{selectedLaptop.name}</h2>
                <p className="specs">{selectedLaptop.specs}</p>
                <p className="big-price">{parseFloat(selectedLaptop.price).toLocaleString()} zł</p>
                <button 
                  onClick={() => {
                    addToCart(selectedLaptop);
                    closeLaptopDetails();
                  }} 
                  className="btn cart-btn big-btn"
                >
                  Dodaj do koszyka
                </button>
              </div>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="payment-page">
            <button className="back-btn" onClick={() => setShowPayment(false)}>← Wróć do koszyka</button>
            <h2>Realizacja zamówienia</h2>
            <div className="payment-form">
              <div className="form-group">
                <label>Imię i nazwisko</label>
                <input 
                  type="text" 
                  placeholder="Wprowadź imię i nazwisko" 
                  ref={fullNameRef}
                  required
                />
              </div>
              <div className="form-group">
                <label>Adres dostawy</label>
                <input 
                  type="text" 
                  placeholder="Wprowadź adres dostawy" 
                  ref={addressRef}
                  required
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input 
                  type="text" 
                  placeholder="+48 ___ ___ ___" 
                  ref={phoneRef}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sposób płatności</label>
                <select ref={paymentMethodRef}>
                  <option value="card">Karta bankowa</option>
                  <option value="cash">Gotówka przy odbiorze</option>
                </select>
              </div>
              <button 
                className="btn payment-btn" 
                onClick={completePayment}
                disabled={orderProcessing}
              >
                {orderProcessing ? 'Przetwarzanie...' : `Zapłać ${cartTotal.toLocaleString()} zł`}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Koszyk */}
      {cart.length > 0 && !showPayment && (
        <div className="cart-panel">
          <h3>Koszyk ({cart.reduce((total, item) => total + item.quantity, 0)} szt.)</h3>
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p>{item.quantity} szt. × {item.price.toLocaleString()} zł</p>
                </div>
                <button 
                  className="remove-btn" 
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Usuń z koszyka"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <p>Razem: {cartTotal.toLocaleString()} zł</p>
            <button className="btn checkout-btn" onClick={checkout}>
              Zapłać
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
