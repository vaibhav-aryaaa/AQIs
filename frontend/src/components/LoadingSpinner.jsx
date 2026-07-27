import React from 'react';

export default function LoadingSpinner({ message = 'Loading details...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '150px',
      gap: '12px',
      color: 'var(--text-secondary)',
      fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid var(--border-primary)',
        borderTop: '3px solid var(--accent-color)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{message}</span>
    </div>
  );
}
