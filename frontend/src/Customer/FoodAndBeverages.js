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
  const [popup, setPopup] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const roomNumber = localStorage.getItem('customerRoomNumber');

  // COMPLETE NOTIFICATION SYSTEM FROM CUSTOMERINTERFACE
  const [showPopup, setShowPopup] = useState(false);
  const [, setNotifications] = useState([]); // all delivered orders for bell popup
  const [counter, setCounter] = useState(0); // new delivered order count
  const [viewedOrderIds, setViewedOrderIds] = useState(() => {
    const stored = localStorage.getItem('viewedOrderIds');
    return stored ? JSON.parse(stored) : [];
  });

  // Track removed notifications
  const [removedOrderIds, setRemovedOrderIds] = useState(() => {
    const stored = localStorage.getItem('removedOrderIds');
    return stored ? JSON.parse(stored) : [];
  });

  // Toast notifications state
  const [toastNotifications, setToastNotifications] = useState([]);

  // Track which notifications have been shown as toasts
  const [shownToastIds, setShownToastIds] = useState(() => {
    const stored = localStorage.getItem('shownToastIds');
    return stored ? JSON.parse(stored) : [];
  });

  // All delivered orders (for bell popup)
  const [allDeliveredOrders, setAllDeliveredOrders] = useState([]);

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

  // Popup logic from FoodMaster with quantity support
  const handleFoodClick = (food) => setPopup({...food, quantity: 1});
  const closePopup = () => setPopup(null);
  
  // Add to cart with quantity support
  const addToCart = async (food, quantity = 1) => {
    if (addingToCart) return;
    setAddingToCart(true);
    
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

  // COMPLETE NOTIFICATION FUNCTIONS FROM CUSTOMERINTERFACE
  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  // Poll backend for orders every 5 seconds
  useEffect(() => {
    let interval;
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
        if (!res.ok) return;
        const allOrders = await res.json();
        const filtered = allOrders.filter(order => String(order.roomNumber) === String(roomNumber));
        
        // Get all delivered orders for this room
        const deliveredOrders = filtered.filter(order => order.status === 'delivered');
        // Filter out removed orders
        const nonRemovedDeliveredOrders = deliveredOrders.filter(order => !removedOrderIds.includes(order._id));
        
        // Sort so newest delivered orders appear first (newest at top)
        const sortedDelivered = nonRemovedDeliveredOrders.slice().sort((a, b) => {
          if (a._id && b._id) return b._id.localeCompare(a._id);
          return 0;
        });
        setAllDeliveredOrders(sortedDelivered);
        
        // Only show new delivered orders not in viewedOrderIds
        const newNotifications = nonRemovedDeliveredOrders.filter(order => !viewedOrderIds.includes(order._id));
        
        // Check for new notifications to show as toasts
        // Only show toast for orders that haven't been shown as toasts before
        const brandNewNotifications = newNotifications.filter(
          order => !shownToastIds.includes(order._id)
        );

        // If there are brand new notifications, add them to toast notifications (newest first) and play sound
        if (brandNewNotifications.length > 0) {
          playNotificationSound();
          const sortedToasts = brandNewNotifications.slice().sort((a, b) => {
            if (a._id && b._id) return b._id.localeCompare(a._id);
            return 0;
          });
          setToastNotifications(prev => [...sortedToasts, ...prev]);
          // Mark these as shown to prevent showing again
          setShownToastIds(prev => {
            const newShownIds = [...prev, ...brandNewNotifications.map(n => n._id)];
            localStorage.setItem('shownToastIds', JSON.stringify(newShownIds));
            return newShownIds;
          });
        }

        setNotifications(newNotifications);
        setCounter(newNotifications.length);
      } catch (e) {
        // ignore errors
      }
    };
    fetchOrders();
    interval = setInterval(fetchOrders, 5000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomNumber, viewedOrderIds, shownToastIds, removedOrderIds]);

  // Handle bell click - toggle popup
  // When opening the bell, clear the counter and any toast popups
  const handleBellClick = () => {
    setShowPopup(prev => {
      const opening = !prev;
      if (opening) {
        // Opening bell: clear counter and toast popups
        setCounter(0);
        setToastNotifications([]);
      } else {
        // Closing bell: mark all current delivered orders as viewed
        const newIds = allDeliveredOrders
          .filter(order => !viewedOrderIds.includes(order._id))
          .map(order => order._id);
        if (newIds.length > 0) {
          setViewedOrderIds(prev => {
            const updated = [...prev, ...newIds];
            localStorage.setItem('viewedOrderIds', JSON.stringify(updated));
            return updated;
          });
        }
      }
      return opening;
    });
  };

  // Handle removing individual notification from bell popup
  const handleRemoveNotification = (orderId) => {
    // Add to removedOrderIds to prevent it from coming back
    setRemovedOrderIds(prev => {
      const updated = [...prev, orderId];
      localStorage.setItem('removedOrderIds', JSON.stringify(updated));
      return updated;
    });
    
    // Also mark as viewed to update counter
    setViewedOrderIds(prev => {
      const updated = [...prev, orderId];
      localStorage.setItem('viewedOrderIds', JSON.stringify(updated));
      return updated;
    });
    
    // Remove the notification from all lists immediately
    setToastNotifications(prev => prev.filter(order => order._id !== orderId));
    setNotifications(prev => prev.filter(order => order._id !== orderId));
    setAllDeliveredOrders(prev => prev.filter(order => order._id !== orderId));
    
    // Update counter
    if (!viewedOrderIds.includes(orderId)) {
      setCounter(prev => Math.max(0, prev - 1));
    }
  };

  // Handle closing toast notification (only marks as viewed, doesn't remove from bell popup)
  const handleCloseToast = (orderId) => {
    setToastNotifications(prev => prev.filter(order => order._id !== orderId));
    // Mark as viewed so it doesn't count in the counter
    setViewedOrderIds(prev => {
      const updated = [...prev, orderId];
      localStorage.setItem('viewedOrderIds', JSON.stringify(updated));
      return updated;
    });
    // Remove from new notifications (so counter decreases)
    setNotifications(prev => prev.filter(order => order._id !== orderId));
    setCounter(prev => Math.max(0, prev - 1));
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If popup is open and click is outside the popup and not on the bell
      if (showPopup) {
        const popup = document.querySelector('.notification-popup');
        const bell = document.querySelector('.notification-bell');
        
        if (popup && bell && 
            !popup.contains(event.target) && 
            !bell.contains(event.target)) {
          setShowPopup(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  // Persist viewedOrderIds to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('viewedOrderIds', JSON.stringify(viewedOrderIds));
  }, [viewedOrderIds]);

  // Persist removedOrderIds to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('removedOrderIds', JSON.stringify(removedOrderIds));
  }, [removedOrderIds]);

  // NOTIFICATION STYLES FROM CUSTOMERINTERFACE
  const bellStyle = {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '12px',
    marginRight: '4px',
    outline: 'none',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  };
  const bellIconStyle = {
    fontSize: 22,
    color: '#F7D700',
    transition: 'color 0.2s',
  };
  const bellCounterStyle = {
    position: 'absolute',
    top: -4,
    right: -4,
    background: '#e74c3c',
    color: '#fff',
    borderRadius: '50%',
    fontSize: 11,
    fontWeight: 700,
    minWidth: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px #e74c3c44',
    zIndex: 2,
  };
  const popupStyle = {
    position: 'absolute',
    top: 40,
    right: 16,
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 16px #0002',
    padding: '0.8rem 1rem',
    minWidth: '280px',
    maxWidth: '320px',
    zIndex: 999,
  };
  const removeBtnStyle = {
    background: '#ff6b6b',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '6px',
    flexShrink: 0,
  };

  // Toast notification styles
  const toastContainerStyle = {
    position: 'fixed',
    top: '60px',
    right: '16px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '320px',
  };

  const toastStyle = {
    background: '#fff',
    border: '2px solid #F7D774',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 16px #0002',
    minWidth: '280px',
    animation: 'slideInRight 0.3s ease-out',
  };

  const toastHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const toastTitleStyle = {
    fontWeight: 600,
    fontSize: '14px',
    color: '#4B2E06',
  };

  const toastCloseStyle = {
    background: '#ff6b6b',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

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
      {/* Toast Notifications Container */}
      {toastNotifications.length > 0 && (
        <div style={toastContainerStyle}>
          {toastNotifications.map((order) => (
            <div key={order._id} style={toastStyle}>
              <div style={toastHeaderStyle}>
                <div style={toastTitleStyle}>
                  Order #{order._id.slice(-6)} Delivered! 🎉
                </div>
                <button 
                  style={toastCloseStyle}
                  onClick={() => handleCloseToast(order._id)}
                  title="Close notification"
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Your order has been delivered to your room.
              </div>
              {order.items && order.items.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px' }}>
                    Items:
                  </div>
                  <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '11px' }}>
                    {order.items.slice(0, 3).map((item, i) => (
                      <li key={item.name + i} style={{ marginBottom: '2px' }}>
                        {item.name} (x{item.quantity || 1})
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li style={{ fontStyle: 'italic' }}>
                        and {order.items.length - 3} more items...
                      </li>
                    )}
                  </ul>
                  <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '4px', marginTop: '6px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Total:</span>
                    <span>
                      ₱{order.items.reduce((total, item) => 
                        total + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', position: 'relative' }}>
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

          {/* Notification Bell */}
          <button 
            className="notification-bell"
            style={{...bellStyle, ...(showPopup ? { background: '#F7D700', borderRadius: '50%', padding: '2px' } : {})}} 
            onClick={handleBellClick} 
            aria-label="Notifications"
          >
            {/* Simple bell SVG */}
            <span style={{...bellIconStyle, ...(showPopup ? { color: '#4B2E06' } : {})}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            {/* Show counter for new delivered orders - only when popup is closed */}
            {!showPopup && counter > 0 && <span style={bellCounterStyle}>{counter}</span>}
          </button>

          {/* Notification Popup */}
          {showPopup && (
            <div className="notification-popup" style={popupStyle}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Delivered Items</span>
                <span style={{ fontSize: 12, color: '#666', fontWeight: 400 }}>
                  {allDeliveredOrders.length} notification{allDeliveredOrders.length !== 1 ? 's' : ''}
                </span>
              </div>
              {allDeliveredOrders.length === 0 ? (
                <div style={{ color: '#888', fontSize: 12 }}>No delivered items.</div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {allDeliveredOrders.map((order, idx) => (
                    <div key={order._id} style={{ 
                      border: '1px solid #f0f0f0', 
                      borderRadius: '6px', 
                      padding: '8px', 
                      marginBottom: '6px',
                      background: viewedOrderIds.includes(order._id) ? '#f9f9f9' : '#fff9e6'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 500, fontSize: '12px' }}>
                          Order #{order._id.slice(-6)}
                          {!viewedOrderIds.includes(order._id) && (
                            <span style={{ marginLeft: '6px', color: '#e74c3c', fontSize: '10px' }}>NEW</span>
                          )}
                        </div>
                        <button 
                          style={removeBtnStyle}
                          onClick={() => handleRemoveNotification(order._id)}
                          title="Remove notification"
                        >
                          ×
                        </button>
                      </div>
                      <ul style={{ paddingLeft: 14, margin: 0, fontSize: '11px' }}>
                        {order.items && order.items.length > 0 ? order.items.map((item, i) => (
                          <li key={item.name + i} style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                              {item.name} (x{item.quantity || 1})
                            </span>
                            <span style={{ fontWeight: 500, marginLeft: '0.5rem' }}>
                              ₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </span>
                          </li>
                        )) : (
                          <li style={{ marginBottom: 4 }}>
                            Item delivered
                          </li>
                        )}
                      </ul>
                      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '4px', marginTop: '4px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Order Total:</span>
                        <span>
                          ₱{order.items.reduce((total, item) => 
                            total + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
              onClick={() => navigate('/customer/interface')}
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
              Food & Beverage
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

        {/* Food Search Results Grid - Fixed 3 columns */}
        {search.trim() && foodLoaded && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            justifyItems: 'center',
            padding: '0 1rem',
            overflow: 'auto',
            flex: 1
          }}>
            {foodItems.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).map((food) => (
              <div key={food.name} style={{
                width: '100%',
                maxWidth: '180px',
                height: '140px',
                background: '#fff',
                borderRadius: '0.8rem',
                boxShadow: '0 4px 16px #e5c16c33, 0 2px 8px #FFD700',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
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
                padding: '0.8rem 0.3rem',
              }}
                onClick={() => handleFoodClick(food)}
                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 32px #e5c16c99'; e.currentTarget.style.border = '2.5px solid #F7D774'; e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'; }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 16px #e5c16c33, 0 2px 8px #FFD700'; e.currentTarget.style.border = '1.5px solid #f7e6b0'; e.currentTarget.style.transform = 'none'; }}
              >
                {food.img && <img src={food.img} alt={food.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.5em', marginBottom: '6px', border: '1.5px solid #F7D774', background: '#fff' }} />}
                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#4B2E06', marginBottom: '2px' }}>{food.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px' }}>{food.category}</div>
                <div style={{ fontSize: '0.8rem', color: '#4B2E06', fontWeight: 500 }}>₱{food.price ? food.price.toFixed(2) : '0.00'}</div>
              </div>
            ))}
            {foodItems.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <div style={{ 
                gridColumn: '1/-1', 
                color: '#888', 
                fontFamily: 'serif', 
                fontSize: '1rem', 
                textAlign: 'center', 
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                No food items found.
              </div>
            )}
          </div>
        )}

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

        {/* Food Category Grid - Fixed 3 columns */}
        {!search.trim() && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            justifyItems: 'center',
            padding: '0 1rem',
            overflow: 'auto',
            flex: 1
          }}>
            {categories.map((cat) => (
              <div key={cat.name} style={{
                width: '100%',
                maxWidth: '180px',
                height: '140px',
                background: '#fff',
                borderRadius: '0.8rem',
                boxShadow: '0 4px 16px #e5c16c33, 0 2px 8px #FFD700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                color: '#222',
                fontFamily: 'Cinzel, serif',
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

      {/* Add CSS for slide-in animation */}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export default FoodAndBeverages;