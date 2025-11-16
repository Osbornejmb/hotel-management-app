import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaBed, FaBroom, FaTools, FaHistory, FaBell } from 'react-icons/fa';
import LogoutButton from '../../Auth/LogoutButton';
import './HotelAdminDashboard.css';
import { io } from 'socket.io-client';

// This is now the master layout (HotelAdminLayout)

function HotelAdminDashboard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Notification state: persistent list shown in panel
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [toasts, setToasts] = useState([]);
  const prevStatusesRef = useRef({});
  const socketRef = useRef(null);
  // short-lived dedupe keys to avoid sending the same notif twice (socket + poll race)
  const recentNotifKeysRef = useRef(new Map());
  // Ref for notification sound
  const notificationAudioRef = useRef(null);

  // persist notification to backend (which should write to the hoteladnotifs collection)
  const saveNotificationToDb = async (notif) => {
    try {
      await fetch('/api/hoteladnotifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notif),
      });
    } catch (err) {
      console.error('Failed to save notification to DB', err);
    }
  };

  // Add notification if not duplicate (same bookingId + newStatus). Also push toast and browser notification.
  const addNotification = (notif) => {
    try {
      // build a dedupe key that covers booking/task/room notifications
      const keyParts = [];
      if (notif.bookingId) keyParts.push(`b:${notif.bookingId}`);
      if (notif.taskId) keyParts.push(`t:${notif.taskId}`);
      if (notif.roomNumber) keyParts.push(`r:${notif.roomNumber}`);
      if (notif.isTaskNotification) keyParts.push('type:task');
      if (notif.isRoomNotification) keyParts.push('type:room');
      keyParts.push(`s:${notif.newStatus}`);
      const dedupeKey = keyParts.join('|');
      const recent = recentNotifKeysRef.current;
      if (recent.has(dedupeKey)) {
        // already processed recently — skip duplicate
        return;
      }
      // mark as seen for 6 seconds
      recent.set(dedupeKey, Date.now());
      setTimeout(() => { recent.delete(dedupeKey); }, 6000);
    } catch (err) {
      // silent
    }
    setNotifications(prev => {
      const exists = prev.some(n => n.bookingId === notif.bookingId && n.newStatus === notif.newStatus);
      if (exists) return prev;
      // Play notification sound
      if (notificationAudioRef.current) {
        notificationAudioRef.current.currentTime = 0;
        notificationAudioRef.current.play().catch(() => {});
      }
      return [notif, ...prev];
    });
    setToasts(prev => {
      const exists = prev.some(t => t.bookingId === notif.bookingId && t.newStatus === notif.newStatus);
      if (exists) return prev;
      return [{ ...notif, toastId: `t-${notif.id}` }, ...prev];
    });
    // persist to DB (fire-and-forget)
    // Only persist if not explicitly marked as fetched/panel-only
    if (notif.persist !== false) {
      saveNotificationToDb(notif);
    }
    // Browser notification
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          const n = new Notification('Room status changed', { body: `Room ${notif.roomNumber}: ${notif.oldStatus ? notif.oldStatus + ' → ' : ''}${notif.newStatus}`, requireInteraction: true });
          n.onclick = () => { window.focus(); n.close(); };
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              const n = new Notification('Room status changed', { body: `Room ${notif.roomNumber}: ${notif.oldStatus ? notif.oldStatus + ' → ' : ''}${notif.newStatus}`, requireInteraction: true });
              n.onclick = () => { window.focus(); n.close(); };
            }
          }).catch(() => {});
        }
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    let intervalId;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) return;
        const data = await res.json();
        // Compare statuses and create persistent notifications for changes
        const prevStatuses = prevStatusesRef.current || {};
        const currentStatuses = {};
        data.forEach(b => {
          const status = b.bookingStatus || b.status || b.paymentStatus || '';
          currentStatuses[b._id] = status;
          const prevStatus = prevStatuses[b._id];
          if (prevStatus !== undefined && prevStatus !== status) {
            // status changed: create notification
            const roomNumber = b.roomNumber || (b.room && b.room.roomNumber) || 'Unknown';
            const notif = {
              id: `${b._id}-${Date.now()}`,
              bookingId: b._id,
              roomNumber,
              oldStatus: prevStatus,
              newStatus: status,
              // fetched from polling (notification panel) — do not persist to DB
              persist: false,
              timestamp: new Date().toISOString(),
              read: false,
            };
            addNotification(notif);
          }
        });
  prevStatusesRef.current = currentStatuses;
      } catch (err) {
        // Optionally handle error
      }
    };
    // perform initial fetch then start polling and socket after prevStatusesRef is populated
    fetchBookings().then(() => {
      intervalId = setInterval(fetchBookings, 20000);
      // Setup socket.io client for real-time notifications
      const socket = io(process.env.REACT_APP_API_URL || '/', { transports: ['websocket', 'polling'] });
  socketRef.current = socket;
      socket.on('bookingStatusChanged', (payload) => {
        // payload: { bookingId, roomNumber, newStatus }
        // try to retrieve the last-seen status stored in prevStatusesRef
        const lastSeen = (prevStatusesRef.current && prevStatusesRef.current[payload.bookingId]) || null;
        const notif = {
          id: `${payload.bookingId}-socket-${Date.now()}`,
          bookingId: payload.bookingId,
          roomNumber: payload.roomNumber,
          oldStatus: lastSeen,
          newStatus: payload.newStatus,
          // socket-originated notifications are considered popups and should be persisted
          persist: true,
          timestamp: new Date().toISOString(),
          read: false,
        };
        addNotification(notif);
        // mark prevStatuses so polling won't duplicate the same change
        try {
          if (!prevStatusesRef.current) prevStatusesRef.current = {};
          prevStatusesRef.current[payload.bookingId] = payload.newStatus;
        } catch (err) {}
      });
      socket.on('roomStatusChanged', (payload) => {
        // payload: { roomId, roomNumber, roomType, status }
        const notif = {
          id: `${payload.roomId}-room-${Date.now()}`,
          bookingId: null,
          roomNumber: payload.roomNumber,
          roomType: payload.roomType,
          oldStatus: null,
          newStatus: payload.status,
          // room updates from socket: treat as popup/persist
          persist: true,
          timestamp: new Date().toISOString(),
          read: false,
          isRoomNotification: true,
        };
        // Add to notifications and toasts using same addNotification (will dedupe by bookingId+newStatus, so room notifications need unique id)
        addNotification(notif);
      });
      socket.on('taskChanged', (payload) => {
        // payload: { taskId, room, employeeId, type, status }
        const notif = {
          id: `${payload.taskId}-task-${Date.now()}`,
          bookingId: null,
          taskId: payload.taskId,
          roomNumber: payload.room,
          employeeId: payload.employeeId,
          taskType: payload.type,
          oldStatus: null,
          newStatus: payload.status,
          // task updates from socket: treat as popup/persist
          persist: true,
          timestamp: new Date().toISOString(),
          read: false,
          isTaskNotification: true,
        };
        addNotification(notif);
      });
    }).catch(() => {
      // initial fetch failed; still try to start polling and socket
      intervalId = setInterval(fetchBookings, 20000);
      const socket = io(process.env.REACT_APP_API_URL || '/', { transports: ['websocket', 'polling'] });
  socketRef.current = socket;
      socket.on('bookingStatusChanged', (payload) => {
        const lastSeen = (prevStatusesRef.current && prevStatusesRef.current[payload.bookingId]) || null;
        const notif = {
          id: `${payload.bookingId}-socket-${Date.now()}`,
          bookingId: payload.bookingId,
          roomNumber: payload.roomNumber,
          oldStatus: lastSeen,
          newStatus: payload.newStatus,
          timestamp: new Date().toISOString(),
          read: false,
        };
        addNotification(notif);
        try {
          if (!prevStatusesRef.current) prevStatusesRef.current = {};
          prevStatusesRef.current[payload.bookingId] = payload.newStatus;
        } catch (err) {}
      });
    });

    return () => { clearInterval(intervalId); if (socketRef.current && socketRef.current.disconnect) socketRef.current.disconnect(); };
  }, [addNotification]);

  const sidebarButtons = [
    { name: 'Dashboard', path: '/admin/hotel', icon: <FaTachometerAlt /> },
    { name: 'Rooms', path: '/admin/hotel/rooms', icon: <FaBed /> },
    { name: 'Housekeeping', path: '/admin/hotel/housekeeping', icon: <FaBroom /> },
    { name: 'Maintenance', path: '/admin/hotel/maintenance', icon: <FaTools /> },
    { name: 'Booking History', path: '/admin/hotel/booking-history', icon: <FaHistory /> },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  return (
    <div className="hotel-admin-dashboard-root gold-theme">
      {/* Hidden audio element for notification sound */}
      <audio ref={notificationAudioRef} src="/notification-sound.mp3" preload="auto" style={{ display: 'none' }} />
      {/* Top navbar */}
      <nav className="hotel-admin-dashboard-nav gold-theme">
        <div className="hotel-admin-dashboard-home-btn">
          <button
            onClick={() => navigate('/admin/hotel')}
            className="hotel-admin-dashboard-home-btn-actual"
            title="Home"
            style={{
              fontSize: '1.5rem',
              background: 'none',
              border: 'none',
              color: '#fff',
            }}
          >
            <img src="/home_icon.png" alt="Home" className="hotel-admin-dashboard-home-icon" />
          </button>
        </div>

        <img src="/lumine_logo.png" alt="Lumine Logo" className="hotel-admin-dashboard-logo" />

        <div className="hotel-admin-dashboard-logout-btn">
          <span
            className="hotel-admin-dashboard-notification-icon"
            title="Notifications"
            style={{ marginRight: '1.2rem', fontSize: '1.5rem', verticalAlign: 'middle', cursor: 'pointer', color: '#fff', position: 'relative' }}
            onClick={() => setShowNotification(!showNotification)}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="hotel-admin-dashboard-notification-badge" aria-hidden>{unreadCount}</span>
            )}
          </span>
          {/* Notification panel */}
          {showNotification && (
            <div className="hotel-admin-dashboard-notification-panel" role="region" aria-label="Notifications">
              <div className="hotel-admin-dashboard-notification-panel-header">
                <strong>Notifications</strong>
                <button
                  className="hotel-admin-dashboard-notification-panel-close"
                  aria-label="Close notifications"
                  onClick={() => setShowNotification(false)}
                >
                  &#10005;
                </button>
              </div>
              <div className="hotel-admin-dashboard-notification-panel-body">
                {notifications.length === 0 ? (
                  <div className="hotel-admin-dashboard-notification-empty">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="hotel-admin-dashboard-notification-item">
                      <div className="hotel-admin-dashboard-notification-item-label" style={{ fontWeight: 'bold', marginBottom: '2px', color: '#c9a74b' }}>
                        {n.isTaskNotification ? 'Task' : (n.isRoomNotification ? 'Room' : 'Booking')}
                      </div>
                      <div className="hotel-admin-dashboard-notification-item-text">
                        {n.isTaskNotification ?
                          `Task ${n.taskId} - ${n.taskType} in ROOM ${n.roomNumber} - ${n.newStatus} - Employee ${n.employeeId}` : (
                          n.isRoomNotification ? `Room ${n.roomNumber} - ${n.roomType}, is now ${n.newStatus}` : `Room ${n.roomNumber} status changed: ${n.oldStatus || 'unknown'} -> ${n.newStatus}`
                        )}
                      </div>
                      <div className="hotel-admin-dashboard-notification-item-meta">
                        <span>{new Date(n.timestamp).toLocaleString()}</span>
                        <button
                          className="hotel-admin-dashboard-notification-panel-close"
                          aria-label={`Dismiss notification ${n.id}`}
                          onClick={() => dismissNotification(n.id)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          &#10005;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <LogoutButton />
        </div>
      </nav>

      {/* Sidebar */}
      <div style={{ display: 'flex', width: '100vw' }}>
        <aside className="hotel-admin-dashboard-sidebar gold-theme">
          {sidebarButtons.map((btn) => (
            <button
              key={btn.name}
              className={`hotel-admin-dashboard-sidebar-btn${
                location.pathname === btn.path ? ' selected' : ''
              }`}
              onClick={() => navigate(btn.path)}
            >
              <span className="sidebar-icon">{btn.icon}</span>
              <span className="sidebar-text">{btn.name}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="hotel-admin-dashboard-main">
          <div className="hotel-admin-dashboard-content gold-theme">{children}</div>
        </div>
      </div>
      {/* Toast overlay container */}
      <div className="hotel-admin-dashboard-toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.toastId} className="hotel-admin-dashboard-toast">
            <div className="hotel-admin-dashboard-toast-body">
              {t.isTaskNotification ? (
                <>
                  <strong>{`Task ${t.taskId} - ${t.taskType}`}</strong>
                  <div className="hotel-admin-dashboard-toast-text">{` in ROOM ${t.roomNumber} - ${t.newStatus} - Employee ${t.employeeId}`}</div>
                </>
              ) : t.isRoomNotification ? (
                <>
                  <strong>{`Room ${t.roomNumber} - ${t.roomType},`}</strong>
                  <div className="hotel-admin-dashboard-toast-text">{` is now ${t.newStatus}`}</div>
                </>
              ) : (
                <>
                  <strong>{`Room ${t.roomNumber} status changed:`}</strong>
                  <div className="hotel-admin-dashboard-toast-text">{`${t.oldStatus || 'unknown'} -> ${t.newStatus}`}</div>
                </>
              )}
            </div>
            <button className="hotel-admin-dashboard-toast-close" onClick={() => dismissToast(t.toastId)} aria-label="Dismiss toast">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HotelAdminDashboard;