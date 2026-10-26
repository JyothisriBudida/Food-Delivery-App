import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Footer.css';

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (!currentUser) {
    return (
      <footer className="footer">
        <div className="footer-nav">
          <button
            className={`footer-button ${isActive('/login') ? 'active' : ''}`}
            onClick={() => navigate('/login')}
          >
            <span className="footer-label">Login</span>
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-nav">
        <button
          className={`footer-button ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <span className="footer-label">Home</span>
        </button>

        <button
          className={`footer-button ${isActive('/analytics') ? 'active' : ''}`}
          onClick={() => navigate('/analytics')}
        >
          <span className="footer-label">Analytics</span>
        </button>

        <button
          className={`footer-button ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
        >
          <span className="footer-label">Profile</span>
        </button>
      </div>
    </footer>
  );
}

export default Footer;
