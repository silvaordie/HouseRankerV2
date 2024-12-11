import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

const CenterUpdater = ({ center, triggerUpdate }) => {
    const map = useMap();

    // Center the map only when triggerUpdate is true
    useEffect(() => {
        if (triggerUpdate) {
            map.setView(center);
        }
    }, [center, triggerUpdate, map]);

    return null; // This component doesn't render anything
};


const MapComponent = ({ pointsOfInterest }) => {
    const [meanGeolocation, setMeanGeolocation] = useState({ lat: 0, lon: 0 });
    const [triggerCenterUpdate, setTriggerCenterUpdate] = useState(false);

    // Calculate the mean geolocation whenever pointsOfInterest changes
    useEffect(() => {
        const getMeanGeolocation = (pointsOfInterest) => {
            let totalLat = 0;
            let totalLon = 0;
            const totalPoints = Object.values(pointsOfInterest).length;

            Object.values(pointsOfInterest).forEach(poi => {
                totalLat += parseFloat(poi.geolocation.lat);
                totalLon += parseFloat(poi.geolocation.lon);
            });

            return {
                lat: totalLat / totalPoints,
                lon: totalLon / totalPoints
            };
        };

        // Update the mean geolocation whenever pointsOfInterest changes
        if (Object.keys(pointsOfInterest).length > 0) {
            setMeanGeolocation(getMeanGeolocation(pointsOfInterest));
            setTriggerCenterUpdate(true); // Trigger map centering
        }
    }, [pointsOfInterest]);  // Dependency on pointsOfInterest

        // Reset the trigger after the map has been centered
        useEffect(() => {
            if (triggerCenterUpdate) {
                const timer = setTimeout(() => setTriggerCenterUpdate(false), 500);
                return () => clearTimeout(timer); // Cleanup timeout
            }
        }, [triggerCenterUpdate]);
        
    return (
        <div className="map-container" style={{ height: '100%', width: '100%' }}>
            <MapContainer
                center={[meanGeolocation.lat, meanGeolocation.lon]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Update map center when meanGeolocation changes */}
                <CenterUpdater
                    center={[meanGeolocation.lat, meanGeolocation.lon]}
                    triggerUpdate={triggerCenterUpdate}
                />                
                {/* Markers for each point of interest */}
                {Object.values(pointsOfInterest).map((poi, index) => (
                    <Marker
                        key={index}
                        position={[poi.geolocation.lat, poi.geolocation.lon]}
                        icon={new L.Icon({
                            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png', // Default pin
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41],
                        })}
                    >
                        <Popup>{poi.name}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
