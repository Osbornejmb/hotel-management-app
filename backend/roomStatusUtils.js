// backend/roomStatusUtils.js
// Utility functions for managing room status transitions based on task state

const Room = require('./Room');

/**
 * Update room status when a task status changes
 * Handles transitions based on task type and current room status
 */
async function updateRoomStatusOnTaskChange(task, newTaskStatus) {
  try {
    // Normalize room identifier and perform a case-insensitive trimmed match
    const roomNumberQuery = (task.room || '').toString().trim();
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const room = await Room.findOne({ roomNumber: { $regex: `^${escapeRegExp(roomNumberQuery)}$`, $options: 'i' } });
    if (!room) {
      console.warn(`Room ${task.room} not found for task status update (queried as: '${roomNumberQuery}')`);
      return null;
    }

    const oldRoomStatus = room.status;
    let newRoomStatus = null;

    // Task is starting (IN_PROGRESS)
    if (newTaskStatus === 'IN_PROGRESS') {
      // When task starts, room status should reflect the task type
      if ((task.type || '').toString().toUpperCase() === 'CLEANING') {
        newRoomStatus = 'cleaning';
      } else if ((task.type || '').toString().toUpperCase() === 'MAINTENANCE') {
        newRoomStatus = 'maintenance';
      }
    }
    // Task is completed
    else if (newTaskStatus === 'COMPLETED') {
      // When task completes, restore room to the prior status stored in the task
      // This is more reliable than trying to infer the status
      if (task.priorStatus) {
        newRoomStatus = task.priorStatus;
        console.log(`Using stored prior status from task: ${task.priorStatus}`);
      } else {
        // Fallback for tasks that don't have priorStatus stored
        // If room was checked-out, it becomes available
        if (oldRoomStatus === 'checked-out') {
          newRoomStatus = 'available';
        }
        // If room was occupied, it returns to occupied
        else if (oldRoomStatus === 'cleaning' || oldRoomStatus === 'maintenance') {
          // Check if there's a guest to determine if it should be occupied or available
          if (room.guestName) {
            newRoomStatus = 'occupied';
          } else {
            newRoomStatus = 'available';
          }
        }
      }
    }

    // Only update if status actually changed
    if (newRoomStatus && newRoomStatus !== oldRoomStatus) {
      console.log(`Updating room '${room.roomNumber}' status: ${oldRoomStatus} -> ${newRoomStatus} (task ${task.taskId} -> ${newTaskStatus})`);
      room.status = newRoomStatus;
      await room.save();

      // Additional debug after save
      console.log(`Room '${room.roomNumber}' saved. Current status: ${room.status}`);
      return { oldStatus: oldRoomStatus, newStatus: newRoomStatus };
    } else {
      console.log(`No room status change needed for room '${room.roomNumber}' (old: ${oldRoomStatus}, computed: ${newRoomStatus})`);
    }

    return null;
  } catch (err) {
    console.error('Error updating room status on task change:', err);
    throw err;
  }
}

/**
 * Update room status when a request status changes
 * Handles transitions based on request type and current room status
 */
async function updateRoomStatusOnRequestChange(request, newRequestStatus) {
  try {
    // Normalize room identifier and perform a case-insensitive trimmed match
    const roomNumberQuery = (request.room || '').toString().trim();
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const room = await Room.findOne({ roomNumber: { $regex: `^${escapeRegExp(roomNumberQuery)}$`, $options: 'i' } });
    if (!room) {
      console.warn(`Room ${request.room} not found for request status update (queried as: '${roomNumberQuery}')`);
      return null;
    }

    const oldRoomStatus = room.status;
    let newRoomStatus = null;

    // Request is starting (in-progress)
    if (newRequestStatus === 'in-progress') {
      // When request starts, room status should reflect the task type
      const taskType = (request.taskType || '').toString().toLowerCase();
      if (taskType === 'cleaning') {
        newRoomStatus = 'cleaning';
      } else if (taskType === 'maintenance' || taskType === 'repair') {
        newRoomStatus = 'maintenance';
      }
    }
    // Request is completed
    else if (newRequestStatus === 'completed') {
      // When request completes, restore room to the prior status stored in the request
      if (request.priorStatus) {
        newRoomStatus = request.priorStatus;
        console.log(`Using stored prior status from request: ${request.priorStatus}`);
      } else {
        // Fallback for requests that don't have priorStatus stored
        if (oldRoomStatus === 'checked-out') {
          newRoomStatus = 'available';
        } else if (oldRoomStatus === 'cleaning' || oldRoomStatus === 'maintenance') {
          if (room.guestName) {
            newRoomStatus = 'occupied';
          } else {
            newRoomStatus = 'available';
          }
        }
      }
    }

    // Only update if status actually changed
    if (newRoomStatus && newRoomStatus !== oldRoomStatus) {
      console.log(`Updating room '${room.roomNumber}' status: ${oldRoomStatus} -> ${newRoomStatus} (request ${request.taskId} -> ${newRequestStatus})`);
      room.status = newRoomStatus;
      await room.save();

      console.log(`Room '${room.roomNumber}' saved. Current status: ${room.status}`);
      return { oldStatus: oldRoomStatus, newStatus: newRoomStatus };
    } else {
      console.log(`No room status change needed for room '${room.roomNumber}' (old: ${oldRoomStatus}, computed: ${newRoomStatus})`);
    }

    return null;
  } catch (err) {
    console.error('Error updating room status on request change:', err);
    throw err;
  }
}


async function setRoomCheckedOut(roomNumber) {
  try {
    const room = await Room.findOne({ roomNumber });
    if (!room) {
      console.warn(`Room ${roomNumber} not found for checkout`);
      return null;
    }

    const oldStatus = room.status;
    room.status = 'checked-out';
    await room.save();

    console.log(`Room ${roomNumber} checked out. Status: ${oldStatus} -> checked-out`);
    return { oldStatus, newStatus: 'checked-out' };
  } catch (err) {
    console.error('Error setting room to checked-out:', err);
    throw err;
  }
}

/**
 * Restore a room to occupied status
 * Called when task on an occupied room completes
 */
async function setRoomOccupied(roomNumber) {
  try {
    const room = await Room.findOne({ roomNumber });
    if (!room) {
      console.warn(`Room ${roomNumber} not found`);
      return null;
    }

    const oldStatus = room.status;
    
    // Only update if not already occupied
    if (oldStatus !== 'occupied') {
      room.status = 'occupied';
      await room.save();

      console.log(`Room ${roomNumber} restored to occupied. Status: ${oldStatus} -> occupied`);
      return { oldStatus, newStatus: 'occupied' };
    }

    return null;
  } catch (err) {
    console.error('Error setting room to occupied:', err);
    throw err;
  }
}

/**
 * Get the prior status before a cleaning/maintenance started
 * This helps determine where to restore the room after task completion
 */
async function getPriorRoomStatus(roomNumber, taskId) {
  try {
    // Fallback: check room document itself
    const room = await Room.findOne({ roomNumber });
    return room?.status || 'available';
  } catch (err) {
    console.error('Error getting prior room status:', err);
    return 'available'; // Safe default
  }
}

module.exports = {
  updateRoomStatusOnTaskChange,
  updateRoomStatusOnRequestChange,
  setRoomCheckedOut,
  setRoomOccupied,
  getPriorRoomStatus
};
