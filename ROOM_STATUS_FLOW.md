# Room Status Management Flow - Implementation Guide

## Overview
This implementation follows the room status flow logic for the hotel management system:

### Scenario 1: Checked-Out Room with Task Request
1. **Guest Checks Out**: Room status changes from `occupied` → `checked-out`
2. **Task Assigned**: Admin creates cleaning or maintenance request
   - Task status: `NOT_STARTED`
   - Room status: remains `checked-out`
3. **Task Started**: Employee starts the task
   - Task status: `IN_PROGRESS`
   - Room status: changes to `cleaning` (if cleaning task) or `maintenance` (if maintenance task)
4. **Task Completed**: Employee finishes the task
   - Task status: `COMPLETED`
   - Room status: changes to `available`

### Scenario 2: Occupied Room with Task Request
1. **Room Occupied**: Guest is currently in the room
   - Room status: `occupied`
2. **Task Requested**: Admin creates cleaning or maintenance request (mid-stay or quick maintenance)
   - Task status: `NOT_STARTED`
   - Room status: remains `occupied`
3. **Task Started**: Employee starts the task
   - Task status: `IN_PROGRESS`
   - Room status: changes to `cleaning` or `maintenance`
4. **Task Completed**: Employee finishes the task
   - Task status: `COMPLETED`
   - Room status: returns to `occupied` (guest still in room)

## Implementation Details

### 1. Room Schema Updates (backend/Room.js)
Updated the room status enum to include all necessary states:
```javascript
status: {
  type: String,
  enum: ['available', 'occupied', 'booked', 'checked-out', 'cleaning', 'maintenance'],
  default: 'available',
  required: true
}
```

### 2. Room Status Utility (backend/roomStatusUtils.js)
Created utility functions for managing room status transitions:

#### `updateRoomStatusOnTaskChange(task, newTaskStatus)`
- **IN_PROGRESS**: Sets room to `cleaning` or `maintenance` based on task type
- **COMPLETED**: 
  - If room was `checked-out`: changes to `available`
  - If room was `cleaning`/`maintenance`: checks guest info, restores to `occupied` if guest exists, otherwise `available`

#### `setRoomCheckedOut(roomNumber)`
- Sets room status to `checked-out` when guest checks out
- Logs the status change to activity log

#### `setRoomOccupied(roomNumber)`
- Restores room to `occupied` after task completion
- Used when a task is completed on an originally occupied room

#### `getPriorRoomStatus(roomNumber, taskId)`
- Helper to retrieve the room's status before a task started
- Checks activity logs for accurate restoration

### 3. Task Routes Update (backend/taskRoutes.js)
Modified the PATCH `/:taskId/status` endpoint to:
1. Update task status to the new state
2. Call `updateRoomStatusOnTaskChange()` to update room status based on task type and status
3. Log activity changes
4. Send notifications to relevant users

**Key Change**: When task status is updated to `IN_PROGRESS` or `COMPLETED`, the corresponding room status is automatically updated using the utility function.

### 4. Checkout Routes Update (backend/checkoutRoutes.js)
Modified the PUT `/checkout` endpoint to:
1. Use `setRoomCheckedOut()` utility to set room to `checked-out` instead of `available`
2. Clear guest information
3. Update customer status to `checked out`
4. Log the activity change

## API Endpoints

### Create Task
**POST** `/api/tasks`
```json
{
  "assignedTo": "Employee Name",
  "room": "101",
  "type": "CLEANING" | "MAINTENANCE",
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "description": "Task description"
}
```

### Update Task Status
**PATCH** `/api/tasks/:taskId/status`
```json
{
  "status": "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
}
```
This endpoint will automatically update the room status based on the task status.

### Checkout Room
**PUT** `/api/checkout`
```json
{
  "roomNumber": "101"
}
```
Sets room status to `checked-out` and prepares it for cleaning/maintenance tasks.

## Activity Logging
All room status changes are logged in the ActivityLog collection with:
- `actionType`: 'task_update' (when task status changes), 'checkout', etc.
- `collection`: 'rooms'
- `documentId`: Room ID
- `change.field`: 'status'
- `change.oldValue`: Previous status
- `change.newValue`: New status

## Testing Checklist

### Test Scenario 1: Checked-Out Room → Cleaning Task
- [ ] Guest checks out (room: `occupied` → `checked-out`)
- [ ] Admin creates cleaning request (task: `NOT_STARTED`, room: `checked-out`)
- [ ] Employee starts task (task: `IN_PROGRESS`, room: should be `cleaning`)
- [ ] Employee completes task (task: `COMPLETED`, room: should be `available`)
- [ ] Verify activity log shows all transitions

### Test Scenario 2: Checked-Out Room → Maintenance Task
- [ ] Guest checks out (room: `occupied` → `checked-out`)
- [ ] Admin creates maintenance request (task: `NOT_STARTED`, room: `checked-out`)
- [ ] Employee starts task (task: `IN_PROGRESS`, room: should be `maintenance`)
- [ ] Employee completes task (task: `COMPLETED`, room: should be `available`)
- [ ] Verify activity log shows all transitions

### Test Scenario 3: Occupied Room → Cleaning Task (Mid-Stay)
- [ ] Room occupied with guest (room: `occupied`)
- [ ] Admin creates cleaning request (task: `NOT_STARTED`, room: `occupied`)
- [ ] Employee starts task (task: `IN_PROGRESS`, room: should be `cleaning`)
- [ ] Employee completes task (task: `COMPLETED`, room: should return to `occupied`)
- [ ] Verify guest info is preserved

### Test Scenario 4: Occupied Room → Maintenance Task (Mid-Stay)
- [ ] Room occupied with guest (room: `occupied`)
- [ ] Admin creates maintenance request (task: `NOT_STARTED`, room: `occupied`)
- [ ] Employee starts task (task: `IN_PROGRESS`, room: should be `maintenance`)
- [ ] Employee completes task (task: `COMPLETED`, room: should return to `occupied`)
- [ ] Verify guest info is preserved

## Socket.io Events
The system emits real-time notifications:
- `taskChanged`: Notifies when task status updates (with roomNumber, type, status)
- `roomStatusChanged`: Notifies when room status changes
- `new-notification`: Sent to assigned employee for task updates

## Notes
- Room status transitions are atomic - they occur immediately when task status updates
- Activity logs provide a complete audit trail of all status changes
- The system gracefully handles edge cases (missing rooms, invalid employees, etc.)
- Guest information is preserved during occupied room tasks
