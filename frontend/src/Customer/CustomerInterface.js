import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAddCartPopup } from './AddCartPopupContext';
import { useCheckoutPopup } from './CheckoutPopupContext';
import { useNavigate, useLocation } from "react-router-dom";
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
  // allOrders holds orders for this customer; global analytics are fetched from server
  
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
  // Loading states for cart and orders
  const [cartProcessingIdx, setCartProcessingIdx] = useState(null);
  const [cartRemovingIdx, setCartRemovingIdx] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

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
    setCartProcessingIdx(idx);
    try {
      if (roomNumber) {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/${idx}/quantity`,
          { quantity: newQuantity }
        );
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } else {
        setCart((prev) => {
          const updatedCart = [...prev];
          updatedCart[idx].quantity = newQuantity;
          return updatedCart;
        });
      }
    } catch {
      // fallback optimistic update already handled above when offline
    } finally {
      setCartProcessingIdx(null);
    }
  };

  const removeFromCart = async (idx) => {
    setCartRemovingIdx(idx);
    try {
      if (roomNumber) {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/${idx}`);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
      } else {
        setCart((prev) => prev.filter((_, i) => i !== idx));
      }
    } catch {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    } finally {
      setCartRemovingIdx(null);
    }
  };

  // Cancel order using admin logic, with confirmation and no reason
  const cancelOrder = async (order) => {
    if (!['pending', 'acknowledged'].includes(order.status)) return;
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;
    setCancellingOrderId(order._id);
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
    } finally {
      setCancellingOrderId(null);
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

  // --- Product carousel (ads) state and data ---
  // We'll load real food items from the API and build combos (meal + drink + dessert + snack)
  const [foodItems, setFoodItems] = useState([]);
  const [foodLoaded, setFoodLoaded] = useState(false);
  const [adminCombos, setAdminCombos] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselPausedRef = useRef(false);
  const carouselContainerRef = useRef(null);
  const analyticsRef = useRef(null); // store last-fetched analytics for ordering combos
  // Selected combo modal state
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [showComboModal, setShowComboModal] = useState(false);
  const [comboQuantity, setComboQuantity] = useState(1);
  // shared add-to-cart popup hook
  const showAddCartPopup = useAddCartPopup();
  const showCheckoutPopup = useCheckoutPopup();
  const carouselNext = useCallback(() => {
    setCarouselIndex(i => {
      const len = carouselItems.length || 0;
      if (len === 0) return i;
      return (i + 1) % len;
    });
  }, [carouselItems.length]);

  const carouselPrev = useCallback(() => {
    setCarouselIndex(i => {
      const len = carouselItems.length || 0;
      if (len === 0) return i;
      return (i - 1 + len) % len;
    });
  }, [carouselItems.length]);

  // autoplay for carousel (non-intrusive)
  useEffect(() => {
    const t = setInterval(() => {
      if (carouselPausedRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      setCarouselIndex(i => (carouselItems.length ? (i + 1) % carouselItems.length : i));
    }, 3000);
    return () => clearInterval(t);
  }, [carouselItems.length]);

  // Fetch food items from backend and build combo carousel
  useEffect(() => {
    let ignore = false;
    const fetchFood = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food`);
        let all = [];
        if (res.data && typeof res.data === 'object') {
          Object.values(res.data).forEach(arr => { if (Array.isArray(arr)) all = all.concat(arr); });
        }
        if (ignore) return;
        setFoodItems(all.filter(f => f.available !== false));
        setFoodLoaded(true);
      } catch (err) {
        console.error('Failed to fetch food items for combos', err);
        setFoodLoaded(true);
      }
    };
    fetchFood();
    const interval = setInterval(fetchFood, 10_000);
    return () => { ignore = true; clearInterval(interval); };
  }, []);

  // Fetch admin-managed combos from backend
  useEffect(() => {
    let ignore = false;
    const fetchAdminCombos = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/carousel/combos`);
        if (ignore) return;
        const adminCombosData = Array.isArray(res.data) ? res.data : res.data.data || [];
        // Update state to trigger carousel rebuild
        setAdminCombos(adminCombosData);
      } catch (err) {
        // Silently fail; carousel will use only auto-generated combos
      }
    };
    fetchAdminCombos();
    const interval = setInterval(fetchAdminCombos, 15_000);
    return () => { ignore = true; clearInterval(interval); };
  }, []);

  // Build combos when foodItems or global analytics change
  useEffect(() => {
    if (!foodLoaded) return;

    const lower = (s = '') => (s || '').toString().toLowerCase();

    // Helper to lookup food item by name (case-insensitive)
    const foodByName = {};
    foodItems.forEach(f => {
      if (!f || !f.name) return;
      foodByName[lower(f.name.trim())] = f;
    });

    const buildFromPairings = (sortedPairs) => {
      const pairCombos = [];
      const maxCombos = 12; // increase to show more combos
      const usedMealIds = new Set(); // track meal ids (or names) used across combos to ensure uniqueness
      const topPairs = (sortedPairs || []).slice(0, 12).map(p => {
        // p might be { pairing, frequency } or [pairKey, freq]
        if (Array.isArray(p)) {
          const [pairKey, freq] = p;
          const [aName, bName] = pairKey.split(' + ').map(s => s.trim());
          return { pairKey, freq, names: [aName, bName] };
        }
        const pairKey = p.pairing || '';
        const freq = p.frequency || 0;
        const [aName, bName] = pairKey.split(' + ').map(s => s.trim());
        return { pairKey, freq, names: [aName, bName] };
      });

      const usedComboKeys = new Set();
      for (let i = 0; i < topPairs.length && pairCombos.length < maxCombos; i++) {
        for (let j = i + 1; j < topPairs.length && pairCombos.length < maxCombos; j++) {
          const namesSet = new Set([...topPairs[i].names.map(n => lower(n)), ...topPairs[j].names.map(n => lower(n))]);
          const namesArr = Array.from(namesSet);
          const foods = namesArr.map(n => foodByName[n]).filter(Boolean);
          if (foods.length < 2) continue;

          const categorize = (f) => {
            const c = lower(f.category || '');
            if (!c) return 'meal';
            if (c.includes('bever') || c.includes('drink') || c.includes('juice') || c.includes('soda') || c.includes('tea') || c.includes('coffee')) return 'beverage';
            if (c.includes('dessert')) return 'dessert';
            if (c.includes('snack') || c.includes('side')) return 'snack';
            return 'meal';
          };

          const byCategory = { meal: [], snack: [], beverage: [], dessert: [] };
          foods.forEach(f => byCategory[categorize(f)].push(f));

          const pickUnique = (arr, picked) => {
            for (const it of arr) {
              if (!picked.find(p => p.name === it.name)) return it;
            }
            return null;
          };

          const picked = [];
          // Try to pick a meal that hasn't been used yet
          let mealPick = null;
          const mealCandidates = byCategory.meal.concat(foods).filter(Boolean);
          for (const mc of mealCandidates) {
            if (!mc || !mc.name) continue;
            const mid = mc._id || lower(mc.name);
            if (usedMealIds.has(mid)) continue;
            if (!picked.find(p => p.name === mc.name)) { mealPick = mc; break; }
          }
          if (mealPick) picked.push(mealPick);
          const snackPick = pickUnique(byCategory.snack, picked) || pickUnique(foods, picked);
          if (snackPick) picked.push(snackPick);
          const bevPick = pickUnique(byCategory.beverage, picked) || pickUnique(foods, picked);
          if (bevPick) picked.push(bevPick);
          const desPick = pickUnique(byCategory.dessert, picked) || pickUnique(foods, picked);
          if (desPick) picked.push(desPick);

          // Ensure combos always contain at least one meal (breakfast/lunch/dinner)
          const mealsLocal = foodItems.filter(f => {
            const c = lower(f.category || '');
            if (!c) return true;
            if (c.includes('bever') || c.includes('drink') || c.includes('juice') || c.includes('soda') || c.includes('tea') || c.includes('coffee')) return false;
            if (c.includes('dessert') || c.includes('snack') || c.includes('side')) return false;
            return true;
          });

          const hasMeal = picked.some(p => {
            const c = lower(p.category || '');
            return !c || (!c.includes('bever') && !c.includes('drink') && !c.includes('dessert') && !c.includes('snack') && !c.includes('side'));
          });
          if (!hasMeal && mealsLocal.length > 0) {
            const extraMeal = mealsLocal.find(m => {
              if (!m || !m.name) return false;
              const mid = m._id || lower(m.name);
              return !picked.find(p => p.name === m.name) && !usedMealIds.has(mid);
            });
            if (extraMeal) picked.unshift(extraMeal);
          }

          if (picked.length < 4) {
            const remainingPool = foodItems.filter(f => !picked.find(p => p.name === f.name));
            for (let r = 0; r < remainingPool.length && picked.length < 4; r++) picked.push(remainingPool[r]);
          }

          if (picked.length < 2) continue;

          const comboNamesKey = picked.map(p => lower(p.name)).sort().join('|');
          if (usedComboKeys.has(comboNamesKey)) continue;
          usedComboKeys.add(comboNamesKey);

          const price = picked.reduce((s, it) => s + (Number(it.price) || 0), 0);
          // Prefer the meal's image as the combo picture
          const mealInPicked = picked.find(p => {
            const c = lower(p.category || '');
            return !c || (!c.includes('bever') && !c.includes('drink') && !c.includes('dessert') && !c.includes('snack') && !c.includes('side'));
          });
          if (mealInPicked) usedMealIds.add(mealInPicked._id || lower(mealInPicked.name));
          pairCombos.push({
            id: `paircombo-${i}-${j}-${comboNamesKey}`,
            title: picked.map(p => p.name).slice(0,4).join(' + '),
            price: Math.round(price),
            img: (mealInPicked && mealInPicked.img) || (picked[0] && picked[0].img) || '',
            items: picked.slice(0,4).map(p => ({ name: p.name, qty: 1 })),
            description: formatComboDescription(picked.slice(0,4), `(Popular: ${topPairs[i].freq} & ${topPairs[j].freq})`)
          });
        }
      }

      return pairCombos;
    };

    // helper: reorder combos by analytics (see below)

    const reorderCombosByAnalytics = (items = [], analytics = null) => {
      if (!analytics) return items;
      const top = (analytics.summary && analytics.summary.mostFrequentItems) || (analytics.analysis && analytics.analysis.mostFrequentItems) || [];
      const low = (analytics.summary && analytics.summary.lowPerformers) || (analytics.analysis && analytics.analysis.lowPerformers) || [];
      const toName = x => (x && (x.name || x[0] || x)) || '';
      const topNames = new Set((top || []).slice(0, 10).map(t => (toName(t) || '').toString().toLowerCase()));
      const lowNames = new Set((low || []).slice(0, 12).map(t => (toName(t) || '').toString().toLowerCase()));

      const includesAny = (combo, nameSet) => {
        if (!combo || !combo.items) return false;
        return combo.items.some(it => nameSet.has((it.name || '').toString().toLowerCase()));
      };

      const picked = [];
      const used = new Set();

      // First, up to 6 combos that include top items
      for (const c of items) {
        if (picked.length >= 6) break;
        const key = c.id || JSON.stringify(c.items || c.title || '');
        if (used.has(key)) continue;
        if (includesAny(c, topNames)) { picked.push(c); used.add(key); }
      }

      // Then, up to 6 combos that include low-performers
      for (const c of items) {
        if (picked.length >= 12) break;
        const key = c.id || JSON.stringify(c.items || c.title || '');
        if (used.has(key)) continue;
        if (includesAny(c, lowNames)) { picked.push(c); used.add(key); }
      }

      // Fill remaining slots with other combos preserving original order
      for (const c of items) {
        if (picked.length >= 12) break;
        const key = c.id || JSON.stringify(c.items || c.title || '');
        if (used.has(key)) continue;
        picked.push(c); used.add(key);
      }

      return picked;
    };

    const formatComboDescription = (items = [], extra = '') => {
      const names = Array.from(new Set((items || []).map(it => (it && it.name ? it.name : '').toString()).filter(Boolean)));
      if (names.length === 0) return extra || '';
      if (names.length === 1) return `${names[0]}${extra ? ' ' + extra : ''}`;
      if (names.length === 2) return `${names[0]} served with ${names[1]}${extra ? ' ' + extra : ''}`;
      const last = names.pop();
      return `${names.join(', ')} and ${last}${extra ? ' ' + extra : ''}`;
    };

    const tryUseAnalytics = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/analytics/summary`);
        const data = res.data;
        analyticsRef.current = data;
        const pairs = (data && data.summary && data.summary.commonPairings) || (data && data.analysis && data.analysis.mostCommonPairings) || [];
        const pairCombos = buildFromPairings(pairs);
        if (pairCombos && pairCombos.length > 0) {
          const newItems = pairCombos.slice(0, 12);
          const ordered = reorderCombosByAnalytics(newItems, data);
          setCarouselItems(ordered);
          setCarouselIndex(prev => {
            const len = newItems.length || 0;
            if (len === 0) return 0;
            // keep previous index when possible, otherwise clamp to last
            return prev < len ? prev : len - 1;
          });
          return true;
        }
      } catch (err) {
        // ignore and fall back
        // console.error('Failed to fetch analytics for combos', err);
      }
      return false;
    };

    (async () => {
      // Only show admin-managed combos
      if (adminCombos.length > 0) {
        setCarouselItems(adminCombos);
        setCarouselIndex(prev => {
          const len = adminCombos.length || 0;
          if (len === 0) return 0;
          return prev < len ? prev : len - 1;
        });
        return;
      }

      const usedAnalytics = await tryUseAnalytics();
      if (usedAnalytics) return;

      // Fallback: previous random combo generation
      const beverages = foodItems.filter(f => {
        const c = lower(f.category || '');
        return c.includes('bever') || c.includes('drink') || c.includes('juice') || c.includes('soda') || c.includes('tea') || c.includes('coffee');
      });

      const desserts = foodItems.filter(f => lower(f.category || '').includes('dessert'));
      const snacks = foodItems.filter(f => lower(f.category || '').includes('snack') || lower(f.category || '').includes('side'));
      const meals = foodItems.filter(f => {
        const c = lower(f.category || '');
        if (!c) return true;
        if (c.includes('bever') || c.includes('drink') || c.includes('dessert') || c.includes('snack') || c.includes('side')) return false;
        return true;
      });

      const combos = [];
      const usedMealIds = new Set(); // ensure each meal item used at most once across combos
      if (meals.length && beverages.length && desserts.length && snacks.length) {
        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const pickRandomUniqueMeal = (arr) => {
          const pool = arr.filter(it => it && it.name && !usedMealIds.has(it._id || lower(it.name)));
          if (pool.length === 0) return null;
          return pool[Math.floor(Math.random() * pool.length)];
        };
        const used = new Set();
        for (let i = 0; i < Math.min(12, meals.length); i++) {
          const meal = pickRandomUniqueMeal(meals) || pickRandom(meals);
          const bev = pickRandom(beverages);
          const des = pickRandom(desserts);
          const sn = pickRandom(snacks);
          const key = `${meal._id || meal.name}|${bev._id || bev.name}|${des._id || des.name}|${sn._id || sn.name}`;
          if (used.has(key)) continue;
          used.add(key);
          const price = [meal, bev, des, sn].reduce((s, it) => s + (Number(it.price) || 0), 0);
          combos.push({
            id: `combo-${i}-${meal._id || meal.name}`,
            title: `${meal.name} + ${bev.name} + ${des.name} + ${sn.name}`,
            price: Math.round(price),
            img: meal.img || bev.img || des.img || sn.img || '',
            items: [
              { name: meal.name, qty: 1 },
              { name: bev.name, qty: 1 },
              { name: des.name, qty: 1 },
              { name: sn.name, qty: 1 }
            ],
            description: formatComboDescription([{ name: meal.name }, { name: bev.name }, { name: des.name }, { name: sn.name }])
          });
          // mark meal used
          if (meal && meal.name) usedMealIds.add(meal._id || lower(meal.name));
        }
      }

      if (combos.length === 0 && meals.length && beverages.length) {
        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const pickRandomUniqueMeal = (arr) => {
          const pool = arr.filter(it => it && it.name && !usedMealIds.has(it._id || lower(it.name)));
          if (pool.length === 0) return null;
          return pool[Math.floor(Math.random() * pool.length)];
        };
        for (let i = 0; i < Math.min(12, meals.length); i++) {
          const meal = pickRandomUniqueMeal(meals) || pickRandom(meals);
          const bev = pickRandom(beverages);
          const price = (Number(meal.price) || 0) + (Number(bev.price) || 0);
          combos.push({
            id: `combo-mealbev-${i}-${meal._id || meal.name}`,
            title: `${meal.name} + ${bev.name}`,
            price: Math.round(price),
            img: meal.img || bev.img || '',
            items: [{ name: meal.name, qty: 1 }, { name: bev.name, qty: 1 }],
            description: formatComboDescription([{ name: meal.name }, { name: bev.name }])
          });
          if (meal && meal.name) usedMealIds.add(meal._id || lower(meal.name));
        }
      }

      if (combos.length === 0 && foodItems.length) {
        // Final fallback: ensure single-item combos are meals where possible
        const meals = foodItems.filter(f => {
          const c = lower(f.category || '');
          if (!c) return true;
          if (c.includes('bever') || c.includes('drink') || c.includes('juice') || c.includes('soda') || c.includes('tea') || c.includes('coffee')) return false;
          if (c.includes('dessert') || c.includes('snack') || c.includes('side')) return false;
          return true;
        });
        const pool = meals.length ? meals : foodItems;
        const top = pool.filter(f => f && f.name && !usedMealIds.has(f._id || lower(f.name))).slice(0, Math.min(12, pool.length));
        combos.push(...top.map((f, i) => ({
          id: `single-${i}-${f._id || f.name}`,
          title: f.name,
          price: Math.round(Number(f.price) || 0),
          img: f.img || '',
          items: [{ name: f.name, qty: 1 }],
          description: formatComboDescription([{ name: f.name }]) || f.details || f.description || ''
        })));
        // mark single-item meals as used
        top.forEach(f => { if (f && f.name) usedMealIds.add(f._id || lower(f.name)); });
      }

      const newItems = (combos || []).slice(0, 12);
      const ordered = analyticsRef.current ? reorderCombosByAnalytics(newItems, analyticsRef.current) : newItems;
      
      setCarouselItems(ordered);
      setCarouselIndex(prev => {
        const len = ordered.length || 0;
        if (len === 0) return 0;
        return prev < len ? prev : len - 1;
      });
    })();
  }, [foodItems, foodLoaded, adminCombos]);

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

  // Handlers for combo modal and adding to cart
  const handleOpenCombo = (combo) => {
    setSelectedCombo(combo);
    setComboQuantity(1);
    setShowComboModal(true);
    carouselPausedRef.current = true;
  };

  const handleCloseCombo = () => {
    setShowComboModal(false);
    setSelectedCombo(null);
    carouselPausedRef.current = false;
  };

  const handleAddComboToCart = async (quantity = 1) => {
    if (!selectedCombo) return;
    const item = {
      name: selectedCombo.title,
      price: Number(selectedCombo.price) || 0,
      img: selectedCombo.img,
      quantity,
      category: 'combo',
      comboContents: selectedCombo.items
    };

    // If roomNumber is present, persist to backend cart; otherwise update local cart

    if (roomNumber) {
      try {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/items`, item);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
        setCart(res.data?.items || []);
        showAddCartPopup(item);
      } catch (err) {
        console.error('Failed to add combo to cart', err);
        // fallback to an in-app error toast
        showAddCartPopup({ ...item, error: true });
      } finally {
        handleCloseCombo();
      }
    } else {
      // offline/local fallback
      setCart(prev => {
        const existingIdx = prev.findIndex(i => i.name === item.name && i.price === item.price);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].quantity = (updated[existingIdx].quantity || 1) + quantity;
          return updated;
        }
        return [item, ...prev];
      });
      handleCloseCombo();
      showAddCartPopup(item);
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

  // Listen for global 'openCart' event (from AddCartPopupProvider "View Cart" button)
  useEffect(() => {
    const onOpenCart = () => setShowCart(true);
    window.addEventListener('openCart', onOpenCart);
    return () => window.removeEventListener('openCart', onOpenCart);
  }, []);

  // Listen for global 'openOrderStatus' event (from CheckoutPopupProvider "View Orders" button)
  useEffect(() => {
    const onOpenOrderStatus = () => setShowStatus(true);
    window.addEventListener('openOrderStatus', onOpenOrderStatus);
    return () => window.removeEventListener('openOrderStatus', onOpenOrderStatus);
  }, []);

  // Support navigation-based open (when another page navigates here with state)
  const location = useLocation();
  useEffect(() => {
    if (!location || !location.state) return;
    if (location.state.openCart) {
      setShowCart(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state.openStatus) {
      setShowStatus(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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

  // Status badge styles with Tailwind classes
  const getStatusBadgeClass = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold capitalize ml-2 border";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-50 text-yellow-800 border-yellow-200`;
      case 'acknowledged':
        return `${baseClasses} bg-blue-50 text-blue-800 border-blue-200`;
      case 'preparing':
        return `${baseClasses} bg-green-50 text-green-800 border-green-200`;
      case 'on the way':
        return `${baseClasses} bg-indigo-50 text-indigo-800 border-indigo-200`;
      case 'delivered':
        return `${baseClasses} bg-emerald-50 text-emerald-800 border-emerald-200`;
      case 'cancelled':
        return `${baseClasses} bg-red-50 text-red-800 border-red-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-800 border-gray-200`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Toast Notifications Container */}
      {toastNotifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
          {[...toastNotifications].reverse().map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isCancelled = order.status === 'cancelled';
            const cancelledOrder = isCancelled ? cancelledOrders.find(co => co.originalOrderId === order._id) : null;
            
            return (
              <div 
                key={order._id} 
                className={`bg-white rounded-xl shadow-lg border-l-4 p-4 animate-slide-in-right ${
                  isCancelled ? 'border-red-400 bg-red-50' : 'border-amber-400'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`font-semibold ${isCancelled ? 'text-red-800' : 'text-amber-800'}`}>
                    {statusInfo.emoji} {statusInfo.message}
                  </div>
                  <button 
                    className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                    onClick={() => handleCloseToast(order._id)}
                    title="Close notification"
                  >
                    ×
                  </button>
                </div>
                <div className={`text-sm ${isCancelled ? 'text-red-700' : 'text-gray-600'} mb-2 flex items-center`}>
                  Order #{order._id?.slice(-6) || 'N/A'} • 
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                </div>
                
                {/* Cancellation Reason */}
                {isCancelled && cancelledOrder?.cancellationReason && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg text-xs text-red-800">
                    <strong>Cancellation Reason:</strong> {cancelledOrder.cancellationReason}
                  </div>
                )}
                
                {order.items && order.items.length > 0 && (
                  <div className="mt-3">
                    <div className={`text-xs font-medium mb-1 ${isCancelled ? 'text-red-700' : 'text-gray-600'}`}>
                      Items:
                    </div>
                    <ul className="text-xs space-y-1 pl-2">
                      {order.items.slice(0, 3).map((item, i) => (
                        <li key={item.name + i} className="flex justify-between">
                          <span>{item.name} (x{item.quantity || 1})</span>
                          <span className="font-medium ml-2">
                            ₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </li>
                      ))}
                      {order.items.length > 3 && (
                        <li className="italic text-gray-500">
                          and {order.items.length - 3} more items...
                        </li>
                      )}
                    </ul>
                    <div className="border-t border-gray-200 pt-2 mt-2 font-semibold flex justify-between text-sm">
                      <span className={isCancelled ? 'text-red-800' : 'text-amber-800'}>Total:</span>
                      <span className={isCancelled ? 'text-red-800' : 'text-amber-800'}>
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

      {/* popup is provided by AddCartPopupProvider */}

      {/* Header */}
      <header className="bg-gradient-to-r from-amber-900 to-amber-800 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and App Name */}
            <div className="flex items-center space-x-3">
              <img 
                src='/lumine_icon.png' 
                alt="Lumine Logo" 
                className="h-8 w-8 object-contain" 
              />
              <span className="text-white text-xl font-light tracking-wider">
                Lumine
              </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-4">
              {/* Cart and Status buttons */}
              <button 
                onClick={() => setShowCart(true)} 
                className="px-4 py-2 rounded-lg text-amber-100 hover:bg-amber-700 hover:text-white transition-all duration-200 font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Cart ({cart.reduce((total, item) => total + (item.quantity || 1), 0)})</span>
              </button>
              
              <button 
                onClick={() => setShowStatus(true)} 
                className="px-4 py-2 rounded-lg text-amber-100 hover:bg-amber-700 hover:text-white transition-all duration-200 font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Status</span>
              </button>

             {/* Notification Bell */}
<button 
  className="notification-bell relative p-1 rounded hover:bg-amber-700 transition-colors focus:outline-none"
  onClick={handleBellClick} 
  aria-label="Notifications"
>
  <div className={`p-1 rounded ${showPopup ? 'bg-amber-600' : ''}`}>
    <svg className="w-5 h-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  </div>
  
  {/* Notification Counter */}
  {!showPopup && counter > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
      {counter}
    </span>
  )}
</button>

              {/* Logout Button */}
              <button 
                className="ml-2 px-4 py-2 rounded-lg bg-amber-200 text-amber-900 hover:bg-amber-300 shadow-md transition-all duration-200 font-medium flex items-center space-x-2"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Popup */}
      {showPopup && (
        <div className="notification-popup absolute top-20 right-4 bg-white rounded-2xl shadow-2xl p-6 min-w-80 max-w-sm z-50 border border-amber-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Order Updates</h3>
            <span className="text-sm text-gray-500 bg-amber-100 px-2 py-1 rounded-full">
              {visibleOrders.length} notification{visibleOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {visibleOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-amber-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No order updates</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {visibleOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const isCancelled = order.status === 'cancelled';
                const cancelledOrder = isCancelled ? cancelledOrders.find(co => co.originalOrderId === order._id) : null;
                const orderId = order._id || order.originalOrderId;
                
                return (
                  <div 
                    key={orderId} 
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      isCancelled 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-medium text-sm text-amber-900">
                        Order #{orderId?.slice(-6) || 'N/A'}
                      </div>
                      <button 
                        className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                        onClick={() => handleRemoveNotification(orderId)}
                        title="Remove notification"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <span className="text-lg mr-2">{statusInfo.emoji}</span>
                      <span className="text-sm font-medium">{statusInfo.message}</span>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </span>
                    </div>
                    
                    {/* Cancellation Reason */}
                    {isCancelled && cancelledOrder?.cancellationReason && (
                      <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-lg text-xs text-red-800">
                        <strong>Reason:</strong> {cancelledOrder.cancellationReason}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? order.items.map((item, i) => (
                        <div key={item.name + i} className="flex justify-between items-center text-sm">
                          <span className="text-amber-800">
                            {item.name} (x{item.quantity || 1})
                          </span>
                          <span className="font-semibold text-amber-900">
                            ₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      )) : (
                        <div className="text-sm text-gray-500">No items listed</div>
                      )}
                    </div>
                    
                    <div className="border-t border-amber-200 pt-2 mt-3 flex justify-between font-semibold text-sm">
                      <span className={isCancelled ? 'text-red-800' : 'text-amber-800'}>Order Total:</span>
                      <span className={isCancelled ? 'text-red-800' : 'text-amber-800'}>
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

      {/* Product Carousel (Food Combos) */}
      <div className="container mx-auto px-4 mt-6">
        <div
          ref={carouselContainerRef}
          onMouseEnter={() => { carouselPausedRef.current = true; }}
          onMouseLeave={() => { carouselPausedRef.current = false; }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-200"
        >
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
            <div className="text-lg font-semibold text-amber-900">Combo Deals</div>
            <div className="text-sm text-amber-700 bg-amber-200 px-3 py-1 rounded-full">Limited time</div>
          </div>

          <div className="flex items-center gap-3 p-3">
            <button
              aria-label="previous"
              onClick={carouselPrev}
              className="p-3 rounded-full hover:bg-amber-100 text-amber-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                {carouselItems.map(combo => (
                  <div key={combo.id} className="flex-shrink-0 w-full px-2">
                    <div
                      className="flex items-center gap-4 p-3 cursor-pointer hover:shadow-lg rounded-lg"
                      onClick={() => handleOpenCombo(combo)}
                    >
                      <img
                        src={combo.img}
                        alt={combo.title}
                        className="w-56 h-40 md:w-64 md:h-44 object-cover rounded-xl shadow-md"
                      />
                      <div className="flex-1">
                        <div className="text-xl font-bold text-amber-900 mb-1">{combo.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{combo.description}</div>
                        <div className="text-2xl font-bold text-orange-600">₱{combo.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-2">Click to view details & add to cart</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots Indicator */}
              <div className="flex items-center justify-center gap-3 mt-4">
                {carouselItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === carouselIndex
                        ? 'bg-amber-600 w-8'
                        : 'bg-amber-300 hover:bg-amber-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              aria-label="next"
              onClick={carouselNext}
              className="p-3 rounded-full hover:bg-amber-100 text-amber-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Combo Modal */}
      {showComboModal && selectedCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-amber-200">
            <div className="p-6 flex items-start gap-4">
              <img src={selectedCombo.img} alt={selectedCombo.title} className="w-40 h-32 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900">{selectedCombo.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedCombo.description}</p>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">₱{selectedCombo.price.toFixed(2)}</div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-amber-800 mb-2">Includes:</div>
                  <ul className="text-sm list-disc list-inside text-gray-700">
                    {selectedCombo.items.map((it, i) => (
                      <li key={i}>{it.name} {it.qty ? `×${it.qty}` : ''}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="text-sm text-gray-600">Quantity:</div>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button onClick={() => setComboQuantity(q => Math.max(1, q - 1))} className="px-3 py-2">−</button>
                    <div className="px-4 py-2 bg-white text-sm font-semibold">{comboQuantity}</div>
                    <button onClick={() => setComboQuantity(q => q + 1)} className="px-3 py-2">+</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-amber-50 border-t border-amber-200 flex justify-end gap-4">
              <button onClick={handleCloseCombo} className="px-6 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold">Cancel</button>
              <button onClick={() => handleAddComboToCart(comboQuantity)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg">Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Popup */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Your Cart
              </h2>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-amber-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg">Your cart is empty</p>
                  <p className="text-sm mt-2">Add some items from our menu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="flex items-center space-x-4 flex-1">
                          <img src={item.img} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-amber-300" />
                          <div className="flex-1">
                            <div className="font-semibold text-amber-900">{item.name}</div>
                            <div className="text-amber-700">₱{item.price ? item.price.toFixed(2) : '0.00'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => updateQuantity(idx, (item.quantity || 1) - 1)} 
                              className="w-8 h-8 rounded-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-colors"
                              disabled={cartProcessingIdx === idx}
                            >
                              {cartProcessingIdx === idx ? '…' : '−'}
                            </button>
                            <span className="min-w-[40px] text-center font-semibold text-amber-900">
                              {item.quantity || 1}
                            </span>
                            <button 
                              onClick={() => updateQuantity(idx, (item.quantity || 1) + 1)} 
                              className="w-8 h-8 rounded-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-colors"
                              disabled={cartProcessingIdx === idx}
                            >
                              {cartProcessingIdx === idx ? '…' : '+'}
                            </button>
                          </div>
                          
                          <div className="text-right min-w-[100px]">
                            <div className="font-bold text-amber-900">₱{itemTotal.toFixed(2)}</div>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(idx)} 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                            disabled={cartRemovingIdx === idx}
                          >
                            {cartRemovingIdx === idx ? (
                              '…'
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="border-t border-amber-200 pt-4 mt-6">
                    <div className="flex justify-between items-center text-lg font-bold text-amber-900">
                      <span>Total:</span>
                      <span>₱{cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-amber-50 border-t border-amber-200">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={async () => {
                      if (roomNumber && cart.length > 0) {
                        setCheckoutLoading(true);
                        try {
                          await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/checkout`);
                          setCart([]);
                          showCheckoutPopup({ success: true, message: 'Checkout successful! Your order has been sent to the restaurant.' });
                          setShowCart(false);
                        } catch (err) {
                          console.error('Checkout failed', err);
                          showCheckoutPopup({ success: false, message: 'Checkout failed. Please try again.' });
                        } finally {
                          setCheckoutLoading(false);
                        }
                      }
                    }}
                  disabled={cart.length === 0 || checkoutLoading}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{checkoutLoading ? 'Processing...' : 'Checkout'}</span>
                </button>

                <button
                  ref={cartCloseBtnRef}
                  onClick={() => setShowCart(false)}
                  className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Status Popup */}
      {showStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Order Status
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex justify-center p-4 bg-amber-50 border-b border-amber-200">
              <div className="flex space-x-2 bg-white p-1 rounded-xl border border-amber-200">
                <button
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    tab === 'pending' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  onClick={() => setTab('pending')}
                >
                  Pending Orders
                </button>
                <button
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    tab === 'history' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  onClick={() => setTab('history')}
                >
                  Order History
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {/* Get filtered orders based on current tab */}
              {(() => {
                const filteredOrders = orders.filter(order => {
                  if (tab === 'pending') {
                    return order.status !== 'delivered' && order.status !== 'cancelled';
                  } else {
                    return order.status === 'delivered' || order.status === 'cancelled';
                  }
                });

                return filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto text-amber-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg">
                      {tab === 'pending' ? 'No pending orders' : 'No order history'}
                    </p>
                    <p className="text-sm mt-2">
                      {tab === 'pending' 
                        ? 'Your pending orders will appear here' 
                        : 'Your completed and cancelled orders will appear here'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order, idx) => {
                      const totalPrice = order.items ? order.items.reduce((sum, item) => 
                        sum + ((item.price || 0) * (item.quantity || 1)), 0) : 0;
                      
                      return (
                        <div key={order._id || idx} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="font-semibold text-amber-900">
                                Order #{order._id ? order._id.slice(-6) : 'N/A'}
                              </div>
                              <div className="text-sm text-amber-700">
                                Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={getStatusBadgeClass(order.status)}>
                                {order.status || 'pending'}
                              </span>
                              {tab === 'pending' && ['pending', 'acknowledged'].includes(order.status) && (
                                <button 
                                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                                  onClick={() => cancelOrder(order)}
                                  disabled={cancellingOrderId === order._id}
                                >
                                  {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                                  <div className="flex items-center space-x-3">
                                    {item.img && (
                                      <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-amber-200" />
                                    )}
                                    <div>
                                      <div className="font-medium text-amber-900">{item.name}</div>
                                      <div className="text-sm text-amber-700">Quantity: {item.quantity || 1}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-amber-900">
                                      ₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-amber-600">
                                No items in this order
                              </div>
                            )}
                          </div>
                          
                          <div className="border-t border-amber-200 pt-3 mt-3 flex justify-between items-center">
                            <div className="font-semibold text-amber-900">Order Total</div>
                            <div className="text-xl font-bold text-amber-900">₱{totalPrice.toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="p-6 bg-amber-50 border-t border-amber-200 text-center">
              <button 
                className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                onClick={() => setShowStatus(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Welcome to Lumine Hotel</h1>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto">
            Discover our premium services and amenities designed to make your stay unforgettable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Facilities Card */}
          <div 
            onClick={() => handleNavigate('/customer/facilities')} 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-1 shadow-xl">
              <div className="bg-white rounded-xl p-8 text-center group-hover:bg-amber-50 transition-colors duration-300 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors">
                  <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-3">Facilities</h3>
                <p className="text-amber-700 mb-4">Explore our premium hotel amenities and services</p>
                <div className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold group-hover:bg-amber-200 transition-colors">
                  View Facilities
                </div>
              </div>
            </div>
          </div>

          {/* Food & Beverage Card */}
          <div 
            onClick={() => handleNavigate('/customer/food')} 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-1 shadow-xl">
              <div className="bg-white rounded-xl p-8 text-center group-hover:bg-amber-50 transition-colors duration-300 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors">
                  <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-3">Food & Beverage</h3>
                <p className="text-amber-700 mb-4">Order delicious meals and drinks to your room</p>
                <div className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold group-hover:bg-amber-200 transition-colors">
                  Order Now
                </div>
              </div>
            </div>
          </div>

          {/* Contact Front Desk Card */}
          <div 
            onClick={() => handleNavigate('/customer/contact')} 
            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-1 shadow-xl">
              <div className="bg-white rounded-xl p-8 text-center group-hover:bg-amber-50 transition-colors duration-300 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors">
                  <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-3">Contact Front Desk</h3>
                <p className="text-amber-700 mb-4">Get assistance from our friendly staff</p>
                <div className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold group-hover:bg-amber-200 transition-colors">
                  Contact Us
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add CSS for animations */}
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
          .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}