import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons
const createCustomIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="background-color: ${color};"><span class="marker-icon">${icon}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export const donationIcon = createCustomIcon('#4CAF50', '🍕');
export const requestIcon = createCustomIcon('#2196F3', '🤝');
export const volunteerIcon = createCustomIcon('#FF9800', '🚴');
export const userIcon = createCustomIcon('#9C27B0', '📍');

function MapComponent({ center, zoom = 13, markers = [], showUserLocation = false, userLocation = null }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker and radius */}
        {showUserLocation && userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <strong>Your Location</strong>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={2000}
              pathOptions={{ color: '#9C27B0', fillColor: '#9C27B0', fillOpacity: 0.1 }}
            />
          </>
        )}

        {/* Render all markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.location.lat, marker.location.lng]}
            icon={marker.icon}
          >
            <Popup>
              <div className="popup-content">
                {marker.popupContent}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
