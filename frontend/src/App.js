import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import LoginPage from "./Auth/LoginPage";
import RegisterPage from "./Auth/RegisterPage";
import ProtectedRoute from "./Auth/ProtectedRoute";
import RestaurantAdminDashboard from "./Admin/Restaurant/RestaurantAdminDashboard";
import HotelAdminDashboard from "./Admin/Hotel/HotelAdminDashboard";
import EmployeeAdminDashboard from "./Admin/Employee/EmployeeAdminDashboard";
import EmployeeMainDashboard from "./User/employeeMainDashboard";  // ✅ Import employee dashboard
import CustomerLogin from "./Admin/Customer/Customerlogin";
import CustomerInterface from "./Admin/Customer/CustomerInterface";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/interface" element={<CustomerInterface />} />

        <Route
          path="/admin/restaurant"
          element={
            <ProtectedRoute allowedRoles={["restaurantAdmin"]}>
              <RestaurantAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hotel"
          element={
            <ProtectedRoute allowedRoles={["hotelAdmin"]}>
              <HotelAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employee"
          element={
            <ProtectedRoute allowedRoles={["employeeAdmin"]}>
              <EmployeeAdminDashboard />
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/User/employeeMainDashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeMainDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
