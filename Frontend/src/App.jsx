import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';

// Protected Pages
import DashboardPage from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import PosPage from './pages/PosPage';

// Protected Route Component
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

// Simple 404 Component
const NotFound = () => <h2>404: Page Not Found</h2>;

function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES (No Sidebar) --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* --- PROTECTED ROUTES (With Sidebar & Header) --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/pos" element={<PosPage />} />
          
          {/* Placeholder for future pages */}
          <Route path="/customers" element={<h2>Customer Management Coming Soon</h2>} />
          <Route path="/reports" element={<h2>Sales Reports Coming Soon</h2>} />
        </Route>
      </Route>

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;