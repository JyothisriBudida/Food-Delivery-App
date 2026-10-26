import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapComponent, { donationIcon, requestIcon } from '../components/MapComponent';
import { defaultCenter } from '../utils/mockData';
import {
  assignVolunteer,
  calculateDistance,
  listenToDonationsRealtime,
  listenToRequestsRealtime,
  updateDeliveryStatus,
  getDeliveries
} from '../services/api';
import '../styles/RolePage.css';
import '../styles/Map.css';

const volunteerLocation = { latitude: defaultCenter.lat, longitude: defaultCenter.lng };

const getUrgencyRank = (urgency) => {
  if (urgency === 'High') return 0;
  if (urgency === 'Medium') return 1;
  return 2;
};

const hasCoordinates = (record) => (
  Number.isFinite(record.latitude) && Number.isFinite(record.longitude)
);

const getNextStatus = (status) => {
  if (status === 'Assigned') return 'Picked Up';
  if (status === 'Picked Up') return 'Delivered';
  return null;
};

function Volunteer() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState('available');
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [acceptingRunId, setAcceptingRunId] = useState('');
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const currentVolunteerId = currentUser.uid;
  const currentVolunteerName = currentUser.displayName || currentUser.email || 'Volunteer';

  useEffect(() => {
    let donationsLoaded = false;
    let requestsLoaded = false;
    let deliveriesLoaded = false;

    const finishLoading = () => {
      if (donationsLoaded && requestsLoaded && deliveriesLoaded) {
        setLoading(false);
      }
    };

    const loadData = async () => {
      try {
        const loadedDonations = await listenToDonationsRealtime('Available');
        setDonations(loadedDonations);
        donationsLoaded = true;
        finishLoading();
      } catch (err) {
        console.error('Error loading donations:', err);
        donationsLoaded = true;
        finishLoading();
      }

      try {
        const loadedRequests = await listenToRequestsRealtime('Pending');
        setRequests(loadedRequests);
        requestsLoaded = true;
        finishLoading();
      } catch (err) {
        console.error('Error loading requests:', err);
        requestsLoaded = true;
        finishLoading();
      }

      try {
        const loadedDeliveries = await getDeliveries(currentVolunteerId);
        setDeliveries(loadedDeliveries);
        deliveriesLoaded = true;
        finishLoading();
      } catch (err) {
        console.error('Error loading deliveries:', err);
        deliveriesLoaded = true;
        finishLoading();
      }
    };

    loadData();
  }, [currentVolunteerId]);

  const availableRuns = useMemo(() => {
    const runs = [];

    donations.filter(hasCoordinates).forEach((donation) => {
      requests.filter(hasCoordinates).forEach((request) => {
        const pickupDistance = calculateDistance(
          volunteerLocation.latitude,
          volunteerLocation.longitude,
          donation.latitude,
          donation.longitude
        );
        const dropoffDistance = calculateDistance(
          donation.latitude,
          donation.longitude,
          request.latitude,
          request.longitude
        );

        runs.push({
          id: `${donation.id}-${request.id}`,
          donation,
          request,
          pickupDistance,
          dropoffDistance,
          totalDistance: Number((pickupDistance + dropoffDistance).toFixed(2)),
          urgency: request.urgency || 'Medium'
        });
      });
    });

    return runs
      .sort((a, b) => (
        getUrgencyRank(a.urgency) - getUrgencyRank(b.urgency) ||
        a.totalDistance - b.totalDistance
      ))
      .slice(0, 24);
  }, [donations, requests]);

  const activeDeliveries = deliveries.filter((delivery) => delivery.status !== 'Delivered');
  const completedDeliveries = deliveries.filter((delivery) => delivery.status === 'Delivered');

  const markers = [
    ...donations.filter(hasCoordinates).map((donation) => ({
      id: `donation-${donation.id}`,
      location: { lat: donation.latitude, lng: donation.longitude },
      icon: donationIcon,
      popupContent: (
        <>
          <h3>{donation.donorName || 'Donor'}</h3>
          <p><strong>Pickup:</strong> {donation.foodName}</p>
          <p><strong>Quantity:</strong> {donation.quantity}</p>
          <p><strong>Address:</strong> {donation.address}</p>
        </>
      )
    })),
    ...requests.filter(hasCoordinates).map((request) => ({
      id: `request-${request.id}`,
      location: { lat: request.latitude, lng: request.longitude },
      icon: requestIcon,
      popupContent: (
        <>
          <h3>{request.receiverName || 'Receiver'}</h3>
          <p><strong>Deliver:</strong> {request.foodNeeded || 'Food needed'}</p>
          <p><strong>People:</strong> {request.people || request.quantity}</p>
          <p><strong>Address:</strong> {request.address}</p>
        </>
      )
    }))
  ];

  const handleAcceptRun = async (run) => {
    if (!window.confirm(`Accept this route from ${run.donation.donorName || 'donor'} to ${run.request.receiverName || 'receiver'}?`)) {
      return;
    }

    setNotice('');
    setError('');
    setAcceptingRunId(run.id);

    try {
      await assignVolunteer({
        taskType: 'delivery-run',
        donationId: run.donation.id,
        requestId: run.request.id,
        volunteerId: currentVolunteerId,
        volunteerName: currentVolunteerName,
        donorName: run.donation.donorName,
        donorEmail: run.donation.donorEmail,
        receiverName: run.request.receiverName,
        receiverEmail: run.request.receiverEmail,
        foodName: run.donation.foodName,
        foodNeeded: run.request.foodNeeded,
        quantity: run.donation.quantity,
        people: run.request.people,
        urgency: run.request.urgency,
        routeDistanceKm: run.totalDistance,
        pickupLocation: {
          latitude: run.donation.latitude,
          longitude: run.donation.longitude,
          address: run.donation.address
        },
        deliveryLocation: {
          latitude: run.request.latitude,
          longitude: run.request.longitude,
          address: run.request.address
        }
      });
      setNotice('Route accepted. It is now listed in My Deliveries.');
      setViewMode('myDeliveries');

      // Refresh deliveries
      const updatedDeliveries = await getDeliveries(currentVolunteerId);
      setDeliveries(updatedDeliveries);
    } catch (assignError) {
      console.error('Error accepting route:', assignError);
      setError('Failed to accept this route. Please try again.');
    } finally {
      setAcceptingRunId('');
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId, currentStatus) => {
    const newStatus = getNextStatus(currentStatus);

    if (!newStatus) {
      return;
    }

    if (!window.confirm(`Update delivery status to "${newStatus}"?`)) {
      return;
    }

    setNotice('');
    setError('');
    setUpdatingDeliveryId(deliveryId);

    try {
      await updateDeliveryStatus(deliveryId, newStatus);
      setNotice(`Delivery marked ${newStatus}.`);

      // Refresh deliveries
      const updatedDeliveries = await getDeliveries(currentVolunteerId);
      setDeliveries(updatedDeliveries);
    } catch (updateError) {
      console.error('Error updating delivery status:', updateError);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdatingDeliveryId('');
    }
  };

  const renderDeliveryCard = (delivery) => {
    const nextStatus = getNextStatus(delivery.status);

    return (
      <article key={delivery.id} className="delivery-card">
        <div className="delivery-card-header">
          <div>
            <h4>{delivery.foodName || delivery.foodNeeded || 'Food delivery'}</h4>
            <p>Route #{delivery.id.substring(0, 8)}</p>
          </div>
          <span className={`status-pill status-${(delivery.status || 'Assigned').toLowerCase().replace(/\s+/g, '-')}`}>
            {delivery.status || 'Assigned'}
          </span>
        </div>

        <div className="route-steps">
          <div className="route-step">
            <span className="route-step-marker">1</span>
            <div>
              <h5>Pickup</h5>
              <p>{delivery.donorName || 'Donor'}</p>
              {delivery.quantity && <p>{delivery.quantity}</p>}
              {delivery.pickupLocation?.address && <p>{delivery.pickupLocation.address}</p>}
            </div>
          </div>
          <div className="route-step">
            <span className="route-step-marker">2</span>
            <div>
              <h5>Dropoff</h5>
              <p>{delivery.receiverName || 'Receiver'}</p>
              {delivery.people && <p>{delivery.people} people</p>}
              {delivery.deliveryLocation?.address && <p>{delivery.deliveryLocation.address}</p>}
            </div>
          </div>
        </div>

        {nextStatus && (
          <button
            className="primary-button volunteer-button delivery-action"
            onClick={() => handleUpdateDeliveryStatus(delivery.id, delivery.status)}
            disabled={updatingDeliveryId === delivery.id}
          >
            {updatingDeliveryId === delivery.id ? 'Updating...' : `Mark ${nextStatus}`}
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="role-page-container volunteer-page">
      <div className="role-page-header volunteer-header">
        <button className="back-button" onClick={() => navigate('/')}>Back</button>
        <h1>Volunteer Dispatch</h1>
        <p>Accept complete pickup and dropoff routes.</p>
      </div>

      <div className="role-page-content">
        <section className="volunteer-dashboard">
          <div className="volunteer-stat">
            <span>{availableRuns.length}</span>
            <p>Matched routes</p>
          </div>
          <div className="volunteer-stat">
            <span>{activeDeliveries.length}</span>
            <p>Active deliveries</p>
          </div>
          <div className="volunteer-stat">
            <span>{completedDeliveries.length}</span>
            <p>Completed</p>
          </div>
        </section>

        <div className="role-toolbar segmented-toolbar">
          <button
            onClick={() => setViewMode('available')}
            className={viewMode === 'available' ? 'primary-button volunteer-button' : 'secondary-button'}
          >
            Available Routes
          </button>
          <button
            onClick={() => setViewMode('myDeliveries')}
            className={viewMode === 'myDeliveries' ? 'primary-button volunteer-button' : 'secondary-button'}
          >
            My Deliveries
          </button>
          {viewMode === 'available' && (
            <button className="secondary-button" onClick={() => setShowMap((value) => !value)}>
              {showMap ? 'Hide Map' : 'View Map'}
            </button>
          )}
        </div>

        {notice && <p className="page-notice success-notice">{notice}</p>}
        {error && <p className="page-notice error-notice">{error}</p>}

        {showMap && viewMode === 'available' && markers.length > 0 && (
          <div className="map-panel">
            <MapComponent
              center={defaultCenter}
              zoom={12}
              markers={markers}
              showUserLocation={true}
              userLocation={{ lat: volunteerLocation.latitude, lng: volunteerLocation.longitude }}
            />
          </div>
        )}

        {viewMode === 'available' ? (
          <section className="nearby-list route-list">
            <div className="section-heading-row">
              <div>
                <h3>Best Available Routes</h3>
                <p>Routes are ranked by receiver urgency and travel distance.</p>
              </div>
            </div>

            {loading ? (
              <p className="empty-state">Loading routes...</p>
            ) : availableRuns.length === 0 ? (
              <div className="empty-state">
                <h4>No complete routes yet</h4>
                <p>There must be at least one available donation and one pending request with map coordinates.</p>
                <p>{donations.length} donations and {requests.length} requests are currently waiting.</p>
              </div>
            ) : (
              availableRuns.map((run) => (
                <article key={run.id} className="route-card">
                  <div className="route-card-main">
                    <div className="route-card-header">
                      <div>
                        <h4>{run.donation.foodName || run.request.foodNeeded || 'Food delivery'}</h4>
                        <p>{run.donation.quantity || 'Food'} for {run.request.people || run.request.quantity || 'receiver'}</p>
                      </div>
                      <span className={`urgency-pill urgency-${run.urgency.toLowerCase()}`}>{run.urgency}</span>
                    </div>

                    <div className="route-steps">
                      <div className="route-step">
                        <span className="route-step-marker">1</span>
                        <div>
                          <h5>Pickup from {run.donation.donorName || 'Donor'}</h5>
                          <p>{run.donation.address || 'Pickup address not provided'}</p>
                        </div>
                      </div>
                      <div className="route-step">
                        <span className="route-step-marker">2</span>
                        <div>
                          <h5>Drop off to {run.request.receiverName || 'Receiver'}</h5>
                          <p>{run.request.address || 'Dropoff address not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="route-card-side">
                    <span className="distance-badge">{run.totalDistance} km</span>
                    <p>{run.pickupDistance} km to pickup</p>
                    <p>{run.dropoffDistance} km to dropoff</p>
                    <button
                      className="primary-button volunteer-button"
                      onClick={() => handleAcceptRun(run)}
                      disabled={acceptingRunId === run.id}
                    >
                      {acceptingRunId === run.id ? 'Accepting...' : 'Accept Route'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : (
          <section className="nearby-list delivery-grid-section">
            <div className="section-heading-row">
              <div>
                <h3>My Deliveries</h3>
                <p>Move each route from assigned to picked up, then delivered.</p>
              </div>
            </div>

            {deliveries.length === 0 ? (
              <p className="empty-state">You do not have any deliveries yet.</p>
            ) : (
              <div className="delivery-grid">
                {deliveries.map(renderDeliveryCard)}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Volunteer;
