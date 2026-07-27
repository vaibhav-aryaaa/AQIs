import React, { useState, useEffect } from 'react';
import { RefreshCw, MapPin, TrendingUp, Cpu, Wind, Activity, Sparkles, PanelLeftOpen } from 'lucide-react';
import MapWidget from '../components/MapWidget';
import ForecastChart from '../components/ForecastChart';
import TicketList from '../components/TicketList';

export default function DashboardPage() {
  const [nodes, setNodes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(1);
  const [forecastValue, setForecastValue] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchData = async () => {
    try {
      const telemetryRes = await fetch('/api/telemetry/current');
      const telemetryData = await telemetryRes.json();
      setNodes(telemetryData);

      const ticketRes = await fetch('/api/tickets');
      const ticketData = await ticketRes.json();
      setTickets(ticketData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const fetchForecast = async (nodeId) => {
    if (!nodeId) return;
    setLoadingForecast(true);
    try {
      const res = await fetch(`/api/forecast/${nodeId}`);
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
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json();
      console.log('Sync response:', data);
      await fetchData();
    } catch (err) {
      console.error('Failed to sync live data:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/ws`;
    
    console.log('Connecting to Live WebSocket Feed:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Received WebSocket message:', msg);
        
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
  }, [selectedNodeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  const selectedNode = nodes.find(n => n.node_id === selectedNodeId);

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
        <section className="analytics-section">
          {/* Card: Node Details */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--accent-color)" />
              <span>Station Details</span>
            </h3>
            {selectedNode ? (
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
              <ForecastChart selectedNode={selectedNode} forecastValue={forecastValue} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
