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

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch('/api/users/me', {
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
        setEditForm(updatedProfile);
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    })();
  }, []);

  const handleEditClick = () => {
    setEditForm({ ...profile });
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfile(editForm);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });

      if (editForm.name) localStorage.setItem('name', editForm.name);
      if (editForm.email) localStorage.setItem('email', editForm.email);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

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
        {!isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              background: "#e7d4a3",
              color: "#6b3f1f",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e9d8b7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#e7d4a3")}
          >
            ✏️ Edit Profile
          </button>
        )}
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
          {isEditing ? (
            // Edit Form
            <div>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#6b3f1f'
              }}>
                Edit Profile Information
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 24,
                marginBottom: 32
              }}>
                {/* Personal Information */}
                <div style={{
                  padding: 24,
                  background: '#f8f5f0',
                  borderRadius: 12,
                  border: '1px solid #e9d8b7'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#6b3f1f'
                  }}>
                    Personal Information
                  </h4>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b3f1f'
                    }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name || ''}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b3f1f'
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email || ''}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b3f1f'
                    }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone || ''}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Employment Information */}
                <div style={{
                  padding: 24,
                  background: '#f8f5f0',
                  borderRadius: 12,
                  border: '1px solid #e9d8b7'
                }}>
                  <h4 style={{
                    margin: '0 0 20px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#6b3f1f'
                  }}>
                    Employment Information
                  </h4>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b3f1f'
                    }}>
                      Position
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={editForm.position || ''}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b3f1f'
                    }}>
                      Hire Date
                    </label>
                    <input
                      type="date"
                      name="hireDate"
                      value={editForm.hireDate ? editForm.hireDate.split('T')[0] : ''}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                paddingTop: 24,
                borderTop: '1px solid #e9d8b7'
              }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    background: "#9b8f83",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    background: "#e7d4a3",
                    color: "#6b3f1f",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: '700'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            // View Mode
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
