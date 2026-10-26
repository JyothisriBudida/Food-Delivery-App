/**
 * API Service - Frontend communicates with FastAPI backend via REST.
 * The frontend does NOT access Firestore directly; all database operations
 * are handled by the backend.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// ==================== DONATIONS API ====================

export const createDonation = (donationData) =>
  request("/api/donations/", { method: "POST", body: JSON.stringify(donationData) });

export const getDonations = (statusFilter = null) =>
  request(`/api/donations/?${statusFilter ? `status=${statusFilter}` : ""}`);

export const updateDonationStatus = (donationId, newStatus) =>
  request(`/api/donations/${donationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ newStatus }),
  });

// ==================== REQUESTS API ====================

export const createRequest = (requestData) =>
  request("/api/requests/", { method: "POST", body: JSON.stringify(requestData) });

export const getRequests = (statusFilter = null) =>
  request(`/api/requests/?${statusFilter ? `status=${statusFilter}` : ""}`);

export const updateRequestStatus = (requestId, newStatus) =>
  request(`/api/requests/${requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ newStatus }),
  });

// ==================== DELIVERIES API ====================

export const assignVolunteer = (deliveryData) =>
  request("/api/deliveries/", { method: "POST", body: JSON.stringify(deliveryData) });

export const getDeliveries = (volunteerId = null) =>
  request(`/api/deliveries/?${volunteerId ? `volunteer_id=${volunteerId}` : ""}`);

export const updateDeliveryStatus = (deliveryId, newStatus) =>
  request(`/api/deliveries/${deliveryId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ newStatus }),
  });

// ==================== REAL-TIME LISTENERS (fetch-based wrappers for API compatibility) ====================
// These replace the original Firestore onSnapshot listeners with fetch-based calls.
// The frontend polls on page load instead of maintaining a live Firestore connection.

export const listenToDonationsRealtime = (statusFilter = null) =>
  getDonations(statusFilter);

export const listenToRequestsRealtime = (statusFilter = null) =>
  getRequests(statusFilter);

export const listenToVolunteerDeliveries = (volunteerId) =>
  getDeliveries(volunteerId);

// ==================== USERS API ====================

export const updateUserProfile = (userId, userData) =>
  request(`/api/users/${userId}/profile`, {
    method: "POST",
    body: JSON.stringify(userData),
  });

export const getUserProfile = (userId) =>
  request(`/api/users/${userId}/profile`);

// ==================== UTILITY ====================

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

export const findNearest = (currentLocation, items, limit = 3) => {
  if (!currentLocation) return [];
  return items
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map((item) => ({
      ...item,
      distance: calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        item.latitude,
        item.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};
