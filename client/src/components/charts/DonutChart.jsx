import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data }) {
  const chartData = {
    labels: ['GWS', 'GCP'],
    datasets: [
      {
        data: data || [65, 35],
        backgroundColor: ['#0284c7', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
