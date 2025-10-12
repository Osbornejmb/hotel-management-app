// TaskRequests.js
import React, { useState, useEffect } from 'react';
import '../styles/taskrequest.css';

const TaskRequests = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [existingTasks, setExistingTasks] = useState([]); // Track existing tasks from tasks collection
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignDescription, setAssignDescription] = useState('');

  // API configuration
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch tasks from your actual API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching tasks from:', `${API_BASE_URL}/requests`);
      const response = await fetch(`${API_BASE_URL}/requests`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Your API returns data with both roomNumber and room fields
      // Let's use the data as-is since it already has the structure we need
      const transformedTasks = data.map(request => ({
        _id: request._id,
        taskId: request.taskId,
        roomNumber: request.roomNumber || request.room, // Use roomNumber if available, otherwise room
        jobType: request.jobType || request.taskType, // Use jobType if available, otherwise taskType
        date: request.date,
        priority: request.priority,
        status: request.status || 'pending',
        assignedTo: request.assignedTo || 'Unassigned',
        description: request.description || '',
        __v: request.__v || 0
      }));
      
      console.log('Transformed tasks:', transformedTasks);
      setTasks(transformedTasks);
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(`Failed to load tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees from your API
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users?role=employee`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Fetch existing tasks from tasks collection to check employee assignments
  const fetchExistingTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch existing tasks');
      }

      const data = await response.json();
      console.log('Existing tasks:', data);
      setExistingTasks(data);
    } catch (err) {
      console.error('Error fetching existing tasks:', err);
    }
  };

  // Filter employees based on task type AND check if they already have active tasks
