import React, { useEffect, useState } from 'react';
import HotelAdminDashboard from './HotelAdminDashboard';
import './HotelAdminBookingHistory.css';


function HotelAdminBookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/bookings`);
        if (res.ok) {
          const data = await res.json();
          setBookings(Array.isArray(data) ? data : data.bookings || []);
        }
      } catch (err) {
        setBookings([]);
      }
    }
    fetchBookings();
  }, []);

  // Filter bookings by search
  const filteredBookings = bookings.filter(b =>
    b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    b.roomNumber?.toString().includes(search)
  );

  return (
    <HotelAdminDashboard>
      <div className="booking-history-container">
        <h2 className="booking-history-title">Booking History</h2>
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
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={5} className="booking-history-table-empty">No bookings found.</td></tr>
            ) : (
              filteredBookings.map((b, i) => (
                <tr key={b._id || i}>
                  <td>{b.customerName}</td>
                  <td>{b.roomNumber}</td>
                  <td>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : ''}</td>
                  <td>{b.checkOut ? new Date(b.checkOut).toLocaleDateString() : ''}</td>
                  <td>{b.status || ''}</td>
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
