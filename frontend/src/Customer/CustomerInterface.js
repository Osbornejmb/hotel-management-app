import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Custom hook to manage notification sounds
const useNotificationSound = () => {
  const [playedNotifications, setPlayedNotifications] = useState(() => {
    const stored = localStorage.getItem('playedNotifications');
    return stored ? JSON.parse(stored) : {};
  });

  const playNotificationSound = useCallback((orderId, status) => {
    const notificationKey = `${orderId}-${status}`;
    
    // If we've already played sound for this order-status combination, don't play again
    if (playedNotifications[notificationKey]) {
      return false;
    }

    // Play the sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
    
    // Mark this notification as played
    setPlayedNotifications(prev => {
      const updated = { ...prev, [notificationKey]: true };
      localStorage.setItem('playedNotifications', JSON.stringify(updated));
      return updated;
    });

    return true;
  }, [playedNotifications]);

  const clearPlayedNotifications = useCallback(() => {
    setPlayedNotifications({});
    localStorage.removeItem('playedNotifications');
  }, []);

  return { playNotificationSound, clearPlayedNotifications };
};

export default function CustomerInterface() {
  // Filter orders that should be shown in the bell popup
  const navigate = useNavigate();
  const [hovered, setHovered] = useState([false, false, false]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const [showPopup, setShowPopup] = useState(() => {
    const stored = localStorage.getItem('customerShowPopup');
    return stored ? JSON.parse(stored) : false;
  });
  const [counter, setCounter] = useState(0);
  
  // Load toast notifications from localStorage to persist across navigation
  const [toastNotifications, setToastNotifications] = useState(() => {
    const stored = localStorage.getItem('customerToastNotifications');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [allOrders, setAllOrders] = useState([]);

  // Track which order notifications have been removed by the user
  const [removedOrderIds, setRemovedOrderIds] = useState(() => {
    const stored = localStorage.getItem('removedOrderIds');
    return stored ? JSON.parse(stored) : [];
  });

  // Track seen order-status combinations
  const [seenOrderStatuses, setSeenOrderStatuses] = useState(() => {
    const stored = localStorage.getItem('seenOrderStatuses');
    return stored ? JSON.parse(stored) : {};
  });

  // Use the custom notification sound hook
  const { playNotificationSound } = useNotificationSound();

  // Cart and Status states
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');

  // Get current room number from localStorage
  const roomNumber = localStorage.getItem('customerRoomNumber');

  // Persist toast notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customerToastNotifications', JSON.stringify(toastNotifications));
  }, [toastNotifications]);

  // Load cart from backend when showCart opens
  useEffect(() => {
    if (showCart && roomNumber) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`)
        .then(res => {
          setCart(res.data?.items || []);
        })
        .catch(() => setCart([]));
    }
  }, [showCart, roomNumber]);

  // POLLING: Keep cart state up-to-date
  useEffect(() => {
    let interval;
    const fetchCartForCounter = async () => {
      if (!roomNumber) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch (e) {}
    };

    fetchCartForCounter();
    interval = setInterval(fetchCartForCounter, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomNumber]);

  // Load checked-out orders for this room when status tab opens
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

  // Cart operations
  const updateQuantity = async (idx, newQuantity) => {
    if (newQuantity < 1) return;
    
    if (roomNumber) {
      try {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/${idx}/quantity`,
          { quantity: newQuantity }
        );
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch {
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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      setOrders(res.data.filter(order => order.roomNumber === roomNumber));
    } catch {
      alert('Failed to cancel order.');
    }
  };

  // Get status emoji and message
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { emoji: '⏳', message: 'Order Received' };
      case 'acknowledged':
        return { emoji: '✅', message: 'Order Acknowledged' };
      case 'preparing':
        return { emoji: '👨‍🍳', message: 'Preparing Your Order' };
      case 'on the way':
        return { emoji: '🚗', message: 'On The Way' };
      case 'delivered':
        return { emoji: '🎉', message: 'Delivered!' };
      case 'cancelled':
        return { emoji: '❌', message: 'Order Cancelled' };
      default:
        return { emoji: '📦', message: 'Order Updated' };
    }
  };

  // Check if status should trigger popup notification
  const shouldShowPopupForStatus = (status) => {
    return ['acknowledged', 'preparing', 'on the way', 'delivered', 'cancelled'].includes(status);
  };

  // Track current order status to detect changes
  const [orderStatusMap, setOrderStatusMap] = useState({});

  // Track removed orders with their status at time of removal
  const [removedOrdersMap, setRemovedOrdersMap] = useState(() => {
    const stored = localStorage.getItem('removedOrdersMap');
    return stored ? JSON.parse(stored) : {};
  });

  // Check if an order should be shown based on removal rules - using useCallback to fix dependency warning
  const shouldShowOrder = useCallback((order) => {
    const removedStatus = removedOrdersMap[order._id];
    
    // If order was never removed, show it
    if (!removedStatus) return true;
    
    // If order was removed when delivered, never show it again
    if (removedStatus === 'delivered') return false;
    
    // If order was removed but status has changed since removal, show it again
    if (removedStatus !== order.status) return true;
    
    // If order was removed and status hasn't changed, don't show it
    return false;
  }, [removedOrdersMap]);

  // Filter orders that should be shown in the bell popup - MOVED UP
  const visibleOrders = allOrders.filter(shouldShowOrder);

  // Poll backend for orders every 5 seconds - FIXED SOUND ISSUE
  useEffect(() => {
    let interval;
    
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
        if (!res.ok) return;
        const allOrders = await res.json();
        const filtered = allOrders.filter(order => String(order.roomNumber) === String(roomNumber));
        
        // Get all orders for this room
        const customerOrders = filtered.filter(order => 
          ['pending', 'acknowledged', 'preparing', 'on the way', 'delivered', 'cancelled'].includes(order.status)
        );
        
        // Sort so newest orders appear first
        const sortedOrders = customerOrders.slice().sort((a, b) => {
          if (a._id && b._id) return b._id.localeCompare(a._id);
          return 0;
        });
        
        setAllOrders(sortedOrders);

        // Detect status changes and update notifications
        const newOrderStatusMap = {};
        let hasNewNotification = false;

        sortedOrders.forEach(order => {
          newOrderStatusMap[order._id] = order.status;
          
          // Skip if order shouldn't be shown based on removal rules
          if (!shouldShowOrder(order)) return;
          
          // Check if status changed and should show popup
          const previousStatus = orderStatusMap[order._id];
          const currentStatus = order.status;
          
          // Only show toast if this order-status hasn't been seen before
          const statusKey = `${order._id}-${order.status}`;
          const isAlreadySeen = seenOrderStatuses[statusKey];
          
          if (previousStatus !== currentStatus && 
            shouldShowPopupForStatus(currentStatus) && 
            !isAlreadySeen) {
            hasNewNotification = true;
            
            // Check if this order is already in toast notifications
            setToastNotifications(prev => {
              const existingIndex = prev.findIndex(notif => notif._id === order._id);
              if (existingIndex >= 0) {
                // Update existing notification
                const updated = [...prev];
                updated[existingIndex] = order;
                return updated;
              } else {
                // Add new notification
                return [order, ...prev];
              }
            });
          }
        });

        // Update order status map
        setOrderStatusMap(newOrderStatusMap);

        // Update counter based on current state - only count unseen order-status combinations
        const activeNotificationOrders = sortedOrders.filter(order => 
          shouldShowOrder(order) && 
          shouldShowPopupForStatus(order.status) &&
          !seenOrderStatuses[`${order._id}-${order.status}`]
        );
        
        setCounter(activeNotificationOrders.length);

        // If there are new notifications, play sound for each new one
        if (hasNewNotification) {
          sortedOrders.forEach(order => {
            if (shouldShowOrder(order) && 
                shouldShowPopupForStatus(order.status) && 
                !seenOrderStatuses[`${order._id}-${order.status}`] &&
                orderStatusMap[order._id] !== order.status) {
              playNotificationSound(order._id, order.status);
            }
          });
        }
      } catch (e) {
        // ignore errors
      }
    };
    
    fetchOrders();
    interval = setInterval(fetchOrders, 5000);
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNumber, removedOrdersMap, shouldShowOrder, seenOrderStatuses, playNotificationSound]); // Added playNotificationSound

  // Handle bell click - toggle popup and persist state
  const handleBellClick = () => {
    setShowPopup(prev => {
      const opening = !prev;
      localStorage.setItem('customerShowPopup', JSON.stringify(opening));
      if (opening) {
        // Opening bell: clear toast popups and mark all as seen
        const newSeenStatuses = { ...seenOrderStatuses };
        toastNotifications.forEach(order => {
          const key = `${order._id}-${order.status}`;
          newSeenStatuses[key] = true;
        });
        setSeenOrderStatuses(newSeenStatuses);
        localStorage.setItem('seenOrderStatuses', JSON.stringify(newSeenStatuses));
        
        // Clear toast notifications
        setToastNotifications([]);
        localStorage.setItem('customerToastNotifications', JSON.stringify([]));
        
        // Update counter
        setCounter(0);
      } else {
        // Closing bell: mark all current order-status combinations as seen
        const newSeenStatuses = { ...seenOrderStatuses };
        visibleOrders.forEach(order => {
          const key = `${order._id}-${order.status}`;
          newSeenStatuses[key] = true;
        });
        setSeenOrderStatuses(newSeenStatuses);
        localStorage.setItem('seenOrderStatuses', JSON.stringify(newSeenStatuses));
        setCounter(0);
      }
      return opening;
    });
  };

  // Handle removing individual notification from bell popup
  const handleRemoveNotification = (orderId) => {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;
    
    // Store in both removal tracking systems for redundancy
    setRemovedOrderIds(prev => {
      const updated = [...prev, orderId];
      localStorage.setItem('removedOrderIds', JSON.stringify(updated));
      return updated;
    });
    
    // Store the status at which the order was removed
    setRemovedOrdersMap(prev => {
      const updated = { ...prev, [orderId]: order.status };
      localStorage.setItem('removedOrdersMap', JSON.stringify(updated));
      return updated;
    });
    
    // Mark this specific order-status as seen
    setSeenOrderStatuses(prev => {
      const updated = { ...prev, [`${orderId}-${order.status}`]: true };
      localStorage.setItem('seenOrderStatuses', JSON.stringify(updated));
      return updated;
    });
    
    // Remove from toast notifications
    setToastNotifications(prev => {
      const updated = prev.filter(order => order._id !== orderId);
      localStorage.setItem('customerToastNotifications', JSON.stringify(updated));
      return updated;
    });
    
    // Update counter
    const activeNotificationOrders = allOrders.filter(order => 
      shouldShowOrder(order) && 
      shouldShowPopupForStatus(order.status) &&
      !seenOrderStatuses[`${order._id}-${order.status}`]
    );
    setCounter(activeNotificationOrders.length);
  };

  // Handle closing toast notification
  const handleCloseToast = (orderId) => {
    const order = allOrders.find(o => o._id === orderId);
    if (order) {
      // Mark this specific order-status as seen
      setSeenOrderStatuses(prev => {
        const updated = { ...prev, [`${orderId}-${order.status}`]: true };
        localStorage.setItem('seenOrderStatuses', JSON.stringify(updated));
        return updated;
      });
    }
    
    // Remove from toast notifications but don't mark as removed
    // So it can reappear if status changes again
    setToastNotifications(prev => {
      const updated = prev.filter(order => order._id !== orderId);
      localStorage.setItem('customerToastNotifications', JSON.stringify(updated));
      return updated;
    });
    
    // Decrement counter
    setCounter(prev => Math.max(0, prev - 1));
  };

  // Close popup when clicking outside, and persist state
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPopup) {
        const popup = document.querySelector('.notification-popup');
        const bell = document.querySelector('.notification-bell');
        if (popup && bell && 
          !popup.contains(event.target) && 
          !bell.contains(event.target)) {
          // Mark all visible notifications as seen
          const newSeenStatuses = { ...seenOrderStatuses };
          visibleOrders.forEach(order => {
            const key = `${order._id}-${order.status}`;
            newSeenStatuses[key] = true;
          });
          setSeenOrderStatuses(newSeenStatuses);
          localStorage.setItem('seenOrderStatuses', JSON.stringify(newSeenStatuses));
          setCounter(0);
          setToastNotifications([]);
          localStorage.setItem('customerToastNotifications', JSON.stringify([]));
          setShowPopup(false);
          localStorage.setItem('customerShowPopup', JSON.stringify(false));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup, seenOrderStatuses, visibleOrders]);

  // Persist removedOrdersMap to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('removedOrdersMap', JSON.stringify(removedOrdersMap));
  }, [removedOrdersMap]);

  // Persist seenOrderStatuses to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('seenOrderStatuses', JSON.stringify(seenOrderStatuses));
  }, [seenOrderStatuses]);

  // Header style - Compact version
  const headerStyle = {
    width: '100%',
    background: '#4B2E06',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.3rem 1rem',
    boxSizing: 'border-box',
    height: '45px',
    boxShadow: '0 2px 8px #0001',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  // Button styles for Cart and Status
  const headerButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#FFD700',
    fontSize: '0.9rem',
    fontFamily: 'serif',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '0.3em 0.8em',
    borderRadius: '0.35em',
    transition: 'background 0.2s, color 0.2s',
    outline: 'none',
  };

  const logoutBtnStyle = {
    background: '#F7D774',
    color: '#4B2E06',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'inherit',
    fontWeight: 500,
    padding: '0.3rem 0.8rem',
    boxShadow: '0 2px 8px #e5c16c44',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
    outline: 'none',
    marginLeft: '12px',
  };
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

  // Status badge styles
  const statusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '2px 6px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'capitalize',
      marginLeft: '6px',
    };

    switch (status) {
      case 'pending':
        return { ...baseStyle, background: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' };
      case 'acknowledged':
        return { ...baseStyle, background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' };
      case 'preparing':
        return { ...baseStyle, background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
      case 'on the way':
        return { ...baseStyle, background: '#cce7ff', color: '#004085', border: '1px solid #b3d7ff' };
      case 'delivered':
        return { ...baseStyle, background: '#d1f7c4', color: '#0f5132', border: '1px solid #c3e6cb' };
      case 'cancelled':
        return { ...baseStyle, background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' };
      default:
        return { ...baseStyle, background: '#e2e3e5', color: '#383d41', border: '1px solid #d6d8db' };
    }
  };

  const handleLogout = async () => {
    const password = window.prompt('Enter hotel admin password to log out:');
    if (!password) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/verify-hoteladmin-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        // Clear all local storage on logout
        localStorage.removeItem('removedOrderIds');
        localStorage.removeItem('removedOrdersMap');
        localStorage.removeItem('seenOrderStatuses');
        localStorage.removeItem('customerToastNotifications');
        localStorage.removeItem('customerShowPopup');
        localStorage.removeItem('playedNotifications'); // Clear played notifications on logout
        localStorage.clear();
        navigate('/customer/login', { replace: true });
      } else {
        alert('Invalid password. Logout cancelled.');
      }
    } catch (err) {
      alert('Error verifying password. Please try again.');
    }
  };
  const logoStyle = {
    height: '28px',
    width: '28px',
    marginRight: '8px',
    objectFit: 'contain',
    background: 'transparent',
    borderRadius: 0,
    boxShadow: 'none',
  };
  const appNameStyle = {
    fontSize: '22px',
    fontWeight: 400,
    color: '#fff',
    fontFamily: 'Cinzel, serif',
    letterSpacing: 1,
    textShadow: '0 1px 4px #0006',
  };

  // Add debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Removed orders tracking: ${removedOrderIds.length} IDs, ${Object.keys(removedOrdersMap).length} in map`);
      console.log(`Seen order-status combinations: ${Object.keys(seenOrderStatuses).length}`);
      console.log(`Toast notifications: ${toastNotifications.length}`);
    }
  }, [removedOrderIds, removedOrdersMap, seenOrderStatuses, toastNotifications]);

  return (
    <div style={{ 
      background: '#fff', 
      height: '100vh', 
      padding: 0, 
      margin: 0, 
      fontFamily: 'Cinzel, serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Toast Notifications Container */}
      {toastNotifications.length > 0 && (
        <div style={toastContainerStyle}>
          {[...toastNotifications].reverse().map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order._id} style={toastStyle}>
                <div style={toastHeaderStyle}>
                  <div style={toastTitleStyle}>
                    {statusInfo.emoji} {statusInfo.message}
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
                  Order #{order._id.slice(-6)} • <span style={statusBadgeStyle(order.status)}>
                    {order.status}
                  </span>
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
            );
          })}
        </div>
      )}

      {/* Header with logo and app name */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src='/lumine_icon.png' alt="Lumine Logo" style={logoStyle} />
          <span style={appNameStyle}>Lumine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {/* Cart and Status buttons */}
          <button 
            onClick={() => setShowCart(true)} 
            style={headerButtonStyle}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}
          >
            Cart ({cart.reduce((total, item) => total + (item.quantity || 1), 0)})
          </button>
          <button 
            onClick={() => setShowStatus(true)} 
            style={headerButtonStyle}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}
          >
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
            {/* Show counter for new orders - only when popup is closed */}
            {!showPopup && counter > 0 && <span style={bellCounterStyle}>{counter}</span>}
          </button>
          <button style={logoutBtnStyle} onClick={handleLogout} onMouseOver={e => { e.target.style.background = '#ffe9a7'; }} onMouseOut={e => { e.target.style.background = '#F7D774'; }}>
            Log Out
          </button>
          {/* Notification Popup */}
          {showPopup && (
            <div className="notification-popup" style={popupStyle}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Order Updates</span>
                <span style={{ fontSize: 12, color: '#666', fontWeight: 400 }}>
                  {visibleOrders.length} notification{visibleOrders.length !== 1 ? 's' : ''}
                </span>
              </div>
              {visibleOrders.length === 0 ? (
                <div style={{ color: '#888', fontSize: 12 }}>No order updates.</div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {visibleOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <div key={order._id} style={{ 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '6px', 
                        padding: '8px', 
                        marginBottom: '6px',
                        background: '#fff9e6'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ fontWeight: 500, fontSize: '12px' }}>
                            Order #{order._id.slice(-6)}
                          </div>
                          <button 
                            style={removeBtnStyle}
                            onClick={() => handleRemoveNotification(order._id)}
                            title="Remove notification"
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                          <span>{statusInfo.emoji} {statusInfo.message}</span>
                          <span style={statusBadgeStyle(order.status)}>{order.status}</span>
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
                              No items listed
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
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
	  
			{/* NEW: Cart Popup with Quantity Support */}
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

			{/* NEW: Status Popup with tabs for Pending and Delivered */}
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

			{/* Main Content Area */}
			<div style={{
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '0.5rem',
				boxSizing: 'border-box',
				overflow: 'hidden',
				minHeight: 0
			}}>
				<div style={{ 
					display: 'flex', 
					gap: '16px', 
					justifyContent: 'center', 
					alignItems: 'center',
					flexWrap: 'wrap'
				}}>
					{/* Facilities Card */}
					<div
						style={{
							background: '#ffdc85',
							borderRadius: '0.8rem',
							boxShadow: hovered[0] ? '0 8px 16px #e5c16c99' : '0 4px 8px #e5c16c55',
							width: 240,
							height: 240,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							border: 'none',
							position: 'relative',
							transform: hovered[0] ? 'translateY(-4px) scale(1.02)' : 'none',
							transition: 'box-shadow 0.2s, transform 0.2s',
							flexShrink: 0
						}}
						onClick={() => handleNavigate('/customer/facilities')}
						onMouseEnter={() => setHovered([true, false, false])}
						onMouseLeave={() => setHovered([false, false, false])}
					>
						<div style={{
							background: '#fff',
							borderRadius: '1.2rem',
							boxShadow: '0 2px 6px #bbb',
							width: 180,
							height: 180,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
						}}>
							<img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Facilities" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: '0.3rem', marginBottom: 12 }} />
							<div style={{ fontSize: 20, color: '#222', fontWeight: 400, fontFamily: 'Cinzel, serif', marginTop: 8 }}>Facilities</div>
						</div>
					</div>

					{/* Food & Beverage Card */}
					<div
						style={{
							background: '#ffdc85',
							borderRadius: '0.8rem',
							boxShadow: hovered[1] ? '0 8px 16px #e5c16c99' : '0 4px 8px #e5c16c55',
							width: 240,
							height: 240,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							border: 'none',
							position: 'relative',
							transform: hovered[1] ? 'translateY(-4px) scale(1.02)' : 'none',
							transition: 'box-shadow 0.2s, transform 0.2s',
							flexShrink: 0
						}}
						onClick={() => handleNavigate('/customer/food')}
						onMouseEnter={() => setHovered([false, true, false])}
						onMouseLeave={() => setHovered([false, false, false])}
					>
						<div style={{
							background: '#fff',
							borderRadius: '1.2rem',
							boxShadow: '0 2px 6px #bbb',
							width: 180,
							height: 180,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
						}}>
							<img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" alt="Food and Beverages" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: '0.3rem', marginBottom: 12 }} />
							<div style={{ fontSize: 18, color: '#222', fontWeight: 400, fontFamily: 'Cinzel, serif', marginTop: 8, textAlign: 'center' }}>Food & Beverage</div>
						</div>
					</div>

					{/* Contact Front Desk Card */}
					<div
						style={{
							background: '#ffdc85',
							borderRadius: '0.8rem',
							boxShadow: hovered[2] ? '0 8px 16px #cfc6b099' : '0 4px 8px #cfc6b055',
							width: 240,
							height: 240,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							border: 'none',
							position: 'relative',
							transform: hovered[2] ? 'translateY(-4px) scale(1.02)' : 'none',
							transition: 'box-shadow 0.2s, transform 0.2s',
							flexShrink: 0
						}}
						onClick={() => handleNavigate('/customer/contact')}
						onMouseEnter={() => setHovered([false, false, true])}
						onMouseLeave={() => setHovered([false, false, false])}
					>
						<div style={{
							background: '#fff',
							borderRadius: '1.2rem',
							boxShadow: '0 2px 6px #bbb',
							width: 180,
							height: 180,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
						}}>
							<img src="https://img.icons8.com/ios-filled/100/000000/contacts.png" alt="Contact Front Desk" style={{ width: 70, height: 70, objectFit: 'contain', marginBottom: 12 }} />
							<div style={{ fontSize: 18, color: '#222', fontWeight: 400, fontFamily: 'Cinzel, serif', marginTop: 8, textAlign: 'center' }}>Contact Frontdesk</div>
						</div>
					</div>
				</div>
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