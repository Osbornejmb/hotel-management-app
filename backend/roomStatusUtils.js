// backend/roomStatusUtils.js
// Utility functions for managing room status transitions based on task state

const Room = require('./Room');

/**
 * Update room status when a task status changes
 * Handles transitions based on task type and current room status
 */
async function updateRoomStatusOnTaskChange(task, newTaskStatus) {
  try {
    const room = await Room.findOne({ roomNumber: task.room });
    if (!room) {
      console.warn(`Room ${task.room} not found for task status update`);
      return null;
    }

    const oldRoomStatus = room.status;
    let newRoomStatus = null;

    // Task is starting (IN_PROGRESS)
    if (newTaskStatus === 'IN_PROGRESS') {
      // When task starts, room status should reflect the task type
      if (task.type === 'CLEANING') {
        newRoomStatus = 'cleaning';
      } else if (task.type === 'MAINTENANCE') {
        newRoomStatus = 'maintenance';
      }
    }
    // Task is completed
    else if (newTaskStatus === 'COMPLETED') {
      // When task completes, restore room to appropriate status
      // If room was checked-out, it becomes available
      if (oldRoomStatus === 'checked-out') {
        newRoomStatus = 'available';
      }
      // If room was occupied, it returns to occupied
      else if (oldRoomStatus === 'cleaning' || oldRoomStatus === 'maintenance') {
        // Need to check the guest info to determine if it should be occupied or available
        // For now, we'll set it to occupied if there's a guest, otherwise available
        if (room.guestName) {
          newRoomStatus = 'occupied';
        } else {
          newRoomStatus = 'available';
        }
      }
    }

    // Only update if status actually changed
    if (newRoomStatus && newRoomStatus !== oldRoomStatus) {
      room.status = newRoomStatus;
      await room.save();

      console.log(`Room ${task.room} status changed from ${oldRoomStatus} to ${newRoomStatus} due to task ${task.taskId} status: ${newTaskStatus}`);
      return { oldStatus: oldRoomStatus, newStatus: newRoomStatus };
    }

    return null;
  } catch (err) {
    console.error('Error updating room status on task change:', err);
    throw err;
  }
}

/**
 * Transition a room to checked-out status
 * Called when guest checks out
 */
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
  setRoomCheckedOut,
  setRoomOccupied,
  getPriorRoomStatus
};
