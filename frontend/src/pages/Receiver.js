import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapComponent, { donationIcon, requestIcon } from '../components/MapComponent';
import { defaultCenter } from '../utils/mockData';
import { listenToDonationsRealtime, listenToRequestsRealtime, createRequest, updateRequestStatus } from '../services/api';
import '../styles/RolePage.css';
import '../styles/Map.css';
import Toast from '../components/Toast';

function Receiver() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('donations'); // 'donations' or 'myRequests'
  const [showMap, setShowMap] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requestForm, setRequestForm] = useState({
    foodNeeded: '',
    quantity: '',
    receiverName: '',
    address: '',
    urgency: 'Medium',
    people: ''
  });
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const currentUserId = currentUser.uid;

  // Listen to real-time donations from backend API
  useEffect(() => {
    const loadDonations = async () => {
      try {
        const data = await listenToDonationsRealtime('Available');
        setDonations(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading donations:', err);
        setDonations([]);
        setLoading(false);
      }
    };

    loadDonations();
  }, []);

  // Listen to all requests to show "My Requests"
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await listenToRequestsRealtime();
        setRequests(data);
      } catch (err) {
        console.error('Error loading requests:', err);
        setRequests([]);
      }
    };

    loadRequests();
  }, []);

  // Filter requests created by current user
  const myRequests = requests.filter(r => r.receiverId === currentUserId);

  // Handle request form submission
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await createRequest({
        foodNeeded: requestForm.foodNeeded,
        quantity: requestForm.quantity,
        receiverName: requestForm.receiverName,
        address: requestForm.address,
        urgency: requestForm.urgency,
        people: parseInt(requestForm.people),
        latitude: defaultCenter.lat + (Math.random() - 0.5) * 0.1,
        longitude: defaultCenter.lng + (Math.random() - 0.5) * 0.1,
        receiverId: currentUserId,
        receiverEmail: currentUser.email,
        status: 'Pending'
      });

      setToast({ message: 'Request created successfully!', type: 'success' });
      setShowRequestForm(false);
      setSelectedDonation(null);
      setRequestForm({ foodNeeded: '', quantity: '', receiverName: '', address: '', urgency: 'Medium', people: '' });

      // Refresh requests list
      const updatedRequests = await listenToRequestsRealtime();
      setRequests(updatedRequests);
    } catch (error) {
      console.error('Error creating request:', error);
      setToast({ message: 'Failed to create request. Please try again.', type: 'error' });
    }
  };

  // Handle opening request form for a specific donation
  const handleRequestFood = (donation) => {
    setSelectedDonation(donation);
    setRequestForm({
      foodNeeded: donation.foodName || '',
      quantity: donation.quantity || '',
      receiverName: '',
      address: '',
      urgency: 'Medium',
      people: ''
    });
    setShowRequestForm(true);
  };

  // Handle canceling request
  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        await updateRequestStatus(requestId, 'Cancelled');
        setToast({ message: 'Request cancelled successfully.', type: 'success' });

        // Refresh requests list
        const updatedRequests = await listenToRequestsRealtime();
        setRequests(updatedRequests);
      } catch (error) {
        setToast({ message: 'Failed to cancel request.', type: 'error' });
      }
    }
  };

  // Prepare markers for food donations
  const donationMarkers = donations
    .filter(donation => Number.isFinite(donation.latitude) && Number.isFinite(donation.longitude))
    .map(donation => ({
      id: donation.id,
      location: { lat: donation.latitude, lng: donation.longitude },
      icon: donationIcon,
      popupContent: (
        <>
          <h3>{donation.donorName || 'Donor'}</h3>
          <p><strong>Food:</strong> {donation.foodName}</p>
          <p><strong>Quantity:</strong> {donation.quantity}</p>
          <p><strong>Location:</strong> {donation.address}</p>
          <p><strong>Status:</strong> <span style={{ color: '#4CAF50' }}>{donation.status}</span></p>
        </>
      )
    }));

  const requestMarkers = myRequests
    .filter(request => Number.isFinite(request.latitude) && Number.isFinite(request.longitude))
    .map(request => ({
      id: request.id,
      location: { lat: request.latitude, lng: request.longitude },
      icon: requestIcon,
      popupContent: (
        <>
          <h3>{request.foodNeeded || 'Food request'}</h3>
          <p><strong>People:</strong> {request.people || request.quantity}</p>
          <p><strong>Location:</strong> {request.address}</p>
          <p><strong>Status:</strong> {request.status || 'Pending'}</p>
        </>
      )
    }));

  const activeMarkers = viewMode === 'donations' ? donationMarkers : requestMarkers;

  return (
    <div className="role-page-container receiver-page">
      <div className="role-page-header receiver-header">
        <button className="back-button" onClick={() => navigate('/')}>← Back</button>
        <h1>Food Receiver</h1>
      </div>

      <div className="role-page-content">
        {/* View Toggle */}
        <div className="role-toolbar segmented-toolbar">
          <button
            onClick={() => setViewMode('donations')}
            className={viewMode === 'donations' ? 'primary-button receiver-button' : 'secondary-button'}
          >
            Available Donations ({donations.length})
          </button>
          <button
            onClick={() => setViewMode('myRequests')}
            className={viewMode === 'myRequests' ? 'primary-button receiver-button' : 'secondary-button'}
          >
            My Requests ({myRequests.length})
          </button>
          <button
            className="primary-button receiver-button"
            onClick={() => {
              setSelectedDonation(null);
              setShowRequestForm(true);
            }}
          >
            + Create Request
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowMap((value) => !value)}
          >
            {showMap ? 'Hide Map' : 'View Map'}
          </button>
        </div>

        {/* Map showing food donations */}
        {showMap && !loading && activeMarkers.length > 0 && (
          <div className="map-panel">
            <MapComponent
              center={defaultCenter}
              zoom={12}
              markers={activeMarkers}
            />
          </div>
        )}

        {/* Donations List / My Requests List */}
        {viewMode === 'donations' ? (
          <div className="nearby-list">
            <h3>Available Food Donations</h3>
            {loading ? (
              <p>Loading donations...</p>
            ) : donations.length === 0 ? (
              <p>No donations available at the moment.</p>
            ) : (
              donations.map(donation => (
                <div key={donation.id} className="nearby-item">
                  <div className="nearby-item-info">
                    <h4>{donation.donorName || 'Donor'}</h4>
                    <p>🍽️ {donation.foodName} - {donation.quantity}</p>
                    <p>📍 {donation.address}</p>
                  </div>
                  <button
                    className="primary-button receiver-button"
                    onClick={() => handleRequestFood(donation)}
                  >
                    Request Food
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="nearby-list">
            <h3>My Requests</h3>
            {myRequests.length === 0 ? (
              <p>You haven't created any requests yet.</p>
            ) : (
              myRequests.map(request => (
                <div key={request.id} className="nearby-item">
                  <div className="nearby-item-info">
                    <h4>{request.foodNeeded || 'Food Request'}</h4>
                    <p>👥 {request.people} people</p>
                    <p>📍 {request.address}</p>
                    <p>Urgency: <span style={{
                      color: request.urgency === 'High' ? '#f44336' :
                             request.urgency === 'Medium' ? '#FF9800' : '#4CAF50'
                    }}>{request.urgency}</span></p>
                    <p>Status: <span style={{
                      color: request.status === 'Pending' ? '#FF9800' :
                             request.status === 'In Transit' ? '#2196F3' :
                             request.status === 'Fulfilled' ? '#4CAF50' : '#999',
                      fontWeight: 'bold'
                    }}>{request.status || 'Pending'}</span></p>
                  </div>
                  {(request.status === 'Pending' || !request.status) && (
                    <button
                    className="secondary-button"
                      onClick={() => handleCancelRequest(request.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="overlay-modal">
            <div className="overlay-modal-card">
              <h2>{selectedDonation ? 'Request This Donation' : 'Create Food Request'}</h2>
              {selectedDonation && (
                <div className="highlight-panel">
                  <p><strong>Donation from:</strong> {selectedDonation.donorName}</p>
                  <p><strong>Food:</strong> {selectedDonation.foodName}</p>
                  <p><strong>Quantity:</strong> {selectedDonation.quantity}</p>
                  <p><strong>Location:</strong> {selectedDonation.address}</p>
                </div>
              )}
              <form onSubmit={handleCreateRequest}>
                <div className="overlay-form-field">
                  <label>Food Needed:</label>
                  <input
                    type="text"
                    value={requestForm.foodNeeded}
                    onChange={(e) => setRequestForm({...requestForm, foodNeeded: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Number of People:</label>
                  <input
                    type="number"
                    value={requestForm.people}
                    onChange={(e) => setRequestForm({...requestForm, people: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Your Name/Organization:</label>
                  <input
                    type="text"
                    value={requestForm.receiverName}
                    onChange={(e) => setRequestForm({...requestForm, receiverName: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Address:</label>
                  <input
                    type="text"
                    value={requestForm.address}
                    onChange={(e) => setRequestForm({...requestForm, address: e.target.value})}
                    required
                  />
                </div>
                <div className="overlay-form-field">
                  <label>Urgency Level:</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({...requestForm, urgency: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="overlay-modal-actions">
                  <button type="submit" className="primary-button receiver-button">
                    Submit Request
                  </button>
                  <button type="button" onClick={() => {
                    setShowRequestForm(false);
                    setSelectedDonation(null);
                    setRequestForm({ foodNeeded: '', quantity: '', receiverName: '', address: '', urgency: 'Medium', people: '' });
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

export default Receiver;
