import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Category data for display
const categories = [
  { name: 'BREAKFAST' },
  { name: 'LUNCH' },
  { name: 'DINNER' },
  { name: 'DESSERTS' },
  { name: 'SNACK' },
  { name: 'BEVERAGES' },
];
function FoodAndBeverages() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [foodItems, setFoodItems] = useState([]); // All food items from backend
  const [foodLoaded, setFoodLoaded] = useState(false);
  const roomNumber = localStorage.getItem('customerRoomNumber');

  // Load all food items from backend on mount
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/food`)
      .then(res => {
        // Flatten all categories into a single array
        let all = [];
        if (res.data && typeof res.data === 'object') {
          Object.values(res.data).forEach(arr => {
            if (Array.isArray(arr)) all = all.concat(arr);
          });
        }
        setFoodItems(all);
        setFoodLoaded(true);
      })
      .catch(() => setFoodLoaded(true));
  }, []);

  // Load cart from backend on mount
  useEffect(() => {
    if (roomNumber) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [roomNumber, showCart]);

  // Load checked-out orders for this room when status tab opens, with polling
  useEffect(() => {
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

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'serif', padding: 0, margin: 0, paddingBottom: '3.5rem' }}>
      {/* Header Bar */}
      <div style={{
        width: '100%',
        background: '#4B2E06',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 2.5rem',
        minHeight: 64,
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px #0001',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={process.env.PUBLIC_URL + '/logo192.png'} alt="Lumine Logo" style={{ height: 40, width: 40, marginRight: 12, objectFit: 'contain', background: 'transparent', borderRadius: 0, boxShadow: 'none' }} />
          <span style={{ fontSize: 32, fontWeight: 400, color: '#fff', fontFamily: 'serif', letterSpacing: 1 }}>Lumine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => setShowCart(true)} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 500, cursor: 'pointer', padding: '0.4em 1.2em', borderRadius: '0.35em', transition: 'background 0.2s, color 0.2s', outline: 'none' }}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}>
            Cart ({cart.length})
          </button>
          <button onClick={() => setShowStatus(true)} style={{ background: 'none', border: 'none', color: '#FFD700', fontSize: '1.25rem', fontFamily: 'serif', fontWeight: 500, cursor: 'pointer', padding: '0.4em 1.2em', borderRadius: '0.35em', transition: 'background 0.2s, color 0.2s', outline: 'none' }}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}>
            Status
          </button>
        </div>
{/* Cart Popup */}
{showCart && (
  <div style={{
    position: 'fixed', top: 0, left: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(75,46,6,0.10)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1200
  }}>
    <div style={{
      background: '#fff', padding: '2.2rem 2.5rem',
      borderRadius: '1.2rem', boxShadow: '0 4px 32px #e5c16c99, 0 2px 8px #FFD700',
      minWidth: '370px', textAlign: 'center', color: '#4B2E06', border: '2.5px solid #F7D774', fontFamily: 'serif', maxWidth: '95vw'
    }}>
      <h2 style={{ color: '#4B2E06', fontWeight: 400, fontFamily: 'serif', fontSize: '2rem', marginBottom: '1.2rem' }}>
        Your Cart
      </h2>

      {cart.length === 0 ? (
        <p style={{ color: '#4B2E06', fontSize: '1.1rem' }}>Your cart is empty.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontFamily: 'serif', color: '#4B2E06' }}>
          <thead>
            <tr style={{ background: '#F7D774', color: '#4B2E06' }}>
              <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Item</th>
              <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Category</th>
              <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Price</th>
              <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0', textAlign: 'left' }}>
                  <img src={item.img} alt={item.name} style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    marginRight: '0.5rem', verticalAlign: 'middle',
                    border: '1.5px solid #F7D774', background: '#fff'
                  }} />
                  {item.name}
                </td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0' }}>{item.category}</td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0' }}>
                  ₱{item.price ? item.price.toFixed(2) : '0.00'}
                </td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0' }}>
                  <button
                    onClick={() => removeFromCart(idx)}
                    style={{
                      padding: '0.3rem 0.8rem', borderRadius: '0.5em',
                      border: '2px solid #FFD700', background: '#F7D774',
                      color: '#4B2E06', cursor: 'pointer', fontWeight: 500,
                      fontFamily: 'serif', boxShadow: '0 2px 8px #e5c16c44',
                      transition: 'background 0.2s, color 0.2s'
                    }}
                    onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                    onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 500, background: '#F7D774', color: '#4B2E06' }}>
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
            } catch {
              alert('Checkout failed. Please try again.');
            }
          }
        }}
        style={{
          marginTop: '1rem', marginRight: '1rem', padding: '0.5rem 1.5rem',
          borderRadius: '0.5em', border: '2px solid #FFD700',
          background: '#F7D774', color: '#4B2E06',
          fontWeight: 500, fontFamily: 'serif', cursor: 'pointer',
          boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s'
        }}
        onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
        onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
      >
        Checkout
      </button>

      <button
        onClick={() => setShowCart(false)}
        style={{
          marginTop: '1rem', padding: '0.5rem 1.5rem',
          borderRadius: '0.5em', border: '2px solid #FFD700',
          background: '#fff', color: '#4B2E06',
          fontWeight: 500, fontFamily: 'serif', cursor: 'pointer',
          boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s'
        }}
        onMouseOver={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
        onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#4B2E06'; }}
      >
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
          background: 'rgba(75,46,6,0.10)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: '#fff', padding: '2.2rem 2.5rem',
            borderRadius: '1.2rem', boxShadow: '0 4px 32px #e5c16c99, 0 2px 8px #FFD700',
            minWidth: '370px', textAlign: 'center', color: '#4B2E06', border: '2.5px solid #F7D774', fontFamily: 'serif', maxWidth: '95vw'
          }}>
            <h2 style={{ color: '#4B2E06', fontWeight: 400, fontFamily: 'serif', fontSize: '2rem', marginBottom: '1.2rem' }}>Order Status</h2>
            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <button
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '0.5em', border: '2px solid #FFD700', background: tab === 'pending' ? '#F7D774' : '#fff', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', marginRight: '1rem', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s'
                }}
                onClick={() => setTab('pending')}
                onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                onMouseOut={e => { e.target.style.background = tab === 'pending' ? '#F7D774' : '#fff'; e.target.style.color = '#4B2E06'; }}
              >Pending</button>
              <button
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '0.5em', border: '2px solid #FFD700', background: tab === 'delivered' ? '#F7D774' : '#fff', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s'
                }}
                onClick={() => setTab('delivered')}
                onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
                onMouseOut={e => { e.target.style.background = tab === 'delivered' ? '#F7D774' : '#fff'; e.target.style.color = '#4B2E06'; }}
              >Delivered</button>
            </div>
            {/* Orders Table, scrollable if too many items */}
            {orders.length === 0 ? (
              <p style={{ color: '#4B2E06', fontSize: '1.1rem' }}>No checked-out orders yet.</p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontFamily: 'serif', color: '#4B2E06' }}>
                  <thead>
                    <tr style={{ background: '#F7D774', color: '#4B2E06' }}>
                      <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Items</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Total Price</th>
                      <th style={{ padding: '0.5rem', borderBottom: '1.5px solid #FFD700', fontWeight: 500 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(order => (tab === 'pending' ? (order.status !== 'delivered') : (order.status === 'delivered'))).map((order, idx) => {
                      const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0), 0);
                      return (
                        <tr key={order._id || idx}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {order.items.map((item, i) => (
                                <li key={i} style={{ marginBottom: '0.5rem' }}>
                                  <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle', border: '1.5px solid #F7D774', background: '#fff' }} />
                                  <span style={{ color: '#4B2E06', fontWeight: 500 }}>{item.name}</span> <span style={{ color: '#4B2E06' }}>({item.category})</span> - <span style={{ color: '#4B2E06' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0', fontWeight: 500 }}>₱{totalPrice.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid #f7e6b0', fontWeight: 500 }}>
                            {order.status || 'pending'}
                            {tab === 'pending' && (
                              <button
                                style={{ marginLeft: '1rem', padding: '0.3rem 1rem', borderRadius: '0.5em', border: '2px solid #FFD700', background: '#F7D774', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s' }}
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
                marginTop: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '0.5em', border: '2px solid #FFD700',
                background: '#fff', color: '#4B2E06',
                fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
              onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#4B2E06'; }}>
              Close
            </button>
          </div>
        </div>
      )}
      </div>
      {/* Back Button and Title */}
      <div style={{ width: '100%', margin: '2.5rem 0 2.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={() => navigate('/customer/interface')}
            style={{
              background: '#F7D774',
              border: 'none',
              color: '#4B2E06',
              fontSize: '1.3rem',
              fontFamily: 'serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 500,
              marginLeft: '2.5rem',
              padding: '0.5em 1.5em',
              borderRadius: '0.7em',
              boxShadow: '0 2px 8px #e5c16c44',
              transition: 'background 0.2s, color 0.2s',
              outline: 'none',
            }}
            onMouseOver={e => { e.target.style.background = '#4B2E06'; e.target.style.color = '#FFD700'; }}
            onMouseOut={e => { e.target.style.background = '#F7D774'; e.target.style.color = '#4B2E06'; }}
          >
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>&#8592;</span> Back
          </button>
        </div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <span style={{ background: '#F7D774', color: '#4B2E06', fontSize: '2rem', fontFamily: 'serif', fontWeight: 400, padding: '0.2em 2.5em', borderRadius: '0.2em', boxShadow: '0 2px 8px #e5c16c44', textAlign: 'center' }}>Food & Beverage</span>
        </div>
      </div>
    
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '2rem 0 0.5rem 0' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search food..."
          style={{
            padding: '0.7rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#fff', color: '#4B2E06', fontWeight: 500, fontSize: '1rem', width: '320px', boxShadow: '0 2px 8px #FFD700', outline: 'none', textAlign: 'center', fontFamily: 'serif', marginBottom: '0.5rem'
          }}
        />
      </div>

      {/* Food Search Results Grid */}
      {search.trim() && foodLoaded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem 2.5rem',
          justifyItems: 'center',
          maxWidth: 1100,
          margin: '0 auto 4.5rem auto',
          background: 'transparent',
        }}>
          {foodItems.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).map((food) => (
            <div key={food.name} style={{
              width: 220,
              height: 180,
              background: '#fff',
              borderRadius: '1.2rem',
              boxShadow: '0 4px 16px #e5c16c33, 0 2px 8px #FFD700',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              color: '#222',
              fontFamily: 'serif',
              fontWeight: 400,
              letterSpacing: 1,
              textAlign: 'center',
              cursor: 'pointer',
              border: '1.5px solid #f7e6b0',
              transition: 'box-shadow 0.18s, border 0.18s, transform 0.18s',
              margin: 0,
              padding: '1.2rem 0.5rem',
            }}
              onClick={() => navigate(`/customer/food/${food.category || ''}`)}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px #e5c16c99'; e.currentTarget.style.border = '2.5px solid #F7D774'; e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 16px #e5c16c33, 0 2px 8px #FFD700'; e.currentTarget.style.border = '1.5px solid #f7e6b0'; e.currentTarget.style.transform = 'none'; }}
            >
              {food.img && <img src={food.img} alt={food.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '0.7em', marginBottom: 10, border: '1.5px solid #F7D774', background: '#fff' }} />}
              <div style={{ fontWeight: 500, fontSize: '1.15rem', color: '#4B2E06', marginBottom: 4 }}>{food.name}</div>
              <div style={{ fontSize: '1rem', color: '#888', marginBottom: 2 }}>{food.category}</div>
              <div style={{ fontSize: '1rem', color: '#4B2E06', fontWeight: 500 }}>₱{food.price ? food.price.toFixed(2) : '0.00'}</div>
            </div>
          ))}
          {foodItems.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div style={{ gridColumn: '1/-1', color: '#888', fontFamily: 'serif', fontSize: '1.2rem', textAlign: 'center', background: 'transparent' }}>No food items found.</div>
          )}
        </div>
      )}

      {/* Food Category Grid (only show if not searching) */}
      {!search.trim() && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem 2.5rem',
          justifyItems: 'center',
          maxWidth: 1100,
         margin: '0 auto 4.5rem auto', // increased bottom margin
        }}>
          {categories.map((cat) => (
            <div key={cat.name} style={{
              width: 220,
              height: 180,
              background: '#fff',
              borderRadius: '1.2rem',
              boxShadow: '0 4px 16px #e5c16c33, 0 2px 8px #FFD700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.55rem',
              color: '#222',
              fontFamily: 'serif',
              fontWeight: 400,
              letterSpacing: 1,
              textAlign: 'center',
              cursor: 'pointer',
              border: '1.5px solid #f7e6b0',
              transition: 'box-shadow 0.18s, border 0.18s, transform 0.18s',
              textTransform: 'uppercase',
              margin: 0,
            }}
              onClick={() => navigate(`/customer/food/${cat.name.toLowerCase()}`)}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px #e5c16c99'; e.currentTarget.style.border = '2.5px solid #F7D774'; e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 16px #e5c16c33, 0 2px 8px #FFD700'; e.currentTarget.style.border = '1.5px solid #f7e6b0'; e.currentTarget.style.transform = 'none'; }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FoodAndBeverages;
