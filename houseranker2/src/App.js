// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './LoginPage';
import ResetPassword from './ResetPassword';
import VerifyCode from './VerifyCode';
import ChangePassword from './ChangePassword';
import Dashboard from './Dashboard';
import SelectPlan from './SelectPlan';

import { useAuth } from "./AuthContext";

const App = () => {
    const { currentUser } = useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/" element={!currentUser ? (
                    <Login />) : (
                    <Dashboard />)} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-code" element={<VerifyCode />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/select-plan" element={<SelectPlan />} />
                <Route path="/dashboard" element={currentUser ? (
                    <Dashboard />) : (
                    <Login />)} />
                

            </Routes>
        </Router>
    );
};

export default App;
