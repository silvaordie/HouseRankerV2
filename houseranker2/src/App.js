// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './LoginPage';
import ResetPassword from './ResetPassword';
import VerifyCode from './VerifyCode';
import ChangePassword from './ChangePassword';
import Dashboard from './Dashboard';



const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

    return (
        <Router>
            <Routes>
                <Route path="/" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated}/> : <Navigate to="/dashboard" />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-code" element={<VerifyCode />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default App;
