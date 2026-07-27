import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Send, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';

export default function SensorLabPage() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  
  const [pm25, setPm25] = useState(45);
  const [pm10, setPm10] = useState(85);
  const [co, setCo] = useState(1.1);
  const [aqi, setAqi] = useState(70);
  
  const [postStatus, setPostStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBaseUrl}/api/nodes`);
        const data = await res.json();
        setNodes(data);
        if (data.length > 0) {
          setSelectedNodeId(data[0].id.toString());
        }
      } catch (err) {
        console.error('Error fetching nodes:', err);
      }
    };
    fetchNodes();
  }, []);

  const handlePostTelemetry = async () => {
    if (!selectedNodeId) return;
    setLoading(true);
    setPostStatus(null);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: parseInt(selectedNodeId),
          pm25: parseFloat(pm25),
          pm10: parseFloat(pm10),
          co: parseFloat(co),
          aqi: parseFloat(aqi)
        })
      });
      
      const data = await response.json();
      setPostStatus(data);
    } catch (err) {
      console.error('Failed to post virtual telemetry:', err);
      setPostStatus({ status: 'error', message: 'Failed to connect to backend api.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNormal = () => {
    setPm25(40 + Math.floor(Math.random() * 15));
    setPm10(75 + Math.floor(Math.random() * 20));
    setCo((0.8 + Math.random() * 0.5).toFixed(2));
    setAqi(65 + Math.floor(Math.random() * 15));
  };

  const handleSetAnomaly = () => {
    setPm25(680);
    setPm10(1250);
    setCo(95.0);
    setAqi(780);
  };

  const activeNode = nodes.find(n => n.id.toString() === selectedNodeId);

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      background: 'var(--bg-primary)',
      padding: '40px 20px',
      color: 'var(--text-primary)',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      <div style={{
        maxWidth: '700px',
        width: '100%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '30px',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Title */}
        <div>
          <h2 style={{
            fontSize: '1.8rem',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
            color: 'var(--text-white)',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Virtual Sensor Simulator Lab
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '5px 0 0 0' }}>
            Simulate and post live air quality readings without needing physical hardware.
          </p>
        </div>

        {/* Node Select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Select Station Node</label>
          <select 
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '10px',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                Node {node.id}: {node.area_name}
              </option>
            ))}
          </select>
        </div>

        {/* Simulation Templates */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={handleSetNormal}
            style={{
              flex: 1,
              background: 'rgba(var(--accent-color-rgb), 0.04)',
              color: 'var(--accent-color)',
              border: '1px solid var(--border-glow)',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(var(--accent-color-rgb), 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(var(--accent-color-rgb), 0.04)';
            }}
          >
            <CheckCircle size={14} />
            Set Clean Air Values
          </button>

          <button 
            onClick={handleSetAnomaly}
            style={{
              flex: 1,
              background: 'rgba(239, 68, 68, 0.04)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              padding: '10px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.04)';
            }}
          >
            <AlertTriangle size={14} />
            Set Suspect/Faulty Values
          </button>
        </div>

        {/* Sliders Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '20px' }}>
          
          {/* PM2.5 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <span>PM2.5 (Fine Dust)</span>
              <strong style={{ color: '#06b6d4' }}>{pm25} ug/m³</strong>
            </div>
            <input 
              type="range" min="1" max="800" value={pm25} 
              onChange={(e) => setPm25(parseInt(e.target.value))}
              style={{ accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>

          {/* PM10 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <span>PM10 (Coarse Dust)</span>
              <strong style={{ color: '#06b6d4' }}>{pm10} ug/m³</strong>
            </div>
            <input 
              type="range" min="1" max="1500" value={pm10} 
              onChange={(e) => setPm10(parseInt(e.target.value))}
              style={{ accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>

          {/* CO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <span>Carbon Monoxide (CO)</span>
              <strong style={{ color: '#f59e0b' }}>{co} mg/m³</strong>
            </div>
            <input 
              type="range" min="0.1" max="100.0" step="0.1" value={co} 
              onChange={(e) => setCo(parseFloat(e.target.value))}
              style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
            />
          </div>

          {/* AQI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              <span>AQI (Air Quality Index)</span>
              <strong style={{ color: 'var(--accent-color)' }}>{aqi}</strong>
            </div>
            <input 
              type="range" min="10" max="800" value={aqi} 
              onChange={(e) => setAqi(parseInt(e.target.value))}
              style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Post Button */}
        <button 
          onClick={handlePostTelemetry}
          disabled={loading}
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-secondary)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.color = 'var(--accent-color)';
              e.currentTarget.style.borderColor = 'rgba(var(--accent-color-rgb), 0.3)';
              e.currentTarget.style.background = 'rgba(var(--accent-color-rgb), 0.03)';
              e.currentTarget.style.boxShadow = '0 4px 20px var(--accent-glow)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-secondary)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Send size={15} />
          <span>{loading ? 'Posting...' : 'Post Telemetry to Live Feed'}</span>
        </button>

        {/* Response Notification Banner */}
        {postStatus && (
          <div style={{
            background: postStatus.status === 'success' ? 'rgba(var(--accent-color-rgb), 0.04)' : (postStatus.status === 'quarantined' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(245, 158, 11, 0.04)'),
            border: `1px solid ${postStatus.status === 'success' ? 'var(--border-glow)' : (postStatus.status === 'quarantined' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)')}`,
            color: postStatus.status === 'success' ? 'var(--accent-color)' : (postStatus.status === 'quarantined' ? '#ef4444' : '#f59e0b'),
            padding: '14px 18px',
            borderRadius: '12px',
            fontSize: '0.85rem',
            textAlign: 'center',
            fontWeight: '600',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {postStatus.status === 'success' && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={16} />
                READINGS ACCEPTED: Air values stored as clean logs.
              </span>
            )}
            {postStatus.status === 'quarantined' && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldAlert size={16} />
                HEALTH CHECK FAILURE: Reading blocked as SUSPECT and quarantined.
              </span>
            )}
            {postStatus.status === 'error' && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                ERROR: Failed to connect to server.
              </span>
            )}
            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.85 }}>
              {postStatus.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
