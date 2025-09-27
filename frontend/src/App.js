import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Attendance from "./Attendance";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Attendance />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="*" element={<Attendance />} />
      </Routes>
    </Router>
  );
}

export default App;