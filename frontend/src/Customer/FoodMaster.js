import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const foodData = {
  breakfast: [
    { name: 'Pancakes', img: 'https://img.icons8.com/color/96/000000/pancake.png' },
    { name: 'Omelette', img: 'https://img.icons8.com/color/96/000000/omelette.png' },
    { name: 'Toast', img: 'https://img.icons8.com/color/96/000000/toast.png' },
  ],
  lunch: [
    { name: 'Burger', img: 'https://img.icons8.com/color/96/000000/hamburger.png' },
    { name: 'Salad', img: 'https://img.icons8.com/color/96/000000/salad.png' },
    { name: 'Sandwich', img: 'https://img.icons8.com/color/96/000000/sandwich.png' },
  ],
  dinner: [
    { name: 'Steak', img: 'https://img.icons8.com/color/96/000000/steak.png' },
    { name: 'Spaghetti', img: 'https://img.icons8.com/color/96/000000/spaghetti.png' },
    { name: 'Roast Chicken', img: 'https://img.icons8.com/color/96/000000/roast-chicken.png' },
  ],
  desserts: [
    { name: 'Ice Cream', img: 'https://img.icons8.com/color/96/000000/ice-cream.png' },
    { name: 'Cake', img: 'https://img.icons8.com/color/96/000000/cake.png' },
    { name: 'Donut', img: 'https://img.icons8.com/color/96/000000/doughnut.png' },
  ],
  snack: [
    { name: 'Popcorn', img: 'https://img.icons8.com/color/96/000000/popcorn.png' },
    { name: 'Chips', img: 'https://img.icons8.com/color/96/000000/potato-chips.png' },
    { name: 'Nuts', img: 'https://img.icons8.com/color/96/000000/nuts.png' },
  ],
  beverages: [
    { name: 'Coffee', img: 'https://img.icons8.com/color/96/000000/coffee.png' },
    { name: 'Juice', img: 'https://img.icons8.com/color/96/000000/orange-juice.png' },
    { name: 'Cocktail', img: 'https://img.icons8.com/color/96/000000/cocktail.png' },
  ],
};

function FoodMaster() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [popup, setPopup] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const foods = foodData[category] || [];
  const roomNumber = localStorage.getItem('customerRoomNumber');

  // Load cart from backend on mount
  useEffect(() => {
    if (roomNumber) {
      axios.get(`http://localhost:5000/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [roomNumber]);

  // Reload cart from backend when cart popup opens
  useEffect(() => {
    if (showCart && roomNumber) {
      axios.get(`http://localhost:5000/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [showCart, roomNumber]);

  // Remove useEffect that POSTs cart on every cart change

  const handleFoodClick = (food) => {
    setPopup(food);
  };

  const closePopup = () => {
    setPopup(null);
  };

  const addToCart = async (food) => {
    const newCart = [...cart, { name: food.name, img: food.img }];
    setCart(newCart);
    setPopup(null);
    if (roomNumber) {
      try {
        await axios.post(`http://localhost:5000/api/cart/${roomNumber}`, { items: newCart });
      } catch {}
    }
  };

  const removeFromCart = async (idx) => {
    if (roomNumber) {
      try {
        await axios.delete(`http://localhost:5000/api/cart/${roomNumber}/${idx}`);
        // Reload cart from backend after deletion
        const res = await axios.get(`http://localhost:5000/api/cart/${roomNumber}`);
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
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Food'}</h2>

      {/* Cart Button */}
      <button
        onClick={() => setShowCart(true)}
        style={{
          position: 'fixed', top: '2rem', right: '2rem',
          padding: '0.5rem 1.5rem', borderRadius: '8px',
          border: 'none', background: '#ff9800',
          color: '#fff', fontWeight: 'bold', cursor: 'pointer',
          zIndex: 1100
        }}
      >
        Cart ({cart.length})
      </button>

      {/* Back Button */}
      <button
        onClick={() => navigate('/customer/food')}
        style={{
          position: 'fixed', top: '2rem', left: '2rem',
          padding: '0.5rem 1.5rem', borderRadius: '8px',
          border: 'none', background: '#2196f3',
          color: '#fff', fontWeight: 'bold', cursor: 'pointer',
          zIndex: 1100
        }}
      >
        Back
      </button>

      {/* Food Items */}
      <div style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'center', gap: '2rem', margin: '2rem 0'
      }}>
        {foods.map((food) => (
          <div
            key={food.name}
            style={{ cursor: 'pointer', width: '120px' }}
            onClick={() => handleFoodClick(food)}
          >
            <img
              src={food.img}
              alt={food.name}
              style={{
                borderRadius: '12px', boxShadow: '0 2px 8px #ccc',
                width: '96px', height: '96px'
              }}
            />
            <div style={{ marginTop: '0.5rem' }}>{food.name}</div>
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
            background: '#fff', padding: '2rem',
            borderRadius: '16px', boxShadow: '0 2px 16px #aaa',
            minWidth: '300px', textAlign: 'center'
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
            <p>Add this item to your cart?</p>
            <button
              onClick={() => addToCart(popup)}
              style={{
                margin: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: 'none',
                background: '#4caf50', color: '#fff',
                fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Add to Cart
            </button>
            <button
              onClick={closePopup}
              style={{
                margin: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: 'none',
                background: '#eee', cursor: 'pointer'
              }}
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
            background: '#fff', padding: '2rem',
            borderRadius: '16px', boxShadow: '0 2px 16px #aaa',
            minWidth: '350px', textAlign: 'center'
          }}>
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {cart.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      margin: '1rem 0', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={item.img}
                        alt={item.name}
                        style={{
                          width: '48px', height: '48px',
                          borderRadius: '8px', marginRight: '1rem'
                        }}
                      />
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeFromCart(idx)}
                      style={{
                        padding: '0.3rem 0.8rem', borderRadius: '6px',
                        border: 'none', background: '#f44336',
                        color: '#fff', cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowCart(false)}
              style={{
                marginTop: '1rem', padding: '0.5rem 1.5rem',
                borderRadius: '8px', border: 'none',
                background: '#eee', cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodMaster;
