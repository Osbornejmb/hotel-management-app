

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import LoginPage from "./Auth/LoginPage";
import RegisterPage from "./Auth/RegisterPage";
import ProtectedRoute from "./Auth/ProtectedRoute";
import RestaurantAdminDashboard from "./Admin/Restaurant/RestaurantAdminDashboard";
import HotelAdminDashboard from "./Admin/Hotel/HotelAdminDashboard";
import CustomerLogin from "./Customer/Customerlogin";
import CustomerInterface from "./Customer/CustomerInterface";
import Amenities from "./Customer/Amenities";
import FoodAndBeverages from "./Customer/FoodAndBeverages";
import ContactFrontDesk from "./Customer/ContactFrontDesk";
import AmenityMaster from "./Customer/AmenityMaster";

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
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
