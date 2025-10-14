import React from 'react';
import LogoutButton from '../../Auth/LogoutButton';
import './RestaurantAdminDashboard.css';

// Toast Notification Component
function ToastNotification({ message, type, onClose }) {
  React.useEffect(() => {
    // persistent notifications (new-order, cancelled) should not auto-dismiss
    const persistent = type === 'new-order' || type === 'cancelled';
    if (persistent) return undefined;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose, type]);

  return (
    <div className={`bg-white rounded-xl shadow-lg border-l-4 p-4 animate-slide-in-right ${
      type === 'new-order' ? 'border-green-400 bg-green-50' : 
      type === 'cancelled' ? 'border-red-400 bg-red-50' : 
      'border-amber-400'
    }`}>
      <div className="flex justify-between items-start">
        <div className={`font-semibold ${
          type === 'new-order' ? 'text-green-800' : 
          type === 'cancelled' ? 'text-red-800' : 
          'text-amber-800'
        }`}>
          {message}
        </div>
        <button 
          className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
          onClick={onClose}
        >
          ×
        </button>
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
  const [menuCategoryFilter, setMenuCategoryFilter] = React.useState('all');

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

  const filteredFoodItems = React.useMemo(() => {
    if (menuCategoryFilter === 'all') return foodItems;
    return foodItems.filter(i => (i.category || '').toLowerCase() === menuCategoryFilter.toLowerCase());
  }, [foodItems, menuCategoryFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-amber-900">Manage Food Menu</h3>
        <div className="flex items-center space-x-3">
          <select
            value={menuCategoryFilter}
            onChange={(e) => setMenuCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-amber-200 bg-white text-amber-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
          >
            <option value="all">All Categories</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="desserts">Desserts</option>
            <option value="snack">Snack</option>
            <option value="beverages">Beverages</option>
          </select>

          <button 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center space-x-2"
            onClick={() => setShowAddPopup(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-center font-semibold ${
          message.includes('success') || message.includes('updated') || message.includes('deleted') 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Price</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Image</th>
              <th className="px-4 py-3 text-left font-semibold">Details</th>
              <th className="px-4 py-3 text-left font-semibold">Available</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFoodItems.map(item => (
              <tr key={item._id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                <td className="px-4 py-3 text-amber-900 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-amber-700">₱{item.price}</td>
                <td className="px-4 py-3 text-amber-700 capitalize">{item.category}</td>
                <td className="px-4 py-3">
                  <img className="w-16 h-16 rounded-lg object-cover border border-amber-300" src={item.img} alt={item.name} />
                </td>
                <td className="px-4 py-3 text-amber-700 max-w-xs truncate">{item.details}</td>
                <td className="px-4 py-3">
                  <button 
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      item.available 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                    onClick={() => handleToggleAvailability(item)}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button 
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(item._id, item.category)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Popup */}
      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h3 className="text-2xl font-bold text-white">Edit Food Item</h3>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <form className="space-y-4" onSubmit={handleEdit}>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Name</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Price</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={editForm.price} 
                    onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Category</label>
                  <select 
                    value={editForm.category} 
                    onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="desserts">Desserts</option>
                    <option value="snack">Snack</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Image URL</label>
                  <input 
                    type="text" 
                    value={editForm.img} 
                    onChange={e => setEditForm(f => ({ ...f, img: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Details</label>
                  <textarea 
                    value={editForm.details} 
                    onChange={e => setEditForm(f => ({ ...f, details: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 resize-none"
                    rows="3"
                  />
                </div>
                <div className="flex justify-center space-x-4 pt-4">
                  <button type="submit" className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                    onClick={() => { setEditId(null); setShowEditPopup(false); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Popup */}
      {showAddPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h3 className="text-2xl font-bold text-white">Add Food Item</h3>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <form className="space-y-4" onSubmit={handleAdd}>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Name</label>
                  <input 
                    type="text" 
                    value={addForm.name} 
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Price</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={addForm.price} 
                    onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Category</label>
                  <select 
                    value={addForm.category} 
                    onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="desserts">Desserts</option>
                    <option value="snack">Snack</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Image URL</label>
                  <input 
                    type="text" 
                    value={addForm.img} 
                    onChange={e => setAddForm(f => ({ ...f, img: e.target.value }))} 
                    required 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Details</label>
                  <textarea 
                    value={addForm.details} 
                    onChange={e => setAddForm(f => ({ ...f, details: e.target.value }))} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 resize-none"
                    rows="3"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={addForm.available} 
                    onChange={e => setAddForm(f => ({ ...f, available: e.target.checked }))} 
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-200"
                  />
                  <label className="text-amber-900 font-semibold">Available</label>
                </div>
                <div className="flex justify-center space-x-4 pt-4">
                  <button type="submit" className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200">
                    Add Food Item
                  </button>
                  <button 
                    type="button" 
                    className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                    onClick={() => setShowAddPopup(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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
      // Ensure FIFO: sort orders by createdAt (or checkedOutAt as fallback) ascending so oldest appear first
      const sorted = (data || []).slice().sort((a, b) => {
        const aTime = new Date(a.createdAt || a.checkedOutAt || 0).getTime();
        const bTime = new Date(b.createdAt || b.checkedOutAt || 0).getTime();
        return aTime - bTime; // oldest first
      });
      setOrders(sorted);
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
      // Ensure FIFO for cancelled orders as well (oldest cancelled order first)
      const sortedCancelled = (data || []).slice().sort((a, b) => {
        const aTime = new Date(a.cancelledAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.cancelledAt || b.createdAt || 0).getTime();
        return aTime - bTime;
      });
      setCancelledOrders(sortedCancelled);
      return data;
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
      return [];
    }
  }, []);

  // Add a notification
  const addNotification = React.useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    // include flags: read (if user has viewed/cleared in popup) and dismissed (if toast was closed)
    setNotifications(prev => [...prev, { id, message, type, read: false, dismissed: false }]);
  }, []);

  // Permanently delete a notification (used in popup Remove button)
  const deleteNotification = React.useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Dismiss a toast only (hide toast UI) but keep notification in popup
  const dismissToast = React.useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
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

    // Update previous state with the sorted arrays returned from fetch helpers
    previousOrdersRef.current = Array.isArray(currentOrders) ? currentOrders : [];
    previousCancelledOrdersRef.current = Array.isArray(currentCancelledOrders) ? currentCancelledOrders : [];
  }, [fetchOrders, fetchCancelledOrders, addNotification, playNotificationSound, showNotificationPopup]);

  React.useEffect(() => {
    // Initial data fetch and setup
    const initializeData = async () => {
      const initialOrders = await fetchOrders();
      const initialCancelledOrders = await fetchCancelledOrders();

      previousOrdersRef.current = Array.isArray(initialOrders) ? initialOrders : [];
      previousCancelledOrdersRef.current = Array.isArray(initialCancelledOrders) ? initialCancelledOrders : [];
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

  const renderOrdersTable = (ordersList, showActions = true, statusType = '') => {
    if (ordersList.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-amber-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg">No {statusType} orders</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <th className="px-4 py-3 text-left font-semibold">Room Number</th>
              <th className="px-4 py-3 text-left font-semibold">Items</th>
              <th className="px-4 py-3 text-left font-semibold">Total Price</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Checked Out At</th>
              {orderFilter === 'cancelled' && (
                <>
                  <th className="px-4 py-3 text-left font-semibold">Cancelled At</th>
                  <th className="px-4 py-3 text-left font-semibold">Cancellation Reason</th>
                </>
              )}
              {showActions && <th className="px-4 py-3 text-left font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {ordersList.map(order => {
              const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
              return (
                <tr key={order._id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3 text-amber-900 font-medium">{order.roomNumber}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <img className="w-12 h-12 rounded-lg object-cover border border-amber-200" src={item.img} alt={item.name} />
                          <div>
                            <div className="font-medium text-amber-900">{item.name}</div>
                            <div className="text-sm text-amber-700">Quantity: {item.quantity || 1}</div>
                            <div className="text-sm font-semibold text-amber-900">
                              ₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-amber-900 font-bold text-lg">₱{totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={getStatusBadgeClass(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-amber-700">
                    {order.checkedOutAt ? new Date(order.checkedOutAt).toLocaleString() : 'N/A'}
                  </td>
                  {orderFilter === 'cancelled' && (
                    <>
                      <td className="px-4 py-3 text-amber-700">
                        {order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-amber-700">{order.cancellationReason}</td>
                    </>
                  )}
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                            onClick={() => handleProgressStatus(order)}
                          >
                            Acknowledge
                          </button>
                        )}
                        {order.status === 'acknowledged' && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                            onClick={() => handleProgressStatus(order)}
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
                            onClick={() => handleProgressStatus(order)}
                          >
                            Mark On The Way
                          </button>
                        )}
                        {order.status === 'on the way' && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                            onClick={() => handleProgressStatus(order)}
                          >
                            Mark Delivered
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'acknowledged') && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                            onClick={() => openCancelPopup(order)}
                          >
                            Cancel
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                            onClick={() => handleDeleteDelivered(order._id)}
                          >
                            Delete
                          </button>
                        )}
                        {orderFilter === 'cancelled' && (
                          <button 
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                            onClick={() => handleDeleteCancelled(order._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Toast Notifications Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
        {notifications.filter(n => !n.dismissed).map(notification => (
          <ToastNotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => dismissToast(notification.id)}
          />
        ))}
      </div>

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
                Lumine Restaurant Admin
              </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <button 
                className="notification-bell relative p-1 rounded hover:bg-amber-700 transition-colors focus:outline-none"
                onClick={handleBellClick} 
                aria-label="Notifications"
              >
                <div className={`p-1 rounded ${showNotificationPopup ? 'bg-amber-600' : ''}`}>
                  <svg className="w-5 h-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                
                {/* Notification Counter */}
                {!showNotificationPopup && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Logout Button */}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Notification Popup */}
      {showNotificationPopup && (
        <div className="notification-popup absolute top-20 right-4 bg-white rounded-2xl shadow-2xl p-6 min-w-80 max-w-sm z-50 border border-amber-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-amber-900">Recent Notifications</h3>
            <span className="text-sm text-gray-500 bg-amber-100 px-2 py-1 rounded-full">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-amber-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    notification.type === 'new-order' 
                      ? 'border-green-200 bg-green-50' 
                      : notification.type === 'cancelled'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-medium text-sm text-amber-900">
                      {notification.message}
                    </div>
                    <button 
                      className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                      onClick={() => deleteNotification(notification.id)}
                      title="Remove notification"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {notification.type.replace('-', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-4">Restaurant Admin Dashboard</h1>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto">
            Manage orders, update menu items, and track restaurant operations
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl border border-amber-200 shadow-lg">
            <div className="flex space-x-1">
              <button
                className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'orders' 
                    ? 'bg-amber-500 text-white shadow-md' 
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                Orders Management
              </button>
              <button
                className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'menu' 
                    ? 'bg-amber-500 text-white shadow-md' 
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
                onClick={() => setActiveTab('menu')}
              >
                Menu Management
              </button>
            </div>
          </div>
        </div>

        {/* Order Filter */}
        {activeTab === 'orders' && (
          <div className="flex justify-center mb-8">
            <select 
              className="px-6 py-3 rounded-xl border-2 border-amber-200 bg-white text-amber-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
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
          </div>
        )}

        {/* Content Area */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'menu' ? (
            <MenuManager />
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
              <h2 className="text-3xl font-bold text-amber-900 mb-8 text-center">
                {orderFilter === 'pending' && 'Pending Orders'}
                {orderFilter === 'acknowledged' && 'Acknowledged Orders'}
                {orderFilter === 'preparing' && 'Preparing Orders'}
                {orderFilter === 'on the way' && 'Orders On The Way'}
                {orderFilter === 'delivered' && 'Delivered Orders'}
                {orderFilter === 'cancelled' && 'Cancelled Orders'}
              </h2>
              
              {orderFilter === 'pending' && renderOrdersTable(pendingOrders, true, 'pending')}
              {orderFilter === 'acknowledged' && renderOrdersTable(acknowledgedOrders, true, 'acknowledged')}
              {orderFilter === 'preparing' && renderOrdersTable(preparingOrders, true, 'preparing')}
              {orderFilter === 'on the way' && renderOrdersTable(onTheWayOrders, true, 'on the way')}
              {orderFilter === 'delivered' && renderOrdersTable(deliveredOrders, true, 'delivered')}
              {orderFilter === 'cancelled' && renderOrdersTable(cancelledOrders, true, 'cancelled')}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Popup */}
      {showCancelPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h3 className="text-2xl font-bold text-white">Cancel Order</h3>
            </div>
            <div className="p-6">
              <p className="text-amber-900 mb-4">Please provide a reason for cancellation:</p>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 resize-none"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                rows="4"
                required
              />
              <div className="flex justify-center space-x-4 mt-6">
                <button 
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                  onClick={handleCancelOrder}
                >
                  Confirm Cancellation
                </button>
                <button 
                  className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                  onClick={() => setShowCancelPopup(false)}
                >
                  Go Back
                </button>
              </div>
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

export default RestaurantAdminDashboard;