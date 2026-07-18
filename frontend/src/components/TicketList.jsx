import React from 'react';

export default function TicketList({ tickets = [] }) {
  const getSeverityStyle = (severity) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' };
      case 'poor':
        return { background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', color: '#f97316' };
      default:
        return { background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b' };
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        Municipal Action Tickets
      </h3>
      {tickets.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>
          No active mitigation tickets. System nominal.
        </div>
      ) : (
        tickets.map((ticket) => (
          <div
            key={ticket.id}
            style={{
              padding: '16px',
              borderRadius: '12px',
              ...getSeverityStyle(ticket.severity),
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
              <span>ZONE {ticket.node_id} - {ticket.severity.toUpperCase()}</span>
              <span
                style={{
                  background: ticket.status === 'Resolved' ? '#10b981' : '#f59e0b',
                  color: '#0f172a',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: '800'
                }}
              >
                {ticket.status.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: '#e2e8f0' }}>
              {ticket.message}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', alignSelf: 'flex-end' }}>
              {new Date(ticket.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
