import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, FileText, Clock } from 'lucide-react';

function getRelativeTime(timestamp) {
  if (!timestamp) return 'just now';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function LiveFeed({ feed = [] }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, paddingBottom: '12px' }}>
        <Activity size={18} color="var(--accent-color)" />
        <span>Live Telemetry & Alerts Feed</span>
      </h3>
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingRight: '4px'
      }}>
        {feed.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.85rem' }}>
            Awaiting live telemetry stream...
          </div>
        ) : (
          feed.map((item, idx) => {
            let color, icon, title, desc;
            if (item.type === 'telemetry') {
              color = '#38bdf8'; // Blue for clean telemetry
              icon = <Activity size={14} color={color} />;
              title = `${item.data.area_name || `Node ${item.data.node_id}`} (Telemetry)`;
              desc = `AQI: ${Math.round(item.data.aqi)} | PM2.5: ${item.data.pm25.toFixed(1)} | CO: ${item.data.co.toFixed(2)}`;
            } else if (item.type === 'anomaly') {
              color = '#ef4444'; // Red for anomaly
              icon = <ShieldAlert size={14} color={color} />;
              title = `${item.data.area_name || `Node ${item.data.node_id}`} Anomaly`;
              desc = `QUARANTINED: ${item.data.reason.replace('Telemetry anomaly detected & logged: ', '')}`;
            } else if (item.type === 'ticket') {
              color = '#f59e0b'; // Amber for ticket
              icon = <FileText size={14} color={color} />;
              title = `GRAP Action Plan`;
              desc = `Severity: ${item.data.severity} | ${item.data.area_name || `Node ${item.data.node_id}`}: ${item.data.message}`;
            }

            return (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border-primary)',
                borderLeft: `3px solid ${color}`,
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.8rem',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--text-white)' }}>
                    {icon}
                    <span>{title}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.7rem', minWidth: '70px', justifyContent: 'flex-end' }}>
                  <Clock size={10} />
                  <span>{getRelativeTime(item.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
