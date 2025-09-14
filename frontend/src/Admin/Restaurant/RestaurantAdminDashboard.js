import LogoutButton from '../../Auth/LogoutButton';

function RestaurantAdminDashboard() {
  return (
    <div style={{ background: '#111', minHeight: '100vh', color: '#FFD700', paddingBottom: '2rem' }}>
      <LogoutButton />
      <h2 style={{ color: '#FFD700', textShadow: '0 2px 8px #000', letterSpacing: '2px' }}>Restaurant Admin Dashboard</h2>
      {/* Add restaurant admin features here */}
    </div>
  );
}

export default RestaurantAdminDashboard;
