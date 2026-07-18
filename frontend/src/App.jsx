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
  
  // State to hold the active quarantined anomaly alert banner data
  const [anomalyAlert, setAnomalyAlert] = useState(null);

  // 1. Initial Load of current telemetry and tickets (fallback polling just in case)
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

  // 2. Load forecast on selected node change
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

  // Setup WebSocket connection and handle real-time broadcasts
  useEffect(() => {
    fetchData(); // Run initial fetch

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws`;
    
    console.log('Connecting to WebSocket server:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Received WebSocket broadcast:', msg);
        
        if (msg.type === 'telemetry') {
          // Instantly update the node's readings on map & inspector
          setNodes((prevNodes) => 
            prevNodes.map((n) => n.node_id === msg.data.node_id ? { ...n, ...msg.data } : n)
          );
        } else if (msg.type === 'anomaly') {
          // Display the quarantined anomaly alert banner
          setAnomalyAlert(msg.data);
          // Hide banner after 8 seconds
          setTimeout(() => setAnomalyAlert(null), 8000);
        } else if (msg.type === 'ticket') {
          // Add new GRAP ticket to the top of the action sidebar
          setTickets((prevTickets) => [msg.data, ...prevTickets]);
        }
      } catch (err) {
        console.error('Error parsing WebSocket json:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed. Falling back to HTTP refresh mode.');
    };

    return () => {
      socket.close();
    };
  }, []);

  // Sync forecast fetch on selected node change
  useEffect(() => {
    fetchForecast(selectedNodeId);
  }, [selectedNodeId]);

  // Handler to post a mock spatial anomaly payload to backend
  const simulateAnomaly = async () => {
    const activeNode = nodes.find(n => n.node_id === selectedNodeId);
    if (!activeNode) return;

    console.log(`Triggering anomaly simulation for Node ${selectedNodeId}...`);
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: selectedNodeId,
          pm25: 650.0,
          pm10: 1200.0,
          co: 95.0, // Exceeds absolute physical limit (50)
          aqi: 750.0 // Exceeds normal limits
        })
      });
    } catch (err) {
      console.error('Failed to post simulated anomaly:', err);
    }
  };

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
      {/* Real-time Anomaly Quarantine Alert Banner */}
      {anomalyAlert && (
        <div style={{
          position: 'absolute',
          top: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(127, 29, 29, 0.95)',
          border: '2px solid #ef4444',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)',
          color: '#ffffff',
          padding: '14px 28px',
          borderRadius: '12px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '380px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <strong style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>🚨 TELEMETRY QUARANTINED</strong>
          <span style={{ fontSize: '0.85rem' }}>
            Node {anomalyAlert.node_id} ({anomalyAlert.area_name}) reported a spatial outlier!
          </span>
          <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontStyle: 'italic' }}>
            Reason: {anomalyAlert.reason}
          </span>
        </div>
      )}

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
            Real-Time Stream Active
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
                <button 
                  onClick={simulateAnomaly}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                    e.target.style.borderColor = '#ef4444';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                >
                  ⚠️ Simulate Anomaly
                </button>
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
