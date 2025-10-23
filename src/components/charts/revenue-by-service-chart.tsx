'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueByServiceChartProps {
  data: Array<{
    _id: string;
    revenue: number;
    orders: number;
  }>;
}

export default function RevenueByServiceChart({ data }: RevenueByServiceChartProps) {
  const serviceColors = {
    store: '#3b82f6',
    pharmacy: '#10b981',
    hotel: '#f59e0b',
    bus: '#8b5cf6',
  };

  const chartData = {
    labels: data.map(item => {
      const serviceType = item._id || 'general';
      return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
    }),
    datasets: [
      {
        label: 'Revenue (ZMW)',
        data: data.map(item => item.revenue),
        backgroundColor: data.map(item => 
          serviceColors[item._id as keyof typeof serviceColors] || '#6b7280'
        ),
        borderColor: data.map(item => 
          serviceColors[item._id as keyof typeof serviceColors] || '#6b7280'
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Revenue by Service Type (Last 30 Days)',
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
          afterLabel: function(context: any) {
            const service = data[context.dataIndex];
            return `Orders: ${service.orders}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          beginAtZero: true,
          callback: function(value: any) {
            return 'ZMW ' + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
