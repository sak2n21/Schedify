import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Loginpage";
import Signup from "./pages/Signup";
import ManageSchedule from "./pages/ManageSchedule";
import ViewSchedule from "./pages/ViewSchedule";
import Feedback from "./pages/Feedback";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifiesEmail";
import emailjs from '@emailjs/browser';
import ContactForm from "./pages/ContactForm";

// Initialize at the start, outside of any component
emailjs.init("wcwEuLp9fqmUlhoXd");


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
        <Route path='/verify-email' element={<VerifyEmail />} />
        <Route path="/contact" element={<ContactForm />} />
      </Routes>
    </Router>
  );
};

export default App;
