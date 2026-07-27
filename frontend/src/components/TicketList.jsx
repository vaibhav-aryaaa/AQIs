import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, PanelLeftClose } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function TicketList({ tickets = [], onToggleSidebar, loading = false }) {
  const getSeverityStyle = (severity) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return { 
          background: 'rgba(239, 68, 68, 0.05)', 
          border: '1px solid rgba(239, 68, 68, 0.25)', 
          color: '#ef4444',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.08)'
        };
      case 'poor':
        return { 
          background: 'rgba(249, 115, 22, 0.05)', 
          border: '1px solid rgba(249, 115, 22, 0.25)', 
          color: '#f97316',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.08)'
        };
      default:
        return { 
          background: 'rgba(245, 158, 11, 0.05)', 
          border: '1px solid rgba(245, 158, 11, 0.25)', 
          color: '#f59e0b',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
        };
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ 
        margin: 0, 
        fontSize: '1.15rem', 
        color: 'var(--text-primary)', 
        borderBottom: '1px solid var(--border-primary)', 
        paddingBottom: '12px',
        fontFamily: '"Space Grotesk", sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FileText size={18} color="var(--accent-color)" />
        <span>Clean Air Action Plans</span>
        <button 
          onClick={onToggleSidebar}
          title="Collapse Panel"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <PanelLeftClose size={18} />
        </button>
      </h3>
      {loading ? (
        <LoadingSpinner message="Loading action plans..." />
      ) : tickets.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '20px' }}>
          No active warnings. Air quality is stable.
        </div>
      ) : (
        tickets.map((ticket) => {
          const isResolved = ticket.status === 'Resolved';
          return (
            <div
              key={ticket.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                ...getSeverityStyle(ticket.severity),
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease-in-out',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '0.8rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={14} />
                  {(ticket.area_name || `ZONE ${ticket.node_id}`).toUpperCase()} - {ticket.severity.toUpperCase()}
                </span>
                <span
                  style={{
                    background: isResolved ? 'var(--accent-glow)' : 'rgba(245, 158, 11, 0.1)',
                    color: isResolved ? 'var(--accent-color)' : '#f59e0b',
                    border: `1px solid ${isResolved ? 'var(--border-glow)' : 'rgba(245, 158, 11, 0.25)'}`,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isResolved ? <CheckCircle size={10} /> : null}
                  {ticket.status.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                {ticket.message}
              </p>
              <span style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-secondary)', 
                alignSelf: 'flex-end',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={11} />
                {new Date(ticket.timestamp.endsWith('Z') ? ticket.timestamp : ticket.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
