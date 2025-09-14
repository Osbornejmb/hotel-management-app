import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Food data copied from FoodMaster.js
const foodData = {
  breakfast: [
    { name: 'Pancakes', img: 'https://img.icons8.com/color/96/000000/pancake.png', price: 4.99 },
    { name: 'Omelette', img: 'https://img.icons8.com/color/96/000000/egg.png', price: 5.99 },
    { name: 'Toast', img: 'https://img.icons8.com/color/96/000000/bread.png', price: 3.49 },
  ],
  lunch: [
    { name: 'Burger', img: 'https://img.icons8.com/color/96/000000/hamburger.png', price: 8.99 },
    { name: 'Salad', img: 'https://img.icons8.com/color/96/000000/salad.png', price: 7.49 },
    { name: 'Sandwich', img: 'https://img.icons8.com/color/96/000000/sandwich.png', price: 6.99 },
  ],
  dinner: [
    { name: 'Steak', img: 'https://img.icons8.com/color/96/000000/steak.png', price: 14.99 },
    { name: 'Spaghetti', img: 'https://img.icons8.com/color/96/000000/spaghetti.png', price: 12.99 },
    { name: 'Roast Chicken', img: 'https://img.icons8.com/color/96/000000/chicken.png', price: 13.49 },
  ],
  desserts: [
    { name: 'Ice Cream', img: 'https://img.icons8.com/color/96/000000/snow.png', price: 4.49 },
    { name: 'Cake', img: 'https://img.icons8.com/color/96/000000/cake.png', price: 5.99 },
    { name: 'Donut', img: 'https://img.icons8.com/color/96/000000/doughnut.png', price: 3.99 },
  ],
  snack: [
    { name: 'Popcorn', img: 'https://img.icons8.com/color/96/000000/popcorn.png', price: 2.99 },
    { name: 'Chips', img: 'https://img.icons8.com/color/96/000000/potato-chips.png', price: 2.49 },
    { name: 'Nuts', img: 'https://img.icons8.com/color/96/000000/nut.png', price: 3.49 },
  ],
  beverages: [
    { name: 'Coffee', img: 'https://img.icons8.com/color/96/000000/coffee.png', price: 2.99 },
    { name: 'Juice', img: 'https://img.icons8.com/color/96/000000/orange-juice.png', price: 3.49 },
    { name: 'Cocktail', img: 'https://img.icons8.com/color/96/000000/cocktail.png', price: 4.99 },
  ],
};

