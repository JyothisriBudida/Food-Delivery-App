import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="app-title">Food Delivery App</h1>
        <p className="app-subtitle">Choose your role to get started</p>

        <div className="role-buttons">
          <button
            className="role-button donator-button"
            onClick={() => navigate('/donator')}
          >
            <div className="button-icon">🍕</div>
            <h2>Food Donator</h2>
            <p>Donate excess food to those in need</p>
          </button>

          <button
            className="role-button receiver-button"
            onClick={() => navigate('/receiver')}
          >
            <div className="button-icon">🤝</div>
            <h2>Food Receiver</h2>
            <p>Request food assistance</p>
          </button>

          <button
            className="role-button volunteer-button"
            onClick={() => navigate('/volunteer')}
          >
            <div className="button-icon">🚴</div>
            <h2>Volunteer</h2>
            <p>Help deliver food to receivers</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
