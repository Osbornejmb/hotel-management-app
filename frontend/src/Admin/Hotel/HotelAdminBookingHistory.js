import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';

function HotelAdminBookingHistory() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/customers`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        setCustomers([]);
      }
    }
    fetchCustomers();
  }, []);

  // Filter customers by search
  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.roomNumber?.toString().includes(search)
  );

  return (
    <HotelAdminDashboard>
      <div style={{ width: '100%', padding: '2rem' }}>
        <h2 style={{ color: '#a57c2b', fontWeight: 700, marginBottom: '1.2rem' }}>Maintenance</h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '350px', padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', marginBottom: '1.2rem' }}
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #ccc' }}>
          <thead>
            <tr style={{ background: '#e3c78a', color: '#222', fontWeight: 700 }}>
              <th style={{ padding: '0.7rem', textAlign: 'center' }}>Guest Name</th>
              <th style={{ textAlign: 'center' }}>Room</th>
              <th style={{ textAlign: 'center' }}>Check in</th>
              <th style={{ textAlign: 'center' }}>Check out</th>
              <th style={{ textAlign: 'center' }}>Booking Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>No bookings found.</td></tr>
            ) : (
              filteredCustomers.map((c, i) => (
                <tr key={c._id || i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.7rem', textAlign: 'center' }}>{c.name}</td>
                  <td style={{ textAlign: 'center' }}>{c.roomNumber}</td>
                  <td style={{ textAlign: 'center' }}>{c.checkinDate ? new Date(c.checkinDate).toLocaleDateString() : ''}</td>
                  <td style={{ textAlign: 'center' }}>
                    {c.updatedCheckoutDate
                      ? c.updatedCheckoutDate
                      : (c.checkoutDate ? c.checkoutDate : '')}
                  </td>
                  <td style={{ textAlign: 'center' }}>{c.status || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </HotelAdminDashboard>
  );
}

export default HotelAdminBookingHistory;
