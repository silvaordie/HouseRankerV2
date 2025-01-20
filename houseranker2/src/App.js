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
