import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
export default FoodMaster;


const initialFoodData = {
  breakfast: [],
  lunch: [],
  dinner: [],
  desserts: [],
  snack: [],
  beverages: []
};

function FoodMaster() {
  // ...existing code...
  // Cancel order function
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
  // ...existing code...
  const [tab, setTab] = useState('pending');
  const { category } = useParams();
  const navigate = useNavigate();
  const [popup, setPopup] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [foodData, setFoodData] = useState(initialFoodData);
  const foods = foodData[category] || [];

  // Fetch food items from backend on mount
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/food`)
      .then(res => setFoodData(res.data))
      .catch(() => setFoodData(initialFoodData));
  }, []);
  const roomNumber = localStorage.getItem('customerRoomNumber');

  useEffect(() => {
    if (!roomNumber) {
      navigate('/customer/login', { replace: true });
    }
  }, [roomNumber, navigate]);

  // Load cart from backend on mount
  useEffect(() => {
    if (roomNumber) {
  axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [roomNumber]);

  // Reload cart from backend when cart popup opens
  useEffect(() => {
    if (showCart && roomNumber) {
  axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [showCart, roomNumber]);

  // Load checked-out orders for this room when status tab opens
  useEffect(() => {
    if (showStatus && roomNumber) {
  axios.get(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`)
        .then(res => {
          // Only show orders for this room
          setOrders(res.data.filter(order => order.roomNumber === roomNumber));
        })
        .catch(() => setOrders([]));
    }
  }, [showStatus, roomNumber]);

  // Remove useEffect that POSTs cart on every cart change

  const handleFoodClick = (food) => {
    setPopup(food);
  };

  const closePopup = () => {
    setPopup(null);
  };

  const addToCart = async (food) => {
    const newCart = [...cart, { name: food.name, img: food.img, price: food.price, category }];
    setCart(newCart);
    setPopup(null);
    if (roomNumber) {
      try {
  await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`, { items: newCart });
      } catch {}
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
        // fallback: remove locally
        setCart((prev) => prev.filter((_, i) => i !== idx));
      }
    } else {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  return (
  <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
  <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Food'}</h2>

      {/* Cart Button */}
      <button
        onClick={() => setShowCart(true)}
        style={{
          position: 'fixed', top: '2rem', right: '2rem',
          padding: '0.5rem 1.5rem', borderRadius: '8px',
          border: '2px solid #FFD700', background: '#222',
          color: '#FFD700', fontWeight: 'bold', cursor: 'pointer',
          zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
        }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
      >
        Cart ({cart.length})
      </button>
      <button
        onClick={() => setShowStatus(true)}
        style={{
          position: 'fixed', top: '2rem', right: '12rem',
          padding: '0.5rem 1.5rem', borderRadius: '8px',
          border: '2px solid #FFD700', background: '#222',
          color: '#FFD700', fontWeight: 'bold', cursor: 'pointer',
          zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
        }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
      >
        Status
      </button>

      {/* Back Button */}
      <button
        onClick={() => navigate('/customer/food')}
        style={{
          position: 'fixed', top: '2rem', left: '2rem',
          padding: '0.5rem 1.5rem', borderRadius: '8px',
          border: '2px solid #FFD700', background: '#222',
          color: '#FFD700', fontWeight: 'bold', cursor: 'pointer',
          zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
        }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
      >
        Back
      </button>

      {/* Search Bar */}
      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search food..."
          style={{
            padding: '0.7rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', fontSize: '1rem', width: '300px', boxShadow: '0 2px 8px #FFD700', marginBottom: '1rem', outline: 'none', textAlign: 'center'
          }}
        />
      </div>
      {/* Food Items */}
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', gap: '2rem', margin: '2rem 0'
      }}>
        {foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).map((food) => (
          <div
            key={food.name}
            style={{ cursor: 'pointer', width: '120px', background: '#222', borderRadius: '16px', boxShadow: '0 2px 12px #FFD700', padding: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => handleFoodClick(food)}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 24px #FFD700'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px #FFD700'; }}
          >
            <img
              src={food.img}
              alt={food.name}
              style={{
                borderRadius: '12px', boxShadow: '0 2px 8px #FFD700',
                width: '96px', height: '96px', background: '#111'
              }}
            />
            <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 8px #000' }}>{food.name}</div>
          </div>
        ))}
      </div>

      {/* Popup for Add to Cart */}
      {popup && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#222', padding: '2rem',
            borderRadius: '16px', boxShadow: '0 2px 24px #FFD700',
            minWidth: '300px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700'
          }}>
            <img
              src={popup.img}
              alt={popup.name}
              style={{
                width: '96px', height: '96px',
                borderRadius: '12px', marginBottom: '1rem'
              }}
            />
            <h3>{popup.name}</h3>
            <p style={{ marginBottom: '0.5rem', color: '#FFD700', fontWeight: 'bold' }}>
              {/* Food details before price */}
              {popup.details ? popup.details : 'No details available.'}
            </p>
            <p>Price: <strong>₱{popup.price ? popup.price.toFixed(2) : '0.00'}</strong></p>
            <p>Add this item to your cart?</p>
            <button
              onClick={() => addToCart(popup)}
              style={{
                margin: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: '2px solid #FFD700',
                background: '#FFD700', color: '#222',
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
            >
              Add to Cart
            </button>
            <button
              onClick={closePopup}
              style={{
                margin: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: '2px solid #FFD700',
                background: '#222', color: '#FFD700',
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cart Popup */}
      {showCart && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: '#222', padding: '2rem',
            borderRadius: '16px', boxShadow: '0 2px 24px #FFD700',
            minWidth: '350px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700'
          }}>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ background: '#FFD700', color: '#222' }}>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Item</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Category</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Price</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                    {cart.map((item, idx) => ( 
                    <tr key={idx}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                        <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {item.name}
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{item.category}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                        <button onClick={() => removeFromCart(idx)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
                          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', background: '#FFD700', color: '#222' }}>
                    <td colSpan={2} style={{ padding: '0.5rem', textAlign: 'right' }}>Total:</td>
                    <td style={{ padding: '0.5rem' }}>
                      ₱{cart.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
            <button
              onClick={async () => {
                if (roomNumber && cart.length > 0) {
                  try {
                    await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/checkout`);
                    setCart([]);
                    alert('Checkout successful! Your order has been sent to the restaurant.');
                    setShowCart(false);
                  } catch (err) {
                    alert('Checkout failed. Please try again.');
                  }
                }
              }}
              style={{
                marginTop: '1rem', marginRight: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: '2px solid #FFD700',
                background: '#FFD700', color: '#222',
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
              Checkout
            </button>
              {/* Removed 'Add More Items' button */}
            <button
              onClick={() => setShowCart(false)}
              style={{
                marginTop: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: '2px solid #FFD700',
                background: '#222', color: '#FFD700',
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Status Popup with tabs for Pending and Delivered */}
      {showStatus && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: '#222', padding: '2rem',
            borderRadius: '16px', boxShadow: '0 2px 24px #FFD700',
            minWidth: '350px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700'
          }}>
            <h2>Order Status</h2>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <button
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', marginRight: '1rem', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
                }}
                onClick={() => setTab('pending')}
                onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              >Pending</button>
              <button
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
                }}
                onClick={() => setTab('delivered')}
                onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              >Delivered</button>
            </div>
            {/* Orders Table, scrollable if too many items */}
            {orders.length === 0 ? (
              <p>No checked-out orders yet.</p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#FFD700', color: '#222' }}>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Items</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Total Price</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(order => (tab === 'pending' ? (order.status !== 'delivered') : (order.status === 'delivered'))).map((order, idx) => {
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0), 0);
                      return (
                        <tr key={order._id || idx}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {order.items.map((item, i) => (
                                <li key={i} style={{ marginBottom: '0.5rem' }}>
                                  <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                  <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</span> <span style={{ color: '#FFD700' }}>({item.category})</span> - <span style={{ color: '#FFD700' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>₱{totalPrice.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                            {order.status || 'pending'}
                            {tab === 'pending' && (
                              <button
                                style={{ marginLeft: '1rem', padding: '0.3rem 1rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
                                onClick={() => cancelOrder(order._id)}
                                onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                                onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
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
                marginTop: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: '2px solid #FFD700',
                background: '#222', color: '#FFD700',
                fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
              Close
            </button>
          </div>
        </div>
  )}
    </div>
  );
}
