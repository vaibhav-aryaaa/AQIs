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
        Select a monitoring node on the map to inspect telemetry & AI forecasts.
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

  const data = {
    labels,
    datasets: [
      {
        label: 'Observed Telemetry',
        data: [...history, null], // Ends at current
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#0284c7',
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
        ], // Starts at current, connects to forecast
        borderColor: '#a855f7',
        borderDash: [6, 6],
        borderWidth: 3,
        pointBackgroundColor: '#a855f7',
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
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#38bdf8',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b' },
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
