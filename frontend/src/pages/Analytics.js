import React, { useState, useEffect } from 'react';
import '../styles/RolePage.css';
import {
  listenToDonationsRealtime,
  listenToRequestsRealtime,
} from '../services/api';

function Analytics() {
  const [totalDonations, setTotalDonations] = useState(null);
  const [foodDelivered, setFoodDelivered] = useState(null);
  const [peopleHelped, setPeopleHelped] = useState(null);
  const [activeRequests, setActiveRequests] = useState(null);
  const [activeDonations, setActiveDonations] = useState(null);
  const [inTransit, setInTransit] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // 1. Total Donations — all donations, no status filter
        const allDonations = await listenToDonationsRealtime();
        setTotalDonations(allDonations.length);

        // 2. Food Delivered — donations with status "Delivered"
        const deliveredDonations = await listenToDonationsRealtime('Delivered');
        setFoodDelivered(deliveredDonations.length);

        // 3. People Helped — sum of `people` field across requests with status "Fulfilled"
        const fulfilledRequests = await listenToRequestsRealtime('Fulfilled');
        const total = fulfilledRequests.reduce((sum, req) => {
          const count = Number(req.people);
          return sum + (Number.isFinite(count) ? count : 0);
        }, 0);
        setPeopleHelped(total);

        // 4. Active Requests — requests with status "Pending"
        const pendingRequests = await listenToRequestsRealtime('Pending');
        setActiveRequests(pendingRequests.length);

        // 5. Active Donations — donations with status "Available"
        const availableDonations = await listenToDonationsRealtime('Available');
        setActiveDonations(availableDonations.length);

        // 6. In Transit — donations with status "In Transit"
        const inTransitDonations = await listenToDonationsRealtime('In Transit');
        setInTransit(inTransitDonations.length);
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
    };

    loadStats();
  }, []);

  const isLoading =
    totalDonations === null ||
    foodDelivered === null ||
    peopleHelped === null ||
    activeRequests === null ||
    activeDonations === null ||
    inTransit === null;

  const stats = [
    { label: 'Total Donations', value: totalDonations },
    { label: 'Food Delivered', value: foodDelivered },
    { label: 'People Helped', value: peopleHelped },
    { label: 'Active Requests', value: activeRequests },
    { label: 'Active Donations', value: activeDonations },
    { label: 'In Transit', value: inTransit },
  ];

  return (
    <div className="role-page-container">
      <div className="role-page-header analytics-header">
        <h1>Analytics</h1>
        <p>Track your impact and activity</p>
      </div>

      <div className="role-page-content">
        <div className="info-card">
          <h2>Community Statistics</h2>
          <p>Live data reflecting current food-sharing activity across the platform.</p>
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.1rem' }}>
            Loading statistics…
          </p>
        ) : (
          <div className="stats-grid">
            {stats.map(({ label, value }) => (
              <div className="stat-card" key={label}>
                <h3>{label}</h3>
                <p className="stat-number">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
