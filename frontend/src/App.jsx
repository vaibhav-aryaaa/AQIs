import React, { useState, useEffect } from 'react';
import MapWidget from './components/MapWidget';
import ForecastChart from './components/ForecastChart';
import TicketList from './components/TicketList';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(1); // Default to first node
  const [forecastValue, setForecastValue] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // 1. Fetch current node data and tickets
  const fetchData = async () => {
    try {
      const telemetryRes = await fetch('/api/telemetry/current');
      const telemetryData = await telemetryRes.json();
      setNodes(telemetryData);

      const ticketRes = await fetch('/api/tickets');
      const ticketData = await ticketRes.json();
      setTickets(ticketData);
    } catch (err) {
      console.error('Error fetching data from backend:', err);
    }
  };

  // 2. Fetch forecast when selected node changes
  const fetchForecast = async (nodeId) => {
    if (!nodeId) return;
    setLoadingForecast(true);
    try {
      const res = await fetch(`/api/forecast/${nodeId}`);
      const data = await res.json();
      setForecastValue(data.forecasted_aqi);
    } catch (err) {
      console.error('Error fetching AI forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  // Initial load and periodic polling (every 5 seconds)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync forecast fetch on selected node change
  useEffect(() => {
    fetchForecast(selectedNodeId);
  }, [selectedNodeId]);

  const selectedNode = nodes.find(n => n.node_id === selectedNodeId);

  const getAqiCategory = (aqi) => {
    if (!aqi) return 'Offline';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  };

  const getAqiClass = (aqi) => {
    if (!aqi) return '';
    return 'aqi-' + getAqiCategory(aqi).toLowerCase().replace(' ', '');
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🍃</span>
          <div className="logo-text">
            <h1>SmartAQI</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="status-badge">
            <span className="status-dot"></span>
            Telemetry Grid Active
          </div>
        </div>
      </header>

      {/* Sidebar - Actions Tickets */}
      <aside className="sidebar">
        <TicketList tickets={tickets} />
      </aside>

      {/* Main Board Display */}
      <main className="main-content">
        {/* Dynamic Mapping Node Widget */}
        <section className="map-section">
          <MapWidget
            nodes={nodes}
            onSelectNode={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
          />
        </section>

        {/* Lower Analytics Section */}
        <section className="analytics-section">
          {/* Card: Selected Node Details */}
          <div className="card">
            <h3 className="card-title">
              <span>Node Inspector</span>
              {selectedNode && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  ID: {selectedNode.node_id}
                </span>
              )}
            </h3>
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#38bdf8' }}>
                      {selectedNode.area_name}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Lat: {selectedNode.latitude.toFixed(4)}, Lon: {selectedNode.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Current AQI</div>
                    <div className={`metric-value ${getAqiClass(selectedNode.aqi)}`} style={{ fontSize: '2rem', margin: 0 }}>
                      {selectedNode.aqi ? selectedNode.aqi.toFixed(0) : 'N/A'}
                    </div>
                    <span className={getAqiClass(selectedNode.aqi)} style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {getAqiCategory(selectedNode.aqi)}
                    </span>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-metric">
                    <span className="metric-label">PM2.5</span>
                    <div className="metric-value" style={{ color: '#06b6d4' }}>
                      {selectedNode.pm25 ? `${selectedNode.pm25.toFixed(1)} ug/m³` : 'N/A'}
                    </div>
                  </div>
                  <div className="detail-metric">
                    <span className="metric-label">PM10</span>
                    <div className="metric-value" style={{ color: '#06b6d4' }}>
                      {selectedNode.pm10 ? `${selectedNode.pm10.toFixed(1)} ug/m³` : 'N/A'}
                    </div>
                  </div>
                  <div className="detail-metric">
                    <span className="metric-label">Carbon Monoxide</span>
                    <div className="metric-value" style={{ color: '#f59e0b' }}>
                      {selectedNode.co ? `${selectedNode.co.toFixed(2)} mg/m³` : 'N/A'}
                    </div>
                  </div>
                  <div className="detail-metric">
                    <span className="metric-label">24h AI Forecast</span>
                    <div className="metric-value" style={{ color: '#a855f7' }}>
                      {loadingForecast ? '...' : (forecastValue ? `${forecastValue.toFixed(0)} AQI` : 'N/A')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Select a node to inspect current metrics.
              </div>
            )}
          </div>

          {/* Card: 24h AI Prediction Chart */}
          <div className="card">
            <h3 className="card-title">
              <span>Predictive Trend Timeline</span>
              {selectedNode && (
                <span className="status-badge" style={{ padding: '2px 8px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                  XGBoost Engine
                </span>
              )}
            </h3>
            <div style={{ flexGrow: 1, minHeight: '180px' }}>
              <ForecastChart selectedNode={selectedNode} forecastValue={forecastValue} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
