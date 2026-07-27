import React, { useState, useEffect } from 'react';
import { Save, Info, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function SettingsPage() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [threshold, setThreshold] = useState(150);
  
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        const data = await res.json();
        setBotToken(data.telegram_bot_token);
        setChatId(data.telegram_chat_id);
        setThreshold(data.alert_threshold_aqi);
      } catch (err) {
        console.error('Error fetching system settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_bot_token: botToken,
          telegram_chat_id: chatId,
          alert_threshold_aqi: parseFloat(threshold)
        })
      });
      
      if (response.ok) {
        setSaveStatus({ status: 'success', message: 'Settings saved and updated successfully!' });
      } else {
        setSaveStatus({ status: 'error', message: 'Failed to update system settings.' });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus({ status: 'error', message: 'Failed to connect to backend api.' });
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '800px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '30px'
      }}>
        <div style={{
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
          {/* Header */}
          <div>
            <h2 style={{
              fontSize: '1.8rem',
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: '700',
              color: 'var(--text-white)',
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              System Settings & Alerts
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '5px 0 0 0' }}>
              Configure alert limits and setup free Telegram notifications.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Telegram Token */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Telegram Bot Token</label>
              <input 
                type="text"
                placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Telegram Chat ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Telegram Chat ID / Channel ID</label>
              <input 
                type="text"
                placeholder="e.g. -100123456789 or 987654321"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Alert Threshold AQI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Alert Threshold (AQI): <strong style={{ color: 'var(--accent-color)' }}>{threshold}</strong>
              </label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input 
                  type="range" min="50" max="300" step="5" value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Alert tickets and Telegram notifications will only trigger if tomorrow's predicted AQI goes above this level.
              </span>
            </div>

            {/* Save Button */}
            <button 
              type="submit"
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
                marginTop: '10px',
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
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </form>

          {/* Status Message */}
          {saveStatus && (
            <div style={{
              background: saveStatus.status === 'success' ? 'rgba(var(--accent-color-rgb), 0.04)' : 'rgba(239, 68, 68, 0.04)',
              border: `1px solid ${saveStatus.status === 'success' ? 'var(--border-glow)' : 'rgba(239, 68, 68, 0.2)'}`,
              color: saveStatus.status === 'success' ? 'var(--accent-color)' : '#ef4444',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              {saveStatus.status === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{saveStatus.message}</span>
            </div>
          )}
        </div>

        {/* Informative Guide Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          padding: '24px',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          boxShadow: 'var(--card-shadow)'
        }}>
          <h3 style={{ 
            fontSize: '1.05rem', 
            color: 'var(--text-white)', 
            marginTop: 0, 
            marginBottom: '12px',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Info size={16} color="var(--accent-color)" />
            <span>Guide: How to set up a Free Telegram Bot</span>
          </h3>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
            <li>
              Open Telegram and search for <strong>@BotFather</strong>.
            </li>
            <li>
              Send the command <code>/newbot</code>. Follow the prompts to name your bot and choose a username.
            </li>
            <li>
              BotFather will message you a <strong>HTTP API Token</strong>. Copy and paste it in the <strong>Telegram Bot Token</strong> input above.
            </li>
            <li>
              Search Telegram for <strong>@chatid_echo_bot</strong>, press start, and copy the numerical chat ID it returns (e.g. <code>987654321</code>). Paste it in the <strong>Telegram Chat ID</strong> input.
            </li>
            <li>
              Now search for your bot username on Telegram, press <strong>Start</strong> to activate your chat window, and test by generating a predicted AQI above your threshold!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
