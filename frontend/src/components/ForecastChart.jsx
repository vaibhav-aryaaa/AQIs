import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ForecastChart({ selectedNode, forecastValue, history }) {
  if (!selectedNode) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
        Select a station on the map to view the air quality forecast.
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '20px', boxSizing: 'border-box' }}>
        No historical data yet — waiting for first readings
      </div>
    );
  }

  const chronologicalHistory = [...history].reverse();
  
  // Downsample history to a maximum of 12 points to prevent dot clutter
  const maxPoints = 12;
  let sampledHistory = chronologicalHistory;
  if (chronologicalHistory.length > maxPoints) {
    const step = (chronologicalHistory.length - 1) / (maxPoints - 1);
    sampledHistory = [];
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.min(Math.round(i * step), chronologicalHistory.length - 1);
      sampledHistory.push(chronologicalHistory[idx]);
    }
  }

  const rawLabels = [
    ...sampledHistory.map(item => {
      const d = new Date(item.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    'Forecast (t+24h)'
  ];

  const totalLabels = rawLabels.length;
  const labels = rawLabels.map((label, idx) => {
    // Keep first, last observed, mid observed, and forecast
    if (idx === 0 || idx === totalLabels - 1 || idx === totalLabels - 2) return label;
    if (idx === Math.floor((totalLabels - 2) / 2)) return label;
    return '';
  });

  const observedData = [...sampledHistory.map(item => item.aqi), null];
  
  const forecastData = [
    ...Array(sampledHistory.length - 1).fill(null),
    sampledHistory[sampledHistory.length - 1].aqi,
    forecastValue !== null && forecastValue !== undefined ? forecastValue : (sampledHistory[sampledHistory.length - 1].aqi + 20)
  ];

  const isLight = document.documentElement.classList.contains('light-theme');
  const forecastColor = isLight ? '#0ea5e9' : '#00ff88';

  const data = {
    labels,
    datasets: [
      {
        label: 'Observed Air Quality',
        data: observedData,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
        borderWidth: 2,
        pointBackgroundColor: '#00f0ff',
        pointRadius: 0, // Remove dot clutter - clean line only
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true
      },
      {
        label: 'AI 24h Forecast',
        data: forecastData,
        borderColor: forecastColor,
        borderDash: [6, 6],
        borderWidth: 2,
        pointBackgroundColor: forecastColor,
        pointRadius: 4, // Keep dot on forecast point to highlight prediction
        pointHoverRadius: 6,
        tension: 0.1
      }
    ]
  };


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isLight ? '#475569' : '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: isLight ? '#ffffff' : '#0a0a0a',
        titleColor: forecastColor,
        bodyColor: isLight ? '#0f172a' : '#e2e8f0',
        borderColor: isLight ? 'rgba(14, 165, 233, 0.2)' : 'rgba(0, 255, 136, 0.25)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.02)' },
        ticks: { 
          color: isLight ? '#475569' : '#64748b', 
          font: { family: 'Plus Jakarta Sans', size: 9 },
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        grid: { color: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: isLight ? '#475569' : '#64748b', font: { family: 'Plus Jakarta Sans' } },
        suggestedMin: 30,
        suggestedMax: 300
      }
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
}
