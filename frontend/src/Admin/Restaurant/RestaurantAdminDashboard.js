import React from 'react';
import LogoutButton from '../../Auth/LogoutButton';
import './RestaurantAdminDashboard.css';


// MenuManager component for food item CRUD
function MenuManager() {
  const [foodItems, setFoodItems] = React.useState([]);
  const [editId, setEditId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({ name: '', price: '', category: 'breakfast', img: '', details: '' });
  const [showEditPopup, setShowEditPopup] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [addForm, setAddForm] = React.useState({ name: '', price: '', category: 'breakfast', img: '', details: '' });
  const [showAddPopup, setShowAddPopup] = React.useState(false);

  // Fetch food items
  const fetchFood = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food`);
      const data = await res.json();
      setFoodItems(Object.entries(data).flatMap(([cat, arr]) => arr.map(item => ({ ...item, category: cat }))));
    } catch {}
  };
  React.useEffect(() => { fetchFood(); }, []);

  // Add food item
  const handleAdd = async e => {
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
        setAddForm({ name: '', price: '', category: 'breakfast', img: '', details: '' });
        setShowAddPopup(false);
        fetchFood();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to add food item.');
      }
    } catch {
      setMessage('Failed to add food item.');
    }
  };

  // Delete food item
  const handleDelete = async (id, category) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/food/${category}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Food item deleted.');
        fetchFood();
      } else {
        setMessage('Failed to delete food item.');
      }
    } catch {
      setMessage('Failed to delete food item.');
    }
  };

  // Edit food item
  const startEdit = item => {
    setEditId(item._id);
    setEditForm({ name: item.name, price: item.price, category: item.category, img: item.img, details: item.details });
    setShowEditPopup(true);
  };
  const handleEdit = async e => {
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
    } catch {
      setMessage('Failed to update food item.');
    }
  };

  return (
    <div className="menu-manager">
      <h3 className="menu-manager-title">Manage Food Menu</h3>
      <button className="btn btn-add" onClick={() => setShowAddPopup(true)}>Add Food Item</button>
      <h4 className="food-items-title">Food Items</h4>
      {message && <p className={`message ${message.includes('success') || message.includes('updated') || message.includes('deleted') ? 'success' : 'error'}`}>{message}</p>}
      <table className="food-table">
        <thead>
          <tr>
            <th>Name</th><th>Price</th><th>Category</th><th>Image</th><th>Details</th><th>Edit</th><th>Delete</th>
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
              <td><button className="btn btn-edit" onClick={() => startEdit(item)}>Edit</button></td>
              <td><button className="btn btn-delete" onClick={() => handleDelete(item._id, item.category)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Food Item Popup */}
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

      {/* Add Food Item Popup */}
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

function RestaurantAdminDashboard() {
  // Cancel order (set status to 'cancelled')
  const handleCancelOrder = async (order) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${order._id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      fetchOrders();
    } catch {}
  };
  const [orders, setOrders] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('pending');

  const statusSteps = [
    'pending',
    'acknowledged',
    'preparing',
    'on the way',
    'delivered'
  ];

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  React.useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => { fetchOrders(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteDelivered = async (orderId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${orderId}`, { method: 'DELETE' });
      fetchOrders();
    } catch {}
  };

  // Progress order status to next step
  const handleProgressStatus = async (order) => {
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
    } catch {}
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const acknowledgedOrders = orders.filter(order => order.status === 'acknowledged');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const onTheWayOrders = orders.filter(order => order.status === 'on the way');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');

  return (
    <div className="dashboard">
      <LogoutButton />
      <h2 className="dashboard-title">Restaurant Admin Dashboard</h2>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending</button>
        <button className={`tab-btn ${activeTab === 'acknowledged' ? 'active' : ''}`} onClick={() => setActiveTab('acknowledged')}>Acknowledged</button>
        <button className={`tab-btn ${activeTab === 'preparing' ? 'active' : ''}`} onClick={() => setActiveTab('preparing')}>Preparing</button>
        <button className={`tab-btn ${activeTab === 'on the way' ? 'active' : ''}`} onClick={() => setActiveTab('on the way')}>On The Way</button>
        <button className={`tab-btn ${activeTab === 'delivered' ? 'active' : ''}`} onClick={() => setActiveTab('delivered')}>Delivered</button>
        <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Manage Menu</button>
      </div>

      {activeTab === 'menu' ? (
        <MenuManager />
      ) : activeTab === 'pending' ? (
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
                        <button className="btn btn-cancel" onClick={() => handleCancelOrder(order)}>
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
      ) : activeTab === 'acknowledged' ? (
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
                        <button className="btn btn-cancel" onClick={() => handleCancelOrder(order)}>
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
      ) : activeTab === 'preparing' ? (
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
      ) : activeTab === 'on the way' ? (
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
      ) : (
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
      )}
    </div>
  );
}

export default RestaurantAdminDashboard;
