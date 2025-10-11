import React, { useState, useEffect } from "react";

// Helper: fetch basic employee list (id + name + formatted id)
async function fetchEmployeesBasic() {
  try {
    const res = await fetch("/api/employee");
    if (!res.ok) return [];
    const data = await res.json();
    const onlyEmployees = data.filter(
      (u) => (u.role || "").toLowerCase() === "employee"
    );
    return onlyEmployees.map((u) => ({
      id: u._id || u.id || u.username,
      name: u.name || u.username,
      formattedId:
        typeof u.employeeId === "number"
          ? String(u.employeeId).padStart(4, "0")
          : u._id || u.username,
      jobTitle: u.jobTitle || "Staff",
    }));
  } catch (err) {
    console.error("fetchEmployeesBasic error", err);
    return [];
  }
}

// Helper: fetch tasks from API
async function fetchTasksFromAPI() {
  try {
    const res = await fetch("/api/tasks");
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchTasksFromAPI error", err);
    return [];
  }
}

// Helper: Filter out employees who have active tasks
const filterAvailableEmployees = (employees, tasks) => {
  // Get names of employees who have active tasks (not completed)
  const employeesWithActiveTasks = tasks
    .filter((task) => task.status !== "COMPLETED")
    .map((task) => task.assigned);

  // Filter out employees who have active tasks
  return employees.filter(
    (emp) => !employeesWithActiveTasks.includes(emp.name)
  );
};

