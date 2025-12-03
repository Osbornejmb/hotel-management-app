// TaskRequests.js
import React, { useState, useEffect } from 'react';
import '../styles/taskrequest.css';

const TaskRequests = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [existingTasks, setExistingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [presentEmployeesToday, setPresentEmployeesToday] = useState([]);

  // API configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hotel-management-app-qo2l.onrender.com';

  // Fetch today's attendance records to get list of present employees (still clocked in)
  // Uses the same logic as attendance dashboard
  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendances`);
      if (!response.ok) {
        console.warn('Failed to fetch attendance records');
        // If attendance fetch fails, use all employees
        const allEmployeeNames = employees.map(e => e.name);
        setPresentEmployeesToday(allEmployeeNames);
        return allEmployeeNames;
      }

      const allAttendance = await response.json();
      console.log('All attendance records from API:', allAttendance);
      console.log('Total attendance records:', allAttendance.length);
      
      if (!allAttendance || allAttendance.length === 0) {
        console.log('No attendance records in database - using all employees as available');
        // If no attendance records exist, use all employees
        const allEmployeeNames = employees.map(e => e.name);
        setPresentEmployeesToday(allEmployeeNames);
        return allEmployeeNames;
      }
      
      // Transform data using same logic as attendance dashboard
      const transformedRecords = allAttendance.map(record => {
        const hasTimedOut = record.clockOut && record.clockOut !== null;
        return {
          name: record.name,
          status: hasTimedOut ? (record.totalHours >= 8 ? 'Complete' : 'Incomplete') : 'Present'
        };
      });
      
      console.log('Transformed records:', transformedRecords);
      
      // Filter for employees with "Present" status (still clocked in)
      const presentEmployees = transformedRecords.filter(record => record.status === 'Present');
      const presentEmployeeNames = presentEmployees.map(record => record.name);
      
      console.log('Employees with "Present" status:', presentEmployeeNames);
      
      // If still no present employees, use all employees
      if (presentEmployeeNames.length === 0) {
        const allEmployeeNames = employees.map(e => e.name);
        setPresentEmployeesToday(allEmployeeNames);
        return allEmployeeNames;
      }
      
      setPresentEmployeesToday(presentEmployeeNames);
      return presentEmployeeNames;
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      // On error, use all employees
      const allEmployeeNames = employees.map(e => e.name);
      setPresentEmployeesToday(allEmployeeNames);
      return allEmployeeNames;
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching tasks from:', `${API_BASE_URL}/api/requests`);
      const response = await fetch(`${API_BASE_URL}/api/requests`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      const transformedTasks = data
        .filter(request => {
          // Filter out completed tasks
          const isCompleted = request.status === 'COMPLETED' || request.status === 'completed';
          console.log(`Task ${request._id} status: ${request.status}, isCompleted: ${isCompleted}`);
          return !isCompleted;
        })
        .map(request => ({
          _id: request._id,
          taskId: request._id,
          roomNumber: request.room || request.roomNumber,
          jobType: request.taskType || request.jobType,
          date: request.date || request.createdAt,
          priority: request.priority,
          status: request.status || 'pending',
          assignedTo: request.assignedTo?.name || request.assignedTo || 'Unassigned',
          description: request.description || '',
          notes: request.notes || '',
          location: request.location || '',
          completedAt: request.completedAt
        }));
      
      console.log('Transformed tasks (completed removed):', transformedTasks);
      setTasks(transformedTasks);
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(`Failed to load tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees from your API - FIXED VERSION
  const fetchEmployees = async () => {
    try {
      console.log('Attempting to fetch employees...');
      
      // Try multiple possible endpoints (in order of preference)
      const endpoints = [
        `${API_BASE_URL}/api/employee`,                    // Main employee endpoint
        `${API_BASE_URL}/api/tasks/employees/list`,       // Task employees endpoint
        `${API_BASE_URL}/api/requests/employees/list`,    // Request employees endpoint
        `${API_BASE_URL}/api/users?role=employee`         // User endpoint
      ];

      let employeesData = [];
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully fetched from ${endpoint}:`, data);
            
            // Transform data to consistent format
            employeesData = Array.isArray(data) ? data.map(emp => ({
              _id: emp._id || emp.id,
              name: emp.name || emp.username || 'Unknown',
              employeeId: emp.employeeId || emp.id,
              jobTitle: emp.jobTitle || emp.role || 'Staff',
              department: emp.department || 'General'
            })) : [];
            
            break; // Exit loop if successful
          } else {
            lastError = `Endpoint ${endpoint} returned ${response.status}`;
            console.warn(`Failed to fetch from ${endpoint}:`, response.status);
          }
        } catch (err) {
          lastError = err.message;
          console.warn(`Error fetching from ${endpoint}:`, err.message);
        }
      }

      if (employeesData.length > 0) {
        setEmployees(employeesData);
        console.log('Final employees data:', employeesData);
      } else {
        throw new Error(lastError || 'All employee endpoints failed');
      }

    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees list. Using fallback data.');
      
      // Fallback to mock data for development
      const fallbackEmployees = [
        { _id: '1', name: 'John Doe', employeeId: 'E1001', jobTitle: 'Cleaner', department: 'Housekeeping' },
        { _id: '2', name: 'Jane Smith', employeeId: 'E1002', jobTitle: 'Maintenance', department: 'Facilities' },
        { _id: '3', name: 'Mike Johnson', employeeId: 'E1003', jobTitle: 'Staff', department: 'General' }
      ];
      setEmployees(fallbackEmployees);
    }
  };

  // Fetch existing tasks from tasks collection to check employee assignments
  const fetchExistingTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch existing tasks');
      }

      const data = await response.json();
      console.log('Existing tasks:', data);
      setExistingTasks(data);
    } catch (err) {
      console.error('Error fetching existing tasks:', err);
      setExistingTasks([]); // Set empty array as fallback
    }
  };

    // Filter employees based on presence - show all present employees regardless of job type
    const getFilteredEmployees = (taskType) => {
      if (employees.length === 0) {
        console.log('No employees available');
        return [];
      }

      console.log('Total employees:', employees.length);
      console.log('Present employees today:', presentEmployeesToday);

      // If no present employees found, show all employees
      if (presentEmployeesToday.length === 0) {
        console.log('No present employees in attendance - showing all employees');
        
        // Filter out employees who already have active tasks
        const availableEmployees = employees.filter(employee => {
          if (!employee || !employee.name) return false;
          
          // Check if employee has any active tasks
          const hasActiveTask = existingTasks.some(task => 
            task.assigned === employee.name && 
            task.status !== 'COMPLETED'
          );
          
          console.log(`Employee ${employee.name} has active task:`, hasActiveTask);
          return !hasActiveTask;
        });

        console.log('Available employees:', availableEmployees);
        return availableEmployees;
      }

      // Filter to only present employees
      const presentEmployees = employees.filter(employee => {
        if (!employee || !employee.name) return false;
        const isPresent = presentEmployeesToday.includes(employee.name);
        console.log(`Employee ${employee.name} is present:`, isPresent);
        return isPresent;
      });

      console.log('Present employees:', presentEmployees);

      // Filter out employees who already have active tasks
      const availableEmployees = presentEmployees.filter(employee => {
        if (!employee || !employee.name) return false;
        
        // Check if employee has any active tasks
        const hasActiveTask = existingTasks.some(task => 
          task.assigned === employee.name && 
          task.status !== 'COMPLETED'
        );
        
        console.log(`Employee ${employee.name} has active task:`, hasActiveTask);
        return !hasActiveTask;
      });

      console.log('Available employees:', availableEmployees);
      return availableEmployees;
    };  // Handle Assign Staff button click
  const handleAssignClick = (task) => {
    console.log('Assign clicked for task:', task);
    console.log('Available employees for this task:', getFilteredEmployees(task.jobType));
    
    setSelectedTask(task);
    setSelectedEmployee('');
    setAssignDescription(task.description || '');
    setShowAssignModal(true);
  };

  // Handle View Details button click
  const handleViewDetailsClick = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  // Create a task in the tasks collection
  const createTaskInTasksCollection = async (requestData, employee) => {
    try {
      const taskData = {
        assignedTo: employee.name,
        room: requestData.roomNumber,
        type: requestData.jobType,
        priority: requestData.priority,
        description: assignDescription || requestData.description || '',
        employeeId: employee.employeeId,
        status: 'NOT_STARTED'
      };

      console.log('Creating task with data:', taskData);

      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      const result = await response.json();
      console.log('Task created successfully:', result);
      
      return result;
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  };

  // Handle assigning a task to an employee
  const handleAssignSubmit = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }

    setProcessing(true);

    try {
      const selectedEmp = employees.find(emp => emp._id === selectedEmployee);
      
      if (!selectedEmp) {
        throw new Error('Selected employee not found');
      }

      console.log('Assigning task to employee:', selectedEmp);

      // Double-check if employee is still available
      const availableEmployees = getFilteredEmployees(selectedTask.jobType);
      const isStillAvailable = availableEmployees.some(emp => emp._id === selectedEmployee);
      
      if (!isStillAvailable) {
        alert('This employee is no longer available. Please select another employee.');
        setProcessing(false);
        return;
      }
      
      // Step 1: Update the request with assigned employee (using employee ID)
      const assignResponse = await fetch(`${API_BASE_URL}/api/requests/${selectedTask._id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedTo: selectedEmp._id,
          description: assignDescription || selectedTask.description
        })
      });

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.error || 'Failed to assign task to request');
      }

      const updatedRequest = await assignResponse.json();
      console.log('Request assigned:', updatedRequest);
      
      // Step 2: Create a corresponding task in the tasks collection
      await createTaskInTasksCollection(selectedTask, selectedEmp);
      
      // Step 3: Update the request status to 'in-progress'
      const updateResponse = await fetch(`${API_BASE_URL}/api/requests/${selectedTask._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in-progress'
        })
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update request status, but task was created');
      }

      // Step 4: Update the local state by removing the assigned request
      setTasks(prevTasks => prevTasks.filter(task => task._id !== selectedTask._id));
      
      // Refresh existing tasks after creating a new one
      await fetchExistingTasks();

      alert(`Task successfully assigned to ${selectedEmp.name}! The request has been processed.`);
      closeModals();
      
    } catch (err) {
      console.error('Error in assignment process:', err);
      alert(`Failed to complete assignment: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Close modals
  const closeModals = () => {
    setShowAssignModal(false);
    setShowDetailsModal(false);
    setSelectedTask(null);
    setSelectedEmployee('');
    setAssignDescription('');
    setProcessing(false);
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTasks(),
          fetchEmployees(),
          fetchExistingTasks(),
          fetchTodayAttendance()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize application data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const filteredTasks = tasks.filter(task => 
    filter === 'all' || task.priority === filter
  );

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      case 'urgent': return '#ff3838';
      default: return '#57606f';
    }
  };

  const getJobTypeIcon = (jobType) => {
    if (!jobType) return '📋';
    
    switch (jobType.toLowerCase()) {
      case 'cleaning': return '🧹';
      case 'maintenance': return '🔧';
      case 'inspection': return '🔍';
      case 'repair': return '🛠️';
      case 'setup': return '⚙️';
      case 'miscellaneous': return '📋';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'No date';
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
              await Promise.all([fetchTasks(), fetchEmployees(), fetchExistingTasks(), fetchTodayAttendance()]);
              setLoading(false);
            }}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <span className="task-count">
            {filteredTasks.length} request{filteredTasks.length !== 1 ? 's' : ''}
          </span>
          <span className="employee-count">
            {presentEmployeesToday.length} employee{presentEmployeesToday.length !== 1 ? 's' : ''} available
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
                <span className="job-type-text">{task.jobType || 'Task'}</span>
              </div>
              <div 
                className="priority-badge" 
                style={{ backgroundColor: getPriorityColor(task.priority) }}
              >
                {task.priority || 'normal'}
              </div>
            </div>

            <div className="task-details">
              <div className="task-info">
                <div className="info-item">
                  <span className="label">Room:</span>
                  <span className="value room-number">#{task.roomNumber}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className="value status">{task.status}</span>
                </div>
                <div className="info-item">
                  <span className="label">Assigned To:</span>
                  <span className="value assigned-to">
                    {task.assignedTo || 'Unassigned'}
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
                disabled={task.assignedTo !== 'Unassigned' && task.assignedTo !== 'unassigned'}
              >
                {task.assignedTo && task.assignedTo !== 'Unassigned' && task.assignedTo !== 'unassigned' 
                  ? 'Already Assigned' 
                  : 'Assign Staff'}
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
                  <p><strong>Room:</strong> #{selectedTask.roomNumber}</p>
                  <p><strong>Type:</strong> {selectedTask.jobType}</p>
                  <p><strong>Priority:</strong> {selectedTask.priority}</p>
                  <p><strong>Status:</strong> {selectedTask.status}</p>
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
                      {employee.name} - {employee.jobTitle} 
                      {employee.employeeId ? ` (ID: ${employee.employeeId})` : ''}
                    </option>
                  ))}
                </select>
                {getFilteredEmployees(selectedTask.jobType).length === 0 && (
                  <div className="no-employees-warning">
                    ⚠️ No available employees for this task type. {presentEmployeesToday.length === 0 ? 'No employees are currently clocked in.' : 'All qualified employees currently have active tasks.'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="assign-description">Task Description:</label>
                <textarea 
                  id="assign-description"
                  value={assignDescription}
                  onChange={(e) => setAssignDescription(e.target.value)}
                  placeholder="Add task description and instructions..."
                  className="form-textarea"
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModals} disabled={processing}>
                Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleAssignSubmit}
                disabled={!selectedEmployee || processing || getFilteredEmployees(selectedTask.jobType).length === 0}
              >
                {processing ? 'Processing...' : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedTask && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>Task Request Details</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="task-details-full">
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
                  <span className="detail-value">{selectedTask.assignedTo || 'Unassigned'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Request Date:</span>
                  <span className="detail-value">{formatDate(selectedTask.date)}</span>
                </div>
                {selectedTask.location && (
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedTask.location}</span>
                  </div>
                )}
                {selectedTask.notes && (
                  <div className="detail-row full-width">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{selectedTask.notes}</span>
                  </div>
                )}
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
          <button 
            className="btn-refresh"
            onClick={fetchTasks}
          >
            Check Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskRequests;