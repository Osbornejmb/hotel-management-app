import React, { useState, useEffect } from 'react';

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeInfo, setEmployeeInfo] = useState({ name: '', employeeId: '' });

  // Use your backend URL
  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchEmployeeTasks();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchEmployeeTasks, 30000);
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Get employee info from JWT token
  const getEmployeeFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Employee from token:', payload);
        return {
          name: payload.name || '',
          employeeId: payload.employeeId || '',
          id: payload.id || ''
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return { name: '', employeeId: '', id: '' };
  };

  const fetchEmployeeTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view your tasks.');
        setLoading(false);
        return;
      }

      // Get employee info from token FIRST
      const employee = getEmployeeFromToken();
      setEmployeeInfo(employee);

      console.log('Logged in employee:', employee);

      // If no employee info in token, we can't filter tasks
      if (!employee.name && !employee.employeeId) {
        setError('Unable to identify employee. Please log in again.');
        setLoading(false);
        return;
      }

      // Fetch all tasks
      const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!tasksResponse.ok) {
        // If tasks endpoint fails, show demo data filtered by employee
        console.log('Tasks API failed, using filtered demo data');
        showFilteredDemoTasks(employee);
        return;
      }

      const allTasks = await tasksResponse.json();
      console.log('All tasks from API:', allTasks);
      
      // Filter tasks to show only those assigned to the current employee
      const employeeTasks = allTasks.filter(task => {
        // Match by employee name (case insensitive) or employee ID
        const matchesName = task.assigned && 
                           task.assigned.toLowerCase() === employee.name.toLowerCase();
        const matchesId = task.employeeId && 
                         task.employeeId.toString() === employee.employeeId?.toString();
        
        return matchesName || matchesId;
      });

      console.log('Filtered tasks:', {
        employeeName: employee.name,
        employeeId: employee.employeeId,
        totalTasks: allTasks.length,
        employeeTasks: employeeTasks.length
      });

      setTasks(employeeTasks);

    } catch (err) {
      console.error('Error fetching employee tasks:', err);
      // Fallback to filtered demo data
      const employee = getEmployeeFromToken();
      showFilteredDemoTasks(employee);
    } finally {
      setLoading(false);
    }
  };

  const showFilteredDemoTasks = (employee) => {
    // Demo data with different employees
    const demoTasks = [
      { 
        id: 'T1001', 
        assigned: 'Christian Malong', 
        employeeId: '0001',
        room: 'Lobby', 
        type: 'CLEANING', 
        status: 'NOT_STARTED', 
        priority: 'HIGH', 
        description: 'Deep cleaning of main lobby area',
        jobTitle: 'Cleaner',
        createdAt: new Date().toISOString(),
        dueDate: '2025-01-15'
      },
      { 
        id: 'T1002', 
        assigned: 'Maria Santos',  // Different employee
        employeeId: '0002',
        room: '302', 
        type: 'MAINTENANCE', 
        status: 'IN_PROGRESS', 
        priority: 'MEDIUM', 
        description: 'Fix AC unit in room 302',
        jobTitle: 'Maintenance',
        createdAt: new Date().toISOString(),
        dueDate: '2025-01-12'
      },
      { 
        id: 'T1003', 
        assigned: 'Juan Dela Cruz',  // Different employee
        employeeId: '0003',
        room: '205-206', 
        type: 'HOUSEKEEPING', 
        status: 'COMPLETED', 
        priority: 'LOW', 
        description: 'Change bedsheets and towels',
        jobTitle: 'Housekeeping',
        createdAt: new Date().toISOString(),
        dueDate: '2025-01-10'
      }
    ];
    
    // Filter demo tasks by current employee
    const filteredTasks = demoTasks.filter(task => {
      const matchesName = task.assigned.toLowerCase() === employee.name?.toLowerCase();
      const matchesId = task.employeeId === employee.employeeId?.toString();
      return matchesName || matchesId;
    });

    console.log('Filtered demo tasks:', {
      employeeName: employee.name,
      employeeId: employee.employeeId,
      filteredCount: filteredTasks.length
    });

    setTasks(filteredTasks);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      // Update local state immediately for better UX
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      // Try to update via API in background
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          console.log('Task status updated via API');
        } else if (response.status === 404) {
          console.log('Status update endpoint not available, using local state only');
        } else {
          console.warn('API update failed:', response.status);
        }
      }

    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_STARTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-600">Loading your tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Tasks</h1>
          {employeeInfo.name && (
            <div className="text-sm text-gray-600">
              <div>Employee: {employeeInfo.name}</div>
              {employeeInfo.employeeId && (
                <div>ID: {employeeInfo.employeeId}</div>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={fetchEmployeeTasks}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="text-yellow-800 text-sm">{error}</div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          <div className="text-gray-500 text-lg mb-2">No tasks assigned</div>
          <div className="text-gray-400 text-sm">
            You don't have any tasks assigned to you at the moment.
            {employeeInfo.name && (
              <div className="mt-1">(Employee: {employeeInfo.name})</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{task.description || task.type}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {formatStatus(task.status)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                
                {/* Status Update Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {task.status !== 'NOT_STARTED' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'NOT_STARTED')}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                    >
                      Not Started
                    </button>
                  )}
                  {task.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
                    >
                      Start
                    </button>
                  )}
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Room/Location</div>
                  <div className="font-medium">{task.room}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Task Type</div>
                  <div className="font-medium">{task.type}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Task ID</div>
                  <div className="font-medium">{task.id}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Due Date</div>
                  <div className="font-medium">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>

              {task.jobTitle && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500">Assigned Role</div>
                  <div className="font-medium text-sm">{task.jobTitle}</div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Statistics */}
      {tasks.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Task Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.status === 'NOT_STARTED').length}
              </div>
              <div className="text-xs text-gray-600">Not Started</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'COMPLETED').length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
        <div className="font-medium text-blue-800">Debug Info:</div>
        <div>Employee: {employeeInfo.name || 'Not detected'}</div>
        <div>Employee ID: {employeeInfo.employeeId || 'Not detected'}</div>
        <div>Tasks loaded: {tasks.length}</div>
        <div>Backend: {API_BASE_URL}</div>
      </div>
    </div>
  );
};

export default EmployeeTasks;