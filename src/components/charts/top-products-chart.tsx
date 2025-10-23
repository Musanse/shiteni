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

interface TopProductsChartProps {
  data: Array<{
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
}

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = {
    labels: data.map(item => 
      item.productName.length > 15 
        ? item.productName.substring(0, 15) + '...' 
        : item.productName
    ),
    datasets: [
      {
        label: 'Units Sold',
        data: data.map(item => item.totalSold),
        backgroundColor: 'rgba(45, 95, 63, 0.8)',
        borderColor: '#2d5f3f',
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
        display: false,
      },
      title: {
        display: true,
        text: 'Top Selling Products (Last 30 Days)',
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
            const product = data[context.dataIndex];
            return `Revenue: K ${product.revenue.toFixed(2)}`;
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
          maxRotation: 45,
          minRotation: 0,
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
