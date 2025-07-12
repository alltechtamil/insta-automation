// src/routes/ProtectedRoute.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = useSelector((state) => state.auth.token) || localStorage.getItem('authToken');

  return token && isAuthenticated ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
