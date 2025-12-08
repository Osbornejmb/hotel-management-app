// backend/roomStatusUtils.js
// Utility functions for managing room status transitions based on task state

const Room = require('./Room');

/**
 * Update room status when a task status changes
 * Handles transitions based on task type and current room status
 */
async function updateRoomStatusOnTaskChange(task, newTaskStatus) {
  try {
    console.log(`=== updateRoomStatusOnTaskChange called ===`);
    console.log(`Task Details:`, { 
      taskId: task.taskId,
      room: task.room,
      type: task.type,
      currentStatus: task.status,
      newTaskStatus: newTaskStatus,
      priorStatus: task.priorStatus
    });

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

    console.log(`Current room status: ${oldRoomStatus}`);

    // Task is starting (IN_PROGRESS)
    if (newTaskStatus === 'IN_PROGRESS') {
      // When task starts, room status should reflect the task type
      console.log(`Task starting - checking type: ${task.type}`);
      if ((task.type || '').toString().toUpperCase() === 'CLEANING') {
        newRoomStatus = 'cleaning';
        console.log(`Task is CLEANING - setting room to 'cleaning'`);
      } else if ((task.type || '').toString().toUpperCase() === 'MAINTENANCE') {
        newRoomStatus = 'maintenance';
        console.log(`Task is MAINTENANCE - setting room to 'maintenance'`);
      } else {
        console.log(`Task type '${task.type}' doesn't match CLEANING or MAINTENANCE`);
      }
    }
    // Task is completed
    else if (newTaskStatus === 'COMPLETED') {
      console.log(`Task completed - checking priorStatus: ${task.priorStatus}`);
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
          console.log(`Fallback: room was checked-out, setting to available`);
        }
        // If room was occupied, it returns to occupied
        else if (oldRoomStatus === 'cleaning' || oldRoomStatus === 'maintenance') {
          // Check if there's a guest to determine if it should be occupied or available
          if (room.guestName) {
            newRoomStatus = 'occupied';
            console.log(`Fallback: room has guest, setting to occupied`);
          } else {
            newRoomStatus = 'available';
            console.log(`Fallback: room has no guest, setting to available`);
          }
        } else {
          console.log(`Fallback: room status ${oldRoomStatus} - no status change`);
        }
      }
    } else {
      console.log(`Task status ${newTaskStatus} - no room status update needed`);
    }

    // Only update if status actually changed
    if (newRoomStatus && newRoomStatus !== oldRoomStatus) {
      console.log(`Updating room '${room.roomNumber}' status: ${oldRoomStatus} -> ${newRoomStatus} (task ${task.taskId} -> ${newTaskStatus})`);
      room.status = newRoomStatus;
      // Save without validation to avoid enum errors on roomType field
      await room.save({ validateBeforeSave: false });

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
    console.log(`=== updateRoomStatusOnRequestChange called ===`);
    console.log(`Request Details:`, { 
      taskId: request.taskId,
      room: request.room,
      taskType: request.taskType,
      currentStatus: request.status,
      newRequestStatus: newRequestStatus,
      priorStatus: request.priorStatus
    });

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

    console.log(`Current room status: ${oldRoomStatus}`);

    // Request is starting (in-progress)
    if (newRequestStatus === 'in-progress') {
      // When request starts, room status should reflect the task type
      const taskType = (request.taskType || '').toString().toLowerCase();
      console.log(`Request starting - checking taskType: ${taskType}`);
      if (taskType === 'cleaning') {
        newRoomStatus = 'cleaning';
        console.log(`Request is cleaning - setting room to 'cleaning'`);
      } else if (taskType === 'maintenance' || taskType === 'repair') {
        newRoomStatus = 'maintenance';
        console.log(`Request is maintenance/repair - setting room to 'maintenance'`);
      } else {
        console.log(`Request taskType '${taskType}' doesn't match cleaning or maintenance/repair`);
      }
    }
    // Request is completed
    else if (newRequestStatus === 'completed') {
      console.log(`Request completed - checking priorStatus: ${request.priorStatus}`);
      // When request completes, restore room to the prior status stored in the request
      if (request.priorStatus) {
        newRoomStatus = request.priorStatus;
        console.log(`Using stored prior status from request: ${request.priorStatus}`);
      } else {
        // Fallback for requests that don't have priorStatus stored
        if (oldRoomStatus === 'checked-out') {
          newRoomStatus = 'available';
          console.log(`Fallback: room was checked-out, setting to available`);
        } else if (oldRoomStatus === 'cleaning' || oldRoomStatus === 'maintenance') {
          if (room.guestName) {
            newRoomStatus = 'occupied';
            console.log(`Fallback: room has guest, setting to occupied`);
          } else {
            newRoomStatus = 'available';
            console.log(`Fallback: room has no guest, setting to available`);
          }
        } else {
          console.log(`Fallback: room status ${oldRoomStatus} - no status change`);
        }
      }
    } else {
      console.log(`Request status ${newRequestStatus} - no room status update needed`);
    }

    // Only update if status actually changed
    if (newRoomStatus && newRoomStatus !== oldRoomStatus) {
      console.log(`Updating room '${room.roomNumber}' status: ${oldRoomStatus} -> ${newRoomStatus} (request ${request.taskId} -> ${newRequestStatus})`);
      room.status = newRoomStatus;
      // Save without validation to avoid enum errors on roomType field
      await room.save({ validateBeforeSave: false });

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
    // Save without validation to avoid enum errors on roomType field
    await room.save({ validateBeforeSave: false });

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
      // Save without validation to avoid enum errors on roomType field
      await room.save({ validateBeforeSave: false });

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
