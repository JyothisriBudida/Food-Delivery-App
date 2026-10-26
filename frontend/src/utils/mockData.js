// Mock data for food donations, requests, and users
export const mockDonations = [
  {
    id: 1,
    donatorName: "Pizza Palace",
    foodType: "Pizza",
    quantity: "5 boxes",
    location: { lat: 12.9716, lng: 77.5946 },
    address: "MG Road, Bangalore",
    status: "Available",
    timestamp: new Date()
  },
  {
    id: 2,
    donatorName: "Healthy Bites",
    foodType: "Salads & Sandwiches",
    quantity: "15 servings",
    location: { lat: 12.9352, lng: 77.6245 },
    address: "Indiranagar, Bangalore",
    status: "Available",
    timestamp: new Date()
  },
  {
    id: 3,
    donatorName: "Sweet Home",
    foodType: "Home cooked meals",
    quantity: "10 servings",
    location: { lat: 12.9279, lng: 77.6271 },
    address: "Koramangala, Bangalore",
    status: "Available",
    timestamp: new Date()
  },
  {
    id: 4,
    donatorName: "Breakfast Corner",
    foodType: "Breakfast items",
    quantity: "20 servings",
    location: { lat: 12.9698, lng: 77.7499 },
    address: "Whitefield, Bangalore",
    status: "Available",
    timestamp: new Date()
  },
  {
    id: 5,
    donatorName: "Curry House",
    foodType: "Indian Meals",
    quantity: "12 servings",
    location: { lat: 13.0358, lng: 77.5970 },
    address: "Yelahanka, Bangalore",
    status: "Available",
    timestamp: new Date()
  }
];

export const mockRequests = [
  {
    id: 1,
    receiverName: "Community Center A",
    people: 25,
    location: { lat: 12.9141, lng: 77.6411 },
    address: "HSR Layout, Bangalore",
    urgency: "High",
    timestamp: new Date()
  },
  {
    id: 2,
    receiverName: "Shelter Home",
    people: 40,
    location: { lat: 12.9767, lng: 77.5993 },
    address: "Sadashivanagar, Bangalore",
    urgency: "Medium",
    timestamp: new Date()
  },
  {
    id: 3,
    receiverName: "Old Age Home",
    people: 30,
    location: { lat: 12.9180, lng: 77.6230 },
    address: "BTM Layout, Bangalore",
    urgency: "High",
    timestamp: new Date()
  },
  {
    id: 4,
    receiverName: "Community Center B",
    people: 15,
    location: { lat: 13.0097, lng: 77.5513 },
    address: "Malleshwaram, Bangalore",
    urgency: "Low",
    timestamp: new Date()
  },
  {
    id: 5,
    receiverName: "Children's Home",
    people: 35,
    location: { lat: 12.9352, lng: 77.5340 },
    address: "Rajajinagar, Bangalore",
    urgency: "Medium",
    timestamp: new Date()
  }
];

export const mockVolunteers = [
  {
    id: 1,
    name: "John Doe",
    vehicle: "Bike",
    location: { lat: 12.9539, lng: 77.6095 },
    address: "Near Cubbon Park",
    status: "Available",
    deliveriesCompleted: 15
  },
  {
    id: 2,
    name: "Sarah Smith",
    vehicle: "Car",
    location: { lat: 12.9279, lng: 77.6271 },
    address: "Koramangala",
    status: "On Delivery",
    deliveriesCompleted: 23
  },
  {
    id: 3,
    name: "Mike Johnson",
    vehicle: "Bike",
    location: { lat: 12.9698, lng: 77.7499 },
    address: "Whitefield",
    status: "Available",
    deliveriesCompleted: 18
  }
];

// Utility function to calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2); // Distance in km
};

// Find nearest items to a given location
export const findNearest = (currentLocation, items, limit = 3) => {
  return items
    .map(item => ({
      ...item,
      distance: calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        item.location.lat,
        item.location.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

// Default center location (Bangalore city center)
export const defaultCenter = { lat: 12.9716, lng: 77.5946 };
