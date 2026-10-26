import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Donator from './pages/Donator';
import Receiver from './pages/Receiver';
import Volunteer from './pages/Volunteer';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Footer from './components/Footer';

function ProtectedRoute({ children }) {
  const { authLoading, currentUser } = useAuth();

  if (authLoading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Router>
      <div className="app">
        <div className="content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/donator" element={<ProtectedRoute><Donator /></ProtectedRoute>} />
            <Route path="/receiver" element={<ProtectedRoute><Receiver /></ProtectedRoute>} />
            <Route path="/volunteer" element={<ProtectedRoute><Volunteer /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
