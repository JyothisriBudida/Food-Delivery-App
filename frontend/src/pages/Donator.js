import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapComponent, { donationIcon, requestIcon } from '../components/MapComponent';
import { defaultCenter } from '../utils/mockData';
import { listenToRequestsRealtime, listenToDonationsRealtime, createDonation, updateDonationStatus } from '../services/api';
import '../styles/RolePage.css';
import '../styles/Map.css';
import Toast from '../components/Toast';

function Donator() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('requests'); // 'requests' or 'myDonations'
  const [showMap, setShowMap] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [donationForm, setDonationForm] = useState({
    foodName: '',
    quantity: '',
    donorName: '',
    address: ''
  });
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const currentUserId = currentUser.uid;

  // Listen to real-time requests from backend API
  useEffect(() => {
    // Initial load
    const loadRequests = async () => {
      try {
        const data = await listenToRequestsRealtime();
        setRequests(data);
      } catch (err) {
        console.error('Error loading requests:', err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  // Listen to all donations to show "My Donations"
  useEffect(() => {
    const loadDonations = async () => {
      try {
        const data = await listenToDonationsRealtime();
        setDonations(data);
      } catch (err) {
        console.error('Error loading donations:', err);
        setDonations([]);
      }
    };

    loadDonations();
  }, []);

  // Filter donations created by current user
  const myDonations = donations.filter(d => d.donorId === currentUserId);

  // Handle donation form submission
  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      // For demo, using default center location. In production, use geolocation or address input
      await createDonation({
        foodName: donationForm.foodName,
        quantity: donationForm.quantity,
        donorName: donationForm.donorName,
        address: donationForm.address,
        latitude: defaultCenter.lat + (Math.random() - 0.5) * 0.1, // Random nearby location
        longitude: defaultCenter.lng + (Math.random() - 0.5) * 0.1,
        donorId: currentUserId,
        donorEmail: currentUser.email,
        status: 'Available'
      });

      setToast({ message: 'Donation created successfully!', type: 'success' });
      setShowDonationForm(false);
      setSelectedRequest(null);
      setDonationForm({ foodName: '', quantity: '', donorName: '', address: '' });

      // Refresh donations list
      const updatedDonations = await listenToDonationsRealtime();
      setDonations(updatedDonations);
    } catch (error) {
      console.error('Error creating donation:', error);
      setToast({ message: 'Failed to create donation. Please try again.', type: 'error' });
    }
  };

  // Handle opening donation form for a specific request
  const handleFulfillRequest = (request) => {
    setSelectedRequest(request);
    setDonationForm({
      foodName: request.foodNeeded || '',
      quantity: request.people ? `${request.people} servings` : '',
      donorName: '',
      address: ''
    });
    setShowDonationForm(true);
  };

  // Handle canceling donation
  const handleCancelDonation = async (donationId) => {
    if (window.confirm('Are you sure you want to cancel this donation?')) {
      try {
        await updateDonationStatus(donationId, 'Cancelled');
        setToast({ message: 'Donation cancelled successfully.', type: 'success' });

        // Refresh donations list
        const updatedDonations = await listenToDonationsRealtime();
        setDonations(updatedDonations);
      } catch (error) {
        setToast({ message: 'Failed to cancel donation.', type: 'error' });
      }
    }
  };

  // Prepare markers for food requests
  const requestMarkers = requests
    .filter(request => Number.isFinite(request.latitude) && Number.isFinite(request.longitude))
    .map(request => ({
      id: request.id,
      location: { lat: request.latitude, lng: request.longitude },
      icon: requestIcon,
      popupContent: (
        <>
          <h3>{request.receiverName || 'Receiver'}</h3>
          <p><strong>Food Needed:</strong> {request.foodNeeded || 'Not specified'}</p>
          <p><strong>People:</strong> {request.people || request.quantity}</p>
          <p><strong>Location:</strong> {request.address}</p>
          <p><strong>Urgency:</strong> <span style={{ color: request.urgency === 'High' ? '#f44336' : request.urgency === 'Medium' ? '#FF9800' : '#4CAF50' }}>{request.urgency || 'Medium'}</span></p>
        </>
      )
    }));

  const donationMarkers = myDonations
    .filter(donation => Number.isFinite(donation.latitude) && Number.isFinite(donation.longitude))
    .map(donation => ({
      id: donation.id,
      location: { lat: donation.latitude, lng: donation.longitude },
      icon: donationIcon,
      popupContent: (
        <>
          <h3>{donation.foodName || 'Donation'}</h3>
          <p><strong>Quantity:</strong> {donation.quantity}</p>
          <p><strong>Location:</strong> {donation.address}</p>
          <p><strong>Status:</strong> {donation.status}</p>
        </>
      )
    }));

  const activeMarkers = viewMode === 'requests' ? requestMarkers : donationMarkers;

  return (
    <div className="role-page-container donator-page">
      <div className="role-page-header donator-header">
        <button className="back-button" onClick={() => navigate('/')}>← Back</button>
        <h1>Food Donator</h1>
      </div>

      <div className="role-page-content">
        {/* View Toggle */}
        <div className="role-toolbar segmented-toolbar">
          <button
            onClick={() => setViewMode('requests')}
            className={viewMode === 'requests' ? 'primary-button donator-button' : 'secondary-button'}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setViewMode('myDonations')}
            className={viewMode === 'myDonations' ? 'primary-button donator-button' : 'secondary-button'}
          >
            My Donations ({myDonations.length})
          </button>
          <button
            className="primary-button donator-button"
            onClick={() => {
              setSelectedRequest(null);
              setShowDonationForm(true);
            }}
          >
            + Create Donation
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowMap((value) => !value)}
          >
            {showMap ? 'Hide Map' : 'View Map'}
          </button>
        </div>

        {/* Map showing food requests */}
        {showMap && !loading && activeMarkers.length > 0 && (
          <div className="map-panel">
            <MapComponent
              center={defaultCenter}
              zoom={12}
              markers={activeMarkers}
            />
          </div>
        )}

        {/* Requests List / My Donations List */}
        {viewMode === 'requests' ? (
          <div className="nearby-list">
            <h3>All Food Requests</h3>
            {loading ? (
              <p>Loading requests...</p>
            ) : requests.length === 0 ? (
              <p>No food requests available at the moment.</p>
            ) : (
              requests.map(request => (
                <div key={request.id} className="nearby-item">
                  <div className="nearby-item-info">
                    <h4>{request.receiverName || 'Receiver'}</h4>
                    <p>🍽️ {request.foodNeeded || 'Food needed'}</p>
                    <p>📍 {request.address}</p>
                    <p>👥 {request.people || request.quantity} people • Urgency: <span style={{ color: request.urgency === 'High' ? '#f44336' : request.urgency === 'Medium' ? '#FF9800' : '#4CAF50' }}>{request.urgency || 'Medium'}</span></p>
                  </div>
                  <button
                    className="primary-button donator-button"
                    onClick={() => handleFulfillRequest(request)}
                  >
                    Fulfill Request
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="nearby-list">
            <h3>My Donations</h3>
            {myDonations.length === 0 ? (
              <p>You haven't created any donations yet.</p>
            ) : (
              myDonations.map(donation => (
                <div key={donation.id} className="nearby-item">
                  <div className="nearby-item-info">
                    <h4>{donation.foodName}</h4>
                    <p>🍽️ Quantity: {donation.quantity}</p>
                    <p>📍 {donation.address}</p>
                    <p>Status: <span style={{
                      color: donation.status === 'Available' ? '#4CAF50' :
                             donation.status === 'In Transit' ? '#FF9800' :
                             donation.status === 'Delivered' ? '#2196F3' : '#999',
                      fontWeight: 'bold'
                    }}>{donation.status}</span></p>
                  </div>
                  {donation.status === 'Available' && (
                    <button
                    className="secondary-button"
                      onClick={() => handleCancelDonation(donation.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Donation Form Modal */}
        {showDonationForm && (
          <div className="overlay-modal">
            <div className="overlay-modal-card">
              <h2>{selectedRequest ? 'Fulfill Food Request' : 'Create Donation'}</h2>
              {selectedRequest && (
                <div className="highlight-panel">
                  <p><strong>Request from:</strong> {selectedRequest.receiverName}</p>
                  <p><strong>Location:</strong> {selectedRequest.address}</p>
                  <p><strong>Urgency:</strong> {selectedRequest.urgency}</p>
                </div>
              )}
              <form onSubmit={handleCreateDonation}>
                <div className="overlay-form-field">
                  <label>Food Name:</label>
                  <input
                    type="text"
                    value={donationForm.foodName}
                    onChange={(e) => setDonationForm({...donationForm, foodName: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Quantity/Servings:</label>
                  <input
                    type="text"
                    value={donationForm.quantity}
                    onChange={(e) => setDonationForm({...donationForm, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Your Name:</label>
                  <input
                    type="text"
                    value={donationForm.donorName}
                    onChange={(e) => setDonationForm({...donationForm, donorName: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Address:</label>
                  <input
                    type="text"
                    value={donationForm.address}
                    onChange={(e) => setDonationForm({...donationForm, address: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-modal-actions">
                  <button type="submit" className="primary-button donator-button">
                    Submit Donation
                  </button>
                  <button type="button" onClick={() => {
                    setShowDonationForm(false);
                    setSelectedRequest(null);
                    setDonationForm({ foodName: '', quantity: '', donorName: '', address: '' });
                  }} className="secondary-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

    </div>
  );
}

export default Donator;
