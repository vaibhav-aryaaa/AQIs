import React, { useState, useEffect } from 'react';
import { RefreshCw, MapPin, TrendingUp, Cpu, Wind, Activity, Sparkles, PanelLeftOpen, ShieldAlert } from 'lucide-react';
import MapWidget from '../components/MapWidget';
import ForecastChart from '../components/ForecastChart';
import TicketList from '../components/TicketList';
import LiveFeed from '../components/LiveFeed';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DashboardPage() {
  const [nodes, setNodes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(1);
  const [forecastValue, setForecastValue] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Live feed state
  const [feed, setFeed] = useState([]);
  // Initial loading state
  const [initialLoading, setInitialLoading] = useState(true);

  // Ingestion Simulator states
  const [preset, setPreset] = useState('moderate');
  const [customPm25, setCustomPm25] = useState('');
  const [customPm10, setCustomPm10] = useState('');
  const [customCo, setCustomCo] = useState('');
  const [customAqi, setCustomAqi] = useState('');
  const [triggering, setTriggering] = useState(false);

  const fetchHistory = async (nodeId) => {
    if (!nodeId) return;
    try {
      const res = await fetch(`${API_BASE}/api/telemetry/history/${nodeId}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching telemetry history:', err);
      setHistory([]);
    }
  };

  const fetchData = async () => {
    try {
      const telemetryRes = await fetch(`${API_BASE}/api/telemetry/current`);
      const telemetryData = await telemetryRes.json();
      setNodes(telemetryData);

      const ticketRes = await fetch(`${API_BASE}/api/tickets`);
      const ticketData = await ticketRes.json();
      setTickets(ticketData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchForecast = async (nodeId) => {
    if (!nodeId) return;
    setLoadingForecast(true);
    try {
      const res = await fetch(`${API_BASE}/api/forecast/${nodeId}`);
      const data = await res.json();
      setForecastValue(data.forecasted_aqi);
    } catch (err) {
      console.error('Error fetching air forecast:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleSyncLiveData = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
      const data = await response.json();
      console.log('Sync response:', data);
      await fetchData();
      await fetchHistory(selectedNodeId);
    } catch (err) {
      console.error('Failed to sync live data:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    let wsUrl;
    if (apiBaseUrl) {
      try {
        const urlObj = new URL(apiBaseUrl);
        const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${urlObj.host}/api/ws`;
      } catch (e) {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${window.location.host}/api/ws`;
      }
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      wsUrl = `${wsProtocol}//${wsHost}/api/ws`;
    }
    
    console.log('Connecting to Live WebSocket Feed:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Received WebSocket message:', msg);
        
        // UI.1: Append to live feed, color-coded by type, capped at 20 entries
        const feedMsg = {
          type: msg.type,
          data: msg.data,
          timestamp: new Date().toISOString()
        };
        setFeed((prevFeed) => [feedMsg, ...prevFeed].slice(0, 20));

        if (msg.type === 'telemetry') {
          setNodes((prevNodes) => 
            prevNodes.map((n) => n.node_id === msg.data.node_id ? { ...n, ...msg.data } : n)
          );
        } else if (msg.type === 'ticket') {
          setTickets((prevTickets) => [msg.data, ...prevTickets]);
        }
      } catch (err) {
        console.error('Error parsing WebSocket json:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected.');
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    fetchForecast(selectedNodeId);
    fetchHistory(selectedNodeId);
  }, [selectedNodeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  const selectedNode = nodes.find(n => n.node_id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setCustomPm25(Math.round((selectedNode.pm25 || 35) * 1.5));
      setCustomPm10(Math.round((selectedNode.pm10 || 70) * 1.5));
      setCustomCo(((selectedNode.co || 1.0) * 1.5).toFixed(2));
      setCustomAqi(Math.round((selectedNode.aqi || 60) * 1.5));
    }
  }, [selectedNodeId]);

  const handleTriggerTelemetry = async () => {
    if (!selectedNode) return;
    setTriggering(true);
    
    let payload;
    if (preset === 'custom') {
      payload = {
        node_id: selectedNode.node_id,
        pm25: parseFloat(customPm25),
        pm10: parseFloat(customPm10),
        co: parseFloat(customCo),
        aqi: parseFloat(customAqi)
      };
    } else {
      const presets = {
        moderate: { pm25: 24.0, pm10: 70.0, co: 0.8, aqi: 75.0 },
        poor: { pm25: 75.0, pm10: 140.0, co: 1.8, aqi: 160.0 },
        severe: { pm25: 250.0, pm10: 420.0, co: 4.2, aqi: 350.0 }
      };
      payload = {
        node_id: selectedNode.node_id,
        ...presets[preset]
      };
    }

    try {
      const response = await fetch(`${API_BASE}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log('Simulation triggered:', data);
    } catch (err) {
      console.error('Failed to trigger virtual telemetry simulation:', err);
    } finally {
      setTimeout(() => {
        setTriggering(false);
      }, 1000);
    }
  };

  const getAqiCategory = (aqi) => {
    if (!aqi) return 'Offline';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Sensitive Groups Warning';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getAqiClass = (aqi) => {
    if (!aqi) return '';
    return 'aqi-' + getAqiCategory(aqi).toLowerCase().replace(/\s+/g, '');
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: 'calc(100vh - 70px)',
      boxSizing: 'border-box',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Sidebar - Action Plans */}
      <aside style={{
        width: sidebarOpen ? '350px' : '0px',
        minWidth: sidebarOpen ? '350px' : '0px',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        background: 'var(--bg-secondary)',
        borderRight: sidebarOpen ? '1px solid var(--border-primary)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <TicketList 
          tickets={tickets} 
          onToggleSidebar={() => setSidebarOpen(false)} 
          loading={initialLoading}
        />
      </aside>

      {/* Main Dashboard Panel */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: '1fr 1fr',
        gap: '20px',
        padding: '20px',
        boxSizing: 'border-box',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Interactive Mapping Nodes */}
        <section className="map-section">
          {/* Floating Expand Button (only visible when sidebar is collapsed) */}
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              title="Expand Panel"
              style={{
                position: 'absolute',
                top: '90px',
                left: '12px',
                zIndex: 1000,
                background: 'var(--bg-secondary)',
                color: 'var(--accent-color)',
                border: '1px solid var(--border-glow)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--card-shadow)',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--accent-glow)';
                e.currentTarget.style.borderColor = 'var(--accent-color)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-glow)';
              }}
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          <button 
            onClick={handleSyncLiveData}
            disabled={syncing}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              background: 'var(--bg-secondary)',
              color: 'var(--accent-color)',
              border: '1px solid var(--border-glow)',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: syncing ? 'not-allowed' : 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}
          >
            <RefreshCw 
              size={14} 
              style={{ 
                animation: syncing ? 'spin 1.5s linear infinite' : 'none' 
              }} 
            />
            <span>{syncing ? 'Syncing...' : 'Sync Live Government Data'}</span>
          </button>
          <MapWidget
            nodes={nodes}
            onSelectNode={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
            forecastValue={forecastValue}
            loadingForecast={loadingForecast}
          />
        </section>

        {/* Lower Details Panels */}
        <section className="analytics-section" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Card: Node Details */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--accent-color)" />
              <span>Station Details</span>
            </h3>
            {initialLoading ? (
              <LoadingSpinner message="Loading station details..." />
            ) : selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-white)', fontFamily: '"Space Grotesk", sans-serif' }}>
                      {selectedNode.area_name}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Lat: {selectedNode.latitude.toFixed(4)}, Lon: {selectedNode.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Current AQI</div>
                    <div className={`metric-value ${getAqiClass(selectedNode.aqi)}`} style={{ fontSize: '2.2rem', margin: 0, lineHeight: 1.1 }}>
                      {selectedNode.aqi ? selectedNode.aqi.toFixed(0) : 'N/A'}
                    </div>
                    <span className={getAqiClass(selectedNode.aqi)} style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {getAqiCategory(selectedNode.aqi)}
                    </span>
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="detail-metric">
                    <span className="metric-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Wind size={13} color="#06b6d4" />
                      PM2.5 (Fine Dust)
                    </span>
                    <div className="metric-value" style={{ color: '#06b6d4' }}>
                      {selectedNode.pm25 ? `${selectedNode.pm25.toFixed(1)} ug/m³` : 'N/A'}
                    </div>
                  </div>
                  <div className="detail-metric">
                    <span className="metric-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Wind size={13} color="#06b6d4" />
                      PM10 (Coarse Dust)
                    </span>
                    <div className="metric-value" style={{ color: '#06b6d4' }}>
                      {selectedNode.pm10 ? `${selectedNode.pm10.toFixed(1)} ug/m³` : 'N/A'}
                    </div>
                  </div>
                  <div className="detail-metric">
                    <span className="metric-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Activity size={13} color="#f59e0b" />
                      Carbon Monoxide (CO)
                    </span>
                    <div className="metric-value" style={{ color: '#f59e0b' }}>
                      {selectedNode.co ? `${selectedNode.co.toFixed(2)} mg/m³` : 'N/A'}
                    </div>
                  </div>
                  <div className="detail-metric" style={{
                    borderColor: 'var(--border-glow)',
                    background: 'var(--accent-glow)'
                  }}>
                    <span className="metric-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Sparkles size={13} color="var(--accent-color)" />
                      Smart Air Forecast (24h)
                    </span>
                    <div className="metric-value" style={{ color: 'var(--accent-color)' }}>
                      {loadingForecast ? 'Updating...' : (forecastValue ? `${forecastValue.toFixed(0)} AQI` : 'N/A')}
                    </div>
                  </div>
                </div>

                {/* Virtual Telemetry Simulator Panel */}
                <div style={{
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px dashed var(--border-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    color: 'var(--text-white)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ShieldAlert size={14} color="#ef4444" />
                    <span>Virtual Telemetry Simulator</span>
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                      value={preset} 
                      onChange={(e) => setPreset(e.target.value)} 
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        flex: 1,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="moderate">Moderate Preset</option>
                      <option value="poor">Poor Preset (Triggers GRAP)</option>
                      <option value="severe">Severe Preset (Triggers Alert)</option>
                      <option value="custom">Custom Values</option>
                    </select>
                    <button
                      onClick={handleTriggerTelemetry}
                      disabled={triggering}
                      style={{
                        background: triggering ? 'var(--border-primary)' : 'rgba(239, 68, 68, 0.1)',
                        color: triggering ? 'var(--text-secondary)' : '#fca5a5',
                        border: `1px solid ${triggering ? 'var(--border-primary)' : '#ef4444'}`,
                        borderRadius: '8px',
                        padding: '6px 15px',
                        fontSize: '0.8rem',
                        cursor: triggering ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {triggering ? 'Triggering...' : 'Trigger'}
                    </button>
                  </div>
                  {preset === 'custom' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '2px', textAlign: 'center' }}>PM2.5</label>
                        <input 
                          type="number" 
                          value={customPm25} 
                          onChange={(e) => setCustomPm25(e.target.value)} 
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                            textAlign: 'center'
                          }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '2px', textAlign: 'center' }}>PM10</label>
                        <input 
                          type="number" 
                          value={customPm10} 
                          onChange={(e) => setCustomPm10(e.target.value)} 
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                            textAlign: 'center'
                          }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '2px', textAlign: 'center' }}>CO</label>
                        <input 
                          type="number" 
                          value={customCo} 
                          onChange={(e) => setCustomCo(e.target.value)} 
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                            textAlign: 'center'
                          }} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '2px', textAlign: 'center' }}>AQI</label>
                        <input 
                          type="number" 
                          value={customAqi} 
                          onChange={(e) => setCustomAqi(e.target.value)} 
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            width: '100%',
                            boxSizing: 'border-box',
                            outline: 'none',
                            textAlign: 'center'
                          }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Select a station on the map to inspect.
              </div>
            )}
          </div>

          {/* Card: Forecast Trend */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--accent-color)" />
                <span>Air Forecast Trend (Next 24h)</span>
              </span>
              {selectedNode && (
                <span className="status-badge" style={{ padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={12} color="var(--accent-color)" />
                  <span>XGBoost AI Model</span>
                </span>
              )}
            </h3>
            <div style={{ flexGrow: 1, minHeight: '180px' }}>
              {initialLoading ? (
                <LoadingSpinner message="Loading forecast trend..." />
              ) : (
                <ForecastChart selectedNode={selectedNode} forecastValue={forecastValue} history={history} />
              )}
            </div>
          </div>

          {/* Card: Live Telemetry Feed */}
          <LiveFeed feed={feed} />
        </section>
      </main>
    </div>
  );
}
