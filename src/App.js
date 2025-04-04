import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Loginpage";
import Signup from "./pages/Signup";
import ManageSchedule from "./pages/ManageSchedule";
import ViewSchedule from "./pages/ViewSchedule";
import Feedback from "./pages/Feedback";
import Dashboard from "./pages/Dashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/manage-schedule" element={<ManageSchedule />} />
        <Route path="/view-schedule" element={<ViewSchedule />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
