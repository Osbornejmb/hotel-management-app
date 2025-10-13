import React, { useState, useEffect } from 'react';

const EmployeeDashboard = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState({ name: '', employeeId: '' });

  // Use your backend URL
  const API_BASE_URL = 'http://localhost:5000';

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

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setLoading(false);
          return;
        }

        // Get employee info from token
        const employee = getEmployeeFromToken();
        setEmployeeInfo(employee);

        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const tasksData = await response.json();
        
        // Filter tasks to show only those assigned to the current employee
        const myTasks = tasksData.filter(task => {
          const matchesName = task.assigned && 
                             task.assigned.toLowerCase() === employee.name.toLowerCase();
          const matchesId = task.employeeId && 
                           task.employeeId.toString() === employee.employeeId?.toString();
          return matchesName || matchesId;
        });

        console.log('Filtered tasks for dashboard:', {
          employeeName: employee.name,
          totalTasks: tasksData.length,
          myTasks: myTasks.length
        });

        setTasks(myTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // Fallback to demo data
        showDemoTasks();
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Demo data fallback
  const showDemoTasks = () => {
    const employee = getEmployeeFromToken();
    const demoTasks = [
      { 
        id: 'T1001', 
        title: 'Clean Lobby Area',
        assigned: 'Christian Malong', 
        employeeId: '0001',
        room: 'Lobby', 
        type: 'CLEANING', 
        status: 'NOT_STARTED', 
        priority: 'HIGH', 
        description: 'Deep cleaning of main lobby area',
        jobTitle: 'Cleaner',
        assignedDate: '2025-01-15',
        assignedTime: '09:00 AM',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'T1002', 
        title: 'Fix AC Unit',
        assigned: 'Maria Santos', 
        employeeId: '0002',
        room: '302', 
        type: 'MAINTENANCE', 
        status: 'IN_PROGRESS', 
        priority: 'MEDIUM', 
        description: 'Fix AC unit in room 302',
        jobTitle: 'Maintenance',
        assignedDate: '2025-01-12',
        assignedTime: '10:30 AM',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'T1004', 
        title: 'Clean Swimming Pool',
        assigned: 'Christian Malong', 
        employeeId: '0001',
        room: 'Pool', 
        type: 'CLEANING', 
        status: 'IN_PROGRESS', 
        priority: 'MEDIUM', 
        description: 'Clean swimming pool area',
        jobTitle: 'Cleaner',
        assignedDate: '2025-01-14',
        assignedTime: '02:00 PM',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter demo tasks by current employee
    const filteredTasks = demoTasks.filter(task => {
      const matchesName = task.assigned.toLowerCase() === employee.name?.toLowerCase();
      const matchesId = task.employeeId === employee.employeeId?.toString();
      return matchesName || matchesId;
    });

    setTasks(filteredTasks);
  };

  // Calculate stats based on filtered tasks
  const calculateStats = () => {
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(task => task.status === 'NOT_STARTED' || task.status === 'IN_PROGRESS').length;
    const totalHours = "5.30"; // This could be calculated from task time estimates
    
    return [
      { value: totalHours, unit: "Hrs", label: "Total Hours", color: "text-orange-500" },
      { value: completedTasks.toString(), label: "Tasks Completed", color: "text-green-500" },
      { value: pendingTasks.toString(), label: "Pending Tasks", color: "text-red-500" }
    ];
  };

  const dynamicStats = calculateStats();

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleMarkAsDone = async () => {
    if (selectedTask) {
      try {
        const token = localStorage.getItem('token');
        
        // Update via API
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask.id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'COMPLETED' })
          });

          if (response.ok) {
            console.log('Task status updated via API');
          }
        }

        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? { ...task, status: 'COMPLETED' }
              : task
          )
        );

        console.log(`Marking task "${selectedTask.title}" as done`);
        alert(`Task "${selectedTask.title}" marked as completed!`);
        handleCloseModal();
      } catch (error) {
        console.error('Error updating task:', error);
        alert('Error updating task. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'NOT_STARTED':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'NOT_STARTED':
        return 'Not Started';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      case 'LOW':
        return 'Low';
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading your tasks...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-orange-500 mb-4 uppercase tracking-wider">TODAY'S...</h2>
        <div className="grid grid-cols-3 gap-3">
          {dynamicStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-baseline space-x-1 mb-2">
                <span className={`${index === 0 ? 'text-3xl' : 'text-2xl'} font-bold ${stat.color}`}>
                  {stat.value}
                </span>
                {stat.unit && <span className={`text-sm ${stat.color}`}>{stat.unit}</span>}
              </div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          My Tasks ({tasks.length})
        </h3>
        <p className="text-sm text-gray-600">
          Tasks assigned to: <span className="font-medium">{employeeInfo.name || 'Loading...'}</span>
          {employeeInfo.employeeId && (
            <span className="ml-2">(ID: {employeeInfo.employeeId})</span>
          )}
        </p>
      </div>

      <div>
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No tasks assigned to you.</p>
            <p className="text-gray-400 text-sm mt-1">Employee: {employeeInfo.name}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{task.description || task.title}</h3>
                  <div className="text-xs text-gray-500 mb-1">
                    <span>Room: {task.room}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>Type: {task.type}</span>
                  </div>
                </div>
                <span className={`${getStatusColor(task.status)} text-white px-3 py-1 rounded-full text-xs font-medium ml-4 whitespace-nowrap`}>
                  {getStatusText(task.status)}
                </span>
              </div>
              {task.type && (
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-600">Task ID: {task.id}</div>
                  {task.priority && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Task Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Employee Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name of Employee:
                  </label>
                  <div className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                    {selectedTask.assigned}
                  </div>
                </div>

                {/* Task Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task:
                  </label>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                      {selectedTask.description || selectedTask.title}
                    </div>
                    {selectedTask.jobTitle && (
                      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border">
                        Role: {selectedTask.jobTitle}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Task Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Type
                    </label>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedTask.type}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Priority
                    </label>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                      {getPriorityText(selectedTask.priority)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Room/Location
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedTask.room}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(selectedTask.status)}`}>
                      {getStatusText(selectedTask.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Task ID
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedTask.id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Employee ID
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedTask.employeeId}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedTask.status !== 'COMPLETED' && (
                  <button
                    onClick={handleMarkAsDone}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 transition-colors"
                  >
                    Mark as Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
        <div className="font-medium text-blue-800">Dashboard Debug Info:</div>
        <div>Employee: {employeeInfo.name || 'Not detected'}</div>
        <div>Employee ID: {employeeInfo.employeeId || 'Not detected'}</div>
        <div>Tasks loaded: {tasks.length}</div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;