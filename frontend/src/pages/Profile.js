import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';
import '../styles/RolePage.css';

function Profile() {
  const navigate = useNavigate();
  const { currentUser, logout, updateDisplayName } = useAuth();
  const [name, setName] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const currentName = currentUser?.displayName || '';
  const shownName = currentName || 'Signed-in User';
  const avatarInitial = (currentName || currentUser?.email || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNameSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    setProfileMessage('');
    setProfileError('');

    if (!trimmedName) {
      setProfileError('Name cannot be empty.');
      return;
    }

    if (trimmedName === currentName) {
      setProfileMessage('Name is already up to date.');
      return;
    }

    setSavingName(true);

    try {
      await updateDisplayName(trimmedName);
      await updateUserProfile(currentUser.uid, {
        displayName: trimmedName,
        email: currentUser.email
      });
      setProfileMessage('Name updated successfully.');
    } catch (error) {
      setProfileError(error.message || 'Unable to update your name.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="role-page-container">
      <div className="role-page-header profile-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="role-page-content">
        <div className="info-card">
          <div className="profile-avatar">
            <div className="avatar-circle">{avatarInitial}</div>
          </div>
          <h2>{shownName}</h2>
          <p>Manage your personal information and preferences</p>
        </div>

        <div className="profile-section">
          <h3>Account Information</h3>
          <div className="profile-field">
            <label>Name:</label>
            <form className="profile-name-form" onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
              <button
                type="submit"
                className="primary-button profile-save-button"
                disabled={savingName || name.trim() === currentName}
              >
                {savingName ? 'Saving...' : 'Save Name'}
              </button>
            </form>
            {profileMessage && <p className="profile-success">{profileMessage}</p>}
            {profileError && <p className="profile-error">{profileError}</p>}
          </div>
          <div className="profile-field">
            <label>Email:</label>
            <p>{currentUser?.email}</p>
          </div>
          <div className="profile-field">
            <label>User ID:</label>
            <p>{currentUser?.uid}</p>
          </div>
        </div>

        <div className="cta-section">
          <button className="secondary-button" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
