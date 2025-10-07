import React from 'react';
import LogoutButton from '../../Auth/LogoutButton';
import './RestaurantAdminDashboard.css';

// Toast Notification Component
function ToastNotification({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

// Custom hook for notification sound
const useNotificationSound = () => {
  const playSound = React.useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  }, []);

  return playSound;
};

// MenuManager component
function MenuManager() {
  const [foodItems, setFoodItems] = React.useState([]);
  const [editId, setEditId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ name: '', price: '', category: 'breakfast', img: '', details: '' });
  const [showEditPopup, setShowEditPopup] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [addForm, setAddForm] = React.useState({ name: '', price: '', category: 'breakfast', img: '', details: '', available: true });
  const [showAddPopup, setShowAddPopup] = React.useState(false);

  const fetchFood = React.useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food`);
      const data = await res.json();
      setFoodItems(Object.entries(data).flatMap(([cat, arr]) => arr.map(item => ({ ...item, category: cat }))));
    } catch (error) {
      console.error('Error fetching food:', error);
    }
  }, []);

  const handleToggleAvailability = React.useCallback(async (item) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food/${item.category}/${item._id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available })
      });
      if (res.ok) {
        setMessage(`Food item marked as ${!item.available ? 'available' : 'unavailable'}.`);
        fetchFood();
      } else {
        setMessage('Failed to update availability.');
      }
    } catch (error) {
      setMessage('Failed to update availability.');
    }
  }, [fetchFood]);

  const handleAdd = React.useCallback(async e => {
    e.preventDefault();
    setMessage('');
    if (!addForm.name || !addForm.price || !addForm.category || !addForm.img) {
      setMessage('Please fill in all required fields.');
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setMessage('Food item added successfully!');
        setAddForm({ name: '', price: '', category: 'breakfast', img: '', details: '', available: true });
        setShowAddPopup(false);
        fetchFood();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to add food item.');
      }
    } catch (error) {
      setMessage('Failed to add food item.');
    }
  }, [addForm, fetchFood]);

  const handleDelete = React.useCallback(async (id, category) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food/${category}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Food item deleted.');
        fetchFood();
      } else {
        setMessage('Failed to delete food item.');
      }
    } catch (error) {
      setMessage('Failed to delete food item.');
    }
  }, [fetchFood]);

  const startEdit = React.useCallback(item => {
    setEditId(item._id);
    setEditForm({ name: item.name, price: item.price, category: item.category, img: item.img, details: item.details });
    setShowEditPopup(true);
  }, []);

  const handleEdit = React.useCallback(async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food/${editForm.category}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setMessage('Food item updated.');
        setEditId(null);
        setShowEditPopup(false);
        fetchFood();
      } else {
        setMessage('Failed to update food item.');
      }
    } catch (error) {
      setMessage('Failed to update food item.');
    }
  }, [editForm, editId, fetchFood]);

  React.useEffect(() => { 
    fetchFood(); 
  }, [fetchFood]);

  return (
    <div className="menu-manager">
      <h3 className="menu-manager-title">Manage Food Menu</h3>
      <button className="btn btn-add" onClick={() => setShowAddPopup(true)}>Add Food Item</button>
      <h4 className="food-items-title">Food Items</h4>
      {message && <p className={`message ${message.includes('success') || message.includes('updated') || message.includes('deleted') ? 'success' : 'error'}`}>{message}</p>}
      <table className="food-table">
        <thead>
          <tr>
            <th>Name</th><th>Price</th><th>Category</th><th>Image</th><th>Details</th><th>Available</th><th>Edit</th><th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {foodItems.map(item => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>₱{item.price}</td>
              <td>{item.category}</td>
              <td><img className="food-img" src={item.img} alt={item.name} /></td>
              <td>{item.details}</td>
              <td>
                <button className={`btn btn-toggle ${item.available ? 'available' : 'unavailable'}`} onClick={() => handleToggleAvailability(item)}>
                  {item.available ? 'Available' : 'Unavailable'}
                </button>
              </td>
              <td><button className="btn btn-edit" onClick={() => startEdit(item)}>Edit</button></td>
              <td><button className="btn btn-delete" onClick={() => handleDelete(item._id, item.category)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Edit Food Item</h3>
            <form className="popup-form" onSubmit={handleEdit}>
              <label>Name:<input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required /></label>
              <label>Price:<input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} required /></label>
              <label>Category:
                <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="desserts">Desserts</option>
                  <option value="snack">Snack</option>
                  <option value="beverages">Beverages</option>
                </select>
              </label>
              <label>Image URL:<input type="text" value={editForm.img} onChange={e => setEditForm(f => ({ ...f, img: e.target.value }))} required /></label>
              <label>Details:<textarea value={editForm.details} onChange={e => setEditForm(f => ({ ...f, details: e.target.value }))} /></label>
              <div className="popup-actions">
                <button type="submit" className="btn btn-save">Save Changes</button>
                <button type="button" className="btn btn-cancel" onClick={() => { setEditId(null); setShowEditPopup(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Add Food Item</h3>
            <form className="popup-form" onSubmit={handleAdd}>
              <label>Name:<input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required /></label>
              <label>Price:<input type="number" step="0.01" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} required /></label>
              <label>Category:
                <select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} required>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="desserts">Desserts</option>
                  <option value="snack">Snack</option>
                  <option value="beverages">Beverages</option>
                </select>
              </label>
              <label>Image URL:<input type="text" value={addForm.img} onChange={e => setAddForm(f => ({ ...f, img: e.target.value }))} required /></label>
              <label>Details:<textarea value={addForm.details} onChange={e => setAddForm(f => ({ ...f, details: e.target.value }))} /></label>
              <label>
                Available:
                <input type="checkbox" checked={addForm.available} onChange={e => setAddForm(f => ({ ...f, available: e.target.checked }))} />
              </label>
              <div className="popup-actions">
                <button type="submit" className="btn btn-save">Add Food Item</button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowAddPopup(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Status steps array outside component to avoid recreation
const statusSteps = [
  'pending',
  'acknowledged',
  'preparing',
  'on the way',
  'delivered'
];

function RestaurantAdminDashboard() {
  const [orders, setOrders] = React.useState([]);
  const [cancelledOrders, setCancelledOrders] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('orders');
  const [orderFilter, setOrderFilter] = React.useState('pending');
  const [showCancelPopup, setShowCancelPopup] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [notifications, setNotifications] = React.useState([]);
  const [showNotificationPopup, setShowNotificationPopup] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);
  
  // Refs to track previous state for comparison
  const previousOrdersRef = React.useRef([]);
  const previousCancelledOrdersRef = React.useRef([]);

  // Notification sound hook
  const playNotificationSound = useNotificationSound();

  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      const data = await res.json();
      setOrders(data);
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }, []);

  const fetchCancelledOrders = React.useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/cancelled`);
      const data = await res.json();
      setCancelledOrders(data);
      return data;
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
      return [];
    }
  }, []);

  // Add a notification
  const addNotification = React.useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  // Remove a notification
  const removeNotification = React.useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Check for new orders and cancellations - FIXED VERSION
  const checkForNotifications = React.useCallback(async () => {
    const currentOrders = await fetchOrders();
    const currentCancelledOrders = await fetchCancelledOrders();

    let newNotificationCount = 0;

    // Check for new orders (only pending orders are considered "new")
    const newOrders = currentOrders.filter(newOrder => 
      !previousOrdersRef.current.some(prevOrder => prevOrder._id === newOrder._id) &&
      newOrder.status === 'pending'
    );
    
    newOrders.forEach(order => {
      addNotification(`New order received from Room ${order.roomNumber}`, 'new-order');
      newNotificationCount++;
    });

    // Check for new cancellations
    const newCancellations = currentCancelledOrders.filter(newCancelled => 
      !previousCancelledOrdersRef.current.some(prevCancelled => prevCancelled._id === newCancelled._id)
    );
    
    newCancellations.forEach(cancelledOrder => {
      addNotification(`Order cancelled from Room ${cancelledOrder.roomNumber}`, 'cancelled');
      newNotificationCount++;
    });

    // Update notification count
    if (newNotificationCount > 0) {
      setNotificationCount(prev => prev + newNotificationCount);

      // Play sound if there are new notifications and popup is not open
      if (!showNotificationPopup) {
        playNotificationSound();
      }
    }

    // Update previous state
    previousOrdersRef.current = currentOrders;
    previousCancelledOrdersRef.current = currentCancelledOrders;
  }, [fetchOrders, fetchCancelledOrders, addNotification, playNotificationSound, showNotificationPopup]);

  React.useEffect(() => {
    // Initial data fetch and setup
    const initializeData = async () => {
      const initialOrders = await fetchOrders();
      const initialCancelledOrders = await fetchCancelledOrders();
      
      previousOrdersRef.current = initialOrders;
      previousCancelledOrdersRef.current = initialCancelledOrders;
    };

    initializeData();

    // Set up polling interval
    const interval = setInterval(() => { 
      checkForNotifications();
      fetchOrders(); // Always fetch orders to keep data fresh
      if (activeTab === 'cancelled') {
        fetchCancelledOrders();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeTab, fetchOrders, fetchCancelledOrders, checkForNotifications]);

  // Handle bell click - clear notifications and counter
  const handleBellClick = () => {
    setShowNotificationPopup(prev => !prev);
    if (!showNotificationPopup) {
      // Clear notification count when opening the popup
      setNotificationCount(0);
    }
  };

  // Close notification popup when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotificationPopup) {
        const popup = document.querySelector('.notification-popup');
        const bell = document.querySelector('.notification-bell');
        if (popup && bell && 
          !popup.contains(event.target) && 
          !bell.contains(event.target)) {
          setShowNotificationPopup(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationPopup]);

  const handleDeleteDelivered = React.useCallback(async (orderId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${orderId}`, { method: 'DELETE' });
      fetchOrders();
    } catch (error) {
      console.error('Error deleting delivered order:', error);
    }
  }, [fetchOrders]);

  // Progress order status to next step
  const handleProgressStatus = React.useCallback(async (order) => {
    const currentIdx = statusSteps.indexOf(order.status);
    if (currentIdx === -1 || currentIdx === statusSteps.length - 1) return;
    const nextStatus = statusSteps[currentIdx + 1];
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${order._id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchOrders();
    } catch (error) {
      console.error('Error progressing order status:', error);
    }
  }, [fetchOrders]);

  // Open cancellation popup
  const openCancelPopup = React.useCallback((order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelPopup(true);
  }, []);

  // Handle order cancellation with reason
  const handleCancelOrder = React.useCallback(async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    try {
      const cancelResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          reason: cancelReason,
          originalOrder: selectedOrder
        })
      });

      if (cancelResponse.ok) {
        setShowCancelPopup(false);
        setSelectedOrder(null);
        setCancelReason('');
        fetchOrders();
        if (activeTab === 'cancelled') {
          fetchCancelledOrders();
        }
      } else {
        alert('Failed to cancel order.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order.');
    }
  }, [cancelReason, selectedOrder, fetchOrders, fetchCancelledOrders, activeTab]);

  const handleDeleteCancelled = React.useCallback(async (cancelledOrderId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/cancelled/${cancelledOrderId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCancelledOrders();
      } else {
        alert('Failed to delete cancelled order.');
      }
    } catch (error) {
      alert('Failed to delete cancelled order.');
    }
  }, [fetchCancelledOrders]);

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const acknowledgedOrders = orders.filter(order => order.status === 'acknowledged');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const onTheWayOrders = orders.filter(order => order.status === 'on the way');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Restaurant Admin Dashboard</h2>
        <div className="header-controls">
          {/* Notification Bell */}
          <button 
            className={`notification-bell ${showNotificationPopup ? 'active' : ''}`}
            onClick={handleBellClick}
            aria-label="Notifications"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {/* Show counter for new notifications */}
            {!showNotificationPopup && notificationCount > 0 && (
              <span className="bell-counter">{notificationCount > 99 ? '99+' : notificationCount}</span>
            )}
          </button>
          <LogoutButton />
        </div>
      </div>
      
      {/* Toast Notifications Container */}
      <div className="toast-container">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Notification Popup */}
      {showNotificationPopup && (
        <div className="notification-popup">
          <div className="notification-popup-header">
            <h3>Recent Notifications</h3>
            <span className="notification-count">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
          {notifications.length === 0 ? (
            <div className="no-notifications">No new notifications</div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div key={notification.id} className={`notification-item ${notification.type}`}>
                  <div className="notification-message">{notification.message}</div>
                  <button 
                    className="notification-close"
                    onClick={() => removeNotification(notification.id)}
                    title="Remove notification"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button>
        <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Manage Menu</button>
        {activeTab === 'orders' && (
          <select 
            className="order-filter" 
            value={orderFilter} 
            onChange={(e) => {
              setOrderFilter(e.target.value);
              if (e.target.value === 'cancelled') {
                fetchCancelledOrders();
              }
            }}
          >
            <option value="pending">Pending Orders</option>
            <option value="acknowledged">Acknowledged Orders</option>
            <option value="preparing">Preparing Orders</option>
            <option value="on the way">Orders On The Way</option>
            <option value="delivered">Delivered Orders</option>
            <option value="cancelled">Cancelled Orders</option>
          </select>
        )}
      </div>

      {/* Cancellation Popup */}
      {showCancelPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Cancel Order</h3>
            <p>Please provide a reason for cancellation:</p>
            <textarea 
              className="cancel-reason-input"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows="4"
              required
            />
            <div className="popup-actions">
              <button className="btn btn-confirm" onClick={handleCancelOrder}>
                Confirm Cancellation
              </button>
              <button className="btn btn-cancel" onClick={() => setShowCancelPopup(false)}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'menu' ? (
        <MenuManager />
      ) : activeTab === 'orders' && orderFilter === 'pending' ? (
        <>
          <h3 className="orders-title">Pending Orders</h3>
          {pendingOrders.length === 0 ? (
            <p>No pending orders.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Checked Out At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id}>
                      <td>{order.roomNumber}</td>
                      <td>
                        <ul className="order-items">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="order-item">
                              <img className="order-img" src={item.img} alt={item.name} />
                              <span className="order-name">{item.name}</span>
                              <span className="order-qty">(x{item.quantity || 1})</span>
                              <span className="order-price">- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="bold">₱{totalPrice.toFixed(2)}</td>
                      <td className="bold">{order.status || 'pending'}</td>
                      <td>{new Date(order.checkedOutAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-progress" onClick={() => handleProgressStatus(order)}>
                          Acknowledge
                        </button>
                        <button className="btn btn-cancel" onClick={() => openCancelPopup(order)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : activeTab === 'orders' && orderFilter === 'acknowledged' ? (
        <>
          <h3 className="orders-title">Acknowledged Orders</h3>
          {acknowledgedOrders.length === 0 ? (
            <p>No acknowledged orders.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Checked Out At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {acknowledgedOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id}>
                      <td>{order.roomNumber}</td>
                      <td>
                        <ul className="order-items">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="order-item">
                              <img className="order-img" src={item.img} alt={item.name} />
                              <span className="order-name">{item.name}</span>
                              <span className="order-qty">(x{item.quantity || 1})</span>
                              <span className="order-price">- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="bold">₱{totalPrice.toFixed(2)}</td>
                      <td className="bold">{order.status || 'acknowledged'}</td>
                      <td>{new Date(order.checkedOutAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-progress" onClick={() => handleProgressStatus(order)}>
                          Start Preparing
                        </button>
                        <button className="btn btn-cancel" onClick={() => openCancelPopup(order)}>
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : activeTab === 'orders' && orderFilter === 'preparing' ? (
        <>
          <h3 className="orders-title">Preparing Orders</h3>
          {preparingOrders.length === 0 ? (
            <p>No preparing orders.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Checked Out At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {preparingOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id}>
                      <td>{order.roomNumber}</td>
                      <td>
                        <ul className="order-items">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="order-item">
                              <img className="order-img" src={item.img} alt={item.name} />
                              <span className="order-name">{item.name}</span>
                              <span className="order-qty">(x{item.quantity || 1})</span>
                              <span className="order-price">- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="bold">₱{totalPrice.toFixed(2)}</td>
                      <td className="bold">{order.status || 'preparing'}</td>
                      <td>{new Date(order.checkedOutAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-progress" onClick={() => handleProgressStatus(order)}>
                          Mark On The Way
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : activeTab === 'orders' && orderFilter === 'on the way' ? (
        <>
          <h3 className="orders-title">Orders On The Way</h3>
          {onTheWayOrders.length === 0 ? (
            <p>No orders on the way.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Checked Out At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {onTheWayOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id}>
                      <td>{order.roomNumber}</td>
                      <td>
                        <ul className="order-items">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="order-item">
                              <img className="order-img" src={item.img} alt={item.name} />
                              <span className="order-name">{item.name}</span>
                              <span className="order-qty">(x{item.quantity || 1})</span>
                              <span className="order-price">- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="bold">₱{totalPrice.toFixed(2)}</td>
                      <td className="bold">{order.status || 'on the way'}</td>
                      <td>{new Date(order.checkedOutAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-progress" onClick={() => handleProgressStatus(order)}>
                          Mark Delivered
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : activeTab === 'orders' && orderFilter === 'delivered' ? (
        <>
          <h3 className="orders-title">Delivered Orders</h3>
          {deliveredOrders.length === 0 ? (
            <p>No delivered orders.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Checked Out At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveredOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id}>
                      <td>{order.roomNumber}</td>
                      <td>
                        <ul className="order-items">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="order-item">
                              <img className="order-img" src={item.img} alt={item.name} />
                              <span className="order-name">{item.name}</span>
                              <span className="order-qty">(x{item.quantity || 1})</span>
                              <span className="order-price">- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="bold">₱{totalPrice.toFixed(2)}</td>
                      <td className="bold">{order.status || 'delivered'}</td>
                      <td>{new Date(order.checkedOutAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-delete" onClick={() => handleDeleteDelivered(order._id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : activeTab === 'orders' && orderFilter === 'cancelled' ? (
        <>
          <h3 className="orders-title">Cancelled Orders</h3>
          {cancelledOrders.length === 0 ? (
            <p>No cancelled orders.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Status When Cancelled</th>
                  <th>Checked Out At</th>
                  <th>Cancelled At</th>
                  <th>Cancellation Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cancelledOrders.map(order => (
                  <tr key={order._id}>
                    <td>{order.roomNumber}</td>
                    <td>
                      <ul className="order-items">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="order-item">
                            <img className="order-img" src={item.img} alt={item.name} />
                            <span className="order-name">{item.name}</span>
                            <span className="order-qty">(x{item.quantity || 1})</span>
                            <span className="order-price">- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="bold">₱{order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</td>
                    <td>{order.statusAtCancellation}</td>
                    <td>{order.checkedOutAt ? new Date(order.checkedOutAt).toLocaleString() : ''}</td>
                    <td>{order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : ''}</td>
                    <td>{order.cancellationReason}</td>
                    <td>
                      <button className="btn btn-delete" onClick={() => handleDeleteCancelled(order._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : null}
    </div>
  );
}

export default RestaurantAdminDashboard;