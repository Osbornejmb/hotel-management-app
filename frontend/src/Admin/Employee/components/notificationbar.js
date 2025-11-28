import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import '../styles/notificationBell.css';

const NotificationBar = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const socketRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const autoHideTimeoutRef = useRef(null);

  const resetAutoHideTimer = useCallback(() => {
    // Clear existing timeout
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
    
    // Set new timeout to hide after 10 seconds
    autoHideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // 10 seconds
  }, []);

  const fetchAllAndFilterUnreadLocal = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const allNotifications = await response.json();
        const unreadNotifications = allNotifications.filter(n => !n.isRead);
        console.log('Filtered unread notifications:', unreadNotifications.length);
        
        setNotifications(unreadNotifications);
        setUnreadCount(unreadNotifications.length);
        
        if (unreadNotifications.length > 0) {
          setIsVisible(true);
          resetAutoHideTimer();
        } else {
          setIsVisible(false);
        }
        
        setCurrentIndex(prev => {
          if (unreadNotifications.length > 0 && prev >= unreadNotifications.length) {
            return 0;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error in fallback fetch:', error);
    }
  }, [resetAutoHideTimer]);

  const fetchUnreadNotificationsLocal = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching unread notifications from /api/notifications/unread...');
      
      const response = await fetch('http://localhost:5000/api/notifications/unread', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched unread notifications:', data.length, data);
        
        setNotifications(data);
        setUnreadCount(data.length);
        
        if (data.length > 0) {
          setIsVisible(true);
          resetAutoHideTimer();
        } else {
          setIsVisible(false);
        }
        
        setCurrentIndex(prev => {
          if (data.length > 0 && prev >= data.length) {
            return 0;
          }
          return prev;
        });
      } else {
        console.error('Failed to fetch unread notifications. Status:', response.status);
        if (response.status === 404) {
          console.log('Trying fallback to fetch all notifications and filter...');
          await fetchAllAndFilterUnreadLocal();
        }
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resetAutoHideTimer, fetchAllAndFilterUnreadLocal]);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    // Listen for new notifications
    socketRef.current.on('new-notification', (notification) => {
      console.log('New notification received in NotificationBar:', notification);
      
      // Add to main notifications list (only unread)
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Automatically show the bar when new notification arrives
      setIsVisible(true);
      
      // Auto-hide after 10 seconds if user doesn't interact
      resetAutoHideTimer();
    });

    fetchUnreadNotificationsLocal();

    // Set up auto-refresh every 3 seconds
    refreshIntervalRef.current = setInterval(fetchUnreadNotificationsLocal, 3000);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [resetAutoHideTimer, fetchUnreadNotificationsLocal]);

  const handleUserInteraction = () => {
    // Reset the auto-hide timer when user interacts
    resetAutoHideTimer();
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the notification from local state
        const updatedNotifications = notifications.filter(n => n._id !== notificationId);
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.length);
        
        // Hide the bar if no more unread notifications
        if (updatedNotifications.length === 0) {
          setIsVisible(false);
          if (autoHideTimeoutRef.current) {
            clearTimeout(autoHideTimeoutRef.current);
          }
        }
        
        // Adjust current index if needed
        if (updatedNotifications.length === 0) {
          setCurrentIndex(0);
        } else if (currentIndex >= updatedNotifications.length) {
          setCurrentIndex(updatedNotifications.length - 1);
        }
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read');
      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setCurrentIndex(0);
        setIsVisible(false);
        
        // Clear auto-hide timer
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
        }
      } else {
        console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    handleUserInteraction();
    
    if (notification.relatedModel === 'Task') {
      window.location.hash = '#tasks';
    } else if (notification.relatedModel === 'Request') {
      window.location.hash = '#task-requests';
    }
  };

  const nextNotification = () => {
    if (notifications.length > 0) {
      setCurrentIndex(prev => (prev + 1) % notifications.length);
      handleUserInteraction();
    }
  };

  const previousNotification = () => {
    if (notifications.length > 0) {
      setCurrentIndex(prev => prev === 0 ? notifications.length - 1 : prev - 1);
      handleUserInteraction();
    }
  };

  const handleCloseBar = () => {
    setIsVisible(false);
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
  };

  const currentNotification = notifications.length > 0 ? notifications[currentIndex] : null;

  // Don't render anything if no unread notifications or not visible
  if (!isVisible || unreadCount === 0) {
    return null;
  }

  return (
    <div className="notification-bar" onMouseEnter={handleUserInteraction} onMouseLeave={resetAutoHideTimer}>
      <div className="bar-container">
        <div className="bar-header">
          <div className="bar-title">
            📢 Notifications
            {unreadCount > 0 && (
              <span className="unread-badge">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="bar-controls">
            <button 
              className="close-bar"
              onClick={handleCloseBar}
              title="Close notification bar"
            >
              
            </button>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={markAllAsRead}
                title="Mark all as read"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Single Notification Display */}
        <div className="single-notification-container">
          {isLoading ? (
            <div className="loading-message">Loading...</div>
          ) : !currentNotification ? (
            <div className="empty-message">No new notifications</div>
          ) : (
            <div className="single-notification">
              <div 
                className="notification-content-single"
                onClick={() => handleNotificationClick(currentNotification)}
              >
                <div className="notification-type-single">
                  {currentNotification.relatedModel === 'Task' ? '📋 Task' : 
                   currentNotification.relatedModel === 'Request' ? '🔔 Request' : '💬 General'}
                </div>
                <div className="notification-title-single">
                  {currentNotification.title}
                </div>
                <div className="notification-message-single">
                  {currentNotification.message}
                </div>
                <div className="notification-time-single">
                  {new Date(currentNotification.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Navigation Controls */}
              {notifications.length > 1 && (
                <div className="navigation-controls">
                  <button 
                    className="nav-button prev-button"
                    onClick={previousNotification}
                    aria-label="Previous notification"
                  >
                    ‹
                  </button>
                  
                  <div className="notification-counter">
                    {currentIndex + 1} / {notifications.length}
                  </div>
                  
                  <button 
                    className="nav-button next-button"
                    onClick={nextNotification}
                    aria-label="Next notification"
                  >
                    ›
                  </button>
                </div>
              )}

              {/* Mark as Read Button */}
              <button 
                className="mark-read-button"
                onClick={() => markAsRead(currentNotification._id)}
                title="Mark as read"
              >
                ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBar;