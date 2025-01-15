// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SelectPlan from './pages/SelectPlan';

import { useAuth } from "./AuthContext";

const App = () => {
    const { currentUser } = useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/" element={!currentUser ? (
                    <Login />) : (
                    <Dashboard />)} />
                <Route path="/select-plan" element={<SelectPlan />} />
                <Route path="/dashboard" element={currentUser ? (
                    <Dashboard />) : (
                    <Login />)} />
                

            </Routes>
        </Router>
    );
};

export default App;
