

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import RestaurantAdminDashboard from "./RestaurantAdminDashboard";
import HotelAdminDashboard from "./HotelAdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/restaurant" element={
          <ProtectedRoute allowedRoles={["restaurantAdmin"]}>
            <RestaurantAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/hotel" element={
          <ProtectedRoute allowedRoles={["hotelAdmin"]}>
            <HotelAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
