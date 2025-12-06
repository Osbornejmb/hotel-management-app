const ActivityLog = require('./ActivityLog');

async function logRoomStatusChange({ roomId, roomNumber, oldValue, newValue, actionType = 'update', user = null }) {
  try {
    const entry = {
      actionType,
      collection: 'rooms',
      documentId: roomId,
      details: { roomNumber, status: newValue },
      change: {
        field: 'status',
        oldValue,
        newValue
      }
    };
    if (user) entry.user = user;
    return await ActivityLog.create(entry);
  } catch (err) {
    console.error('[activityLogUtils] Failed to create activity log:', err);
    throw err;
  }
}

module.exports = { logRoomStatusChange };
