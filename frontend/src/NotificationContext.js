import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const prevStatusesRef = useRef({});
  const socketRef = useRef(null);
  const notificationAudioRef = useRef(null);

  useEffect(() => {
    let intervalId;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (!res.ok) return;
        const data = await res.json();
        const prevStatuses = prevStatusesRef.current || {};
        const currentStatuses = {};
        data.forEach(b => {
          const status = b.bookingStatus || b.status || b.paymentStatus || '';
          currentStatuses[b._id] = status;
          const prevStatus = prevStatuses[b._id];
          if (prevStatus !== undefined && prevStatus !== status) {
            const roomNumber = b.roomNumber || (b.room && b.room.roomNumber) || 'Unknown';
            const notif = {
              id: `${b._id}-${Date.now()}`,
              bookingId: b._id,
              roomNumber,
              oldStatus: prevStatus,
              newStatus: status,
              timestamp: new Date().toISOString(),
              read: false,
            };
            addNotification(notif);
          }
        });
        prevStatusesRef.current = currentStatuses;
      } catch (err) {}
    };
    fetchBookings().then(() => {
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
      socket.on('roomStatusChanged', (payload) => {
        const notif = {
          id: `${payload.roomId}-room-${Date.now()}`,
          bookingId: null,
          roomNumber: payload.roomNumber,
          roomType: payload.roomType,
          oldStatus: null,
          newStatus: payload.status,
          timestamp: new Date().toISOString(),
          read: false,
          isRoomNotification: true,
        };
        addNotification(notif);
      });
      socket.on('taskChanged', (payload) => {
        const notif = {
          id: `${payload.taskId}-task-${Date.now()}`,
          bookingId: null,
          taskId: payload.taskId,
          roomNumber: payload.room,
          employeeId: payload.employeeId,
          taskType: payload.type,
          oldStatus: null,
          newStatus: payload.status,
          timestamp: new Date().toISOString(),
          read: false,
          isTaskNotification: true,
        };
        addNotification(notif);
      });
    }).catch(() => {
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
  }, []);

  const addNotification = (notif) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.bookingId === notif.bookingId && n.newStatus === notif.newStatus);
      if (exists) return prev;
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
    } catch (err) {}
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, dismissNotification, unreadCount, toasts, dismissToast, notificationAudioRef }}>
      {children}
      <audio ref={notificationAudioRef} src="/notification-sound.mp3" preload="auto" style={{ display: 'none' }} />
    </NotificationContext.Provider>
  );
}