// Create Task Modal Component
const CreateTaskModal = ({
  isOpen,
  onClose,
  employees,
  tasks,
  onTaskCreate,
  taskType,
}) => {
  const [formData, setFormData] = useState({
    assigned: "",
    room: "",
    type: taskType || "CLEANING",
    priority: "MEDIUM",
    description: "",
  });
  const [creating, setCreating] = useState(false);

  // Filter employees based on task type AND availability
  const getFilteredEmployees = () => {
    // First filter by task type
    let typeFilteredEmployees;
    switch (formData.type) {
      case "CLEANING":
        typeFilteredEmployees = employees.filter(
          (emp) =>
            emp.jobTitle?.toLowerCase().includes("cleaner") ||
            emp.jobTitle?.toLowerCase().includes("housekeeping") ||
            !emp.jobTitle
        );
        break;
      case "MAINTENANCE":
        typeFilteredEmployees = employees.filter(
          (emp) =>
            emp.jobTitle?.toLowerCase().includes("maintenance") ||
            emp.jobTitle?.toLowerCase().includes("technician") ||
            emp.jobTitle?.toLowerCase().includes("engineer") ||
            !emp.jobTitle
        );
        break;
      default:
        typeFilteredEmployees = employees;
    }

    // Then filter out employees with active tasks
    return filterAvailableEmployees(typeFilteredEmployees, tasks);
  };

  const filteredEmployees = getFilteredEmployees();

  useEffect(() => {
    if (taskType) {
      setFormData((prev) => ({ ...prev, type: taskType }));
    }
  }, [taskType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.assigned) {
      alert("Please select an employee to assign this task to.");
      return;
    }

    setCreating(true);

    try {
      const selectedEmployee = employees.find(
        (emp) => emp.name === formData.assigned
      );

      // Call the actual API through parent component
      await onTaskCreate({
        assigned: formData.assigned,
        employeeId: selectedEmployee?.formattedId || "N/A",
        room: formData.room,
        type: formData.type,
        status: formData.assigned ? "NOT_STARTED" : "UNASSIGNED",
        priority: formData.priority,
        description: formData.description,
        jobTitle: selectedEmployee?.jobTitle || "Staff",
      });

      setCreating(false);
      onClose();
      setFormData({
        assigned: "",
        room: "",
        type: taskType || "CLEANING",
        priority: "MEDIUM",
        description: "",
      });
    } catch (error) {
      setCreating(false);
      alert("Error creating task. Please try again.");
    }
  };

  const handleClose = () => {
    setFormData({
      assigned: "",
      room: "",
      type: taskType || "CLEANING",
      priority: "MEDIUM",
      description: "",
    });
    onClose();
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      assigned: "", // Clear assigned employee when type changes
    }));
  };

  const getJobTitleRequirements = () => {
    switch (formData.type) {
      case "CLEANING":
        return "Available for Cleaning: Cleaners, Housekeeping";
      case "MAINTENANCE":
        return "Available for Maintenance: Maintenance, Technicians, Engineers";
      default:
        return "All employees available";
    }
  };

  // Get count of available employees
  const availableEmployeesCount = filteredEmployees.length;
  const totalEmployees = employees.filter((emp) => {
    switch (formData.type) {
      case "CLEANING":
        return (
          emp.jobTitle?.toLowerCase().includes("cleaner") ||
          emp.jobTitle?.toLowerCase().includes("housekeeping") ||
          !emp.jobTitle
        );
      case "MAINTENANCE":
        return (
          emp.jobTitle?.toLowerCase().includes("maintenance") ||
          emp.jobTitle?.toLowerCase().includes("technician") ||
          emp.jobTitle?.toLowerCase().includes("engineer") ||
          !emp.jobTitle
        );
      default:
        return true;
    }
  }).length;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          animation: "modalAppear 0.3s ease-out",
        }}
      >
        <style>
          {`
            @keyframes modalAppear {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid #ecf0f1",
            paddingBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#2c3e50",
              fontWeight: 600,
              fontSize: "1.3rem",
            }}
          >
            Create New Task
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#7f8c8d",
              padding: "4px",
              borderRadius: "4px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#e74c3c")}
            onMouseLeave={(e) => (e.target.style.color = "#7f8c8d")}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Task Type */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#2c3e50",
              }}
            >
              Task Type *
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleTypeChange("CLEANING")}
                style={{
                  padding: "8px 16px",
                  background:
                    formData.type === "CLEANING" ? "#2ecc71" : "#f8f9fa",
                  color: formData.type === "CLEANING" ? "white" : "#7f8c8d",
                  border: "none",
                  borderRadius: "20px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "0.85rem",
                }}
              >
                Cleaning
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("MAINTENANCE")}
                style={{
                  padding: "8px 16px",
                  background:
                    formData.type === "MAINTENANCE" ? "#3498db" : "#f8f9fa",
                  color: formData.type === "MAINTENANCE" ? "white" : "#7f8c8d",
                  border: "none",
                  borderRadius: "20px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "0.85rem",
                }}
              >
                Maintenance
              </button>
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "#7f8c8d",
                marginTop: "4px",
                fontStyle: "italic",
              }}
            >
              {getJobTitleRequirements()}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: availableEmployeesCount === 0 ? "#e74c3c" : "#2ecc71",
                marginTop: "4px",
                fontWeight: 500,
              }}
            >
              Available: {availableEmployeesCount} of {totalEmployees} employees
            </div>
          </div>

          {/* Assigned To */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#2c3e50",
              }}
            >
              Assign To *
            </label>
            <select
              value={formData.assigned}
              onChange={(e) =>
                setFormData({ ...formData, assigned: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
              required
            >
              <option value="">Select Employee</option>
              {filteredEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.jobTitle || "Staff"}) - ID: {emp.formattedId}
                </option>
              ))}
            </select>
            {filteredEmployees.length === 0 && (
              <div
                style={{
                  color: "#e74c3c",
                  fontSize: "0.8rem",
                  marginTop: "4px",
                }}
              >
                No available employees for {formData.type.toLowerCase()} tasks.
                {totalEmployees > 0
                  ? " All qualified employees currently have active tasks."
                  : " Please select a different task type."}
              </div>
            )}
          </div>

          {/* Room Number */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#2c3e50",
              }}
            >
              Room Number *
            </label>
            <input
              type="text"
              placeholder="Enter room number..."
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "88px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          {/* Priority */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#2c3e50",
              }}
            >
              Priority *
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#2c3e50",
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Enter task description..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                resize: "vertical",
                minHeight: "80px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              borderTop: "1px solid #ecf0f1",
              paddingTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: "#7f8c8d",
                border: "1px solid #bdc3c7",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: creating ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!creating) {
                  e.target.style.background = "#f8f9fa";
                  e.target.style.color = "#2c3e50";
                }
              }}
              onMouseLeave={(e) => {
                if (!creating) {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#7f8c8d";
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || filteredEmployees.length === 0}
              style={{
                padding: "12px 24px",
                background:
                  creating || filteredEmployees.length === 0
                    ? "#95a5a6"
                    : "#3498db",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor:
                  creating || filteredEmployees.length === 0
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: "120px",
                justifyContent: "center",
              }}
            >
              {creating ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

const TasksSection = () => {
  const [emps, setEmps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const tasksData = await fetchTasksFromAPI();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      try {
        // Fetch employees
        const employeeList = await fetchEmployeesBasic();
        if (mounted) {
          setEmps(employeeList);
        }

        // Fetch tasks
        await fetchTasks();
      } catch (error) {
        console.error("Error initializing data:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter tasks based on active filter and search term
  const filteredTasks = tasks.filter((task) => {
    const taskStatus = task.status.replace("_", " "); // Convert NOT_STARTED to "NOT STARTED"
    const matchesFilter =
      activeFilter === "all" ||
      taskStatus.toLowerCase() === activeFilter.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.room.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Handle Create New Task - UPDATED for real API
  const handleCreateTask = async (newTask) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedTo: newTask.assigned, // Employee name
          room: newTask.room,
          type: newTask.type,
          priority: newTask.priority,
          description: newTask.description,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Add the new task to state
        setTasks((prev) => [result.task, ...prev]);
        alert("Task created successfully!");
      } else {
        const error = await response.json();
        alert(`Error creating task: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task. Please try again.");
    }
  };

  // Handle Export Tasks
  const handleExportTasks = () => {
    if (filteredTasks.length === 0) {
      alert("No tasks to export.");
      return;
    }

    // Create CSV content
    const headers = [
      "Task ID",
      "Assigned To",
      "Employee ID",
      "Room",
      "Task Type",
      "Status",
      "Priority",
      "Job Title",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredTasks.map((task) =>
        [
          task.id,
          `"${task.assigned}"`,
          task.employeeId,
          task.room,
          task.type,
          task.status.replace("_", " "), // Convert back for export
          task.priority,
          task.jobTitle || "Staff",
        ].join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tasks-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log("Exported", filteredTasks.length, "tasks");
    alert(`Exported ${filteredTasks.length} tasks successfully!`);
  };

  // Handle Search Clear
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Get task counts for better UX
  const taskCounts = {
    all: tasks.length,
    unassigned: tasks.filter((t) => t.status === "UNASSIGNED").length,
    notStarted: tasks.filter((t) => t.status === "NOT_STARTED").length,
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.replace("_", " ");
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
        }}
      >
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2
        style={{
          marginBottom: 24,
          color: "#2c3e50",
          fontWeight: 600,
          fontSize: "1.8rem",
        }}
      >
        Task Management
      </h2>

      {/* Filters and Search Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: "300px",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 500,
              color: "#2c3e50",
              minWidth: "100px",
            }}
          >
            Search Tasks:
          </div>
          <div style={{ display: "flex", flex: 1, gap: 8 }}>
            <input
              type="text"
              placeholder="Search by ID, employee, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
                flex: 1,
                fontSize: 14,
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                style={{
                  padding: "10px 16px",
                  background: "#95a5a6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#7f8c8d")}
                onMouseLeave={(e) => (e.target.style.background = "#95a5a6")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "8px 16px",
              background: activeFilter === "all" ? "#3498db" : "#f8f9fa",
              color: activeFilter === "all" ? "white" : "#7f8c8d",
              border: "none",
              borderRadius: 20,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            <span>All Tasks</span>
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "#3498db",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {taskCounts.all}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("unassigned")}
            style={{
              padding: "8px 16px",
              background: activeFilter === "unassigned" ? "#e74c3c" : "#f8f9fa",
              color: activeFilter === "unassigned" ? "white" : "#7f8c8d",
              border: "none",
              borderRadius: 20,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: activeFilter === "unassigned" ? "#fff" : "#e74c3c",
              }}
            ></span>
            Unassigned
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "#e74c3c",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {taskCounts.unassigned}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("not started")}
            style={{
              padding: "8px 16px",
              background:
                activeFilter === "not started" ? "#f39c12" : "#f8f9fa",
              color: activeFilter === "not started" ? "white" : "#7f8c8d",
              border: "none",
              borderRadius: 20,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: activeFilter === "not started" ? "#fff" : "#f39c12",
              }}
            ></span>
            Not Started
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "#f39c12",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "0.7rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {taskCounts.notStarted}
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          fontWeight: 600,
          color: "#2c3e50",
          fontSize: "1.1rem",
          paddingLeft: "8px",
        }}
      >
        Task List{" "}
        {filteredTasks.length > 0 && `(${filteredTasks.length} tasks)`}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 0,
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
          marginBottom: 24,
          width: "100%",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            fontSize: 14,
            color: "#2c3e50",
            borderCollapse: "collapse",
            minWidth: "800px",
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                fontWeight: 600,
                background: "#f8f9fa",
              }}
            >
              <th style={{ padding: "18px 16px" }}>TASK ID</th>
              <th style={{ padding: "18px 16px" }}>ASSIGNED TO</th>
              <th style={{ padding: "18px 16px" }}>ROOM</th>
              <th style={{ padding: "18px 16px" }}>TASK TYPE</th>
              <th style={{ padding: "18px 16px" }}>STATUS</th>
              <th style={{ padding: "18px 16px" }}>PRIORITY</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: "1px solid #ecf0f1",
                  transition: "background 0.2s ease",
                }}
              >
                <td style={{ padding: "16px", fontWeight: 600 }}>{task.id}</td>
                <td style={{ padding: "16px" }}>
                  <div>{task.assigned}</div>
                  <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>
                    ID: {task.employeeId} • {task.jobTitle || "Staff"}
                  </div>
                </td>
                <td style={{ padding: "16px", fontWeight: 500 }}>
                  {task.room}
                </td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      background:
                        task.type === "CLEANING"
                          ? "rgba(46, 204, 113, 0.1)"
                          : task.type === "MAINTENANCE"
                          ? "rgba(52, 152, 219, 0.1)"
                          : "rgba(155, 89, 182, 0.1)",
                      color:
                        task.type === "CLEANING"
                          ? "#2ecc71"
                          : task.type === "MAINTENANCE"
                          ? "#3498db"
                          : "#9b59b6",
                      fontWeight: 500,
                      fontSize: "0.85rem",
                    }}
                  >
                    {task.type}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      background:
                        task.status === "COMPLETED"
                          ? "rgba(46, 204, 113, 0.1)"
                          : task.status === "IN_PROGRESS"
                          ? "rgba(52, 152, 219, 0.1)"
                          : task.status === "NOT_STARTED"
                          ? "rgba(243, 156, 18, 0.1)"
                          : "rgba(231, 76, 60, 0.1)",
                      color:
                        task.status === "COMPLETED"
                          ? "#2ecc71"
                          : task.status === "IN_PROGRESS"
                          ? "#3498db"
                          : task.status === "NOT_STARTED"
                          ? "#f39c12"
                          : "#e74c3c",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    {formatStatus(task.status)}
                  </span>
                </td>
                <td style={{ padding: "16px" }}>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      background:
                        task.priority === "HIGH"
                          ? "rgba(231, 76, 60, 0.1)"
                          : task.priority === "MEDIUM"
                          ? "rgba(243, 156, 18, 0.1)"
                          : "rgba(46, 204, 113, 0.1)",
                      color:
                        task.priority === "HIGH"
                          ? "#e74c3c"
                          : task.priority === "MEDIUM"
                          ? "#f39c12"
                          : "#2ecc71",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    {task.priority}
                  </span>
                </td>
              </tr>
            ))}

            {/* Show message if no results found */}
            {filteredTasks.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#7f8c8d",
                    fontStyle: "italic",
                  }}
                >
                  {searchTerm || activeFilter !== "all"
                    ? "No tasks found matching your criteria"
                    : "No tasks available"}
                </td>
              </tr>
            )}

            {/* Add empty rows for consistent spacing if needed */}
            {filteredTasks.length > 0 &&
              [...Array(Math.max(0, 8 - filteredTasks.length))].map((_, i) => (
                <tr key={i + filteredTasks.length} style={{ height: 48 }}>
                  <td colSpan={6}></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#2980b9";
            e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#3498db";
            e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Create New Task
        </button>
        <button
          onClick={handleExportTasks}
          disabled={filteredTasks.length === 0}
          style={{
            background: filteredTasks.length === 0 ? "#95a5a6" : "#2ecc71",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: 14,
            cursor: filteredTasks.length === 0 ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: filteredTasks.length === 0 ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (filteredTasks.length > 0) {
              e.target.style.background = "#27ae60";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (filteredTasks.length > 0) {
              e.target.style.background = "#2ecc71";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.15)";
            }
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export Tasks
        </button>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        employees={emps}
        tasks={tasks}
        onTaskCreate={handleCreateTask}
      />
    </div>
  );
};

export default TasksSection;
