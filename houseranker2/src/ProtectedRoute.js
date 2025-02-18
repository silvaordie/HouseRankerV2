import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, currentUser }) => {
  return currentUser ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
