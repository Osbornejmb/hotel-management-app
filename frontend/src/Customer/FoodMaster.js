import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckoutUpsellModal from './CheckoutUpsellModal';
import OrderConfirmationModal from './OrderConfirmationModal';

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

const initialFoodData = {
  breakfast: [],
  lunch: [],
  dinner: [],
  desserts: [],
  snack: [],
  beverages: []
};

function FoodMaster() {
  const { category } = useParams();
  // Always get room number at the top so all functions use the same value
  const roomNumber = localStorage.getItem('customerRoomNumber');
  // Map category to display name
  const categoryDisplayNames = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    desserts: 'Desserts',
    snack: 'Snack',
    beverages: 'Beverages',
  };
  // Convert category to lowercase for mapping (handles uppercase from URL)
  const normalizedCategory = category ? category.toLowerCase() : '';
  const headerTitle = categoryDisplayNames[normalizedCategory] || 'Foods';
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [foodData, setFoodData] = useState(initialFoodData);
  const [popup, setPopup] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Enhanced Cart, Status, and Notification states from CustomerInterface
  const [showCart, setShowCart] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');

  // Upsell Modal states
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellData, setUpsellData] = useState({});
  const [isUpsellLoading, setIsUpsellLoading] = useState(false);
  const [, setPendingCheckout] = useState(false);

  // Order Confirmation Modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isConfirmationLoading, setIsConfirmationLoading] = useState(false);
  
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

  // Handle food click: show popup only if available
  const handleFoodClick = (food) => {
    if (food.available === false) {
      alert('This food item is currently unavailable.');
      return;
    }
    setPopup({...food, quantity: 1});
  };
  
  // Add to cart with quantity support
  const addToCart = async (food, quantity = 1) => {
    if (addingToCart) return;
    setAddingToCart(true);
    
    // Always use the image path from the card (food.img) for cart display
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

  const closePopup = () => setPopup(null);
  const foods = foodData[normalizedCategory] || [];

  // Poll food data for the selected category from backend every second
  useEffect(() => {
    let ignore = false;
    const fetchFood = () => {
      axios.get(`${process.env.REACT_APP_API_URL}/api/food`)
        .then(res => {
          if (!ignore && res.data && typeof res.data === 'object') {
            setFoodData(res.data);
          }
        })
        .catch(() => {});
    };
    fetchFood();
    const interval = setInterval(fetchFood, 1000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [category]);

  // Enhanced Cart Operations from CustomerInterface
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

  // Enhanced Cancel Order from CustomerInterface
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

  // Get status emoji and message from CustomerInterface
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
        localStorage.removeItem('removedOrdersMap');
        localStorage.removeItem('seenOrderStatuses');
        localStorage.removeItem('customerToastNotifications');
        localStorage.removeItem('customerShowPopup');
        localStorage.removeItem('playedNotifications');
        localStorage.clear();
        navigate('/customer/login', { replace: true });
      } else {
        alert('Invalid password. Logout cancelled.');
      }
    } catch (err) {
      alert('Error verifying password. Please try again.');
    }
  };

  // ========== UPSELL MODAL HANDLERS ==========
  
  // Fetch upsell recommendations from backend
  const fetchUpsellRecommendations = async () => {
    if (!roomNumber) return;
    setIsUpsellLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/upsell`
      );
      
      const { showUpsell, upsellHeading, upsellMessage, recommendations } = response.data;
      
      if (showUpsell && recommendations && recommendations.length > 0) {
        setUpsellData({
          upsellHeading,
          upsellMessage,
          recommendations
        });
        setShowUpsellModal(true);
      } else {
        // No upsell needed, proceed with checkout
        await completeCheckout();
      }
    } catch (error) {
      console.error('Error fetching upsell recommendations:', error);
      // On error, proceed with checkout anyway
      await completeCheckout();
    } finally {
      setIsUpsellLoading(false);
    }
  };

  // Complete the checkout process
  const completeCheckout = async () => {
    if (!roomNumber || cart.length === 0) return;
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/checkout`);
      setCart([]);
      alert('Checkout successful! Your order has been sent to the restaurant.');
      setShowCart(false);
      setPendingCheckout(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
      setPendingCheckout(false);
    }
  };

  // Handle checkout button click - show upsell modal first
  const handleCheckoutClick = async () => {
    if (!roomNumber || cart.length === 0) return;
    setPendingCheckout(true);
    await fetchUpsellRecommendations();
  };

  // Handle adding item to cart from upsell modal
  const handleUpsellAddToCart = async (item, quantity = 1) => {
    try {
      // Add item to cart via API
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/items`,
        {
          name: item.name,
          img: item.img,
          category: item.category,
          price: item.price,
          quantity: quantity
        }
      );
      
      // Refresh cart
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}`);
      setCart(res.data?.items || []);
      
      // Close modal and show confirmation
      setShowUpsellModal(false);
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  // Handle "No Thanks, Continue" button
  const handleUpsellSkip = async () => {
    setShowUpsellModal(false);
    setShowConfirmationModal(true);
  };

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    if (!roomNumber || cart.length === 0) return;
    
    setIsConfirmationLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/cart/${roomNumber}/checkout`);
      setCart([]);
      alert('Checkout successful! Your order has been sent to the restaurant.');
      setShowCart(false);
      setShowConfirmationModal(false);
      setPendingCheckout(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
      setPendingCheckout(false);
    } finally {
      setIsConfirmationLoading(false);
    }
  };

  // Handle cancel order confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setShowCart(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col overflow-auto">
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
                <div className={`p-1 rounded ${showPopupNotification ? 'bg-amber-600' : ''}`}>
                  <svg className="w-5 h-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                
                {/* Notification Counter */}
                {!showPopupNotification && counter > 0 && (
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
      {showPopupNotification && (
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

      {/* Back Button and Title */}
      <div className="container mx-auto px-4 mt-6">
        <button 
          onClick={() => navigate('/customer/food')} 
          className="flex items-center space-x-2 text-amber-700 hover:text-amber-900 transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Food Menu</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-4">{headerTitle}</h1>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto">
            Browse our delicious {headerTitle.toLowerCase()} menu items
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${headerTitle.toLowerCase()} items...`}
              className="w-full px-6 py-4 rounded-2xl border-2 border-amber-300 bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-200 shadow-lg"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-amber-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="container mx-auto px-4 pb-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).map((food, idx) => (
            <div 
              key={food.name + idx} 
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              onClick={() => handleFoodClick(food)}
            >
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-1 shadow-xl">
                <div className={`bg-white rounded-xl p-6 text-center group-hover:bg-amber-50 transition-colors duration-300 h-full flex flex-col ${
                  food.available === false ? 'opacity-50' : ''
                }`}>
                  <div className="w-full h-48 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors overflow-hidden">
                    {food.img ? (
                      <img 
                        src={food.img} 
                        alt={food.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="text-amber-600">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">{food.name}</h3>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="text-2xl font-bold text-orange-600">₱{food.price ? food.price.toFixed(2) : '0.00'}</div>
                    {food.available === false && (
                      <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-amber-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">No {headerTitle.toLowerCase()} items found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Food Details Popup */}
      {popup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h2 className="text-2xl font-bold text-white">{popup.name}</h2>
            </div>
            
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {popup.img && (
                <img 
                  src={popup.img} 
                  alt={popup.name}
                  className="w-full h-48 object-cover rounded-xl mb-6 border border-amber-200"
                />
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-amber-900">Price:</span>
                  <span className="text-2xl font-bold text-orange-600">₱{popup.price ? popup.price.toFixed(2) : '0.00'}</span>
                </div>
                
                {popup.details && (
                  <div>
                    <span className="text-lg font-semibold text-amber-900 block mb-2">Description:</span>
                    <p className="text-amber-700 leading-relaxed">{popup.details}</p>
                  </div>
                )}
                
                {/* Quantity Selector */}
                <div className="flex items-center justify-between pt-4 border-t border-amber-200">
                  <span className="text-lg font-semibold text-amber-900">Quantity:</span>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => {
                        const currentQty = popup.quantity || 1;
                        if (currentQty > 1) {
                          setPopup({...popup, quantity: currentQty - 1});
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="min-w-[40px] text-center font-semibold text-amber-900 text-lg">
                      {popup.quantity || 1}
                    </span>
                    <button 
                      onClick={() => {
                        const currentQty = popup.quantity || 1;
                        setPopup({...popup, quantity: currentQty + 1});
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-amber-50 border-t border-amber-200">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => addToCart(popup, popup.quantity || 1)}
                  disabled={addingToCart}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={closePopup}
                  className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Upsell Modal */}
      <CheckoutUpsellModal
        isOpen={showUpsellModal}
        upsellData={upsellData}
        onAddToCart={handleUpsellAddToCart}
        onContinueCheckout={handleUpsellSkip}
        isLoading={isUpsellLoading}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmationModal}
        items={cart}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelConfirmation}
        isLoading={isConfirmationLoading}
      />

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
                            >
                              −
                            </button>
                            <span className="min-w-[40px] text-center font-semibold text-amber-900">
                              {item.quantity || 1}
                            </span>
                            <button 
                              onClick={() => updateQuantity(idx, (item.quantity || 1) + 1)} 
                              className="w-8 h-8 rounded-full bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="text-right min-w-[100px]">
                            <div className="font-bold text-amber-900">₱{itemTotal.toFixed(2)}</div>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(idx)} 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
                  onClick={handleCheckoutClick}
                  disabled={cart.length === 0}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Checkout</span>
                </button>

                <button
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
                                >
                                  Cancel
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

export default FoodMaster;