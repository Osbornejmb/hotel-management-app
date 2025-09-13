
import { useNavigate } from 'react-router-dom';

function CustomerInterface() {
  const roomNumber = localStorage.getItem('customerRoomNumber');
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>Customer Interface</h2>
      <p>Welcome! Your room number is <strong>{roomNumber}</strong>.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => handleNavigate('/customer/amenities')}>
          <img src="https://img.icons8.com/color/96/000000/room.png" alt="Amenities" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc' }} />
          <div>Amenities</div>
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => handleNavigate('/customer/food')}> 
          <img src="https://img.icons8.com/color/96/000000/restaurant.png" alt="Food and Beverages" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc' }} />
          <div>Food & Beverages</div>
        </div>
        <div style={{ cursor: 'pointer' }} onClick={() => handleNavigate('/customer/contact')}> 
          <img src="https://img.icons8.com/color/96/000000/phone.png" alt="Contact Front Desk" style={{ borderRadius: '12px', boxShadow: '0 2px 8px #ccc' }} />
          <div>Contact Front Desk</div>
        </div>
      </div>
    </div>
  );
}

export default CustomerInterface;
