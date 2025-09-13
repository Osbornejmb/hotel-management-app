import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function FoodAndBeverages() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const roomNumber = localStorage.getItem('customerRoomNumber');
  const categories = [
    {
      name: 'Breakfast',
      img: 'https://img.icons8.com/color/96/000000/breakfast.png',
      path: '/customer/food/breakfast',
    },
    {
      name: 'Lunch',
      img: 'https://img.icons8.com/color/96/000000/lunch.png',
      path: '/customer/food/lunch',
    },
    {
      name: 'Dinner',
      img: 'https://img.icons8.com/color/96/000000/dinner.png',
      path: '/customer/food/dinner',
    },
    {
      name: 'Desserts',
      img: 'https://img.icons8.com/color/96/000000/cake.png',
      path: '/customer/food/desserts',
    },
    {
      name: 'Snack',
      img: 'https://img.icons8.com/color/96/000000/popcorn.png',
      path: '/customer/food/snack',
    },
    {
      name: 'Beverages',
      img: 'https://img.icons8.com/color/96/000000/cocktail.png',
      path: '/customer/food/beverages',
    },
  ];

  // Load cart from backend on mount
  useEffect(() => {
    if (roomNumber) {
      axios.get(`http://localhost:5000/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [roomNumber, showCart]);

  const removeFromCart = async (idx) => {
    if (roomNumber) {
      try {
        await axios.delete(`http://localhost:5000/api/cart/${roomNumber}/${idx}`);
        // Reload cart from backend after deletion
        const res = await axios.get(`http://localhost:5000/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch {
        // fallback: remove locally
        const newCart = cart.filter((_, i) => i !== idx);
        setCart(newCart);
      }
    } else {
      const newCart = cart.filter((_, i) => i !== idx);
      setCart(newCart);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Food & Beverages</h2>
      <button onClick={() => navigate('/customer/interface')} style={{ position: 'fixed', top: '2rem', left: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100 }}>Back</button>
      <button onClick={() => setShowCart(true)} style={{ position: 'fixed', top: '2rem', right: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#ff9800', color: '#fff', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100 }}>
        Cart ({cart.length})
      </button>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        {categories.map((cat) => (
          <div key={cat.name} style={{ cursor: 'pointer', width: '120px' }} onClick={() => navigate(cat.path)}>
            <img src={cat.img} alt={cat.name} style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc', width: '96px', height: '96px' }} />
            <div style={{ marginTop: '0.5rem' }}>{cat.name}</div>
          </div>
        ))}
      </div>
      <p>Order food and beverages for your room here.</p>
      {showCart && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #aaa', minWidth: '350px', textAlign: 'center' }}>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {cart.map((item, idx) => (
                  <li key={idx} style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <img src={item.img} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', marginRight: '1rem' }} />
                      {item.name} <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.9em' }}>{item.category}</span>
                    </span>
                    <button onClick={() => removeFromCart(idx)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: 'none', background: '#f44336', color: '#fff', cursor: 'pointer' }}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowCart(false)} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#eee', cursor: 'pointer' }}>Close</button>
            <button onClick={() => { setShowCart(false); navigate('/customer/food/breakfast'); }} style={{ marginTop: '1rem', marginLeft: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2196f3', color: '#fff', cursor: 'pointer' }}>Add More Items</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodAndBeverages;
