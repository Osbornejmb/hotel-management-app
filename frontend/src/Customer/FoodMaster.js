import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const initialFoodData = {
  breakfast: [],
  lunch: [],
  dinner: [],
  desserts: [],
  snack: [],
  beverages: []
};

function FoodMaster() {
  const { category } = useParams();
  // Always get room number at the top so all functions use the same value
  const roomNumber = localStorage.getItem('customerRoomNumber');
  // Map category to display name
  const categoryDisplayNames = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    desserts: 'Desserts',
    snack: 'Snack',
    beverages: 'Beverages',
  };
  // Convert category to lowercase for mapping (handles uppercase from URL)
  const normalizedCategory = category ? category.toLowerCase() : '';
  const headerTitle = categoryDisplayNames[normalizedCategory] || 'Foods';
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [foodData, setFoodData] = useState(initialFoodData);
  const [popup, setPopup] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');
  // Add missing handlers
  const handleFoodClick = (food) => setPopup({...food, quantity: 1});
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Add to cart with quantity support
  const addToCart = async (food, quantity = 1) => {
    if (addingToCart) return;
    setAddingToCart(true);
    
    // Always use the image path from the card (food.img) for cart display
    const foodWithImage = { 
      ...food, 
      image: food.img,
      quantity: quantity
    };
    
    if (roomNumber) {
      try {
        // Use the new endpoint that merges quantities
        await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/items`, foodWithImage);
        // Always fetch the latest cart after adding
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch (err) {
        alert('Failed to add to cart. Please try again.');
      }
    } else {
      // For local cart (no room number), check if item exists and update quantity
      setCart((prev) => {
        const existingItemIndex = prev.findIndex(
          item => item.name === food.name && item.price === food.price
        );
        
        if (existingItemIndex >= 0) {
          const updatedCart = [...prev];
          updatedCart[existingItemIndex].quantity += quantity;
          return updatedCart;
        } else {
          return [...prev, foodWithImage];
        }
      });
    }
    setAddingToCart(false);
    setPopup(null);
  };

  const closePopup = () => setPopup(null);
  const foods = foodData[normalizedCategory] || [];

  // Fetch food data for the selected category from backend
  React.useEffect(() => {
    let ignore = false;
    axios.get(`${process.env.REACT_APP_API_URL}/api/food`)
      .then(res => {
        if (!ignore && res.data && typeof res.data === 'object') {
          setFoodData(res.data);
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [category]);

  // Update item quantity in cart
  const updateQuantity = async (idx, newQuantity) => {
    if (newQuantity < 1) return;
    
    if (roomNumber) {
      try {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/${idx}/quantity`,
          { quantity: newQuantity }
        );
        // Reload cart from backend after update
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch {
        // Fallback: update local state
        setCart((prev) => {
          const updatedCart = [...prev];
          updatedCart[idx].quantity = newQuantity;
          return updatedCart;
        });
      }
    } else {
      setCart((prev) => {
        const updatedCart = [...prev];
        updatedCart[idx].quantity = newQuantity;
        return updatedCart;
      });
    }
  };

  const removeFromCart = async (idx) => {
    if (roomNumber) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/${idx}`);
        // Reload cart from backend after deletion
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch {
        setCart((prev) => prev.filter((_, i) => i !== idx));
      }
    } else {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/cart/orders/${orderId}`);
      // Refresh orders list
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      setOrders(res.data.filter(order => order.roomNumber === roomNumber));
    } catch {
      alert('Failed to cancel order.');
    }
  };

  // Load cart from backend when showCart opens or popup closes
  React.useEffect(() => {
    if ((showCart || !popup) && roomNumber) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [showCart, popup, roomNumber]);

  // Load checked-out orders for this room when status tab opens, with polling
  React.useEffect(() => {
    let interval;
    const fetchOrders = () => {
      if (showStatus && roomNumber) {
        axios.get(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`)
          .then(res => {
            setOrders(res.data.filter(order => order.roomNumber === roomNumber));
          })
          .catch(() => setOrders([]));
      }
    };
    if (showStatus && roomNumber) {
      fetchOrders();
      interval = setInterval(fetchOrders, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showStatus, roomNumber]);

  return (
    <div style={{ 
      height: '100vh',
      maxHeight: '800px',
      background: '#fff', 
      fontFamily: 'Cinzel, serif', 
      padding: 0, 
      margin: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header Bar - Compact for tablet */}
      <div style={{
        width: '100%',
        background: '#4B2E06',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 1rem',
        minHeight: '50px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px #0001',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/lumine_icon.png" alt="Lumine Logo" style={{ height: '30px', width: '30px', marginRight: '8px', objectFit: 'contain', background: 'transparent', borderRadius: 0, boxShadow: 'none' }} />
          <span style={{ fontSize: '24px', fontWeight: 400, color: '#fff', fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>Lumine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button onClick={() => setShowCart(true)} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '0.9rem', fontFamily: 'serif', fontWeight: 500, cursor: 'pointer', padding: '0.3em 0.8em', borderRadius: '0.35em', transition: 'background 0.2s, color 0.2s', outline: 'none' }}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}>
            Cart ({cart.reduce((total, item) => total + (item.quantity || 1), 0)})
          </button>
          <button onClick={() => setShowStatus(true)} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '0.9rem', fontFamily: 'serif', fontWeight: 500, cursor: 'pointer', padding: '0.3em 0.8em', borderRadius: '0.35em', transition: 'background 0.2s, color 0.2s', outline: 'none' }}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}>
            Status
          </button>
        </div>
      </div>

      {/* Main Content Area - Fills remaining space */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '0.5rem 0'
      }}>
        {/* Back Button and Title */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          marginBottom: '0.8rem',
          flexShrink: 0
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '0 1rem' }}>
            <button
              onClick={() => navigate('/customer/food')}
              style={{
                background: '#F7D774',
                border: 'none',
                color: '#4B2E06',
                fontSize: '0.8rem',
                fontFamily: 'Cinzel, serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
                padding: '0.3em 1em',
                borderRadius: '0.5em',
                boxShadow: '0 2px 8px #e5c16c44',
                transition: 'background 0.2s, color 0.2s',
                outline: 'none',
              }}
              onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
            >
              <span style={{ fontSize: '1rem', marginRight: '0.3rem' }}>&#8592;</span> Back
            </button>
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
            <span style={{ 
              background: '#F7D774', 
              color: '#4B2E06', 
              fontSize: '1.2rem', 
              fontFamily: 'Cinzel, serif', 
              fontWeight: 400, 
              padding: '0.2em 1.2em', 
              borderRadius: '0.2em', 
              boxShadow: '0 2px 8px #e5c16c44', 
              textAlign: 'center' 
            }}>
              {headerTitle}
            </span>
          </div>
        </div>
      
        {/* Search Bar */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '0.8rem',
          flexShrink: 0
        }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search food..."
            style={{
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              border: '2px solid #FFD700', 
              background: '#fff', 
              color: '#4B2E06', 
              fontWeight: 500, 
              fontSize: '0.8rem', 
              width: '250px', 
              boxShadow: '0 2px 8px #FFD700', 
              outline: 'none', 
              textAlign: 'center', 
              fontFamily: 'Cinzel, serif', 
            }}
          />
        </div>

        {/* Food Items Grid - Fixed 3 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          justifyItems: 'center',
          padding: '0 1rem',
          overflow: 'auto',
          flex: 1
        }}>
          {foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).map((food, idx) => (
            <div key={food.name + idx} style={{
              width: '100%',
              maxWidth: '180px',
              height: '140px',
              background: '#fff',
              borderRadius: '0.8rem',
              boxShadow: '0 4px 16px #e5c16c33, 0 2px 8px #FFD700',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              fontSize: '0.9rem',
              color: '#222',
              fontFamily: 'Cinzel, serif',
              fontWeight: 400,
              letterSpacing: 1,
              textAlign: 'center',
              cursor: 'pointer',
              border: '1.5px solid #f7e6b0',
              transition: 'box-shadow 0.18s, border 0.18s, transform 0.18s',
              margin: 0,
              padding: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
              onClick={() => handleFoodClick(food)}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px #e5c16c99'; e.currentTarget.style.border = '2.5px solid #F7D774'; e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 16px #e5c16c33, 0 2px 8px #FFD700'; e.currentTarget.style.border = '1.5px solid #f7e6b0'; e.currentTarget.style.transform = 'none'; }}
            >
              {food.img && (
                <img src={food.img} alt={food.name} style={{ width: '100%', height: '90px', objectFit: 'cover', borderTopLeftRadius: '0.8rem', borderTopRightRadius: '0.8rem', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, border: 'none', background: '#fff', display: 'block' }} />
              )}
              <div style={{ width: '100%', padding: '0.3rem 0.5rem 0 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#4B2E06', margin: 0, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{food.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#4B2E06', fontWeight: 500, marginTop: 2 }}>₱{food.price ? food.price.toFixed(2) : '0.00'}</div>
              </div>
              {/* Cart icon bottom right */}
              <span style={{ position: 'absolute', bottom: 8, right: 10, color: '#FFD700', fontSize: '20px' }}>
                <i className="fa fa-shopping-cart" />
              </span>
            </div>
          ))}
        </div>

        {/* Popup for Add to Cart with Quantity Selection */}
        {popup && (
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: '0.8rem',
              boxShadow: '0 4px 32px #e5c16c99, 0 2px 8px #FFD700',
              width: '80vw',
              maxWidth: '300px',
              minHeight: '280px',
              textAlign: 'center',
              color: '#4B2E06',
              border: '2.5px solid #F7D774',
              fontFamily: 'serif',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}>
              {popup.img && (
                <img src={popup.img} alt={popup.name} style={{ width: '100%', maxWidth: '180px', height: '110px', objectFit: 'cover', borderRadius: '0.8em', marginBottom: '8px', border: '1.5px solid #F7D774', background: '#fff', display: 'block' }} />
              )}
              <h3 style={{ color: '#4B2E06', fontWeight: 500, fontFamily: 'Cinzel, serif', fontSize: '1rem', margin: 0, marginBottom: '0.4rem' }}>{popup.name}</h3>
              <div style={{ fontSize: '0.9rem', color: '#4B2E06', fontWeight: 500, marginBottom: '0.4rem' }}>₱{popup.price ? popup.price.toFixed(2) : '0.00'}</div>
              {popup.details && (
                <p style={{ margin: 0, marginBottom: '0.6rem', color: '#4B2E06', fontWeight: 400, fontSize: '0.8rem' }}>{popup.details}</p>
              )}
              
              {/* Quantity Selector */}
              <div style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    onClick={() => {
                      const currentQty = popup.quantity || 1;
                      if (currentQty > 1) {
                        setPopup({...popup, quantity: currentQty - 1});
                      }
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid #FFD700',
                      background: '#F7D774',
                      color: '#4B2E06',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    -
                  </button>
                  <span style={{ 
                    minWidth: '30px', 
                    textAlign: 'center', 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    fontFamily: 'Cinzel, serif'
                  }}>
                    {popup.quantity || 1}
                  </span>
                  <button
                    onClick={() => {
                      const currentQty = popup.quantity || 1;
                      setPopup({...popup, quantity: currentQty + 1});
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '2px solid #FFD700',
                      background: '#F7D774',
                      color: '#4B2E06',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '0.6rem', fontSize: '0.8rem' }}>Add this item to your cart?</div>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', width: '100%' }}>
                <button
                  onClick={() => addToCart(popup, popup.quantity || 1)}
                  disabled={addingToCart}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '0.4em', border: '2px solid #FFD700',
                    background: addingToCart ? '#e5c16c88' : '#F7D774', color: '#4B2E06',
                    fontWeight: 500, fontFamily: 'serif', cursor: addingToCart ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                    fontSize: '0.8rem'
                  }}
                  onMouseOver={e => { if (!addingToCart) { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}}
                  onMouseOut={e => { if (!addingToCart) { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}}
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={closePopup}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '0.4em', border: '2px solid #FFD700',
                    background: '#fff', color: '#4B2E06',
                    fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                    fontSize: '0.8rem'
                  }}
                  onMouseOver={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                  onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#4B2E06'; }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cart Popup with Quantity Support */}
        {showCart && (
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(75,46,6,0.10)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1200
          }}>
            <div style={{
              background: '#fff', 
              padding: '1.2rem',
              borderRadius: '1rem', 
              boxShadow: '0 4px 32px #e5c16c99, 0 2px 8px #FFD700',
              width: '90vw',
              maxWidth: '600px',
              maxHeight: '70vh',
              textAlign: 'center', 
              color: '#4B2E06', 
              border: '2.5px solid #F7D774', 
              fontFamily: 'serif',
              overflow: 'auto'
            }}>
              <h2 style={{ color: '#4B2E06', fontWeight: 400, fontFamily: 'serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Your Cart
              </h2>

              {cart.length === 0 ? (
                <p style={{ color: '#4B2E06', fontSize: '1rem' }}>Your cart is empty.</p>
              ) : (
                <div style={{ maxHeight: '35vh', overflowY: 'auto', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'serif', color: '#4B2E06', fontSize: '0.8rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ background: '#F7D774', color: '#4B2E06' }}>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Item</th>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Price</th>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Qty</th>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Total</th>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => {
                        const itemTotal = (item.price || 0) * (item.quantity || 1);
                        return (
                          <tr key={idx}>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0', textAlign: 'left' }}>
                              <img src={item.img} alt={item.name} style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                marginRight: '0.4rem', verticalAlign: 'middle',
                                border: '1.5px solid #F7D774', background: '#fff'
                              }} />
                              {item.name}
                            </td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0' }}>
                              ₱{item.price ? item.price.toFixed(2) : '0.00'}
                            </td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                <button
                                  onClick={() => updateQuantity(idx, (item.quantity || 1) - 1)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: '1px solid #FFD700',
                                    background: '#F7D774',
                                    color: '#4B2E06',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ minWidth: '20px', textAlign: 'center' }}>
                                  {item.quantity || 1}
                                </span>
                                <button
                                  onClick={() => updateQuantity(idx, (item.quantity || 1) + 1)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: '1px solid #FFD700',
                                    background: '#F7D774',
                                    color: '#4B2E06',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0', fontWeight: 500 }}>
                              ₱{itemTotal.toFixed(2)}
                            </td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0' }}>
                              <button
                                onClick={() => removeFromCart(idx)}
                                style={{
                                  padding: '0.2rem 0.5rem', borderRadius: '0.4em',
                                  border: '2px solid #FFD700', background: '#F7D774',
                                  color: '#4B2E06', cursor: 'pointer', fontWeight: 500,
                                  fontFamily: 'serif', boxShadow: '0 2px 8px #e5c16c44',
                                  transition: 'background 0.2s, color 0.2s',
                                  fontSize: '0.7rem'
                                }}
                                onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                                onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ fontWeight: 500, background: '#F7D774', color: '#4B2E06' }}>
                        <td colSpan={3} style={{ padding: '0.4rem', textAlign: 'right' }}>Total:</td>
                        <td style={{ padding: '0.4rem' }}>
                          ₱{cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  onClick={async () => {
                    if (roomNumber && cart.length > 0) {
                      try {
                        await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/checkout`);
                        setCart([]);
                        alert('Checkout successful! Your order has been sent to the restaurant.');
                        setShowCart(false);
                      } catch {
                        alert('Checkout failed. Please try again.');
                      }
                    }
                  }}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '0.4em', border: '2px solid #FFD700',
                    background: '#F7D774', color: '#4B2E06',
                    fontWeight: 500, fontFamily: 'serif', cursor: 'pointer',
                    boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                    fontSize: '0.8rem'
                  }}
                  onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                  onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                >
                  Checkout
                </button>

                <button
                  onClick={() => setShowCart(false)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '0.4em', border: '2px solid #FFD700',
                    background: '#fff', color: '#4B2E06',
                    fontWeight: 500, fontFamily: 'serif', cursor: 'pointer',
                    boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                    fontSize: '0.8rem'
                  }}
                  onMouseOver={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                  onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#4B2E06'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Popup with tabs for Pending and Delivered */}
        {showStatus && (
          <div style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(75,46,6,0.10)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1200
          }}>
            <div style={{
              background: '#fff', 
              padding: '1.2rem',
              borderRadius: '1rem', 
              boxShadow: '0 4px 32px #e5c16c99, 0 2px 8px #FFD700',
              width: '90vw',
              maxWidth: '600px',
              maxHeight: '70vh',
              textAlign: 'center', 
              color: '#4B2E06', 
              border: '2.5px solid #F7D774', 
              fontFamily: 'serif',
              overflow: 'auto'
            }}>
              <h2 style={{ color: '#4B2E06', fontWeight: 400, fontFamily: 'serif', fontSize: '1.5rem', marginBottom: '1rem' }}>Order Status</h2>
              {/* Tabs */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', gap: '0.8rem' }}>
                <button
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '0.4em', border: '2px solid #FFD700', background: tab === 'pending' ? '#F7D774' : '#fff', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                    fontSize: '0.8rem'
                  }}
                  onClick={() => setTab('pending')}
                  onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                  onMouseOut={e => { e.target.style.background = tab === 'pending' ? '#F7D774' : '#fff'; e.target.style.color = '#4B2E06'; }}
                >Pending</button>
                <button
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '0.4em', border: '2px solid #FFD700', background: tab === 'delivered' ? '#F7D774' : '#fff', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                    fontSize: '0.8rem'
                  }}
                  onClick={() => setTab('delivered')}
                  onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                  onMouseOut={e => { e.target.style.background = tab === 'delivered' ? '#F7D774' : '#fff'; e.target.style.color = '#4B2E06'; }}
                >Delivered</button>
              </div>
              {/* Orders Table, scrollable if too many items */}
              {orders.length === 0 ? (
                <p style={{ color: '#4B2E06', fontSize: '1rem' }}>No checked-out orders yet.</p>
              ) : (
                <div style={{ maxHeight: '35vh', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontFamily: 'serif', color: '#4B2E06', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#F7D774', color: '#4B2E06' }}>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Items</th>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Total Price</th>
                        <th style={{ padding: '0.4rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(order => (tab === 'pending' ? (order.status !== 'delivered') : (order.status === 'delivered'))).map((order, idx) => {
                        const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                        return (
                          <tr key={order._id || idx}>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0' }}>
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {order.items.map((item, i) => (
                                  <li key={i} style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center' }}>
                                    {item.img && (
                                      <img src={item.img} alt={item.name} style={{ width: '24px', height: '24px', borderRadius: '6px', marginRight: '0.4rem', verticalAlign: 'middle', border: '1.5px solid #F7D774', background: '#fff' }} />
                                    )}
                                    <span style={{ color: '#4B2E06', fontWeight: 500, fontSize: '0.8rem' }}>{item.name}</span> 
                                    <span style={{ color: '#4B2E06', marginLeft: '0.4rem', fontSize: '0.8rem' }}>(x{item.quantity || 1})</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0', fontWeight: 500 }}>₱{totalPrice.toFixed(2)}</td>
                            <td style={{ padding: '0.4rem', borderBottom: '1px solid #f7e6b0', fontWeight: 500 }}>
                              {order.status || 'pending'}
                              {tab === 'pending' && (
                                <button
                                  style={{ marginLeft: '0.4rem', padding: '0.2rem 0.6rem', borderRadius: '0.4em', border: '2px solid #FFD700', background: '#F7D774', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s', fontSize: '0.7rem' }}
                                  onClick={() => cancelOrder(order._id)}
                                  onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                                  onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                                >Cancel</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <button
                onClick={() => setShowStatus(false)}
                style={{
                  marginTop: '1rem', padding: '0.4rem 1rem',
                  borderRadius: '0.4em', border: '2px solid #FFD700',
                  background: '#fff', color: '#4B2E06',
                  fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s',
                  fontSize: '0.8rem'
                }}
                onMouseOver={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#4B2E06'; }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodMaster;