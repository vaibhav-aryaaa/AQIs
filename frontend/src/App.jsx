import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SensorLabPage from './pages/SensorLabPage';
import SettingsPage from './pages/SettingsPage';
import GooeyNav from './components/GooeyNav';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [anomalyAlert, setAnomalyAlert] = useState(null);
  const [feed, setFeed] = useState([]);
  
  // Theme state persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }, [theme]);

  const [autoSimulate, setAutoSimulate] = useState(false);

  useEffect(() => {
    if (!autoSimulate) return;
    
    const triggerRandomSimulation = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBaseUrl}/api/simulate/random-anomaly`, {
          method: 'POST'
        });
        const data = await res.json();
        console.log('Random simulation triggered:', data);
      } catch (err) {
        console.error('Failed to trigger random simulation:', err);
      }
    };

    triggerRandomSimulation();
    const interval = setInterval(triggerRandomSimulation, 15000);
    return () => clearInterval(interval);
  }, [autoSimulate]);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Simulator Lab', path: '/simulator' },
    { label: 'Settings', path: '/settings' }
  ];

  // Global WebSocket listener for suspect air reading alerts
  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    let wsUrl;
    if (apiBaseUrl) {
      try {
        const urlObj = new URL(apiBaseUrl);
        const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${urlObj.host}/api/ws`;
      } catch (e) {
        wsUrl = `ws://127.0.0.1:8000/api/ws`;
      }
    } else {
      wsUrl = `ws://127.0.0.1:8000/api/ws`;
    }
    
    console.log('Global App connecting to WebSocket:', wsUrl);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('Global WebSocket message received:', msg);

        // Update global feed state
        const feedMsg = {
          type: msg.type,
          data: msg.data,
          timestamp: new Date().toISOString()
        };
        setFeed((prevFeed) => [feedMsg, ...prevFeed].slice(0, 20));

        // Dispatch a custom event to notify mounted page components
        window.dispatchEvent(new CustomEvent('smartaqi-ws-message', { detail: msg }));

        if (msg.type === 'anomaly') {
          console.log('Global anomaly received:', msg.data);
          setAnomalyAlert(msg.data);
          setTimeout(() => setAnomalyAlert(null), 8000);
        }
      } catch (err) {
        console.error('Error parsing global websocket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('Global WebSocket connection closed.');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'var(--bg-primary)', 
        position: 'relative',
        transition: 'background 0.3s ease'
      }}>
        
        {/* Global Slide-In Suspect Air Reading Alert Banner */}
        {anomalyAlert && (
          <div style={{
            position: 'fixed',
            top: '85px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(127, 29, 29, 0.95)',
            border: '2px solid #ef4444',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '12px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: '380px',
            fontFamily: '"Plus Jakarta Sans", sans-serif'
          }}>
            <strong style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>🚨 SUSPECT AIR READING BLOCKED</strong>
            <span style={{ fontSize: '0.85rem' }}>
              Station {anomalyAlert.node_id} ({anomalyAlert.area_name}) reported a suspicious reading!
            </span>
            <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontStyle: 'italic' }}>
              Health Check Flag: {anomalyAlert.reason.replace('Telemetry anomaly detected & logged: ', '')}
            </span>
          </div>
        )}

        {/* Navigation Top Header Bar (Minimalist, Centered, Fixed & Transparent) */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '70px',
          background: 'transparent',
          borderBottom: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 30px',
          zIndex: 9999,
          boxSizing: 'border-box'
        }}>
          {/* System Active Status Badge and Auto-Simulate Toggle */}
          <div style={{
            position: 'absolute',
            left: '30px',
            top: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            padding: '6px 14px',
            borderRadius: '20px',
            boxShadow: 'var(--card-shadow)',
            backdropFilter: 'blur(12px)',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.8rem',
            fontWeight: '600',
            userSelect: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot"></span>
              <span style={{ color: 'var(--text-secondary)' }}>System Active</span>
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--border-primary)' }}></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={autoSimulate}
                onChange={(e) => setAutoSimulate(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Auto-Simulate</span>
            </label>
          </div>

          {/* Gooey Animated Navigation Menu */}
          <GooeyNav items={navItems} />

          {/* Theme Toggle Switch */}
          <button 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              position: 'absolute',
              right: '30px',
              top: '15px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--accent-color)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--card-shadow)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.25s ease',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-color)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Page Content Routes (Padded to clear the fixed header) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '70px' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage feed={feed} />} />
            <Route path="/simulator" element={<SensorLabPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
