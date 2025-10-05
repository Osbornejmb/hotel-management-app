import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Facilities.css';
import axios from 'axios';

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

const FACILITY_DATA = [
	{
		key: 'Restaurant',
		title: 'Restaurant',
		description: 'Enjoy freshly cooked meals every day at our restaurant, where good food and comfort come together for a satisfying dining experience.',
		img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
		thumb: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
	},
	{
		key: 'Pool',
		title: 'Swimming Pool',
		description: 'Take a refreshing dip or spend a relaxing afternoon by the pool, perfect for unwinding with family and friends.',
		img: 'https://www.landcon.ca/wp-content/uploads/2019/01/Backyard-Pool-900x450.jpg',
		thumb: 'https://www.landcon.ca/wp-content/uploads/2019/01/Backyard-Pool-900x450.jpg',
	},
	{
		key: 'Fitness',
		title: 'Fitness Center',
		description: 'Stay active during your stay with our fitness center, offering the equipment you need for a simple workout or a full routine.',
		img: 'https://images.squarespace-cdn.com/content/v1/58471a2329687f12c60955a3/1709159979051-8UDTOGLV884UYMV5LW1T/fitness-center-design.jpg?format=1000w',
		thumb: 'https://images.squarespace-cdn.com/content/v1/58471a2329687f12c60955a3/1709159979051-8UDTOGLV884UYMV5LW1T/fitness-center-design.jpg?format=1000w',
	},
	{
		key: 'Parking',
		title: 'Parking',
		description: 'Enjoy the convenience of secure on-site parking, giving you peace of mind while you focus on your stay.',
		img: 'https://webbox.imgix.net/images/fkasnjcmlhnbwpkv/ac1975e4-f8ee-4b5c-b76d-321325562de3.jpg?auto=format,compress&fit=crop&crop=entropy',
		thumb: 'https://webbox.imgix.net/images/fkasnjcmlhnbwpkv/ac1975e4-f8ee-4b5c-b76d-321325562de3.jpg?auto=format,compress&fit=crop&crop=entropy',
	},
	{
		key: 'Garden',
		title: 'Garden',
		description: 'Step into our garden and enjoy a peaceful space filled with greenery, ideal for a morning walk or quiet relaxation.',
		img: 'https://cdn.britannica.com/42/91642-050-332E5C66/Keukenhof-Gardens-Lisse-Netherlands.jpg',
		thumb: 'https://cdn.britannica.com/42/91642-050-332E5C66/Keukenhof-Gardens-Lisse-Netherlands.jpg',
	},
	{
		key: 'Playground',
		title: 'Playground',
		description: 'Let the kids have fun in our playground, a safe and lively spot where they can laugh, play, and make new friends.',
		img: 'https://fastrackcms-nightcap.imgix.net/uploads/nc-playgrounds-cms-header.jpg?fit=min&ixlib=php-2.3.0&s=051f395d1718827bb734ca34516e27d6',
		thumb: 'https://fastrackcms-nightcap.imgix.net/uploads/nc-playgrounds-cms-header.jpg?fit=min&ixlib=php-2.3.0&s=051f395d1718827bb734ca34516e27d6',
	},
];

