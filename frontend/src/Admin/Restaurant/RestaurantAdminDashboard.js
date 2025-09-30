import React from 'react';
import LogoutButton from '../../Auth/LogoutButton';
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
    <div style={{ background: '#222', color: '#FFD700', padding: '2rem', borderRadius: '16px', maxWidth: '700px', margin: '2rem auto', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700' }}>
      <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Manage Food Menu</h3>
      <button onClick={() => setShowAddPopup(true)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s', marginBottom: '2rem' }}>Add Food Item</button>
      <h4 style={{ marginBottom: '1rem' }}>Food Items</h4>
      {message && <p style={{ color: message.includes('success') || message.includes('updated') || message.includes('deleted') ? '#4caf50' : '#f44336', marginTop: '1rem' }}>{message}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#222', color: '#FFD700', boxShadow: '0 2px 8px #FFD700', border: '2px solid #FFD700', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ background: '#FFD700', color: '#222' }}>
            <th>Name</th><th>Price</th><th>Category</th><th>Image</th><th>Details</th><th>Edit</th><th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {foodItems.map(item => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>₱{item.price}</td>
              <td>{item.category}</td>
              <td><img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px' }} /></td>
              <td>{item.details}</td>
              <td><button onClick={() => startEdit(item)} style={{ padding: '0.3rem 1rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button></td>
              <td><button onClick={() => handleDelete(item._id, item.category)} style={{ padding: '0.3rem 1rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Edit Food Item Popup */}
      {showEditPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#222', color: '#FFD700', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700', minWidth: '350px', maxWidth: '90vw' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Edit Food Item</h3>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Name:<input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }} /></label>
              <label>Price:<input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }} /></label>
              <label>Category:<select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="desserts">Desserts</option>
                <option value="snack">Snack</option>
                <option value="beverages">Beverages</option>
              </select></label>
              <label>Image URL:<input type="text" value={editForm.img} onChange={e => setEditForm(f => ({ ...f, img: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }} /></label>
              <label>Details:<textarea value={editForm.details} onChange={e => setEditForm(f => ({ ...f, details: e.target.value }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem', minHeight: '60px' }} /></label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}>Save Changes</button>
                <button type="button" onClick={() => { setEditId(null); setShowEditPopup(false); }} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Food Item Popup */}
      {showAddPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#222', color: '#FFD700', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700', minWidth: '350px', maxWidth: '90vw' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Add Food Item</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label>Name:<input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }} /></label>
              <label>Price:<input type="number" step="0.01" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }} /></label>
              <label>Category:<select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="desserts">Desserts</option>
                <option value="snack">Snack</option>
                <option value="beverages">Beverages</option>
              </select></label>
              <label>Image URL:<input type="text" value={addForm.img} onChange={e => setAddForm(f => ({ ...f, img: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem' }} /></label>
              <label>Details:<textarea value={addForm.details} onChange={e => setAddForm(f => ({ ...f, details: e.target.value }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #FFD700', background: '#111', color: '#FFD700', marginTop: '0.5rem', minHeight: '60px' }} /></label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}>Add Food Item</button>
                <button type="button" onClick={() => setShowAddPopup(false)} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function RestaurantAdminDashboard() {
  const [orders, setOrders] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('pending');

  const fetchOrders = async () => {
    try {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  React.useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDeleteDelivered = async (orderId) => {
    try {
  await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${orderId}`, {
        method: 'DELETE',
      });
      // Refresh orders
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  const handleMarkDelivered = async (orderId) => {
    try {
  await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      // Refresh orders
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/cart/orders/all`);
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');

  return (
  <div style={{ background: '#111', minHeight: '100vh', maxHeight: '100vh', overflowY: 'auto', color: '#FFD700', paddingBottom: '2rem' }}>
      <LogoutButton />
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Restaurant Admin Dashboard</h2>
      <div style={{ marginTop: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <button
          style={{ padding: '0.5rem 2rem', borderRadius: '8px', border: activeTab === 'pending' ? '2px solid #FFD700' : '2px solid #222', background: activeTab === 'pending' ? '#FFD700' : '#222', color: activeTab === 'pending' ? '#222' : '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
          onClick={() => setActiveTab('pending')}
        >Pending</button>
        <button
          style={{ padding: '0.5rem 2rem', borderRadius: '8px', border: activeTab === 'delivered' ? '2px solid #FFD700' : '2px solid #222', background: activeTab === 'delivered' ? '#FFD700' : '#222', color: activeTab === 'delivered' ? '#222' : '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
          onClick={() => setActiveTab('delivered')}
        >Delivered</button>
        <button
          style={{ padding: '0.5rem 2rem', borderRadius: '8px', border: activeTab === 'menu' ? '2px solid #FFD700' : '2px solid #222', background: activeTab === 'menu' ? '#FFD700' : '#222', color: activeTab === 'menu' ? '#222' : '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
          onClick={() => setActiveTab('menu')}
        >Manage Menu</button>
      </div>
      {activeTab === 'menu' ? (
        <MenuManager />
      ) : activeTab === 'pending' ? (
        <>
          <h3 style={{ color: '#FFD700', marginTop: '2rem' }}>Pending Orders</h3>
          {pendingOrders.length === 0 ? (
            <p>No pending orders.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem', background: '#222', color: '#FFD700', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700' }}>
              <thead>
                <tr style={{ background: '#FFD700', color: '#222' }}>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Room Number</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Items</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Total Price</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Status</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Checked Out At</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id} style={{ background: '#222', color: '#FFD700' }}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>{order.roomNumber}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {order.items.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                              <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</span> 
                              <span style={{ color: '#FFD700', marginLeft: '0.5rem' }}>(x{item.quantity || 1})</span>
                              <span style={{ color: '#FFD700', marginLeft: '0.5rem' }}>- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700', fontWeight: 'bold' }}>₱{totalPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700', fontWeight: 'bold' }}>
                        {order.status || 'pending'}
                        <button
                          style={{ marginLeft: '1rem', padding: '0.3rem 1rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
                          onClick={() => handleMarkDelivered(order._id)}
                          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
                        >
                          Mark Delivered
                        </button>
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>{new Date(order.checkedOutAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <h3 style={{ color: '#FFD700', marginTop: '2rem' }}>Delivered Orders</h3>
          {deliveredOrders.length === 0 ? (
            <p>No delivered orders.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem', background: '#222', color: '#FFD700', boxShadow: '0 2px 16px #FFD700', border: '2px solid #FFD700' }}>
              <thead>
                <tr style={{ background: '#FFD700', color: '#222' }}>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Room Number</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Items</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Total Price</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Status</th>
                  <th style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>Checked Out At</th>
                </tr>
              </thead>
              <tbody>
                {deliveredOrders.map(order => {
                  const totalPrice = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                  return (
                    <tr key={order._id} style={{ background: '#222', color: '#FFD700' }}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>{order.roomNumber}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {order.items.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                              <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</span> 
                              <span style={{ color: '#FFD700', marginLeft: '0.5rem' }}>(x{item.quantity || 1})</span>
                              <span style={{ color: '#FFD700', marginLeft: '0.5rem' }}>- ₱{item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700', fontWeight: 'bold' }}>₱{totalPrice.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700', fontWeight: 'bold' }}>{order.status || 'delivered'}
                        <button
                          style={{ marginLeft: '1rem', padding: '0.3rem 1rem', borderRadius: '6px', border: '2px solid #FFD700', background: '#FFD700', color: '#222', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s' }}
                          onClick={() => handleDeleteDelivered(order._id)}
                          onMouseOver={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
                          onMouseOut={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
                        >
                          Delete
                        </button>
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>{new Date(order.checkedOutAt).toLocaleString()}</td>
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