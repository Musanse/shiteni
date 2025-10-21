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

interface OrdersByStatusChartProps {
  data: Array<{
    _id: string;
    count: number;
  }>;
}

export default function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const statusColors = {
    pending: '#f59e0b',
    confirmed: '#10b981',
    shipped: '#3b82f6',
    delivered: '#059669',
    cancelled: '#ef4444',
  };

  const chartData = {
    labels: data.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => statusColors[item._id as keyof typeof statusColors] || '#6b7280'),
        borderColor: data.map(item => statusColors[item._id as keyof typeof statusColors] || '#6b7280'),
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
        text: 'Orders by Status',
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
