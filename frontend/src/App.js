import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./Auth/LoginPage";
import RegisterPage from "./Auth/RegisterPage";
import ProtectedRoute from "./Auth/ProtectedRoute";
import RestaurantAdminDashboard from "./Admin/Restaurant/RestaurantAdminDashboard";
import HotelAdminDashboard from "./Admin/Hotel/HotelAdminDashboard";
import CustomerLogin from "./Admin/Customer/Customerlogin";
import CustomerInterface from "./Admin/Customer/CustomerInterface";
import AttendancePage from "./AttendancePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* 👇 Default route now points to AttendancePage */}
        <Route path="/" element={<AttendancePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/interface" element={<CustomerInterface />} />
        <Route path="/attendance" element={<AttendancePage />} />
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
        {/* 👇 Fallback also goes to AttendancePage */}
        <Route path="*" element={<AttendancePage />} />
      </Routes>
    </Router>
  );
}

export default App;