const getFilteredEmployees = (taskType) => {
  if (!taskType) return [];

  const jobTitleMap = {
    'cleaning': ['Cleaner', 'Staff'],
    'maintenance': ['Maintenance', 'Staff'],
    'repair': ['Maintenance', 'Staff'],
    'inspection': ['Manager', 'Staff'],
    'setup': ['Staff', 'Maintenance'],
    'other': ['Staff']
  };

  const allowedJobTitles = jobTitleMap[taskType] || ['Staff'];
  
  // Get employees with the right job title AND valid data
  const qualifiedEmployees = employees.filter(employee => 
    employee && 
    employee._id && 
    employee.name && 
    employee.jobTitle &&
    allowedJobTitles.includes(employee.jobTitle)
  );

  // Filter out employees who already have active tasks AND ensure they have complete data
  const availableEmployees = qualifiedEmployees.filter(employee => {
    if (!employee || !employee.name) return false;
    
    // Check if employee has any active tasks (NOT_STARTED or IN_PROGRESS status)
    const hasActiveTask = existingTasks.some(task => 
      task.assigned === employee.name && 
      (task.status === 'NOT_STARTED' || task.status === 'IN_PROGRESS')
    );
    
    return !hasActiveTask;
  });

  console.log('Available employees for', taskType, ':', availableEmployees.map(emp => ({
    name: emp.name,
    jobTitle: emp.jobTitle,
    employeeId: emp.employeeId,
    hasActiveTask: existingTasks.some(task => 
      task.assigned === emp.name && 
      (task.status === 'NOT_STARTED' || task.status === 'IN_PROGRESS')
    )
  })));

  return availableEmployees;
};

  // Handle Assign Staff button click
  const handleAssignClick = (task) => {
    setSelectedTask(task);
    setSelectedEmployee('');
    setAssignDescription('');
    setShowAssignModal(true);
  };

  // Handle View Details button click
  const handleViewDetailsClick = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

 // Create a task in the tasks collection using your task route
    const createTaskInTasksCollection = async (requestData, employee) => {
    try {
        const taskData = {
        assigned: employee.name, // Use 'assigned' field to match your existing tasks structure
        assignedTo: employee.name, // Also include assignedTo for compatibility
        room: requestData.roomNumber,
        type: requestData.jobType,
        priority: requestData.priority,
        description: assignDescription || requestData.description || '',
        employeeId: employee.employeeId, // Include employee ID if needed
        employeeName: employee.name // Explicitly include employee name
        };

        console.log('Creating task with data:', taskData);

        const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
        });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task in tasks collection');
        }

        const result = await response.json();
        console.log('Task created in tasks collection:', result);
        
        // Refresh existing tasks after creating a new one
        await fetchExistingTasks();
        
        return result;
    } catch (err) {
        console.error('Error creating task in tasks collection:', err);
        throw err;
    }
    };

     // Handle assigning a task to an employee
    const handleAssignSubmit = async () => {
    if (!selectedEmployee) {
        alert('Please select an employee');
        return;
    }

    try {
        const selectedEmp = employees.find(emp => emp._id === selectedEmployee);
        
        // Double-check if employee is still available (in case of race conditions)
        const availableEmployees = getFilteredEmployees(selectedTask.jobType);
        const isStillAvailable = availableEmployees.some(emp => emp._id === selectedEmployee);
        
        if (!isStillAvailable) {
        alert('This employee is no longer available. Please select another employee.');
        return;
        }
        
        // Step 1: Update the request with assigned employee
        const assignResponse = await fetch(`${API_BASE_URL}/requests/${selectedTask._id}/assign`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assignedTo: selectedEmp.name,
            description: assignDescription || selectedTask.description
        })
        });

        if (!assignResponse.ok) {
        throw new Error('Failed to assign task to request');
        }

        const updatedRequest = await assignResponse.json();
        
        // Step 2: Create a corresponding task in the tasks collection with employee name
        await createTaskInTasksCollection(selectedTask, selectedEmp);
        
        // Step 3: Delete the request from requests collection
        const deleteResponse = await fetch(`${API_BASE_URL}/requests/${selectedTask._id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
        });

        if (!deleteResponse.ok) {
        throw new Error('Failed to delete request after task creation');
        }

        const deleteResult = await deleteResponse.json();
        console.log('Request deleted:', deleteResult);
        
        // Step 4: Update the local state by removing the deleted request
        setTasks(prevTasks => prevTasks.filter(task => task._id !== selectedTask._id));
        
        // Refresh existing tasks after creating a new one
        await fetchExistingTasks();

        alert(`Task assigned to ${selectedEmp.name} successfully! Request has been processed and removed.`);
        setShowAssignModal(false);
        setSelectedTask(null);
        setSelectedEmployee('');
        setAssignDescription('');
    } catch (err) {
        console.error('Error in assignment process:', err);
        alert(`Failed to complete assignment: ${err.message}`);
    }
    };

  // Close modals
  const closeModals = () => {
    setShowAssignModal(false);
    setShowDetailsModal(false);
    setSelectedTask(null);
    setSelectedEmployee('');
    setAssignDescription('');
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchTasks();
      await fetchEmployees();
      await fetchExistingTasks();
    };
    
    initializeData();
  }, []);

  const filteredTasks = tasks.filter(task => 
    filter === 'all' || task.priority === filter
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      case 'urgent': return '#ff3838';
      default: return '#57606f';
    }
  };

  const getJobTypeIcon = (jobType) => {
    switch (jobType) {
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔧';
      case 'inspection': return '🔍';
      case 'repair': return '🛠️';
      case 'setup': return '⚙️';
      case 'other': return '📋';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="task-requests-loading">
        <div className="spinner"></div>
        <p>Loading task requests...</p>
      </div>
    );
  }

  return (
    <div className="task-requests-section">
      <div className="task-requests-header">
        <h2>📋 Task Requests</h2>
        <div className="task-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="priority-filter"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <button 
            className="btn-refresh"
            onClick={async () => {
              setLoading(true);
              await fetchTasks();
              await fetchExistingTasks();
              setLoading(false);
            }}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <span className="task-count">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)} className="dismiss-btn">×</button>
        </div>
      )}

      <div className="tasks-grid">
        {filteredTasks.map((task) => (
          <div key={task._id} className="task-card">
            <div className="task-header">
              <div className="task-type">
                <span className="job-icon">{getJobTypeIcon(task.jobType)}</span>
                <span className="job-type-text">{task.jobType}</span>
              </div>
              <div className="priority-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                {task.priority}
              </div>
            </div>

            <div className="task-details">
              <div className="task-info">
                <div className="info-item">
                  <span className="label">Room:</span>
                  <span className="value room-number">#{task.roomNumber}</span>
                </div>
                <div className="info-item">
                  <span className="label">Task ID:</span>
                  <span className="value task-id">{task.taskId}</span>
                </div>
                <div className="info-item">
                  <span className="label">Assigned To:</span>
                  <span className="value assigned-to">
                    {task.assignedTo}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Requested:</span>
                  <span className="value date">{formatDate(task.date)}</span>
                </div>
                {task.description && (
                  <div className="info-item">
                    <span className="label">Description:</span>
                    <span className="value description-text">{task.description}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="task-actions">
              <button 
                className="btn-assign"
                onClick={() => handleAssignClick(task)}
                disabled={task.assignedTo !== 'Unassigned'}
              >
                {task.assignedTo !== 'Unassigned' ? 'Already Assigned' : 'Assign Staff'}
              </button>
              <button 
                className="btn-view"
                onClick={() => handleViewDetailsClick(task)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Assign Task to Staff</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Task Information:</label>
                <div className="task-info-modal">
                  <p><strong>Task ID:</strong> {selectedTask.taskId}</p>
                  <p><strong>Room:</strong> #{selectedTask.roomNumber}</p>
                  <p><strong>Type:</strong> {selectedTask.jobType}</p>
                  <p><strong>Priority:</strong> {selectedTask.priority}</p>
                </div>
              </div>
              
             <div className="form-group">
                <label htmlFor="employee-select">Select Available Employee:</label>
                <select 
                    id="employee-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="form-select"
                >
                    <option value="">Choose an available employee...</option>
                    {getFilteredEmployees(selectedTask.jobType).map(employee => (
                    <option key={employee._id} value={employee._id}>
                        {employee.name} - {employee.jobTitle} {employee.employeeId ? `(ID: ${employee.employeeId})` : ''}
                    </option>
                    ))}
                </select>
                {getFilteredEmployees(selectedTask.jobType).length === 0 && (
                    <div className="no-employees-warning">
                    ⚠️ No available employees for this task type. All qualified employees currently have active tasks.
                    </div>
                )}
            </div>

              <div className="form-group">
                <label htmlFor="assign-description">Additional Instructions:</label>
                <textarea 
                  id="assign-description"
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  placeholder="Add any additional instructions or details..."
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModals}>
                Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleAssignSubmit}
                disabled={getFilteredEmployees(selectedTask.jobType).length === 0}
                >
                Assign & Process Request
            </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
                <h3>Assign & Process Task Request</h3>
                <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="task-details-full">
                <div className="detail-row">
                  <span className="detail-label">Task ID:</span>
                  <span className="detail-value">{selectedTask.taskId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Room Number:</span>
                  <span className="detail-value">#{selectedTask.roomNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Job Type:</span>
                  <span className="detail-value">{selectedTask.jobType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Priority:</span>
                  <span 
                    className="detail-value priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{selectedTask.status}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Assigned To:</span>
                  <span className="detail-value">{selectedTask.assignedTo}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Request Date:</span>
                  <span className="detail-value">{formatDate(selectedTask.date)}</span>
                </div>
                {selectedTask.description && (
                  <div className="detail-row full-width">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value description-full">{selectedTask.description}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-confirm" onClick={closeModals}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 && !loading && (
        <div className="no-tasks">
          <p>No task requests found</p>
        </div>
      )}
    </div>
  );
};

export default TaskRequests;