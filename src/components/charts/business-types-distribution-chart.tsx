'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BusinessTypesDistributionChartProps {
  data: Array<{
    _id: string;
    count: number;
  }>;
}

export default function BusinessTypesDistributionChart({ data }: BusinessTypesDistributionChartProps) {
  const serviceTypeColors = {
    store: '#3b82f6',
    pharmacy: '#10b981',
    hotel: '#f59e0b',
    bus: '#8b5cf6',
    general: '#6b7280',
  };

  const chartData = {
    labels: data.map(item => {
      const serviceType = item._id || 'general';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
    }),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => 
          serviceTypeColors[item._id as keyof typeof serviceTypeColors] || '#6b7280'
        ),
        borderColor: data.map(item => 
          serviceTypeColors[item._id as keyof typeof serviceTypeColors] || '#6b7280'
        ),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Business Types Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#2d5f3f',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Pie data={chartData} options={options} />
    </div>
  );
}
