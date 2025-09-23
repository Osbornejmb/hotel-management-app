import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import LoginPage from "./Auth/LoginPage";
import RegisterPage from "./Auth/RegisterPage";
import ProtectedRoute from "./Auth/ProtectedRoute";
import RestaurantAdminDashboard from "./Admin/Restaurant/RestaurantAdminDashboard";
import HotelAdminDashboard from "./Admin/Hotel/HotelAdminDashboard";
<<<<<<< HEAD
import EmployeeAdminDashboard from "./Admin/Employee/EmployeeAdminDashboard";
import CustomerLogin from "./Admin/Customer/Customerlogin";
import CustomerInterface from "./Admin/Customer/CustomerInterface";
=======
import CustomerLogin from "./Customer/Customerlogin";
import CustomerInterface from "./Customer/CustomerInterface";
import Amenities from "./Customer/Amenities";
import FoodAndBeverages from "./Customer/FoodAndBeverages";
import FoodMaster from "./Customer/FoodMaster";
import ContactFrontDesk from "./Customer/ContactFrontDesk";
import AmenityMaster from "./Customer/AmenityMaster";
import HotelAdminRooms from "./Admin/Hotel/HotelAdminRooms";
import HotelAdminHousekeeping from "./Admin/Hotel/HotelAdminHousekeeping";
import HotelAdminMaintenance from "./Admin/Hotel/HotelAdminMaintenance";
import HotelAdminBookingHistory from "./Admin/Hotel/HotelAdminBookingHistory";
>>>>>>> 14dcae8e53acda0b405c271f37cdeb462f02c64e

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/customer/login" element={<CustomerLogin />} />
  <Route path="/customer/interface" element={<CustomerInterface />} />
  <Route path="/customer/amenities" element={<Amenities />} />
  <Route path="/customer/amenities/:amenity" element={<AmenityMaster />} />
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
            <HotelAdminDashboard />
          </ProtectedRoute>
        } />
<<<<<<< HEAD
        <Route path="/admin/employee" element={
          <ProtectedRoute allowedRoles={["employeeAdmin"]}>
            <EmployeeAdminDashboard />
=======
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
>>>>>>> 14dcae8e53acda0b405c271f37cdeb462f02c64e
          </ProtectedRoute>
        } />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