function Facilities() {
	const [modal, setModal] = useState({ open: false, facility: null });
  const navigate = useNavigate();
  const roomNumber = localStorage.getItem('customerRoomNumber');

  // Enhanced Cart, Status, and Notification states
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');
  
  // Notification states
  const [showPopupNotification, setShowPopupNotification] = useState(() => {
    const stored = localStorage.getItem('customerShowPopup');
    return stored ? JSON.parse(stored) : false;
  });
  const [counter, setCounter] = useState(0);
  const [toastNotifications, setToastNotifications] = useState(() => {
    const stored = localStorage.getItem('customerToastNotifications');
    return stored ? JSON.parse(stored) : [];
  });
  const [allOrders, setAllOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [seenOrderStatuses, setSeenOrderStatuses] = useState(() => {
    const stored = localStorage.getItem('seenOrderStatuses');
    return stored ? JSON.parse(stored) : {};
  });
  const [removedOrdersMap, setRemovedOrdersMap] = useState(() => {
    const stored = localStorage.getItem('removedOrdersMap');
    return stored ? JSON.parse(stored) : {};
  });
  const [orderStatusMap, setOrderStatusMap] = useState({});

  // Use the custom notification sound hook
  const { playNotificationSound } = useNotificationSound();

	// Optionally keep the login redirect
	React.useEffect(() => {
		if (!localStorage.getItem('customerRoomNumber')) {
			navigate('/customer/login', { replace: true });
		}
	}, [navigate]);

	const openModal = (facility) => setModal({ open: true, facility });
	const closeModal = () => setModal({ open: false, facility: null });

	// Back button: close modal if open, otherwise go back
	const handleBack = () => {
		if (modal.open) {
			closeModal();
		} else {
			navigate('/customer/interface');
		}
	};

  // Enhanced Cart Operations
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

  // Enhanced Cancel Order
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
    interval = setInterval(fetchCartForCounter, 1000);

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

  // Fetch cancelled orders
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

  // Poll backend for orders every second - FIXED VERSION
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
    interval = setInterval(fetchOrders, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomNumber, removedOrdersMap, shouldShowOrder, seenOrderStatuses, playNotificationSound, orderStatusMap, handleOrderStatusTransition, cancelledOrders]);

  // Poll for cancelled orders
  useEffect(() => {
    let interval;
    
    const fetchData = async () => {
      await fetchCancelledOrders();
    };
    
    fetchData();
    interval = setInterval(fetchData, 1000);
    
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
    setShowPopupNotification(prev => {
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
      if (showPopupNotification) {
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
          setShowPopupNotification(false);
          localStorage.setItem('customerShowPopup', JSON.stringify(false));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopupNotification, seenOrderStatuses, visibleOrders]);

  // Persist removedOrdersMap to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('removedOrdersMap', JSON.stringify(removedOrdersMap));
  }, [removedOrdersMap]);

  // Persist seenOrderStatuses to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('seenOrderStatuses', JSON.stringify(seenOrderStatuses));
  }, [seenOrderStatuses]);

  // Persist toast notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customerToastNotifications', JSON.stringify(toastNotifications));
  }, [toastNotifications]);

  // Force popup to update when removedOrdersMap changes
  useEffect(() => {
    if (showPopupNotification) {
      // This will trigger a re-render of the popup with updated visible orders
      setAllOrders(prev => [...prev]);
    }
  }, [removedOrdersMap, showPopupNotification]);

  // Add debug info in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Seen order-status combinations: ${Object.keys(seenOrderStatuses).length}`);
      console.log(`Toast notifications: ${toastNotifications.length}`);
    }
    console.log(`Removed orders tracking: ${Object.keys(removedOrdersMap).length} in map`);
  }, [removedOrdersMap, seenOrderStatuses, toastNotifications]);

  // Styles for notifications
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

	return (
		<div className="facilities-root">
      {/* Toast Notifications Container */}
      {toastNotifications.length > 0 && (
        <div style={toastContainerStyle}>
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

			{/* Enhanced Header Bar */}
			<div className="facilities-header" style={{ justifyContent: 'space-between', padding: '0.3rem 1rem' }}>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<img src="/lumine_icon.png" alt="Lumine Logo" className="facilities-logo" />
					<span className="facilities-brand">Lumine</span>
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
            style={{...bellStyle, ...(showPopupNotification ? { background: '#F7D700', borderRadius: '50%', padding: '2px' } : {})}} 
            onClick={handleBellClick} 
            aria-label="Notifications"
          >
            {/* Simple bell SVG */}
            <span style={{...bellIconStyle, ...(showPopupNotification ? { color: '#4B2E06' } : {})}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            {/* Show counter for new orders - only when popup is closed */}
            {!showPopupNotification && counter > 0 && <span style={bellCounterStyle}>{counter}</span>}
          </button>

          {/* Notification Popup */}
          {showPopupNotification && (
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

			{/* Back Button and Title */}
			<div className="facilities-topbar">
				<button className="facilities-back" onClick={handleBack}>
					<span className="facilities-back-arrow">←</span> Back
				</button>
			</div>

			<div className="facilities-titlebar-centered">
				<span className="facilities-title-highlight">Lumine Facilities</span>
			</div>

			{/* Facilities Grid */}
			<div className="facilities-grid">
				{FACILITY_DATA.map((facility) => (
					<div key={facility.key} className="facilities-card" onClick={() => openModal(facility)}>
						<div className="facilities-card-inner">
							<img src={facility.thumb} alt={facility.title} className="facilities-card-img" />
							<div className="facilities-card-name">{facility.title}</div>
						</div>
					</div>
				))}
			</div>

			{/* Modal Popup */}
			{modal.open && modal.facility && (
				<div className="facility-modal-overlay" onClick={closeModal}>
					<div className="facility-modal" onClick={e => e.stopPropagation()}>
						<img src={modal.facility.img} alt={modal.facility.title} className="facility-modal-img" />
						<h2 className="facility-modal-title">{modal.facility.title}</h2>
						<p className="facility-modal-desc">{modal.facility.description}</p>
						<button className="facility-modal-close" onClick={closeModal}>Close</button>
					</div>
				</div>
			)}

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
                            {tab === 'pending' && ['pending','acknowledged'].includes(order.status) && (
                              <button
                                style={{ marginLeft: '0.4rem', padding: '0.2rem 0.6rem', borderRadius: '0.4em', border: '2px solid #FFD700', background: '#F7D774', color: '#4B2E06', fontWeight: 500, fontFamily: 'serif', cursor: 'pointer', boxShadow: '0 2px 8px #e5c16c44', transition: 'background 0.2s, color 0.2s', fontSize: '0.7rem' }}
                                onClick={() => cancelOrder(order)}
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

export default Facilities;