import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Custom hook to manage notification sounds
const useNotificationSound = () => {
  const playedNotificationsRef = React.useRef({});
  useState(() => {
    const stored = localStorage.getItem('playedNotifications');
    const initial = stored ? JSON.parse(stored) : {};
    playedNotificationsRef.current = initial;
  });

  const playNotificationSound = useCallback((orderId, status) => {
    const notificationKey = `${orderId}-${status}`;
    // If already played, do not play again
    if (playedNotificationsRef.current[notificationKey]) {
      return false;
    }
    // Play the sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
    // Mark as played in ref and state
    playedNotificationsRef.current[notificationKey] = true;
    localStorage.setItem('playedNotifications', JSON.stringify(playedNotificationsRef.current));
    return true;
  }, []);

  const clearPlayedNotifications = useCallback(() => {
  playedNotificationsRef.current = {};
  localStorage.removeItem('playedNotifications');
  }, []);

  return { playNotificationSound, clearPlayedNotifications };
};

export default function CustomerInterface() {
  const navigate = useNavigate();

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
  const [cancelledOrders, setCancelledOrders] = useState([]);

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
  const cartCloseBtnRef = useRef(null);
  const statusCloseBtnRef = useRef(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');

  // Get current room number from localStorage
  const roomNumber = localStorage.getItem('customerRoomNumber');

  // Track removed orders with their status at time of removal - FIXED: Include cancelled orders
  const [removedOrdersMap, setRemovedOrdersMap] = useState(() => {
    const stored = localStorage.getItem('removedOrdersMap');
    return stored ? JSON.parse(stored) : {};
  });

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
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } catch (e) {}
    };

    fetchCartForCounter();
  interval = setInterval(fetchCartForCounter, 3000);

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
      interval = setInterval(fetchOrders, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showStatus, roomNumber]);

  // Fetch cancelled orders - FIXED with useCallback
  const fetchCancelledOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/orders/cancelled`);
      const customerCancelledOrders = res.data.filter(order => 
        String(order.roomNumber) === String(roomNumber)
      );
      setCancelledOrders(customerCancelledOrders);
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
      setCancelledOrders([]);
    }
  }, [roomNumber]);

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

  // Cancel order using admin logic, with confirmation and no reason
  const cancelOrder = async (order) => {
    if (!['pending', 'acknowledged'].includes(order.status)) return;
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          reason: "Customer cancelled",
          originalOrder: order
        })
      });
      if (res.ok) {
        // Refresh orders
        const updated = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
        const data = await updated.json();
        setOrders(data.filter(o => o.roomNumber === roomNumber));
      } else {
        alert('Failed to cancel order.');
      }
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

  // FIXED: Check if an order should be shown based on removal rules
  const shouldShowOrder = useCallback((order) => {
    if (!order) return false;
    
    // For cancelled orders from the cancelledOrders array, use originalOrderId
    const orderId = order._id || order.originalOrderId;
    if (!orderId) return false;
    
    const removedStatus = removedOrdersMap[orderId];
    
    // If order was never removed, show it
    if (!removedStatus) return true;
    
    // If order was removed when delivered, never show it again
    if (removedStatus === 'delivered') return false;
    
    // If order was removed when cancelled, never show it again
    if (removedStatus === 'cancelled') return false;
    
    // If order was removed but status has changed since removal, show it again
    const currentStatus = order.status || 'cancelled';
    if (removedStatus !== currentStatus) return true;
    
    // If order was removed and status hasn't changed, don't show it
    return false;
  }, [removedOrdersMap]);

  // FIXED: Filter orders that should be shown in the bell popup - include cancelled orders
  const visibleOrders = React.useMemo(() => {
    // Combine regular orders and cancelled orders for display
    const regularOrders = allOrders.filter(shouldShowOrder);
    
    // Convert cancelled orders to the same format as regular orders for display
    const cancelledOrdersForDisplay = cancelledOrders
      .filter(cancelledOrder => {
        const orderId = cancelledOrder.originalOrderId;
        const removedStatus = removedOrdersMap[orderId];
        
        // Show cancelled order if it hasn't been removed or if it was removed but status changed
        if (!removedStatus) return true;
        if (removedStatus === 'cancelled') return false;
        return removedStatus !== 'cancelled';
      })
      .map(cancelledOrder => ({
        ...cancelledOrder,
        _id: cancelledOrder.originalOrderId,
        status: 'cancelled',
        items: cancelledOrder.items || []
      }));
    
    return [...regularOrders, ...cancelledOrdersForDisplay];
  }, [allOrders, cancelledOrders, shouldShowOrder, removedOrdersMap]);

  // Function to handle order status transitions
  const handleOrderStatusTransition = useCallback((order, previousStatus, currentStatus) => {
    const orderId = order._id || order.originalOrderId;
    const statusKey = `${orderId}-${currentStatus}`;
    const isAlreadySeen = seenOrderStatuses[statusKey];
    
    // If this status has already been seen, don't show notification
    if (isAlreadySeen) return false;
    
    // Only show notification for statuses that should trigger popups
    if (!shouldShowPopupForStatus(currentStatus)) return false;
    
    // Check if order should be shown based on removal rules
    if (!shouldShowOrder(order)) return false;
    
    return true;
  }, [seenOrderStatuses, shouldShowOrder]);

  // Poll backend for orders every 5 seconds - FIXED VERSION
  useEffect(() => {
    let interval;
    
    const fetchOrders = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
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
          const previousStatus = orderStatusMap[order._id];
          const currentStatus = order.status;
          newOrderStatusMap[order._id] = currentStatus;
          
          // Skip if no status change
          if (previousStatus === currentStatus) return;
          
          // Check if we should show notification for this status transition
          if (handleOrderStatusTransition(order, previousStatus, currentStatus)) {
            hasNewNotification = true;
            
            // Remove any existing toast for this order (to replace with new status)
            setToastNotifications(prev => {
              const previousNotifications = Array.isArray(prev) ? prev : [];
              const filtered = previousNotifications.filter(notif => notif._id !== order._id);
              // Add new notification with current status
              return [order, ...filtered];
            });
          }
        });

        // Update order status map
        setOrderStatusMap(newOrderStatusMap);

        // Update counter based on current state - FIXED: Include cancelled orders in counter
        const activeNotificationOrders = sortedOrders.filter(order => 
          shouldShowOrder(order) && 
          shouldShowPopupForStatus(order.status) &&
          !seenOrderStatuses[`${order._id}-${order.status}`]
        );
        
        const activeCancelledNotifications = cancelledOrders.filter(cancelledOrder => {
          const orderId = cancelledOrder.originalOrderId;
          return shouldShowOrder({ _id: orderId, status: 'cancelled' }) &&
                 shouldShowPopupForStatus('cancelled') &&
                 !seenOrderStatuses[`${orderId}-cancelled`];
        });
        
        setCounter(activeNotificationOrders.length + activeCancelledNotifications.length);

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
  interval = setInterval(fetchOrders, 3000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomNumber, removedOrdersMap, shouldShowOrder, seenOrderStatuses, playNotificationSound, orderStatusMap, handleOrderStatusTransition, cancelledOrders]);

  // Poll for cancelled orders - FIXED
  useEffect(() => {
    let interval;
    
    const fetchData = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      await fetchCancelledOrders();
    };
    
    fetchData();
  interval = setInterval(fetchData, 3000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchCancelledOrders]);

  // FIXED: Handle cancelled orders and add to notifications
  useEffect(() => {
    cancelledOrders.forEach(cancelledOrder => {
      const orderId = cancelledOrder.originalOrderId;
      
      // Check if this cancelled order should trigger a notification
      const statusKey = `${orderId}-cancelled`;
      const isAlreadySeen = seenOrderStatuses[statusKey];
      
      // Only show if not already seen as cancelled and should be shown
      if (!isAlreadySeen && shouldShowOrder({ _id: orderId, status: 'cancelled' })) {
        const cancelledOrderWithStatus = { 
          ...cancelledOrder, 
          status: 'cancelled', 
          _id: orderId 
        };
        
        setToastNotifications(prev => {
          const previousNotifications = Array.isArray(prev) ? prev : [];
          const filtered = previousNotifications.filter(notif => notif._id !== orderId);
          return [cancelledOrderWithStatus, ...filtered];
        });
        
        playNotificationSound(orderId, 'cancelled');
        
        // Update counter
        setCounter(prev => {
          const activeNotificationOrders = allOrders.filter(order => 
            shouldShowOrder(order) && 
            shouldShowPopupForStatus(order.status) &&
            !seenOrderStatuses[`${order._id}-${order.status}`]
          );
          
          const activeCancelledNotifications = cancelledOrders.filter(co => {
            const coId = co.originalOrderId;
            return shouldShowOrder({ _id: coId, status: 'cancelled' }) &&
                   shouldShowPopupForStatus('cancelled') &&
                   !seenOrderStatuses[`${coId}-cancelled`];
          });
          
          return activeNotificationOrders.length + activeCancelledNotifications.length;
        });
      }
    });
  }, [cancelledOrders, seenOrderStatuses, shouldShowOrder, playNotificationSound, allOrders]);

  // Handle bell click - toggle popup and persist state - FIXED: Include cancelled orders
  const handleBellClick = () => {
    setShowPopup(prev => {
      const opening = !prev;
      localStorage.setItem('customerShowPopup', JSON.stringify(opening));
      if (opening) {
        // Opening bell: clear toast popups and mark all as seen
        const newSeenStatuses = { ...seenOrderStatuses };
        
        // Mark all toast notifications as seen
        toastNotifications.forEach(order => {
          const orderId = order._id || order.originalOrderId;
          const status = order.status || 'cancelled';
          const key = `${orderId}-${status}`;
          newSeenStatuses[key] = true;
        });
        
        // Mark all visible orders as seen
        visibleOrders.forEach(order => {
          const orderId = order._id || order.originalOrderId;
          const status = order.status || 'cancelled';
          const key = `${orderId}-${status}`;
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
          const orderId = order._id || order.originalOrderId;
          const status = order.status || 'cancelled';
          const key = `${orderId}-${status}`;
          newSeenStatuses[key] = true;
        });
        setSeenOrderStatuses(newSeenStatuses);
        localStorage.setItem('seenOrderStatuses', JSON.stringify(newSeenStatuses));
        setCounter(0);
      }
      return opening;
    });
  };

  // FIXED: Handle removing individual notification from bell popup
  const handleRemoveNotification = (orderId) => {
    // Find the order in either allOrders or cancelledOrders
    const order = allOrders.find(o => o._id === orderId) || 
                 cancelledOrders.find(o => o.originalOrderId === orderId);
    
    if (!order) return;

    const orderStatus = order.status || 'cancelled';

    // Store the status at which the order was removed
    setRemovedOrdersMap(prev => {
      const updated = { ...prev, [orderId]: orderStatus };
      localStorage.setItem('removedOrdersMap', JSON.stringify(updated));
      return updated;
    });

    // Mark this specific order-status as seen
    setSeenOrderStatuses(prev => {
      const updated = { ...prev, [`${orderId}-${orderStatus}`]: true };
      if (orderStatus === 'cancelled') {
        updated[`${orderId}-cancelled`] = true;
      }
      localStorage.setItem('seenOrderStatuses', JSON.stringify(updated));
      return updated;
    });

    // Remove from toast notifications
    setToastNotifications(prev => {
      const previousNotifications = Array.isArray(prev) ? prev : [];
      const updated = previousNotifications.filter(notif => notif._id !== orderId);
      localStorage.setItem('customerToastNotifications', JSON.stringify(updated));
      return updated;
    });

    // Update counter
    const activeNotificationOrders = allOrders.filter(order =>
      shouldShowOrder(order) &&
      shouldShowPopupForStatus(order.status) &&
      !seenOrderStatuses[`${order._id}-${order.status}`]
    );
    
    const activeCancelledNotifications = cancelledOrders.filter(cancelledOrder => {
      const coId = cancelledOrder.originalOrderId;
      return shouldShowOrder({ _id: coId, status: 'cancelled' }) &&
             shouldShowPopupForStatus('cancelled') &&
             !seenOrderStatuses[`${coId}-cancelled`];
    });
    
    setCounter(activeNotificationOrders.length + activeCancelledNotifications.length);
  };

  // FIXED: Handle closing toast notification - properly remove cancelled orders
  const handleCloseToast = (orderId) => {
    const order = allOrders.find(o => o._id === orderId) || 
                 cancelledOrders.find(o => o.originalOrderId === orderId);
    
    if (order) {
      const orderStatus = order.status || 'cancelled';
      
      // Mark this specific order-status as seen
      setSeenOrderStatuses(prev => {
        const updated = { ...prev, [`${orderId}-${orderStatus}`]: true };
        localStorage.setItem('seenOrderStatuses', JSON.stringify(updated));
        return updated;
      });
    }
    
    // Remove from toast notifications but don't mark as removed in removedOrdersMap
    // So it can reappear if status changes again, but won't reappear for the same status
    setToastNotifications(prev => {
      const previousNotifications = Array.isArray(prev) ? prev : [];
      const updated = previousNotifications.filter(notif => notif._id !== orderId);
      localStorage.setItem('customerToastNotifications', JSON.stringify(updated));
      return updated;
    });
    
    // Update counter
    const activeNotificationOrders = allOrders.filter(order =>
      shouldShowOrder(order) &&
      shouldShowPopupForStatus(order.status) &&
      !seenOrderStatuses[`${order._id}-${order.status}`]
    );
    
    const activeCancelledNotifications = cancelledOrders.filter(cancelledOrder => {
      const coId = cancelledOrder.originalOrderId;
      return shouldShowOrder({ _id: coId, status: 'cancelled' }) &&
             shouldShowPopupForStatus('cancelled') &&
             !seenOrderStatuses[`${coId}-cancelled`];
    });
    
    setCounter(activeNotificationOrders.length + activeCancelledNotifications.length);
  };

  // Close popup when clicking outside, and persist state - FIXED: Include cancelled orders
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
            const orderId = order._id || order.originalOrderId;
            const status = order.status || 'cancelled';
            const key = `${orderId}-${status}`;
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

  // --- Product carousel (ads) state and data ---
  const carouselItems = [
    { id: 'p1', title: 'Spa Relaxation Package', price: '₱1,200', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRJTL8auN0STxRsusN1WL2T3fb8WrXq5zdKA&s' },
    { id: 'p2', title: 'Romantic Dinner for Two', price: '₱950', img: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=60' },
    { id: 'p3', title: 'City Tour Package', price: '₱750', img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=60' },
    { id: 'p4', title: 'Breakfast Buffet Upgrade', price: '₱250', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=60' }
  ];
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselPausedRef = useRef(false);
  const carouselContainerRef = useRef(null);
  const carouselNext = useCallback(() => setCarouselIndex(i => (i + 1) % carouselItems.length), [carouselItems.length]);
  const carouselPrev = useCallback(() => setCarouselIndex(i => (i - 1 + carouselItems.length) % carouselItems.length), [carouselItems.length]);

  // autoplay for carousel (non-intrusive)
  useEffect(() => {
    const t = setInterval(() => {
      if (carouselPausedRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      setCarouselIndex(i => (i + 1) % carouselItems.length);
    }, 4500);
    return () => clearInterval(t);
  }, [carouselItems.length]);

  // keyboard navigation for carousel (left/right) — ignore when typing in inputs
  useEffect(() => {
    const onKey = (e) => {
      const active = document.activeElement;
      const tag = active && active.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return;
      if (e.key === 'ArrowLeft') carouselPrev();
      if (e.key === 'ArrowRight') carouselNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [carouselNext, carouselPrev]);

  // Button styles for Cart and Status
  const headerButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#FFD700',
    fontSize: '0.9rem',
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
    
    letterSpacing: 1,
    textShadow: '0 1px 4px #0006',
  };

  // Add debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Seen order-status combinations: ${Object.keys(seenOrderStatuses).length}`);
      console.log(`Toast notifications: ${toastNotifications.length}`);
    }
    console.log(`Removed orders tracking: ${Object.keys(removedOrdersMap).length} in map`);
  }, [removedOrdersMap, seenOrderStatuses, toastNotifications]);

  // Force popup to update when removedOrdersMap changes
  useEffect(() => {
    if (showPopup) {
      // This will trigger a re-render of the popup with updated visible orders
      setAllOrders(prev => [...prev]);
    }
  }, [removedOrdersMap, showPopup]);

  useEffect(() => {
    if (showCart && cartCloseBtnRef.current) {
      cartCloseBtnRef.current.focus();
    }
  }, [showCart]);

  useEffect(() => {
    if (showStatus && statusCloseBtnRef.current) {
      statusCloseBtnRef.current.focus();
    }
  }, [showStatus]);

  // Escape key to close modals and focus management
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showCart) setShowCart(false);
        if (showStatus) setShowStatus(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCart, showStatus]);

    return (
    <div className="min-h-screen bg-gray-50" style={{ 
      background: '#fff', 
      height: '100vh', 
      padding: 0, 
      margin: 0, 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Toast Notifications Container */}
      {toastNotifications.length > 0 && (
        <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-xs" style={toastContainerStyle}>
          {[...toastNotifications].reverse().map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isCancelled = order.status === 'cancelled';
            const cancelledOrder = isCancelled ? cancelledOrders.find(co => co.originalOrderId === order._id) : null;
            
            return (
              <div key={order._id} style={{
                ...toastStyle,
                border: isCancelled ? '2px solid #f5c6cb' : '2px solid #F7D774',
                background: isCancelled ? '#fff5f5' : '#fff'
              }}>
                <div style={toastHeaderStyle}>
                  <div style={{...toastTitleStyle, color: isCancelled ? '#721c24' : '#4B2E06'}}>
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
                <div style={{ fontSize: '12px', color: isCancelled ? '#a61e2a' : '#666' }}>
                  Order #{order._id?.slice(-6) || 'N/A'} • 
                  <span style={statusBadgeStyle(order.status)}>
                    {order.status}
                  </span>
                </div>
                
                {/* Cancellation Reason */}
                {isCancelled && cancelledOrder?.cancellationReason && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px',
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#721c24'
                  }}>
                    <strong>Cancellation Reason:</strong> {cancelledOrder.cancellationReason}
                  </div>
                )}
                
                {order.items && order.items.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, marginBottom: '4px', color: isCancelled ? '#721c24' : '#666' }}>
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
                    <div style={{ 
                      borderTop: '1px solid #e0e0e0', 
                      paddingTop: '4px', 
                      marginTop: '6px', 
                      fontWeight: 600, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '12px',
                      color: isCancelled ? '#721c24' : '#4B2E06'
                    }}>
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
      <div className="w-full bg-amber-900 flex items-center justify-between px-4 h-12 shadow-md sticky top-0 z-50" style={headerStyle}>
        <div className="flex items-center space-x-3" style={{ display: 'flex', alignItems: 'center' }}>
          <img src='/lumine_icon.png' alt="Lumine Logo" style={logoStyle} />
          <span className="text-white text-lg font-medium" style={appNameStyle}>Lumine</span>
        </div>
        <div className="flex items-center space-x-2" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {/* Cart and Status buttons */}
          <button 
            onClick={() => setShowCart(true)} 
            className="px-3 py-1 rounded-md text-amber-200 hover:bg-amber-200 hover:text-amber-900 transition-colors"
            style={headerButtonStyle}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}
          >
            Cart ({cart.reduce((total, item) => total + (item.quantity || 1), 0)})
          </button>
          <button 
            onClick={() => setShowStatus(true)} 
            className="px-3 py-1 rounded-md text-amber-200 hover:bg-amber-200 hover:text-amber-900 transition-colors"
            style={headerButtonStyle}
            onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#4B2E06'; }}
            onMouseOut={e => { e.target.style.background = 'none'; e.target.style.color = '#FFD700'; }}
          >
            Status
          </button>

          {/* Notification Bell */}
          <button 
            className="notification-bell relative p-2 rounded-full hover:bg-amber-100 focus:outline-none"
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
          <button className="ml-3 px-3 py-1 rounded-md bg-amber-200 text-amber-900 hover:bg-amber-100 shadow-sm" style={logoutBtnStyle} onClick={handleLogout} onMouseOver={e => { e.target.style.background = '#ffe9a7'; }} onMouseOut={e => { e.target.style.background = '#F7D774'; }}>
            Log Out
          </button>
          {/* Notification Popup */}
          {showPopup && (
            <div className="notification-popup bg-white rounded-lg shadow-lg p-3" style={popupStyle}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Order Updates</span>
                <span style={{ fontSize: 12, color: '#666', fontWeight: 400 }}>
                  {visibleOrders.length} notification{visibleOrders.length !== 1 ? 's' : ''}
                </span>
              </div>
                {visibleOrders.length === 0 ? (
                <div className="text-sm text-gray-500">No order updates.</div>
              ) : (
                <div className="max-h-52 overflow-y-auto">
                  {visibleOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const isCancelled = order.status === 'cancelled';
                    const cancelledOrder = isCancelled ? cancelledOrders.find(co => co.originalOrderId === order._id) : null;
                    const orderId = order._id || order.originalOrderId;
                    
                    return (
                      <div key={orderId} style={{ 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '6px', 
                        padding: '8px', 
                        marginBottom: '6px',
                        background: isCancelled ? '#fff5f5' : '#fff9e6'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ fontWeight: 500, fontSize: '12px' }}>
                            Order #{orderId?.slice(-6) || 'N/A'}
                          </div>
                          <button 
                            style={removeBtnStyle}
                            onClick={() => handleRemoveNotification(orderId)}
                            title="Remove notification"
                          >
                            ×
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                          <span>{statusInfo.emoji} {statusInfo.message}</span>
                          <span style={statusBadgeStyle(order.status)}>{order.status}</span>
                        </div>
                        
                        {/* Cancellation Reason */}
                        {isCancelled && cancelledOrder?.cancellationReason && (
                          <div style={{ 
                            marginBottom: '6px', 
                            padding: '6px',
                            background: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: '#721c24'
                          }}>
                            <strong>Reason:</strong> {cancelledOrder.cancellationReason}
                          </div>
                        )}
                        
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
                            ₱{order.items ? order.items.reduce((total, item) => 
                              total + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2) : '0.00'
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

      {/* Product Carousel (Ads) - placed directly below the header */}
      <div className="mx-auto w-full max-w-4xl px-4 mt-3" style={{ pointerEvents: 'auto' }}>
        <div ref={carouselContainerRef} onMouseEnter={() => { carouselPausedRef.current = true; }} onMouseLeave={() => { carouselPausedRef.current = false; }} className="relative bg-white rounded-lg shadow-sm overflow-hidden" style={{ border: '1px solid #fff3cd' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ background: '#fff9e6' }}>
            <div className="text-sm font-semibold text-amber-800">Recommended for you</div>
            <div className="text-xs text-gray-600">Offers & hotel extras</div>
          </div>
          <div className="flex items-center gap-3 p-3">
            <button aria-label="previous" onClick={carouselPrev} className="p-2 rounded-md hover:bg-amber-100 text-amber-800" style={{ background: 'transparent', border: 'none' }}>
              ‹
            </button>
            <div className="flex-1 overflow-hidden">
              <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                {carouselItems.map(item => (
                  <div key={item.id} className="flex-shrink-0 w-full" style={{ minWidth: '100%' }}>
                    <div className="flex items-center gap-3 p-2">
                      <img src={item.img} alt={item.title} className="w-32 h-20 object-cover rounded-md shadow-sm" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-900">{item.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{item.price}</div>
                        <div className="mt-2">
                          <button onClick={() => alert(item.title + ' — More info coming soon')} className="px-3 py-1 rounded-md text-sm shadow-sm" style={{ background: '#F7D774', border: '2px solid #FFD700', color: '#4B2E06' }}>View</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {carouselItems.map((_, idx) => (
                  <button key={idx} onClick={() => setCarouselIndex(idx)} aria-label={`Go to slide ${idx + 1}`} className={`w-2 h-2 rounded-full ${idx === carouselIndex ? 'bg-amber-900' : 'bg-amber-200'}`}></button>
                ))}
              </div>
            </div>
            <button aria-label="next" onClick={carouselNext} className="p-2 rounded-md hover:bg-amber-100 text-amber-800" style={{ background: 'transparent', border: 'none' }}>
              ›
            </button>
          </div>
        </div>
      </div>
	  
      {/* Cart Popup */}
      {showCart && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-amber-900/10 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-11/12 max-w-lg max-h-[70vh] overflow-auto border-2 border-amber-200" style={{ color: '#4B2E06' }}>
            <h2 className="text-2xl font-medium text-amber-900 mb-4">Your Cart</h2>

            {cart.length === 0 ? (
              <p className="text-amber-800">Your cart is empty.</p>
            ) : (
              <div className="max-h-[35vh] overflow-y-auto mb-4">
                <table className="w-full text-sm text-amber-900">
                  <thead className="sticky top-0 bg-amber-100">
                    <tr>
                      <th className="py-2 px-2 text-left">Item</th>
                      <th className="py-2 px-2">Price</th>
                      <th className="py-2 px-2">Qty</th>
                      <th className="py-2 px-2">Total</th>
                      <th className="py-2 px-2">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      const itemTotal = (item.price || 0) * (item.quantity || 1);
                      return (
                        <tr key={idx} className="border-b border-amber-50">
                          <td className="py-2 px-2 text-left flex items-center gap-2">
                            <img src={item.img} alt={item.name} className="w-6 h-6 rounded-md border border-amber-200" />
                            <span>{item.name}</span>
                          </td>
                          <td className="py-2 px-2">₱{item.price ? item.price.toFixed(2) : '0.00'}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2 justify-center">
                              <button onClick={() => updateQuantity(idx, (item.quantity || 1) - 1)} className="w-6 h-6 rounded-full border border-amber-200 bg-amber-100">-</button>
                              <span className="min-w-[20px] text-center">{item.quantity || 1}</span>
                              <button onClick={() => updateQuantity(idx, (item.quantity || 1) + 1)} className="w-6 h-6 rounded-full border border-amber-200 bg-amber-100">+</button>
                            </div>
                          </td>
                          <td className="py-2 px-2 font-semibold">₱{itemTotal.toFixed(2)}</td>
                          <td className="py-2 px-2">
                            <button onClick={() => removeFromCart(idx)} className="px-2 py-1 rounded bg-red-500 text-white text-xs">Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-amber-100 font-semibold">
                      <td colSpan={3} className="py-2 px-2 text-right">Total:</td>
                      <td className="py-2 px-2">₱{cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-center gap-4">
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
                className="px-4 py-2 rounded-md bg-amber-200 border-2 border-amber-300 text-amber-900 font-medium shadow-sm"
              >
                Checkout
              </button>

              <button
                ref={cartCloseBtnRef}
                onClick={() => setShowCart(false)}
                className="px-4 py-2 rounded-md border-2 border-amber-200 bg-white text-amber-900 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Popup with tabs for Pending and Delivered */}
      {showStatus && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-amber-900/10 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-11/12 max-w-lg max-h-[70vh] overflow-auto border-2 border-amber-200">
            <h2 className="text-2xl font-medium text-amber-900 mb-4">Order Status</h2>
            {/* Tabs */}
            <div className="flex justify-center mb-4 gap-3">
              <button
                className={`px-4 py-2 rounded-md font-medium ${tab === 'pending' ? 'bg-amber-200 border-2 border-amber-300 text-amber-900' : 'bg-white border-2 border-amber-200 text-amber-800'}`}
                onClick={() => setTab('pending')}
              >Pending</button>
              <button
                className={`px-4 py-2 rounded-md font-medium ${tab === 'delivered' ? 'bg-amber-200 border-2 border-amber-300 text-amber-900' : 'bg-white border-2 border-amber-200 text-amber-800'}`}
                onClick={() => setTab('delivered')}
              >Delivered</button>
            </div>
            {/* Orders Table, scrollable if too many items */}
            {orders.length === 0 ? (
              <p className="text-amber-800">No checked-out orders yet.</p>
            ) : (
              <div className="max-h-[35vh] overflow-y-auto">
                <table className="w-full text-sm text-amber-900">
                  <thead className="bg-amber-100 sticky top-0">
                    <tr>
                      <th className="py-2 px-2 text-left">Items</th>
                      <th className="py-2 px-2">Total Price</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(order => (tab === 'pending' ? (order.status !== 'delivered') : (order.status === 'delivered'))).map((order, idx) => {
                      const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                      return (
                        <tr key={order._id || idx} className="border-b border-amber-50">
                          <td className="py-2 px-2">
                            <ul className="list-none p-0 m-0">
                              {order.items.map((item, i) => (
                                <li key={i} className="flex items-center mb-2">
                                  {item.img && (
                                    <img src={item.img} alt={item.name} className="w-6 h-6 rounded-md mr-2 border border-amber-200" />
                                  )}
                                  <span className="font-medium">{item.name}</span>
                                  <span className="ml-2 text-sm text-amber-800">(x{item.quantity || 1})</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-2 px-2 font-semibold">₱{totalPrice.toFixed(2)}</td>
                          <td className="py-2 px-2">
                            <span className="capitalize">{order.status || 'pending'}</span>
                            {tab === 'pending' && ['pending','acknowledged'].includes(order.status) && (
                              <button className="ml-2 px-2 py-1 rounded bg-amber-200 border-2 border-amber-300" onClick={() => cancelOrder(order)}>Cancel</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 text-center">
              <button ref={statusCloseBtnRef} className="px-4 py-2 rounded-md border-2 border-amber-200 bg-white text-amber-900" onClick={() => setShowStatus(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center p-4 overflow-hidden">
        <div className="flex flex-wrap justify-center items-center gap-6">
					{/* Facilities Card */}
          <div onClick={() => handleNavigate('/customer/facilities')} onMouseEnter={() => {}} onMouseLeave={() => {}} className="w-60 h-60 rounded-2xl bg-amber-100 shadow-md hover:shadow-xl transform transition-transform duration-200 flex items-center justify-center cursor-pointer">
            <div className="bg-white rounded-xl shadow-inner w-44 h-44 flex flex-col items-center justify-center">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" alt="Facilities" className="w-24 h-16 object-cover rounded-md mb-3" />
              <div className="text-lg text-amber-900">Facilities</div>
            </div>
          </div>

					{/* Food & Beverage Card */}
          <div onClick={() => handleNavigate('/customer/food')} onMouseEnter={() => {}} onMouseLeave={() => {}} className="w-60 h-60 rounded-2xl bg-amber-100 shadow-md hover:shadow-xl transform transition-transform duration-200 flex items-center justify-center cursor-pointer">
            <div className="bg-white rounded-xl shadow-inner w-44 h-44 flex flex-col items-center justify-center">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" alt="Food and Beverages" className="w-24 h-16 object-cover rounded-md mb-3" />
              <div className="text-lg text-amber-900 text-center">Food & Beverage</div>
            </div>
          </div>

					{/* Contact Front Desk Card */}
          <div onClick={() => handleNavigate('/customer/contact')} onMouseEnter={() => {}} onMouseLeave={() => {}} className="w-60 h-60 rounded-2xl bg-amber-100 shadow-md hover:shadow-xl transform transition-transform duration-200 flex items-center justify-center cursor-pointer">
            <div className="bg-white rounded-xl shadow-inner w-44 h-44 flex flex-col items-center justify-center">
              <img src="https://img.icons8.com/ios-filled/100/000000/contacts.png" alt="Contact Front Desk" className="w-16 h-16 mb-3" />
              <div className="text-lg text-amber-900 text-center">Contact Frontdesk</div>
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