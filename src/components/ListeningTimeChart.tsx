'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ListeningTimeData } from '@/types/spotify';
import { spotifyApi } from '@/lib/apiClient';

interface ListeningTimeChartProps {
  initialData?: ListeningTimeData[];
  days?: number;
  key?: string;
}

export default function ListeningTimeChart({ 
  initialData = [], 
  days = 30,
  key
}: ListeningTimeChartProps) {
  const [listeningData, setListeningData] = useState<ListeningTimeData[]>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData.length);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(days);
  
  useEffect(() => {
    if (key) {
      fetchListeningTimeData();
    }
  }, [key]);
  
  useEffect(() => {
    if (!initialData.length) {
      fetchListeningTimeData();
    }
  }, [initialData.length, timeRange]);
  
  const fetchListeningTimeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await spotifyApi.getListeningTime(timeRange);
      
      // Make sure we have data for all days
      const filledData = fillMissingDates(data, timeRange);
      setListeningData(filledData);
    } catch (err: any) {
      console.error('Failed to fetch listening time data:', err);
      setError(err.message || 'Failed to load listening time data');
    } finally {
      setLoading(false);
    }
  };
  
  const fillMissingDates = (data: ListeningTimeData[], daysCount: number): ListeningTimeData[] => {
    const filledData: Record<string, ListeningTimeData> = {};
    
    // Create a map of existing data
    data.forEach(item => {
      filledData[item.date] = item;
    });
    
    // Fill missing dates with zero values
    const today = new Date();
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      if (!filledData[dateString]) {
        filledData[dateString] = {
          date: dateString,
          minutes: 0
        };
      }
    }
    
    // Convert back to array and sort by date
    return Object.values(filledData)
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  const handleTimeRangeChange = (newDays: number) => {
    setTimeRange(newDays);
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Listening Time
        </h2>
        
        <div className="flex space-x-2">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => handleTimeRangeChange(days)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                timeRange === days
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {days === 7 ? 'Week' : days === 14 ? '2 Weeks' : days === 30 ? 'Month' : '3 Months'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={listeningData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 25,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date"
              tickFormatter={formatDate}
              interval="preserveEnd"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
            />
            <YAxis 
              label={{ 
                value: 'Minutes', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' } 
              }}
            />
            <Tooltip 
              formatter={(value) => [`${value} minutes`, 'Listening Time']}
              labelFormatter={formatDate}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="minutes" 
              name="Listening Time (minutes)"
              fill="#1DB954" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 text-center">
          Esta grafica se va enriqueciendo cada vez que visitas la página.
        </p>
      </div>
    </div>
  );
} 