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
  const currentAqi = selectedNode.aqi || chronologicalHistory[chronologicalHistory.length - 1].aqi || 120.0;

  const labels = [
    ...chronologicalHistory.map(item => {
      const d = new Date(item.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    'Forecast (t+24h)'
  ];

  const observedData = [...chronologicalHistory.map(item => item.aqi), null];
  
  const forecastData = [
    ...Array(chronologicalHistory.length - 1).fill(null),
    chronologicalHistory[chronologicalHistory.length - 1].aqi,
    forecastValue !== null && forecastValue !== undefined ? forecastValue : (chronologicalHistory[chronologicalHistory.length - 1].aqi + 20)
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
        borderWidth: 3,
        pointBackgroundColor: '#00f0ff',
        pointRadius: 5,
        tension: 0.3,
        fill: true
      },
      {
        label: 'AI 24h Forecast',
        data: forecastData,
        borderColor: forecastColor,
        borderDash: [6, 6],
        borderWidth: 3,
        pointBackgroundColor: forecastColor,
        pointRadius: 6,
        pointHoverRadius: 8,
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
        ticks: { color: isLight ? '#475569' : '#64748b', font: { family: 'Plus Jakarta Sans' } }
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
