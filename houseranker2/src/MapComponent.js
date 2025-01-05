import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.awesome-markers/dist/leaflet.awesome-markers.css";
import "leaflet.awesome-markers";

const CenterAndZoomUpdater = ({ pointsOfInterest, sortedEntries, triggerUpdate, resetTrigger }) => {
  const map = useMap();
  const prevDataRef = useRef({ pointsOfInterest: null, sortedEntries: null });

  useEffect(() => {
    if (!map || !triggerUpdate) return;

    const hasDataChanged = () => {
      const prevPoints = prevDataRef.current.pointsOfInterest;
      const prevSorted = prevDataRef.current.sortedEntries;

      return (
        JSON.stringify(prevPoints) !== JSON.stringify(pointsOfInterest) ||
        JSON.stringify(prevSorted) !== JSON.stringify(sortedEntries)
      );
    };

    if (!hasDataChanged()) {
      resetTrigger(); // If data hasn't changed, reset the trigger and skip
      return;
    }

    const bounds = L.latLngBounds();

    // Add points of interest to bounds
    Object.values(pointsOfInterest).forEach((poi) => {
      bounds.extend([poi.geolocation.lat, poi.geolocation.lon]);
    });

    // Add sorted entries to bounds
    sortedEntries.forEach(([_, entry]) => {
      bounds.extend([entry.geolocation.lat, entry.geolocation.lon]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    prevDataRef.current = { pointsOfInterest, sortedEntries };
    resetTrigger(); // Reset trigger after applying zoom and center
  }, [map, pointsOfInterest, sortedEntries, triggerUpdate, resetTrigger]);

  return null;
};

const MapComponent = ({ pointsOfInterest, sortedEntries }) => {
  const [triggerCenterUpdate, setTriggerCenterUpdate] = useState(false);

  // Trigger center/zoom update when pointsOfInterest or sortedEntries change
  useEffect(() => {
    setTriggerCenterUpdate(true);
  }, [pointsOfInterest, sortedEntries]);

  const resetCenterTrigger = () => {
    setTriggerCenterUpdate(false);
  };

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
        center={[0, 0]} // Initial center (adjust if needed)
        zoom={13} // Initial zoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Add CenterAndZoomUpdater */}
        <CenterAndZoomUpdater
          pointsOfInterest={pointsOfInterest}
          sortedEntries={sortedEntries}
          triggerUpdate={triggerCenterUpdate}
          resetTrigger={resetCenterTrigger}
        />

        {/* Render POIs */}
        {Object.values(pointsOfInterest).map((poi, index) => (
          <Marker
            key={`poi-${index}`}
            position={[poi.geolocation.lat, poi.geolocation.lon]}
            icon={L.AwesomeMarkers.icon({
              icon: "fa-star",
              markerColor: "purple",
              prefix: "fa",
              iconColor: "white",
            })}
          >
            <Popup>{poi.name}</Popup>
          </Marker>
        ))}

        {/* Render the top 4 custom-ranked markers */}
        {sortedEntries.slice(0, 4).map(([_, entry], index) => {
          const colors = ["blue", "green", "yellow", "red"];
          const iconColor = colors[index];

          return (
            <Marker
              key={`custom-${index}`}
              position={[
                parseFloat(entry.geolocation.lat),
                parseFloat(entry.geolocation.lon),
              ]}
              icon={getCustomIcon(iconColor)}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
