import React, { useState, useEffect } from 'react';

const ProfileSection = () => {
  const [profile, setProfile] = useState({
    name: localStorage.getItem('name') || localStorage.getItem('username') || 'Admin User',
    role: localStorage.getItem('role') || 'Admin',
    email: localStorage.getItem('email') || '',
    phone: '',
    id: localStorage.getItem('userId') || '',
    position: '',
    hireDate: ''
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const updatedProfile = {
          name: data.name || data.username || profile.name,
          role: data.role || profile.role,
          email: data.email || profile.email,
          phone: data.phone || profile.phone,
          id: data.id || data._id || profile.id,
          position: data.position || data.job || profile.position,
          hireDate: data.hireDate || profile.hireDate
        };
        setProfile(updatedProfile);
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    })();
  }, []);

  const formattedHireDate = profile.hireDate ?
    new Date(profile.hireDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

  const getStatusStyle = () => ({
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    backgroundColor: '#e9d8b7',
    color: '#6b3f1f'
  });

  const getRoleColor = (role) => {
    const colors = {
      admin: '#6b3f1f',
      hoteladmin: '#9b8f83',
      restaurantadmin: '#b0acaa',
      employeeadmin: '#7b7b7b',
      employee: '#e7d4a3'
    };
    return colors[role?.toLowerCase()] || '#7b7b7b';
  };

  return (
    <div style={{ padding: 24, background: "#f8f5f0", minHeight: "100vh" }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <h2 style={{
          margin: 0,
          color: "#6b3f1f",
          fontSize: '28px',
          fontWeight: '800'
        }}>
          Profile Management
        </h2>
      </div>

      {message && (
        <div style={{
          marginBottom: 24,
          padding: "12px 16px",
          borderRadius: 8,
          background: message.type === 'error' ? '#f7e6e6' : '#f0e6d2',
          color: message.type === 'error' ? '#6b3f1f' : '#6b3f1f',
          border: `1px solid ${message.type === 'error' ? '#e7d4a3' : '#e9d8b7'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 6px 28px rgba(0,0,0,0.06)',
        border: '1px solid #e9d8b7',
        overflow: 'hidden'
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #e9d8b7 0%, #e7d4a3 100%)',
          padding: 32,
          color: '#6b3f1f',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: '12px',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 'bold',
              border: '3px solid #e7d4a3',
              color: '#6b3f1f'
            }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8,
                color: '#6b3f1f'
              }}>
                {profile.name}
              </div>
              <div style={{
                fontSize: 16,
                color: '#9b8f83',
                marginBottom: 12
              }}>
                {profile.position || 'Position Not Set'}
              </div>
              <div style={{
                fontSize: 14,
                color: '#7b7b7b'
              }}>
                Employee ID: {profile.id || 'Not Available'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={getStatusStyle()}>
                ONLINE
              </div>
              <div style={{
                marginTop: 12,
                padding: '4px 12px',
                background: getRoleColor(profile.role),
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: '#fff'
              }}>
                {profile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: 32 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32
          }}>
            {/* Personal Information */}
            <div style={{
              padding: 24,
              background: '#f8f5f0',
              borderRadius: 12,
              border: '1px solid #e9d8b7'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#6b3f1f',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                👤 Personal Information
              </h3>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9b8f83',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Full Name
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b3f1f',
                    fontWeight: '500'
                  }}>
                    {profile.name || '—'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9b8f83',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Email Address
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b3f1f',
                    fontWeight: '500'
                  }}>
                    {profile.email || '—'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9b8f83',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Phone Number
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b3f1f',
                    fontWeight: '500'
                  }}>
                    {profile.phone || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div style={{
              padding: 24,
              background: '#f8f5f0',
              borderRadius: 12,
              border: '1px solid #e9d8b7'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#6b3f1f',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                💼 Employment Information
              </h3>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9b8f83',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Position
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b3f1f',
                    fontWeight: '500'
                  }}>
                    {profile.position || '—'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9b8f83',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Hire Date
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b3f1f',
                    fontWeight: '500'
                  }}>
                    {formattedHireDate || '—'}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9b8f83',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Role
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#6b3f1f',
                    fontWeight: '500'
                  }}>
                    {profile.role || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;