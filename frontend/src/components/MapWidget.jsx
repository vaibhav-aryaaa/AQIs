import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

export default function MapWidget({ nodes = [], onSelectNode, selectedNodeId }) {
  // Center of Delhi coordinates
  const position = [28.6139, 77.2090];

  const getAqiColor = (aqi) => {
    if (!aqi) return '#64748b'; // Gray for offline
    if (aqi <= 50) return '#10b981'; // Good (Green)
    if (aqi <= 100) return '#06b6d4'; // Satisfactory (Teal)
    if (aqi <= 200) return '#f59e0b'; // Moderate (Yellow)
    if (aqi <= 300) return '#f97316'; // Poor (Orange)
    if (aqi <= 400) return '#ef4444'; // Very Poor (Red)
    return '#7f1d1d'; // Severe (Dark Red)
  };

  const getAqiLabel = (aqi) => {
    if (!aqi) return 'Offline';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  };

  return (
    <MapContainer center={position} zoom={11} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {nodes.map((node) => {
        const markerColor = getAqiColor(node.aqi);
        const isSelected = selectedNodeId === node.node_id;

        return (
          <CircleMarker
            key={node.node_id}
            center={[node.latitude, node.longitude]}
            pathOptions={{
              color: isSelected ? '#ffffff' : markerColor,
              fillColor: markerColor,
              fillOpacity: 0.8,
              weight: isSelected ? 3 : 1,
              radius: isSelected ? 14 : 10
            }}
            eventHandlers={{
              click: () => onSelectNode(node.node_id)
            }}
          >
            <Popup>
              <div style={{ color: '#0f172a', fontFamily: 'sans-serif' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{node.area_name}</h4>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem' }}>
                  <strong>AQI:</strong> {node.aqi ? node.aqi.toFixed(1) : 'N/A'} ({getAqiLabel(node.aqi)})
                </p>
                {node.aqi && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    PM2.5: {node.pm25.toFixed(1)} | CO: {node.co.toFixed(1)} mg/m³
                  </p>
                )}
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold' }}>
                  Click to view 24h predictions
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
