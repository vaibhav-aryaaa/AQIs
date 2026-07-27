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

export default function ForecastChart({ selectedNode, forecastValue }) {
  if (!selectedNode) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
        Select a station on the map to view the air quality forecast.
      </div>
    );
  }

  // Generate mock past 6 hours from current node value for the graph visual
  const currentAqi = selectedNode.aqi || 120.0;
  const history = [
    currentAqi - 15 + Math.random() * 10,
    currentAqi - 8 + Math.random() * 8,
    currentAqi - 12 + Math.random() * 10,
    currentAqi - 2 + Math.random() * 5,
    currentAqi - 5 + Math.random() * 5,
    currentAqi
  ];

  const labels = ['t-5h', 't-4h', 't-3h', 't-2h', 't-1h', 'Current (t)', 'Forecast (t+24h)'];
  
  // Combine history with forecasted t+24 value
  const dataValues = [...history, forecastValue || currentAqi + 20];

  const isLight = document.documentElement.classList.contains('light-theme');
  const forecastColor = isLight ? '#0ea5e9' : '#00ff88';

  const data = {
    labels,
    datasets: [
      {
        label: 'Observed Air Quality',
        data: [...history, null],
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
        data: [
          ...Array(5).fill(null),
          currentAqi,
          forecastValue || currentAqi + 20
        ],
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
