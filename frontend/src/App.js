import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import LoginPage from "./Auth/LoginPage";
import RegisterPage from "./Auth/RegisterPage";
import ProtectedRoute from "./Auth/ProtectedRoute";
import RestaurantAdminDashboard from "./Admin/Restaurant/RestaurantAdminDashboard";
import HotelAdminLayout from "./Admin/Hotel/HotelAdminDashboard";
import Dashboard from "./Admin/Hotel/Dashboard";
import CustomerLogin from "./Customer/Customerlogin";
import CustomerInterface from "./Customer/CustomerInterface";
import Facilities from "./Customer/Facilities";
import FoodAndBeverages from "./Customer/FoodAndBeverages";
import FoodMaster from "./Customer/FoodMaster";
import ContactFrontDesk from "./Customer/ContactFrontDesk";
import HotelAdminRooms from "./Admin/Hotel/HotelAdminRooms";
import HotelAdminHousekeeping from "./Admin/Hotel/HotelAdminHousekeeping";
import HotelAdminMaintenance from "./Admin/Hotel/HotelAdminMaintenance";
import HotelAdminBookingHistory from "./Admin/Hotel/HotelAdminBookingHistory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/customer/login" element={<CustomerLogin />} />
  <Route path="/customer/interface" element={<CustomerInterface />} />
  <Route path="/customer/facilities" element={<Facilities />} />
  <Route path="/customer/food" element={<FoodAndBeverages />} />
  <Route path="/customer/food/:category" element={<FoodMaster />} />
  <Route path="/customer/contact" element={<ContactFrontDesk />} />
        <Route path="/admin/restaurant" element={
          <ProtectedRoute allowedRoles={["restaurantAdmin"]}>
            <RestaurantAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/hotel" element={
          <ProtectedRoute allowedRoles={["hotelAdmin"]}>
            <HotelAdminLayout>
              <Dashboard />
            </HotelAdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/hotel/rooms" element={
          <ProtectedRoute allowedRoles={["hotelAdmin"]}>
            <HotelAdminRooms />
          </ProtectedRoute>
        } />
        <Route path="/admin/hotel/housekeeping" element={
          <ProtectedRoute allowedRoles={["hotelAdmin"]}>
            <HotelAdminHousekeeping />
          </ProtectedRoute>
        } />
        <Route path="/admin/hotel/maintenance" element={
          <ProtectedRoute allowedRoles={["hotelAdmin"]}>
            <HotelAdminMaintenance />
          </ProtectedRoute>
        } />
        <Route path="/admin/hotel/booking-history" element={
          <ProtectedRoute allowedRoles={["hotelAdmin"]}>
            <HotelAdminBookingHistory />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
