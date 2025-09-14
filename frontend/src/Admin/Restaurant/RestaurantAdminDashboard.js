import React from 'react';
import LogoutButton from '../../Auth/LogoutButton';

function RestaurantAdminDashboard() {
  const [orders, setOrders] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('pending');

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/cart/orders/all');
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeleteDelivered = async (orderId) => {
    try {
      await fetch(`http://localhost:5000/api/cart/orders/${orderId}`, {
        method: 'DELETE',
      });
      // Refresh orders
      const res = await fetch('http://localhost:5000/api/cart/orders/all');
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      await fetch(`http://localhost:5000/api/cart/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      // Refresh orders
      const res = await fetch('http://localhost:5000/api/cart/orders/all');
      const data = await res.json();
      setOrders(data);
    } catch {}
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');

  return (
    <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', paddingBottom: '2rem' }}>
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
          style={{ padding: '0.5rem 2rem', borderRadius: '8px', border: '2px solid #FFD700', background: '#222', color: '#FFD700', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px #FFD700', transition: 'background 0.2s, color 0.2s', marginLeft: '2rem' }}
          onClick={fetchOrders}
          onMouseOver={e => { e.target.style.background = '#FFD700'; e.target.style.color = '#222'; }}
          onMouseOut={e => { e.target.style.background = '#222'; e.target.style.color = '#FFD700'; }}
        >Refresh</button>
      </div>
      {activeTab === 'pending' ? (
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
                  const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0), 0);
                  return (
                    <tr key={order._id} style={{ background: '#222', color: '#FFD700' }}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>{order.roomNumber}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {order.items.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                              <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</span> <span style={{ color: '#FFD700' }}>({item.category})</span> - <span style={{ color: '#FFD700' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</span>
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
                  const totalPrice = order.items.reduce((sum, item) => sum + (item.price || 0), 0);
                  return (
                    <tr key={order._id} style={{ background: '#222', color: '#FFD700' }}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>{order.roomNumber}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #FFD700' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {order.items.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                              <img src={item.img} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                              <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{item.name}</span> <span style={{ color: '#FFD700' }}>({item.category})</span> - <span style={{ color: '#FFD700' }}>₱{item.price ? item.price.toFixed(2) : '0.00'}</span>
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
