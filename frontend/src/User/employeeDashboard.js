import React, { useState, useEffect } from 'react';

const EmployeeDashboard = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // This would typically come from your authentication context or user session
  const currentUser = "Vivian Tabassamy";

  const stats = [
    { value: "5.30", unit: "Hrs", label: "Total Hours", color: "text-orange-500" },
    { value: "5", label: "Tasks Completed", color: "text-green-500" },
    { value: "5", label: "Pending Tasks", color: "text-red-500" }
  ];

  // Fetch tasks from API or database
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
       const response = await fetch('/api/tasks');
const tasksData = await response.json();

        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter tasks to show only those assigned to the current user
  const myTasks = tasks.filter(task => task.assignee === currentUser);

  // Calculate stats based on filtered tasks
  const calculateStats = () => {
    const completedTasks = myTasks.filter(task => task.status === 'Completed').length;
    const pendingTasks = myTasks.filter(task => task.status === 'Pending' || task.status === 'In Progress').length;
    
    return [
      { value: "5.30", unit: "Hrs", label: "Total Hours", color: "text-orange-500" },
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
        // Simulating API call to update task status
        // await fetch(`/api/tasks/${selectedTask.id}`, {
        //   method: 'PUT',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     ...selectedTask,
        //     status: 'Completed'
        //   })
        // });

        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? { ...task, status: 'Completed' }
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
      case 'In Progress':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
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
          My Tasks ({myTasks.length})
        </h3>
        <p className="text-sm text-gray-600">
          Tasks assigned to: <span className="font-medium">{currentUser}</span>
        </p>
      </div>

      <div>
        {myTasks.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No tasks assigned to you.</p>
          </div>
        ) : (
          myTasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{task.title}</h3>
                  <div className="text-xs text-gray-500 mb-1">
                    <span>Assigned: {task.assignedDate} {task.assignedTime}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>Assigned to: {task.assignee}</span>
                  </div>
                </div>
                <span className={`${getStatusColor(task.status)} text-white px-3 py-1 rounded-full text-xs font-medium ml-4 whitespace-nowrap`}>
                  {task.status}
                </span>
              </div>
              {task.type && (
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-600">{task.type}</div>
                  {task.priority && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
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
                    {selectedTask.assignee}
                  </div>
                </div>

                {/* Task Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task:
                  </label>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                      {selectedTask.title}
                    </div>
                    {selectedTask.description && (
                      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border">
                        {selectedTask.description}
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
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Assigned Date
                    </label>
                    <div className="text-sm text-gray-900">
                      {selectedTask.assignedDate} {selectedTask.assignedTime}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
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
                {selectedTask.status !== 'Completed' && (
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
    </div>
  );
};

export default EmployeeDashboard;