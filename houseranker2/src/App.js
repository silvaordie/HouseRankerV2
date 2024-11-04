// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './LoginPage';
import ResetPassword from './ResetPassword';
import VerifyCode from './VerifyCode';
import ChangePassword from './ChangePassword';
import Dashboard from './Dashboard';
import { useAuth } from "./AuthContext";



const App = () => {
    const { currentUser } = useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/" element={!currentUser ? (
                    <Login />            ) : (
                    <Navigate to="/dashboard" />)}/>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-code" element={<VerifyCode />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/dashboard" element={currentUser ? (
                    <Dashboard />  ) : (
                    <Navigate to="/" />)}/>
            </Routes>
        </Router>
    );
};

export default App;