function FoodAndBeverages() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [searchPopup, setSearchPopup] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [foodPopup, setFoodPopup] = useState(null); // For add-to-cart popup
  const roomNumber = localStorage.getItem('customerRoomNumber');

  useEffect(() => {
    if (!roomNumber) {
      navigate('/customer/login', { replace: true });
    }
  }, [roomNumber, navigate]);
  const categories = [
    {
      name: 'Breakfast',
      img: 'https://img.icons8.com/color/96/000000/breakfast.png',
      path: '/customer/food/breakfast',
      price: 8.99,
    },
    {
      name: 'Lunch',
      img: 'https://img.icons8.com/color/96/000000/lunch.png',
      path: '/customer/food/lunch',
      price: 12.99,
    },
    {
      name: 'Dinner',
      img: 'https://img.icons8.com/color/96/000000/dinner.png',
      path: '/customer/food/dinner',
      price: 16.99,
    },
    {
      name: 'Desserts',
      img: 'https://img.icons8.com/color/96/000000/cake.png',
      path: '/customer/food/desserts',
      price: 6.99,
    },
    {
      name: 'Snack',
      img: 'https://img.icons8.com/color/96/000000/popcorn.png',
      path: '/customer/food/snack',
      price: 4.99,
    },
    {
      name: 'Beverages',
      img: 'https://img.icons8.com/color/96/000000/cocktail.png',
      path: '/customer/food/beverages',
      price: 3.99,
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

  // Load checked-out orders for this room when status tab opens
  useEffect(() => {
    if (showStatus && roomNumber) {
      axios.get('http://localhost:5000/api/cart/orders/all')
        .then(res => {
          setOrders(res.data.filter(order => order.roomNumber === roomNumber));
        })
        .catch(() => setOrders([]));
    }
  }, [showStatus, roomNumber]);

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

  // Add to cart function for food items
  const addToCart = async (food, category) => {
    const newCart = [...cart, { name: food.name, img: food.img, price: food.price, category }];
    setCart(newCart);
    setFoodPopup(null);
    if (roomNumber) {
      try {
        await axios.post(`http://localhost:5000/api/cart/${roomNumber}`, { items: newCart });
      } catch {}
    }
  };

  return (
  <div style={{ textAlign: 'center', marginTop: '3rem', background: '#111', minHeight: '100vh', color: '#FFD700' }}>
  <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Food & Beverages</h2>
      <button onClick={() => navigate('/customer/interface')} style={{ position: 'fixed', top: '2rem', left: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Back</button>
      <button onClick={() => setShowCart(true)} style={{ position: 'fixed', top: '2rem', right: '2rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
        Cart ({cart.length})
      </button>
      <button onClick={() => setShowStatus(true)} style={{ position: 'fixed', top: '2rem', right: '12rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100, boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
        onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
        onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>
        Status
      </button>
      {/* Search Bar */}
      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            if (e.target.value.trim().length > 0) {
              // Gather only food items from all categories
              const allFoods = Object.entries(foodData).flatMap(([catName, foods]) => foods.map(food => ({ ...food, category: catName })));
              const results = allFoods.filter(item => item.name && item.name.toLowerCase().includes(e.target.value.toLowerCase()));
              setSearchResults(results);
              setSearchPopup(true);
            } else {
              setSearchPopup(false);
              setSearchResults([]);
            }
          }}
          placeholder="Search food..."
          style={{
            padding: '0.7rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', fontSize: '1rem', width: '300px', boxShadow: '0 2px 8px #FFD700', marginBottom: '1rem', outline: 'none', textAlign: 'center'
          }}
        />
      </div>
      {/* Search Popup */}
      {searchPopup && searchResults.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
          <div style={{ background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 24px #FFD700', minWidth: '350px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700' }}>
            <h2>Search Results</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {searchResults.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={item.img} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', marginRight: '1rem', verticalAlign: 'middle', background: '#111', cursor: 'pointer' }}
                    onClick={() => {
                      setFoodPopup({ ...item });
                      setSearchPopup(false);
                    }}
                  />
                  <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                    onClick={() => {
                      setFoodPopup({ ...item });
                      setSearchPopup(false);
                    }}>
                    {item.name}
                  </span>
                  {item.price && <span style={{ marginLeft: '1rem', color: '#FFD700' }}>₱{item.price.toFixed(2)}</span>}
                </li>
              ))}
            </ul>
            <button onClick={() => { setSearchPopup(false); setSearch(''); }} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Close</button>
          </div>
        </div>
      )}

      {/* Add to Cart Popup for food search */}
      {foodPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1400
        }}>
          <div style={{
            background: '#222', padding: '2rem',
            borderRadius: '16px', boxShadow: '0 2px 24px #FFD700',
            minWidth: '300px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700'
          }}>
            <img
              src={foodPopup.img}
              alt={foodPopup.name}
              style={{
                width: '96px', height: '96px',
                borderRadius: '12px', marginBottom: '1rem'
              }}
            />
            <h3>{foodPopup.name}</h3>
            <p>Price: <strong>₱{foodPopup.price ? foodPopup.price.toFixed(2) : '0.00'}</strong></p>
            <p>Add this item to your cart?</p>
            <button
              onClick={() => addToCart(foodPopup, foodPopup.category)}
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
              onClick={() => setFoodPopup(null)}
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
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        {categories.filter(cat => cat.name.toLowerCase().includes(search.toLowerCase())).map((cat) => (
          <div key={cat.name} style={{ cursor: 'pointer', width: '120px', background: '#222', borderRadius: '16px', boxShadow: '0 2px 12px #FFD700', padding: '1rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => navigate(cat.path)}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 4px 24px #FFD700'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px #FFD700'; }}>
            <img src={cat.img} alt={cat.name} style={{ borderRadius: '12px', boxShadow: '0 2px 8px #FFD700', width: '96px', height: '96px', background: '#111' }} />
            <div style={{ marginTop: '0.5rem', color: '#FFD700', fontWeight: 'bold', textShadow: '0 2px 8px #000' }}>{cat.name}</div>
          </div>
        ))}
      </div>
  <p style={{ color: '#FFD700', textShadow: '0 2px 8px #000' }}>Order food and beverages for your room here.</p>
      {showCart && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
    <div style={{ background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 24px #FFD700', minWidth: '350px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700' }}>
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
                  {cart.map((item, idx) => {
                    // Use item.price if present, fallback to category price
                    const cat = categories.find(c => c.name === item.category) || {};
                    const price = typeof item.price === 'number' ? item.price : (cat.price || 0);
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                          <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                          {item.name}
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{item.category}</td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>₱{price.toFixed(2)}</td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                          <button onClick={() => removeFromCart(idx)} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
                            onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                            onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: 'bold', background: '#FFD700', color: '#222' }}>
                    <td colSpan={2} style={{ padding: '0.5rem', textAlign: 'right' }}>Total:</td>
                    <td style={{ padding: '0.5rem' }}>
                      ₱{cart.reduce((sum, item) => {
                        const cat = categories.find(c => c.name === item.category) || {};
                        const price = typeof item.price === 'number' ? item.price : (cat.price || 0);
                        return sum + price;
                      }, 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
            <button onClick={async () => {
              if (roomNumber && cart.length > 0) {
                try {
                  await axios.post(`http://localhost:5000/api/cart/${roomNumber}/checkout`);
                  setCart([]);
                  alert('Checkout successful! Your order has been sent to the restaurant.');
                  setShowCart(false);
                } catch (err) {
                  alert('Checkout failed. Please try again.');
                }
              }
            }} style={{ marginTop: '1rem', marginRight: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>Checkout</button>
            <button onClick={() => setShowCart(false)} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Close</button>
            <button onClick={() => { setShowCart(false); navigate('/customer/food/breakfast'); }} style={{ marginTop: '1rem', marginLeft: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
              onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}>Add More Items</button>
          </div>
        </div>
      )}

      {/* Status Popup */}
      {showStatus && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
    <div style={{ background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 24px #FFD700', minWidth: '350px', textAlign: 'center', color: '#FFD700', border: '2px solid #FFD700' }}>
            <h2>Order Status</h2>
            {orders.length === 0 ? (
              <p>No checked-out orders yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ background: '#FFD700', color: '#222' }}>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Items</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Total Price</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => {
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
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{order.status || 'pending'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <button onClick={() => setShowStatus(false)} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
              onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
              onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodAndBeverages;
