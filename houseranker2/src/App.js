// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate  } from 'react-router-dom';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SelectPlan from './pages/SelectPlan';
import ProtectedRoute from "./ProtectedRoute";

import { useAuth } from "./AuthContext";

const App = () => {
    const { currentUser } = useAuth();
    const recaptchaKey = process.env.REACT_APP_ENV == "PROD" ? process.env.REACT_APP_GOOGLE_CAPTCHA_SITE_KEY_PROD:process.env.REACT_APP_GOOGLE_CAPTCHA_SITE_KEY; // Use a frontend env variable
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaKey}&debug=true`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    console.log(currentUser)
    return (
        <Router>
        <Routes>
          {/* Public route */}
          <Route path="/" element={!currentUser ? <Login /> : <Dashboard />} />
  
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/select-plan"
            element={
              <ProtectedRoute currentUser={currentUser}>
                <SelectPlan />
              </ProtectedRoute>
            }
          />
          {/* Catch-all route for unmatched paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
};

export default App;
