import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Pane } from 'react-leaflet';
import { Map } from 'lucide-react';

export default function MapWidget({ nodes = [], onSelectNode, selectedNodeId, forecastValue, loadingForecast }) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  const position = [28.6139, 77.2090];

  const getAqiColor = (aqi) => {
    if (!aqi) return '#64748b';
    const isLight = document.documentElement.classList.contains('light-theme');
    if (aqi <= 50) return isLight ? '#0ea5e9' : '#00ff88';
    if (aqi <= 100) return '#f59e0b';
    if (aqi <= 150) return '#f97316';
    if (aqi <= 200) return '#ef4444';
    if (aqi <= 300) return '#a855f7';
    return '#7f1d1d';
  };

  const getAqiLabel = (aqi) => {
    if (!aqi) return 'Offline';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Sensitive Groups Warning';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const sortedNodesForHalos = [...nodes]
    .filter(n => n.aqi !== null && n.aqi !== undefined)
    .sort((a, b) => a.aqi - b.aqi);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Floating Heatmap Toggle Widget */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid rgba(0, 255, 136, 0.25)',
        borderRadius: '10px',
        padding: '10px 16px',
        fontSize: '0.8rem',
        color: '#e2e8f0',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0, 255, 136, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}>
        <input 
          id="heatmap-toggle"
          type="checkbox" 
          checked={showHeatmap}
          onChange={(e) => setShowHeatmap(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: '#00ff88', width: '14px', height: '14px' }}
        />
        <label htmlFor="heatmap-toggle" style={{ 
          cursor: 'pointer', 
          fontWeight: '700', 
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Map size={14} color="#00ff88" />
          <span>Show Spatial Heatmap Overlay</span>
        </label>
      </div>

      <MapContainer center={position} zoom={11} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Custom pane for halos rendered at z-index 350 */}
        <Pane name="halos-pane" style={{ zIndex: 350 }}>
          {showHeatmap && sortedNodesForHalos.map((node) => {
            const haloColor = getAqiColor(node.aqi);
            const fillOpacity = node.aqi > 200 ? 0.04 : 0.02;

            return (
              <Circle
                key={`halo-${node.node_id}`}
                center={[node.latitude, node.longitude]}
                radius={8000}
                pane="halos-pane"
                pathOptions={{
                  fillColor: haloColor,
                  stroke: false,
                  fillOpacity: fillOpacity
                }}
              />
            );
          })}
        </Pane>

        {/* Station Markers render in default overlayPane (z-index 400) */}
        {nodes.map((node) => {
          const markerColor = getAqiColor(node.aqi);
          const isSelected = selectedNodeId === node.node_id;
          const isStale = !node.timestamp || ((Date.now() - new Date(node.timestamp).getTime()) / 60000 > 5);

          return (
            <React.Fragment key={node.node_id}>
              {isStale && (
                <CircleMarker
                  center={[node.latitude, node.longitude]}
                  className="leaflet-pulse"
                  pathOptions={{
                    className: 'leaflet-pulse',
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.15,
                    weight: 1.5,
                    radius: isSelected ? 22 : 16
                  }}
                  eventHandlers={{
                    click: () => onSelectNode(node.node_id)
                  }}
                />
              )}
              <CircleMarker
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
                <div style={{ color: '#0f172a', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontFamily: '"Space Grotesk", sans-serif', fontWeight: '700' }}>{node.area_name}</h4>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem' }}>
                    <strong>AQI:</strong> {node.aqi ? node.aqi.toFixed(1) : 'N/A'} ({getAqiLabel(node.aqi)})
                  </p>
                  {node.aqi && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      PM2.5: {node.pm25.toFixed(1)} | CO: {node.co.toFixed(1)} mg/m³
                    </p>
                  )}
                  <p 
                    onClick={() => onSelectNode(node.node_id)}
                    style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {selectedNodeId === node.node_id ? (
                      loadingForecast ? 'Calculating Forecast...' : (forecastValue ? `24h AI Forecast: ${forecastValue.toFixed(0)} AQI` : 'Click to view 24h predictions')
                    ) : (
                      'Click to view 24h predictions'
                    )}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}
      </MapContainer>
    </div>
  );
}
