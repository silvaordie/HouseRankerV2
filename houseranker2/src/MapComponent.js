import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

const CenterUpdater = ({ center, triggerUpdate, resetTrigger }) => {
    const map = useMap();

    useEffect(() => {
        if (triggerUpdate) {
            map.setView(center); // Center the map
            resetTrigger(); // Reset trigger after centering
        }
    }, [center, triggerUpdate, map, resetTrigger]);

    return null;
};

const MapComponent = ({ pointsOfInterest, sortedEntries }) => {
    const [meanGeolocation, setMeanGeolocation] = useState({ lat: 0, lon: 0 });
    const [triggerCenterUpdate, setTriggerCenterUpdate] = useState(false);

    // Calculate mean geolocation whenever pointsOfInterest changes
    useEffect(() => {
        const calculateMeanGeolocation = () => {
            const totalPoints = Object.values(pointsOfInterest).length;
            if (totalPoints === 0) return { lat: 0, lon: 0 };

            const { totalLat, totalLon } = Object.values(pointsOfInterest).reduce(
                (acc, poi) => {
                    acc.totalLat += parseFloat(poi.geolocation.lat);
                    acc.totalLon += parseFloat(poi.geolocation.lon);
                    return acc;
                },
                { totalLat: 0, totalLon: 0 }
            );

            return {
                lat: totalLat / totalPoints,
                lon: totalLon / totalPoints,
            };
        };

        const newMean = calculateMeanGeolocation();

        if (
            newMean.lat !== meanGeolocation.lat ||
            newMean.lon !== meanGeolocation.lon
        ) {
            setMeanGeolocation(newMean);
            setTriggerCenterUpdate(true);
        }
    }, [pointsOfInterest, meanGeolocation]);

    const resetCenterTrigger = () => {
        setTriggerCenterUpdate(false);
    };

    const getCustomIcon = (color, number) => {
        return new L.Icon({
            iconUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });
    };

    return (
        <div className="map-container" style={{ height: "100%", width: "100%" }}>
            <MapContainer
                center={[meanGeolocation.lat, meanGeolocation.lon]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* CenterUpdater to manage map centering */}
                <CenterUpdater
                    center={[meanGeolocation.lat, meanGeolocation.lon]}
                    triggerUpdate={triggerCenterUpdate}
                    resetTrigger={resetCenterTrigger}
                />

                {/* Render POIs */}
                {Object.values(pointsOfInterest).map((poi, index) => (
                    <Marker
                        key={`poi-${index}`}
                        position={[poi.geolocation.lat, poi.geolocation.lon]}
                        icon={
                            new L.Icon({
                                iconUrl:
                                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41],
                            })
                        }
                    >
                        <Popup>{poi.name}</Popup>
                    </Marker>
                ))}

                {/* Render the top 4 custom-ranked markers */}
                {sortedEntries.slice(0, 4).map(([address, entry], index) => {
                    const colors = ["blue", "green", "yellow", "red"];
                    const iconColor = colors[index];

                    return (
                        <MemoizedMarker
                            key={`custom-${index}`}
                            position={[
                                parseFloat(entry.geolocation.lat),
                                parseFloat(entry.geolocation.lon),
                            ]}
                            icon={getCustomIcon(iconColor, index + 1)}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
};

// Memoize the Marker component to prevent unnecessary re-renders
const MarkerComponent = ({ position, icon }) => {
    return <Marker position={position} icon={icon} />;
};

const MemoizedMarker = React.memo(MarkerComponent);

export default MapComponent;





