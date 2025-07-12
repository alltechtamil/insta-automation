// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import routes from './routes.jsx';
import ProtectedRoute from './routes/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { setAuthToken } from './redux/auth/authSlice.js';

const Loader = () => (
  <div className='flex justify-center items-center h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-900'></div>
  </div>
);

function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      dispatch(setAuthToken(token));
      localStorage.setItem('authToken', token);
      navigate('/dashboard');
    }
  }, [location]);

  return (
    <Routes>
      {routes.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          element={
            route.protected ? (
              <ProtectedRoute>{route.element}</ProtectedRoute>
            ) : (
              route.element
            )
          }
        />
      ))}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <React.Suspense fallback={<Loader />}>
        <Toaster position="top-right" reverseOrder={false} />
        <AppRouter />
      </React.Suspense>
    </Router>
  );
}

export default App;
