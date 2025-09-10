import React from 'react';

function CustomerInterface() {
  const roomNumber = localStorage.getItem('customerRoomNumber');

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Customer Interface</h2>
      <p>Welcome! Your room number is <strong>{roomNumber}</strong>.</p>
      <div style={{ marginTop: '2rem', color: 'gray' }}>
        <h3>Features Coming Soon:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>Order food and services</li>
          <li>View order status</li>
          <li>Request billing and checkout</li>
        </ul>
        <p>This is a placeholder. More features will be added soon.</p>
      </div>
    </div>
  );
}

export default CustomerInterface;
