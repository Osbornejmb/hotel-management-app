import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';
import './HotelAdminBookingHistory.css';

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
      <div className="booking-history-container">
        <h2 className="booking-history-title">Maintenance</h2>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="booking-history-search"
        />
        <table className="booking-history-table">
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Room</th>
              <th>Check in</th>
              <th>Check out</th>
              <th>Booking Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={5} className="booking-history-table-empty">No bookings found.</td></tr>
            ) : (
              filteredCustomers.map((c, i) => (
                <tr key={c._id || i}>
                  <td>{c.name}</td>
                  <td>{c.roomNumber}</td>
                  <td>{c.checkinDate ? new Date(c.checkinDate).toLocaleDateString() : ''}</td>
                  <td>
                    {c.updatedCheckoutDate
                      ? c.updatedCheckoutDate
                      : (c.checkoutDate ? c.checkoutDate : '')}
                  </td>
                  <td>{c.status || ''}</td>
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
