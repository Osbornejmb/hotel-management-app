import React from 'react';
import axios from 'axios';
import LogoutButton from '../../Auth/LogoutButton';
import CarouselManager from './CarouselManager';
import './RestaurantAdminDashboard.css';
// Charts
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
// PDF export
import { jsPDF } from 'jspdf';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  }, [apiBase]);

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
  // Loading and pending-delete states for menu actions
  const [togglingItemId, setTogglingItemId] = React.useState(null);
  const [menuSaving, setMenuSaving] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(null); // { id, category, timeoutId }

  const fetchFood = React.useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food`);
      const data = await res.json();
      setFoodItems(Object.entries(data).flatMap(([cat, arr]) => arr.map(item => ({ ...item, category: cat }))));
    } catch (error) {
      console.error('Error fetching food:', error);
    }
  }, [apiBase]);

  const handleToggleAvailability = React.useCallback(async (item) => {
    setTogglingItemId(item._id);
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
    } finally {
      setTogglingItemId(null);
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
      setMenuSaving(true);
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
    } finally {
      setMenuSaving(false);
    }
  }, [addForm, fetchFood]);

  const handleDelete = React.useCallback(async (id, category) => {
    // schedule deletion with undo
    if (pendingDelete && pendingDelete.id === id) return;
    const timeoutId = setTimeout(async () => {
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
      } finally {
        setPendingDelete(null);
      }
    }, 6000); // 6s undo window

    setPendingDelete({ id, category, timeoutId });
    setMessage('Food item scheduled for deletion. You have 6 seconds to undo.');
  }, [fetchFood, pendingDelete]);

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
          <div className="flex items-center justify-center gap-4">
            <div>{message}</div>
            {pendingDelete && (
              <button
                className="px-4 py-2 rounded-lg bg-white border border-amber-200 text-amber-700 font-semibold hover:bg-amber-50"
                onClick={() => {
                  // cancel pending delete
                  clearTimeout(pendingDelete.timeoutId);
                  setPendingDelete(null);
                  setMessage('Deletion cancelled.');
                }}
              >
                Undo
              </button>
            )}
          </div>
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
                    disabled={togglingItemId === item._id}
                  >
                    {togglingItemId === item._id ? 'Updating...' : (item.available ? 'Available' : 'Unavailable')}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button 
                      className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                      onClick={() => startEdit(item)}
                      disabled={menuSaving}
                    >
                      {menuSaving ? 'Saving...' : 'Edit'}
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(item._id, item.category)}
                      disabled={pendingDelete !== null}
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

// Generate dynamic summary and analysis of food orders
function generateOrderAnalysisSummary(orders, foods = null) {
  /**
   * Generates a comprehensive summary and analysis of food orders
   * @param {Array} orders - Array of order objects with items, roomNumber, checkedOutAt properties
   * @returns {Object} - Contains summary and analysis
   */

  if (!orders || orders.length === 0) {
    return {
      summary: {
        totalOrders: 0,
        totalItemsOrdered: 0,
        itemFrequency: {},
        itemsByDay: {},
        itemsByRoom: {},
        commonPairings: []
      },
      analysis: {
        peakOrderingDays: [],
        mostFrequentItems: [],
        mostActiveRooms: [],
        mostCommonPairings: [],
        patterns: []
      },
      rawAnalysis: "No order data available for analysis."
    };
  }

  // Initialize tracking objects
  const itemFrequency = {};
  const itemsByDay = {};
  const itemsByRoom = {};
  const pairingMap = {}; // to track item combinations
  const roomOrderCounts = {};
  const dayOrderCounts = {};

  // Prepare food lookup maps if foods provided
  const foodsByImg = {};
  const foodsByPriceCat = {};
  const foodsByName = {};
  if (Array.isArray(foods)) {
    foods.forEach(f => {
      if (!f) return;
      if (f.img) foodsByImg[f.img] = f;
      const key = `${f.price || ''}|${(f.category || '').toString().toLowerCase()}`;
      if (!foodsByPriceCat[key]) foodsByPriceCat[key] = [];
      foodsByPriceCat[key].push(f);
      if (f.name) foodsByName[f.name.toString().toLowerCase()] = f;
    });
  }

  const mapName = (raw) => {
    if (!raw) return raw;
    const name = (raw.name || raw).toString();
    const lname = name.toLowerCase();
    if (foodsByName[lname]) return foodsByName[lname].name;
    if (raw.img && foodsByImg[raw.img]) return foodsByImg[raw.img].name;
    const key = `${raw.price || ''}|${(raw.category || '').toString().toLowerCase()}`;
    const list = foodsByPriceCat[key] || [];
    if (list.length === 1) return list[0].name;
    return name;
  };

  // Process each order
  orders.forEach(order => {
    if (!order.items || order.items.length === 0) return;

    // Extract day from checkedOutAt (YYYY-MM-DD format)
    const orderDate = order.checkedOutAt 
      ? new Date(order.checkedOutAt).toISOString().split('T')[0]
      : 'unknown-date';
    
    const roomNumber = order.roomNumber || 'unknown-room';

    // Track day and room order counts
    dayOrderCounts[orderDate] = (dayOrderCounts[orderDate] || 0) + 1;
    roomOrderCounts[roomNumber] = (roomOrderCounts[roomNumber] || 0) + 1;

    // Count quantities per item in this order (including combo components)
    const orderItemCounts = {};
    (order.items || []).forEach(item => {
      if (!item) return;

      if (Array.isArray(item.comboContents) && item.comboContents.length > 0) {
        // Sum quantities for components (map to current food names when possible)
        item.comboContents.forEach(component => {
          if (!component || !component.name) return;
          const name = mapName(component);
          const qty = Number(component.quantity) || 1;
          orderItemCounts[name] = (orderItemCounts[name] || 0) + qty;
        });
      } else if (item.name) {
        const name = mapName(item);
        const qty = Number(item.quantity) || 1;
        orderItemCounts[name] = (orderItemCounts[name] || 0) + qty;
      }
    });

    // Process each item (respecting quantities)
    const uniqueItems = Object.keys(orderItemCounts);
    uniqueItems.forEach(itemName => {
      const qty = orderItemCounts[itemName] || 0;
      // Track frequency by total units sold (account for quantity)
      itemFrequency[itemName] = (itemFrequency[itemName] || 0) + qty;

      // Track by day (presence)
      if (!itemsByDay[itemName]) itemsByDay[itemName] = [];
      if (!itemsByDay[itemName].includes(orderDate)) {
        itemsByDay[itemName].push(orderDate);
      }

      // Track by room (presence)
      if (!itemsByRoom[itemName]) itemsByRoom[itemName] = [];
      if (!itemsByRoom[itemName].includes(roomNumber)) {
        itemsByRoom[itemName].push(roomNumber);
      }
    });

    // Track common pairings (items that appear together)
    // Track common pairings (items that appear together)
    if (uniqueItems.length > 1) {
      // Weight pairings by the number of co-occurring units (min of the two quantities)
      for (let i = 0; i < uniqueItems.length; i++) {
        for (let j = i + 1; j < uniqueItems.length; j++) {
          const a = uniqueItems[i];
          const b = uniqueItems[j];
          const pairing = [a, b].sort().join(' + ');
          const weight = Math.min(orderItemCounts[a] || 0, orderItemCounts[b] || 0) || 1;
          pairingMap[pairing] = (pairingMap[pairing] || 0) + weight;
        }
      }
    }
  });

  // Calculate totals
  const totalItems = Object.values(itemFrequency).reduce((sum, count) => sum + count, 0);

  // Sort item frequencies (full list) and extract top results separately
  const sortedItemFrequencyFull = Object.entries(itemFrequency)
    .sort((a, b) => b[1] - a[1]);
  const sortedItemFrequency = sortedItemFrequencyFull.slice(0, 10);

  const sortedDays = Object.entries(dayOrderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sortedRooms = Object.entries(roomOrderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sortedPairings = Object.entries(pairingMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Compile summary
  const summary = {
    totalOrders: orders.length,
    totalItemsOrdered: totalItems,
    // full frequency map (all items)
    itemFrequency: Object.fromEntries(sortedItemFrequencyFull),
    // top items kept separately in analysis.mostFrequentItems
    itemsByDay: Object.fromEntries(
      Object.entries(itemsByDay).map(([item, days]) => [item, days.length])
    ),
    itemsByRoom: Object.fromEntries(
      Object.entries(itemsByRoom).map(([item, rooms]) => [item, rooms.length])
    ),
    commonPairings: sortedPairings.map(([pairing, count]) => ({
      pairing,
      frequency: count
    }))
  };

  // Generate analysis insights
  const analysis = {
    peakOrderingDays: sortedDays.map(([day, count]) => ({
      date: day,
      orderCount: count
    })),
    mostFrequentItems: sortedItemFrequency.map(([name, count]) => ({
      name,
      orderCount: count,
      daysOrdered: itemsByDay[name]?.length || 0,
      roomsOrdered: itemsByRoom[name]?.length || 0
    })),
    mostActiveRooms: sortedRooms.map(([room, count]) => ({
      roomNumber: room,
      totalOrders: count
    })),
    mostCommonPairings: sortedPairings.map(([pairing, count]) => ({
      items: pairing,
      frequency: count
    })),
    patterns: generatePatterns(
      summary,
      sortedItemFrequency,
      sortedDays,
      sortedRooms,
      sortedPairings,
      orders
    )
  };

  // Identify low-performing items for insights
  try {
    // Deterministic selection: always return the lowest 10 items by orderCount
    const lowPerformers = Object.entries(summary.itemFrequency)
      .map(([name, count]) => ({ name, orderCount: count }))
      .sort((a, b) => a.orderCount - b.orderCount)
      .slice(0, 10);

    analysis.lowPerformers = lowPerformers;
  } catch (e) {
    analysis.lowPerformers = [];
  }

  // Generate actionable recommendations based on analysis
  analysis.recommendations = generateRecommendations(summary, analysis, orders);

  // Generate raw written analysis
  const rawAnalysis = generateRawAnalysis(summary, analysis);

  return {
    summary,
    analysis,
    rawAnalysis,
    generatedAt: new Date().toISOString()
  };
}

// Helper function to generate pattern insights
function generatePatterns(summary, sortedItems, sortedDays, sortedRooms, sortedPairings, orders) {
  const patterns = [];

  // Pattern 1: Peak ordering periods
  if (sortedDays.length > 0) {
    const peakDay = sortedDays[0];
    const avgOrdersPerDay = summary.totalOrders / Object.keys(summary.itemsByDay).length;
    if (peakDay[1] > avgOrdersPerDay * 1.5) {
      patterns.push(`Peak ordering detected on ${peakDay[0]} with ${peakDay[1]} orders (${Math.round((peakDay[1] / avgOrdersPerDay - 1) * 100)}% above average).`);
    }
  }

  // Pattern 2: Most popular item
  if (sortedItems.length > 0) {
    const topItem = sortedItems[0];
    const percentage = Math.round((topItem[1] / summary.totalItemsOrdered) * 100);
    patterns.push(`"${topItem[0]}" is the most popular item, appearing in ${topItem[1]} orders (${percentage}% of all items ordered).`);
  }

  // Pattern 3: Item pairing trends
  if (sortedPairings.length > 0) {
    const topPairing = sortedPairings[0];
    patterns.push(`Strong item pairing detected: "${topPairing[0]}" appears together ${topPairing[1]} times.`);
  }

  // Pattern 4: Room ordering behavior
  if (sortedRooms.length > 0) {
    const activeRooms = sortedRooms.length;
    const topRoom = sortedRooms[0];
    const avgOrdersPerRoom = summary.totalOrders / activeRooms;
    if (topRoom[1] > avgOrdersPerRoom * 1.5) {
      patterns.push(`Room ${topRoom[0]} is exceptionally active with ${topRoom[1]} orders, ${Math.round((topRoom[1] / avgOrdersPerRoom - 1) * 100)}% above average.`);
    }
  }

  // Pattern 5: Inventory insights
  if (sortedItems.length >= 2) {
    const topTwo = sortedItems.slice(0, 2);
    const difference = topTwo[0][1] - topTwo[1][1];
    if (difference > 5) {
      patterns.push(`Significant demand gap: "${topTwo[0][0]}" outpaces "${topTwo[1][0]}" by ${difference} orders.`);
    }
  }

  // Pattern 6: Diversification
  const uniqueItems = Object.keys(summary.itemFrequency).length;
  if (uniqueItems > 10) {
    patterns.push(`High menu diversity observed with ${uniqueItems} different items ordered.`);
  } else if (uniqueItems <= 5) {
    patterns.push(`Limited menu diversity: only ${uniqueItems} items were ordered. Consider promotions for other menu items.`);
  }

  return patterns;
}

// Helper function to generate actionable recommendations
function generateRecommendations(summary, analysis, orders) {
  const recommendations = [];

  // 1) Recommendations for top items
  (analysis.mostFrequentItems || []).slice(0, 6).forEach(item => {
    const examplePair = (summary.commonPairings || []).find(p => p.pairing.toLowerCase().includes(item.name.toLowerCase()));
    const actions = [];
      actions.push(`Feature "${item.name}" in Top Items / Hero banner of menu`);
      actions.push(`Create a one-click bundle with its most common pairing${examplePair ? ` (e.g. ${examplePair.pairing})` : ''}`);
    actions.push('Mark as inventory priority and set low-stock alerts');
    actions.push('Run a 2-week A/B price test (small premium vs control) to measure elasticity');
    actions.push('Promote as a time-limited special during off-peak to boost slow periods');

    recommendations.push({
      type: 'top-item',
      item: item.name,
      priority: 'high',
      reason: `${item.name} appears in ${item.orderCount} orders and across ${item.daysOrdered} days`,
      actions
    });
  });

  // 2) Recommendations for common pairings
  (summary.commonPairings || []).slice(0, 6).forEach(pair => {
    const actions = [];
    actions.push(`Create a combo product for ${pair.pairing} with a small discount (5-10%)`);
    actions.push('Add pairing as a checkout upsell / recommended add-on with one-click');
    actions.push('Track bundle attach rate and conversion over 2 weeks');

    recommendations.push({
      type: 'pairing',
      pairing: pair.pairing,
      priority: 'high',
      reason: `Pairing appears ${pair.frequency} times`,
      actions
    });
  });

  // 3) Peak day recommendations (staffing & prep)
  (analysis.peakOrderingDays || []).slice(0, 3).forEach(day => {
    const actions = [];
    actions.push(`Increase kitchen staff and prep quantities on ${day.date} (plan +20% capacity based on historical peak).`);
    actions.push('Prepare ingredient prep-sheets and staging for the shift');
    actions.push('Consider surge pricing only if capacity is constrained');

    recommendations.push({
      type: 'peak-day',
      date: day.date,
      priority: 'medium',
      reason: `High orders (${day.orderCount}) on ${day.date}`,
      actions
    });
  });

  // 4) Top rooms (VIP & targeting)
  (analysis.mostActiveRooms || []).slice(0, 6).forEach(room => {
    const actions = [];
    actions.push('Flag as high-value room for personalized offers');
    actions.push('Offer a targeted discount or free item on next order to increase retention');
    actions.push('Consider a loyalty or VIP program for repeated high-frequency rooms');

    recommendations.push({
      type: 'top-room',
      room: room.roomNumber,
      priority: 'medium',
      reason: `Room ${room.roomNumber} placed ${room.totalOrders} orders`,
      actions
    });
  });

  // 5) Operational & strategic recommendations
  // Menu diversity / demand gaps
  if (analysis.patterns && analysis.patterns.length) {
    recommendations.push({
      type: 'patterns',
      priority: 'low',
      reason: 'Auto-detected patterns',
      actions: analysis.patterns.slice(0,5).map(p => `Investigate pattern: ${p}`)
    });
  }

  recommendations.push({
    type: 'quick-wins',
    priority: 'high',
    reason: 'Immediate action suggestions',
    actions: [
      'Highlight top 3 items on menu and home screen',
      'Create 2 quick bundles from top pairings and measure attach rate',
      'Set low-stock alerts for top 10 items'
    ]
  });

  // Recommendations for low-performing items
  (analysis.lowPerformers || []).slice(0, 8).forEach(item => {
    const actions = [];
    actions.push(`Run a 2-week promotional test for "${item.name}" (10-20% discount)`);
    actions.push('Bundle this item with a top-performing item and measure attach rate');
    actions.push('Verify inventory & availability; check if low orders are due to stockouts or visibility');
    actions.push('Consider menu placement changes or temporary removal if unprofitable');

    recommendations.push({
      type: 'low-performer',
      item: item.name,
      priority: 'medium',
      reason: `${item.name} has low orders (${item.orderCount} orders)`,
      actions
    });
  });

  return recommendations;
}

// Helper function to generate written analysis
function generateRawAnalysis(summary, analysis) {
  let text = "=== FOOD ORDER ANALYSIS REPORT ===\n\n";

  text += `OVERVIEW\n`;
  text += `Total Orders Analyzed: ${summary.totalOrders}\n`;
  text += `Total Items Ordered: ${summary.totalItemsOrdered}\n`;
  text += `Unique Items: ${Object.keys(summary.itemFrequency).length}\n\n`;

  if (analysis.mostFrequentItems.length > 0) {
    text += `TOP PERFORMING ITEMS\n`;
    analysis.mostFrequentItems.slice(0, 5).forEach((item, idx) => {
      text += `${idx + 1}. ${item.name}: ${item.orderCount} orders (across ${item.daysOrdered} days, ${item.roomsOrdered} rooms)\n`;
    });
    text += "\n";
  }

  if (analysis.peakOrderingDays.length > 0) {
    text += `PEAK ORDERING PERIODS\n`;
    analysis.peakOrderingDays.forEach(day => {
      text += `${day.date}: ${day.orderCount} orders\n`;
    });
    text += "\n";
  }

  if (analysis.mostActiveRooms.length > 0) {
    text += `MOST ACTIVE ROOMS\n`;
    analysis.mostActiveRooms.forEach(room => {
      text += `Room ${room.roomNumber}: ${room.totalOrders} orders\n`;
    });
    text += "\n";
  }

  if (analysis.mostCommonPairings.length > 0) {
    text += `ITEM PAIRINGS (Items Frequently Ordered Together)\n`;
    analysis.mostCommonPairings.slice(0, 5).forEach(pairing => {
      text += `${pairing.items}: ${pairing.frequency} times\n`;
    });
    text += "\n";
  }

  text += `KEY INSIGHTS\n`;
  if (analysis.patterns.length > 0) {
    analysis.patterns.forEach((pattern, idx) => {
      text += `• ${pattern}\n`;
    });
  } else {
    text += "• Insufficient data for pattern analysis.\n";
  }

  // Append readable recommendations section if available
  text += `\nRECOMMENDATIONS\n`;
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    analysis.recommendations.forEach((rec, idx) => {
      const header = rec.type ? rec.type.toString().toUpperCase() : `RECOMMENDATION`;
      text += `${idx + 1}. ${header} - ${rec.reason || ''}\n`;
      if (rec.item) text += `   Item: ${rec.item}\n`;
      if (rec.pairing) text += `   Pairing: ${rec.pairing}\n`;
      if (rec.room) text += `   Room: ${rec.room}\n`;
      if (rec.date) text += `   Date: ${rec.date}\n`;
      if (rec.actions && rec.actions.length) {
        rec.actions.slice(0, 10).forEach(action => {
          text += `     - ${action}\n`;
        });
      }
      text += "\n";
    });
  } else {
    text += "No automated recommendations available.\n\n";
  }

  return text;
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
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [orders, setOrders] = React.useState([]);
  const [cancelledOrders, setCancelledOrders] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('orders');
  // analysis result for analytics tab
  const [analysisResult, setAnalysisResult] = React.useState(null);
  const [topItemQuery, setTopItemQuery] = React.useState('');
  // Controls to collapse/expand long analytics lists to reduce scrolling
  const [showAllTopItems, setShowAllTopItems] = React.useState(false);
  const [showAllPairings, setShowAllPairings] = React.useState(false);
  const [showAllPeakDays, setShowAllPeakDays] = React.useState(false);
  const [showAllRooms, setShowAllRooms] = React.useState(false);
  const [showAllLowPerformers, setShowAllLowPerformers] = React.useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = React.useState(false);
  const [orderFilter, setOrderFilter] = React.useState('pending');
  const [showCancelPopup, setShowCancelPopup] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [notifications, setNotifications] = React.useState([]);
  const [showNotificationPopup, setShowNotificationPopup] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = React.useState(null);
  
  // Refs to track previous state for comparison
  const previousOrdersRef = React.useRef([]);
  const previousCancelledOrdersRef = React.useRef([]);

  // Notification sound hook
  const playNotificationSound = useNotificationSound();

  const fetchOrders = React.useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/cart/orders/all`);
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
      const res = await fetch(`${apiBase}/api/cart/orders/cancelled`);
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

  // Clear all notifications (used by "Clear all" button in popup)
  const clearAllNotifications = React.useCallback(() => {
    setNotifications([]);
    setNotificationCount(0);
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

  // Recompute analysis whenever orders change
  React.useEffect(() => {
    (async () => {
      try {
        let foods = null;
        try {
          const res = await axios.get(`${apiBase}/api/food`);
          let all = [];
          if (res.data && typeof res.data === 'object') {
            Object.values(res.data).forEach(arr => { if (Array.isArray(arr)) all = all.concat(arr); });
          }
          foods = all;
        } catch (err) {
          // ignore food fetch errors and fall back to name-only mapping
          foods = null;
        }

        const result = generateOrderAnalysisSummary(orders, foods);
        setAnalysisResult(result);
      } catch (e) {
        console.error('Error generating order analysis:', e);
        setAnalysisResult(null);
      }
    })();
  }, [orders, apiBase]);

  // Compute per-item room counts (which room ordered an item the most)
  const perItemRoomCounts = React.useMemo(() => {
    const map = {};
    (orders || []).forEach(order => {
      const room = order.roomNumber || 'unknown-room';
      (order.items || []).forEach(item => {
        if (!item) return;
        const itemQty = item.quantity || 1;

        // Count the main item (combo or single item)
        const mainName = item.name || 'unknown-item';
        if (!map[mainName]) map[mainName] = {};
        map[mainName][room] = (map[mainName][room] || 0) + itemQty;

        // If this is a combo, also count each component toward per-item room counts
        if (Array.isArray(item.comboContents)) {
          item.comboContents.forEach(component => {
            if (!component || !component.name) return;
            const compQty = (component.quantity || 1) * itemQty;
            const compName = component.name;
            if (!map[compName]) map[compName] = {};
            map[compName][room] = (map[compName][room] || 0) + compQty;
          });
        }
      });
    });
    return map;
  }, [orders]);

  const perItemTopRoom = React.useMemo(() => {
    const out = {};
    Object.entries(perItemRoomCounts).forEach(([item, rooms]) => {
      const sorted = Object.entries(rooms).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        out[item] = { room: sorted[0][0], count: sorted[0][1] };
      } else {
        out[item] = { room: null, count: 0 };
      }
    });
    return out;
  }, [perItemRoomCounts]);

  // Build a searchable list of all items (not just the top N) for the Top Items search
  const searchableItems = React.useMemo(() => {
    if (!analysisResult || !analysisResult.summary) return [];
    const freq = analysisResult.summary.itemFrequency || {};
    // summary contains precomputed counts per item: itemsByDay and itemsByRoom
    const itemsByDay = analysisResult.summary.itemsByDay || {};
    const itemsByRoom = analysisResult.summary.itemsByRoom || {};
    return Object.entries(freq).map(([name, count]) => {
      return {
        name,
        orderCount: count,
        daysOrdered: itemsByDay[name] || 0,
        roomsOrdered: itemsByRoom[name] || 0
      };
    });
  }, [analysisResult]);

  // Export the generated rawAnalysis as a PDF file download
  const handleExportPDF = React.useCallback(() => {
    if (!analysisResult) {
      alert('No analysis available to export.');
      return;
    }

    try {
      const content = analysisResult.rawAnalysis || '';
      
      // Create a new PDF document (A4, portrait)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // PDF document properties
      doc.setProperties({
        title: 'Food Order Analysis Report',
        subject: 'Restaurant Analytics Report',
        author: 'Lumine Restaurant Admin',
        keywords: 'orders, analysis, restaurant'
      });

      // Set font and colors
      doc.setTextColor(180, 83, 9); // amber-900
      doc.setFontSize(20);
      doc.text('Food Order Analysis Report', 15, 20);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);

      // Add a horizontal line
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.line(15, 35, 195, 35);

      // Split content into lines and add to PDF
      doc.setTextColor(59, 42, 18); // amber-950
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      const lineHeight = 5;
      let yPosition = 42;

      // Split text into lines and handle page breaks
      const lines = doc.splitTextToSize(content, maxWidth);
      
      lines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Add footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text('Lumine Restaurant Analytics', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Download the PDF
      doc.save(`food-order-analysis-${new Date().getTime()}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF. Please try again.');
    }
  }, [analysisResult]);

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
                            onClick={() => setConfirmDeleteOrderId(order._id)}
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
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 bg-amber-100 px-2 py-1 rounded-full">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAllNotifications}
                className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
                title="Clear all notifications"
              >
                Clear all
              </button>
            </div>
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
            <div className="flex space-x-1 flex-wrap">
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
              <button
                className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'carousel'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
                onClick={() => setActiveTab('carousel')}
              >
                Carousel
              </button>
              <button
                className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
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
          ) : activeTab === 'carousel' ? (
            <CarouselManager />
          ) : activeTab === 'analytics' ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
              <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">Analytics & Visuals</h2>
              {!analysisResult ? (
                <div className="text-center py-12 text-gray-500">Loading analysis...</div>
              ) : (
                <div className="space-y-6">
                  {/* Visuals (moved to top) */}
                  <div className="analytics-visuals-wrapper">
                    <h3 className="text-xl font-semibold text-amber-900 mb-3">Visuals</h3>
                    <div className="p-2 bg-white rounded-lg border border-amber-100 overflow-visible">
                      {(() => {
                        const top = (analysisResult.analysis.mostFrequentItems || []).slice(0, 8);
                        const barLabels = top.map(i => i.name);
                        const barValues = top.map(i => i.orderCount);
                        const colors = ['#F59E0B', '#F97316', '#FB923C', '#FCD34D', '#FDBA74', '#F97316', '#FB923C', '#F59E0B'];
                        const barData = { labels: barLabels, datasets: [{ label: 'Orders', data: barValues, backgroundColor: barLabels.map((_, idx) => colors[idx % colors.length]) }] };
                        const barOptions = { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false } }, layout: { padding: { top: 8, right: 8, left: 4, bottom: 4 } }, scales: { x: { grid: { display: false }, ticks: { color: '#5b3e24' } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#5b3e24' } } } };

                        let daysAll = (analysisResult.analysis.peakOrderingDays || []).slice();
                        // Sort oldest to newest (chronological)
                        daysAll.sort((a, b) => new Date(a.date) - new Date(b.date));
                        const daysToShowCount = showAllPeakDays ? daysAll.length : Math.min(10, daysAll.length);
                        const daysToShow = daysAll.slice(0, daysToShowCount);
                        const lineLabels = daysToShow.map(d => d.date);
                        const lineValues = daysToShow.map(d => d.orderCount);
                        const lineData = { labels: lineLabels, datasets: [{ label: 'Orders', data: lineValues, borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.18)', tension: 0.3, fill: true }] };
                        const lineOptions = { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } }, scales: { x: { ticks: { color: '#92400E' } }, y: { beginAtZero: true, ticks: { color: '#92400E' } } } };

                        return (
                          <div className="analytics-visuals-grid">
                            <div className="analytics-chart-container analytics-large-chart">
                              <div className="chart-title text-sm text-amber-800 font-semibold mb-2">Top Items (by orders)</div>
                              <Bar data={barData} options={barOptions} />
                            </div>

                            <div className="analytics-chart-container analytics-large-chart">
                              <div className="chart-title text-sm text-amber-800 font-semibold mb-2">Peak Ordering Days</div>
                              <Line data={lineData} options={lineOptions} />
                              {daysAll.length > daysToShow.length && (
                                <div className="mt-2 text-center">
                                  <button className="px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-sm analytics-toggle-btn" onClick={() => setShowAllPeakDays(s => !s)} aria-expanded={showAllPeakDays}>
                                    {showAllPeakDays ? 'Show less' : `Show all (${daysAll.length})`}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Summary cards */}
                  <div className="analytics-summary-wrapper">
                    <div className="analytics-summary-sticky">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 analytics-grid">
                        <div className="analytics-card">
                      <div className="analytics-card-header">Total Orders</div>
                      <div className="analytics-card-body">{analysisResult.summary.totalOrders}</div>
                    </div>
                    <div className="analytics-card">
                      <div className="analytics-card-header">Total Items Ordered</div>
                      <div className="analytics-card-body">{analysisResult.summary.totalItemsOrdered}</div>
                    </div>
                    <div className="analytics-card">
                      <div className="analytics-card-header">Unique Items</div>
                      <div className="analytics-card-body">{Object.keys(analysisResult.summary.itemFrequency).length}</div>
                    </div>
                    <div className="analytics-card">
                      <div className="analytics-card-header">Most Active Room</div>
                      <div className="analytics-card-body small">{analysisResult.analysis.mostActiveRooms && analysisResult.analysis.mostActiveRooms[0] ? analysisResult.analysis.mostActiveRooms[0].roomNumber : 'N/A'}</div>
                      <div className="analytics-card-sub">{analysisResult.analysis.mostActiveRooms && analysisResult.analysis.mostActiveRooms[0] ? `${analysisResult.analysis.mostActiveRooms[0].totalOrders} orders` : ''}</div>
                    </div>
                      </div>
                    </div>
                  </div>

                    {/* Top items + Low performers (side-by-side) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="analytics-section top-items">
                        <h3 className="text-xl font-semibold text-amber-900 mb-3">Top Items</h3>
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Search top items..."
                          value={topItemQuery}
                          onChange={(e) => setTopItemQuery(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 focus:outline-none"
                        />
                      </div>
                      <ul className="space-y-2">
                        {(() => {
                          const filtered = searchableItems.filter(i => i.name.toLowerCase().includes(topItemQuery.toLowerCase()));
                          const maxShow = showAllTopItems ? filtered.length : 8;
                          return filtered.slice(0, maxShow).map(item => {
                            const topRoom = perItemTopRoom[item.name] || { room: null, count: 0 };
                            return (
                              <li key={item.name} className="flex justify-between items-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                                <div>
                                  <div className="font-medium text-amber-900">{item.name}</div>
                                  <div className="text-sm text-amber-700">{item.daysOrdered} days · {item.roomsOrdered} rooms</div>
                                  <div className="text-sm text-amber-700">Top room: <span className="font-semibold text-amber-900">{topRoom.room || 'N/A'}</span> {topRoom.count ? `(${topRoom.count} total item${topRoom.count === 1 ? '' : 's'} ordered)` : ''}</div>
                                </div>
                                <div className="text-amber-900 font-semibold">
                                  {item.orderCount} <span className="text-sm text-amber-700 font-normal">orders</span>
                                </div>
                              </li>
                            );
                          });
                        })()}
                      </ul>
                      {/* Toggle for more/less */}
                      {searchableItems.filter(i => i.name.toLowerCase().includes(topItemQuery.toLowerCase())).length > 8 && (
                        <div className="mt-2 text-center">
                          <button
                            className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm"
                            onClick={() => setShowAllTopItems(prev => !prev)}
                          >
                            {showAllTopItems ? 'Show less' : `Show all (${searchableItems.filter(i => i.name.toLowerCase().includes(topItemQuery.toLowerCase())).length})`}
                          </button>
                        </div>
                      )}
                      
                    </div>

                    <div className="analytics-section low-performers">
                      <h3 className="text-xl font-semibold text-amber-900 mb-3">Least Performing Items</h3>
                      <div className="p-4 bg-white rounded-lg border border-amber-100">
                        <ul className="space-y-2">
                          {(() => {
                            const list = (analysisResult.analysis.lowPerformers || []).slice();
                            // Ensure list is sorted least -> most (ascending by orderCount)
                            list.sort((a, b) => a.orderCount - b.orderCount);
                            const maxShow = showAllLowPerformers ? list.length : Math.min(10, list.length);
                            return list.slice(0, maxShow).map(lp => (
                              <li key={lp.name} className="flex justify-between items-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                                <div className="text-amber-900">{lp.name}</div>
                                <div className="text-amber-900 font-semibold">
                                  {lp.orderCount} <span className="text-sm text-amber-700 font-normal">orders</span>
                                </div>
                              </li>
                            ));
                          })()}
                        </ul>
                        {analysisResult.analysis.lowPerformers.length > 10 && (
                          <div className="mt-2 text-center">
                            <button className="px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-sm analytics-toggle-btn" onClick={() => setShowAllLowPerformers(s => !s)} aria-expanded={showAllLowPerformers} aria-label={showAllLowPerformers ? 'Show fewer low order items' : 'Show all low order items'}>
                              {showAllLowPerformers ? 'Show less' : `Show all (${analysisResult.analysis.lowPerformers.length})`}
                            </button>
                          </div>
                        )}
                        <div className="mt-4 text-sm text-amber-700">
                          Suggested actions: run promotions, bundle with popular items, check availability or consider menu changes.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pairings and peak days */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 analytics-sections-grid">
                    <div className="analytics-section pairings">
                      <h3 className="text-xl font-semibold text-amber-900 mb-3">Common Pairings</h3>
                      <ul className="space-y-2">
                        {(() => {
                          const list = analysisResult.summary.commonPairings || [];
                          const maxShow = showAllPairings ? list.length : 6;
                          return list.slice(0, maxShow).map(p => (
                            <li key={p.pairing} className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex justify-between">
                              <div className="text-amber-900">{p.pairing}</div>
                              <div className="font-semibold text-amber-900">{p.frequency}</div>
                            </li>
                          ));
                        })()}
                      </ul>
                      {analysisResult.summary.commonPairings.length > 6 && (
                        <div className="mt-2 text-center">
                          <button className="px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-sm analytics-toggle-btn" onClick={() => setShowAllPairings(p => !p)} aria-expanded={showAllPairings} aria-label={showAllPairings ? 'Show fewer pairings' : 'Show all pairings'}>
                            {showAllPairings ? 'Show less' : `Show all (${analysisResult.summary.commonPairings.length})`}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="analytics-section peak-days">
                      <h3 className="text-xl font-semibold text-amber-900 mb-3">Peak Ordering Days</h3>
                      <div className="p-4 bg-white rounded-lg border border-amber-100">
                        {(() => {
                          const days = (analysisResult.analysis.peakOrderingDays || []).slice();
                          // Sort oldest -> newest (chronological)
                          days.sort((a, b) => new Date(a.date) - new Date(b.date));
                          const maxShow = showAllPeakDays ? days.length : Math.min(6, days.length);
                          return (
                            <div>
                              <ul className="space-y-2">
                                {days.slice(0, maxShow).map(d => (
                                  <li key={d.date} className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex justify-between">
                                    <div className="text-amber-900">{d.date}</div>
                                    <div className="font-semibold text-amber-900">{d.orderCount} orders</div>
                                  </li>
                                ))}
                              </ul>
                              {days.length > maxShow && (
                                <div className="mt-2 text-center">
                                  <button className="px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-sm analytics-toggle-btn" onClick={() => setShowAllPeakDays(s => !s)} aria-expanded={showAllPeakDays} aria-label={showAllPeakDays ? 'Show fewer peak days' : 'Show all peak days'}>
                                    {showAllPeakDays ? 'Show less' : `Show all (${days.length})`}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Top rooms list */}
                  <div className="mt-6 analytics-section top-rooms">
                    <h3 className="text-xl font-semibold text-amber-900 mb-3">Top Rooms by Orders</h3>
                    <div className="p-4 bg-white rounded-lg border border-amber-100">
                      <ul className="space-y-2">
                        {(() => {
                          const list = (analysisResult.analysis.mostActiveRooms || []);
                          const maxShow = showAllRooms ? list.length : 6;
                          return list.slice(0, maxShow).map(r => (
                            <li key={r.roomNumber} className="flex justify-between items-center p-2 rounded-lg bg-amber-50 border border-amber-100">
                              <div className="text-amber-900">Room {r.roomNumber}</div>
                              <div className="font-semibold text-amber-900">{r.totalOrders} orders</div>
                            </li>
                          ));
                        })()}
                      </ul>
                      {(analysisResult.analysis.mostActiveRooms || []).length > 6 && (
                        <div className="mt-2 text-center">
                          <button className="px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-sm analytics-toggle-btn" onClick={() => setShowAllRooms(r => !r)} aria-expanded={showAllRooms} aria-label={showAllRooms ? 'Show fewer rooms' : 'Show all top rooms'}>
                            {showAllRooms ? 'Show less' : `Show all (${(analysisResult.analysis.mostActiveRooms || []).length})`}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  

                  {/* Insights removed — redundant with recommendations and patterns elsewhere */}

                  {/* Recommendations Panel */}
                  <div className="mt-8 pt-8 border-t-2 border-amber-200">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-amber-900 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Actionable Recommendations
                      </h2>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleExportPDF}
                          className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                        >
                          Export report (PDF)
                        </button>
                      </div>
                    </div>

                    {!analysisResult.analysis.recommendations || analysisResult.analysis.recommendations.length === 0 ? (
                      <div className="text-center py-8 text-amber-700 bg-amber-50 rounded-lg border border-amber-100">
                        <p>No recommendations available yet. More data needed for insights.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(() => {
                          const list = analysisResult.analysis.recommendations || [];
                          const maxShow = showAllRecommendations ? list.length : 6;
                          return list.slice(0, maxShow).map((rec, idx) => {
                          const priorityColors = {
                            'high': 'border-red-300 bg-red-50',
                            'medium': 'border-yellow-300 bg-yellow-50',
                            'low': 'border-blue-300 bg-blue-50'
                          };
                          const priorityBadgeColors = {
                            'high': 'bg-red-500 text-white',
                            'medium': 'bg-yellow-500 text-white',
                            'low': 'bg-blue-500 text-white'
                          };
                          const typeIcons = {
                            'top-item': '📈',
                            'pairing': '🔗',
                            'peak-day': '📅',
                            'top-room': '🏨',
                            'patterns': '🔍',
                            'quick-wins': '⚡'
                          };
                          
                          return (
                            <div key={idx} className={`border-l-4 rounded-lg p-4 ${priorityColors[rec.priority] || 'border-gray-300 bg-gray-50'}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{typeIcons[rec.type] || '💡'}</span>
                                  <div>
                                    <h4 className="font-semibold text-amber-900 capitalize">
                                      {rec.type.replace('-', ' ')}
                                    </h4>
                                    <p className="text-sm text-amber-700">{rec.reason}</p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${priorityBadgeColors[rec.priority] || 'bg-gray-500 text-white'}`}>
                                  {rec.priority}
                                </span>
                              </div>

                              {/* Context fields */}
                              <div className="text-sm text-amber-700 mb-3 space-y-1">
                                {rec.item && <div><span className="font-semibold">Item:</span> {rec.item}</div>}
                                {rec.pairing && <div><span className="font-semibold">Pairing:</span> {rec.pairing}</div>}
                                {rec.room && <div><span className="font-semibold">Room:</span> {rec.room}</div>}
                                {rec.date && <div><span className="font-semibold">Date:</span> {rec.date}</div>}
                              </div>

                              {/* Action items */}
                              {rec.actions && rec.actions.length > 0 && (
                                <div className="bg-white rounded px-3 py-2">
                                  <p className="text-xs font-semibold text-amber-900 mb-2">Action Items:</p>
                                  <ul className="space-y-1">
                                    {rec.actions.slice(0, 5).map((action, actionIdx) => (
                                      <li key={actionIdx} className="text-xs text-amber-700 flex items-start">
                                        <span className="mr-2">→</span>
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                          });
                        })()}
                        {analysisResult.analysis.recommendations.length > 6 && (
                          <div className="col-span-1 lg:col-span-2 text-center">
                            <button className="px-4 py-2 rounded-md bg-amber-100 text-amber-800 analytics-toggle-btn" onClick={() => setShowAllRecommendations(s => !s)} aria-expanded={showAllRecommendations} aria-label={showAllRecommendations ? 'Show fewer recommendations' : 'Show all recommendations'}>
                              {showAllRecommendations ? 'Show less' : `Show all recommendations (${analysisResult.analysis.recommendations.length})`}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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

      {/* Confirm Delete Delivered Order Popup */}
      {confirmDeleteOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h3 className="text-2xl font-bold text-white">Delete Delivered Order</h3>
            </div>
            <div className="p-6">
              <p className="text-amber-900 mb-4">Are you sure you want to permanently delete this delivered order? This action cannot be undone.</p>
              <div className="flex justify-center space-x-4 mt-6">
                <button 
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                  onClick={async () => {
                    await handleDeleteDelivered(confirmDeleteOrderId);
                    setConfirmDeleteOrderId(null);
                  }}
                >
                  Confirm Delete
                </button>
                <button 
                  className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                  onClick={() => setConfirmDeleteOrderId(null)}
                >
                  Cancel
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