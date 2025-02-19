import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
import "leaflet.awesome-markers";
import isEqual from "lodash/isEqual"; // Import lodash for deep comparison

const CenterAndZoomUpdater = ({ pointsOfInterest = {}, sortedEntries = [] }) => {
  const map = useMap();
  const prevDataRef = useRef({ pointsOfInterest: null, sortedEntries: null });

  useEffect(() => {
    if (!map) return;

    const hasDataChanged = () => {
      const prevPoints = prevDataRef.current.pointsOfInterest;
      const prevSorted = prevDataRef.current.sortedEntries;

      return (
        !isEqual(prevPoints, pointsOfInterest) ||
        !isEqual(prevSorted, sortedEntries)
      );
    };

    if (!hasDataChanged()) {
      return; // Skip if data hasn't changed
    }

    const bounds = L.latLngBounds();
    let hasValidBounds = false;

    // Add points of interest to bounds
    if (pointsOfInterest && Object.keys(pointsOfInterest).length > 0) {
      Object.values(pointsOfInterest).forEach((poi) => {
        if (poi?.geolocation?.lat && poi?.geolocation?.lon) {
          bounds.extend([poi.geolocation.lat, poi.geolocation.lon]);
          hasValidBounds = true;
        }
      });
    }

    // Add sorted entries to bounds
    if (sortedEntries && sortedEntries.length > 0) {
      sortedEntries.forEach(([_, entry]) => {
        if (entry?.geolocation?.lat && entry?.geolocation?.lon) {
          bounds.extend([entry.geolocation.lat, entry.geolocation.lon]);
          hasValidBounds = true;
        }
      });
    }

    if (hasValidBounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      // Default center if no valid bounds
      map.setView([51.505, -0.09], 13);
    }

    prevDataRef.current = { pointsOfInterest, sortedEntries };
  }, [map, pointsOfInterest, sortedEntries]);

  return null;
};


const MapComponent = ({ pointsOfInterest = {}, sortedEntries = [], mode = 'ranking' }) => {
  console.log(sortedEntries)
  const getCustomIcon = (color) => {
    return L.AwesomeMarkers.icon({
      icon: "fa-home",
      markerColor: color,
      prefix: "fa",
      iconColor: "white",
    });
  };

  return (
    <div className="map-container" style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={[51.505, -0.09]} // Default center
        zoom={13} // Default zoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Add CenterAndZoomUpdater */}
        <CenterAndZoomUpdater
          pointsOfInterest={pointsOfInterest}
          sortedEntries={sortedEntries}
        />

        {/* Render POIs */}
        {pointsOfInterest && Object.entries(pointsOfInterest).map(([key, poi]) => {
          if (poi?.geolocation?.lat && poi?.geolocation?.lon) {
            return (
              <Marker
                key={`poi-${key}`}
                position={[poi.geolocation.lat, poi.geolocation.lon]}
                icon={L.AwesomeMarkers.icon({
                  icon: "fa-star",
                  markerColor: "purple",
                  prefix: "fa",
                  iconColor: "white",
                })}
              >
                <Popup>{poi.name || 'Point of Interest'}</Popup>
              </Marker>
            );
          }
          return null;
        })}

        {/* Render entries based on mode */}
        {sortedEntries && (mode === 'ranking' ? 
          // Ranking mode - top 4 with different colors
          sortedEntries.slice(0, 4).map(([id, entry], index) => {
            const colors = ["blue", "green", "orange", "red"];
            if (entry?.geolocation?.lat && entry?.geolocation?.lon) {
              return (
                <Marker
                  key={`entry-${id}`}
                  position={[entry.geolocation.lat, entry.geolocation.lon]}
                  icon={getCustomIcon(colors[index])}
                >
                  <Popup>{entry.Address || 'Property'}</Popup>
                </Marker>
              );
            }
            return null;
          })
          : 
          // Import mode - up to 50 entries all in blue
          sortedEntries.slice(0, 50).map(([id, entry]) => {
            if (entry?.geolocation?.lat && entry?.geolocation?.lon) {
              return (
                <Marker
                  key={`entry-${id}`}
                  position={[entry.geolocation.lat, entry.geolocation.lon]}
                  icon={getCustomIcon("blue")}
                >
                  <Popup>{entry.Address || 'Property'}</Popup>
                </Marker>
              );
            }
            return null;
          })
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
