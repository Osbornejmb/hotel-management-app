import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import '../styles/notificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushNotification, setPushNotification] = useState(null);
  const socketRef = useRef(null);
  const pushTimeoutRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
    socketRef.current = io(apiBase);

    // Listen for new notifications
    socketRef.current.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Add to main notifications list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show push notification
      showPushNotification(notification);
    });

    // Load existing notifications
    fetchNotifications();

    // Set up auto-refresh every 2 seconds
    refreshIntervalRef.current = setInterval(fetchNotifications, 2000);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pushTimeoutRef.current) {
        clearTimeout(pushTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const showPushNotification = (notification) => {
    // Clear any existing push notification
    if (pushTimeoutRef.current) {
      clearTimeout(pushTimeoutRef.current);
    }
    
    // Show new push notification
    setPushNotification(notification);
    
    // Auto-hide after 3 seconds
    pushTimeoutRef.current = setTimeout(() => {
      setPushNotification(null);
    }, 3000);
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
      const response = await fetch(`${apiBase}/api/notifications`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
      await fetch(`${apiBase}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';
      await fetch(`${apiBase}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    
    if (notification.relatedModel === 'Task') {
      window.location.hash = '#tasks';
    } else if (notification.relatedModel === 'Request') {
      window.location.hash = '#task-requests';
    }
    
    setIsOpen(false);
  };

  const handlePushNotificationClick = () => {
    if (pushNotification) {
      // Mark as read and navigate
      markAsRead(pushNotification._id);
      
      if (pushNotification.relatedModel === 'Task') {
        window.location.hash = '#tasks';
      } else if (pushNotification.relatedModel === 'Request') {
        window.location.hash = '#task-requests';
      }
      
      // Close push notification immediately
      setPushNotification(null);
      if (pushTimeoutRef.current) {
        clearTimeout(pushTimeoutRef.current);
      }
    }
  };

  const closePushNotification = () => {
    setPushNotification(null);
    if (pushTimeoutRef.current) {
      clearTimeout(pushTimeoutRef.current);
    }
  };

  return (
    <div className="notification-bell">
      {/* Push Notification */}
      {pushNotification && (
        <div 
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            width: '300px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 99999,
            padding: '15px',
            cursor: 'pointer',
            animation: 'slideInRight 0.3s ease-out'
          }}
          onClick={handlePushNotificationClick}
          onMouseEnter={() => {
            // Pause auto-hide on hover
            if (pushTimeoutRef.current) {
              clearTimeout(pushTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            // Resume auto-hide when mouse leaves
            pushTimeoutRef.current = setTimeout(() => {
              setPushNotification(null);
            }, 1000);
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{
              fontWeight: 600,
              color: '#333',
              fontSize: '0.9rem',
              flex: 1
            }}>
              {pushNotification.title}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                closePushNotification();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0',
                marginLeft: '10px'
              }}
            >
              ×
            </button>
          </div>
          <div style={{
            color: '#666',
            fontSize: '0.8rem',
            lineHeight: '1.3',
            marginBottom: '8px'
          }}>
            {pushNotification.message}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#999',
              fontSize: '0.7rem'
            }}>
              {new Date(pushNotification.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: '#007bff',
              borderRadius: '50%'
            }}></div>
          </div>
          
          {/* Progress bar for auto-hide */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '3px',
            backgroundColor: '#f0f0f0',
            borderRadius: '0 0 8px 8px'
          }}>
            <div 
              style={{
                height: '100%',
                backgroundColor: '#007bff',
                borderRadius: '0 0 8px 8px',
                animation: 'progressBar 3s linear forwards'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Bell Icon */}
      <div 
        className="bell-icon" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          cursor: 'pointer', 
          padding: '10px',
          position: 'relative',
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '50%',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ff4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '350px',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          marginTop: '10px'
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '4px 8px'
                }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No notifications</div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div
                  key={notification._id}
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    transition: 'background-color 0.2s',
                    backgroundColor: !notification.isRead ? '#f0f7ff' : 'white'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = !notification.isRead ? '#f0f7ff' : 'white'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      color: '#333', 
                      marginBottom: '4px', 
                      fontSize: '0.9rem' 
                    }}>
                      {notification.title}
                    </div>
                    <div style={{ 
                      color: '#666', 
                      fontSize: '0.8rem', 
                      marginBottom: '4px', 
                      lineHeight: '1.3' 
                    }}>
                      {notification.message}
                    </div>
                    <div style={{ 
                      color: '#999', 
                      fontSize: '0.7rem' 
                    }}>
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#007bff',
                      borderRadius: '50%',
                      marginLeft: '10px',
                      marginTop: '5px'
                    }}></div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div style={{
              padding: '10px 15px',
              borderTop: '1px solid #eee',
              textAlign: 'center'
            }}>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
                onClick={() => window.location.href = '/notifications'}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes progressBar {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationBell;