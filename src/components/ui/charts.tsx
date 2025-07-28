"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
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

interface RecommendationData {
  suggestion: string;
  type: string;
  count: number;
  organizationCount: number;
  averagePriority: number;
  prevalence: number;
}

interface ChartProps {
  data: RecommendationData[];
  title: string;
  height?: number;
}

export function RecommendationsBarChart({ data, title, height = 400 }: ChartProps) {
  const chartData = {
    labels: data.map(item => item.suggestion.length > 30 ? item.suggestion.substring(0, 30) + '...' : item.suggestion),
    datasets: [
      {
        label: 'Number of Organizations',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const item = data[dataIndex];
            return [
              `Type: ${item.type}`,
              `Prevalence: ${item.prevalence}%`,
              `Avg Priority: ${item.averagePriority}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Organizations',
          font: {
            weight: 'bold',
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export function RecommendationsByCategoryChart({ data, title, height = 400 }: ChartProps) {
  // Group data by category/type
  const categoryData = data.reduce((acc, item) => {
    const category = item.type === 'QUESTION' ? 'Question-Based' :
                    item.type === 'SECTION' ? 'Section-Based' :
                    item.type === 'ASSESSMENT' ? 'Overall Assessment' : item.type;
    
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        totalPriority: 0,
        suggestions: [],
      };
    }
    
    acc[category].count += item.count;
    acc[category].totalPriority += item.averagePriority * item.count;
    acc[category].suggestions.push(item);
    
    return acc;
  }, {} as Record<string, { count: number; totalPriority: number; suggestions: RecommendationData[] }>);

  const chartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: 'Number of Organizations',
        data: Object.values(categoryData).map(cat => cat.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',   // Yellow
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(139, 92, 246, 0.8)',   // Purple
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const category = Object.keys(categoryData)[dataIndex];
            const catData = Object.values(categoryData)[dataIndex];
            const avgPriority = catData.totalPriority / catData.count;
            
            return [
              `Total Suggestions: ${catData.count}`,
              `Average Priority: ${avgPriority.toFixed(1)}`,
              `Unique Suggestions: ${catData.suggestions.length}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Organizations',
          font: {
            weight: 'bold',
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 0,
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
} 

interface SimpleBarChartProps {
  data: Record<string, number>;
  title: string;
  height?: number;
}

export function SimpleBarChart({ data, title, height = 350 }: SimpleBarChartProps) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: 'bold' },
        color: '#1f2937',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
          font: { weight: 'bold' },
        },
      },
      x: {
        ticks: { font: { size: 10 } },
      },
    },
  };
  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
} 