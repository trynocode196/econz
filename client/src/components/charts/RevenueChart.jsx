import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function RevenueChart({ labels, data }) {
  const chartLabels = labels && labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const chartValues = data && data.length > 0 ? data : [180, 210, 240, 235, 260, 280];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: '#0284c7',
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const raw = context.raw || 0;
            return ` ₹${raw.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--slate-400)',
          font: {
            family: 'Plus Jakarta Sans',
            weight: '600',
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
