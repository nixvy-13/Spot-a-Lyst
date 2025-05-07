'use client';

import React, { useState } from 'react';
import { TimeRange } from '@/types/spotify';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

interface StatsGridProps {
  title: string;
  children: React.ReactNode;
  timeRangeOptions?: TimeRangeOption[];
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  isLoading?: boolean;
}

export default function StatsGrid({
  title,
  children,
  timeRangeOptions,
  onTimeRangeChange,
  isLoading = false,
}: StatsGridProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(
    timeRangeOptions?.[0]?.value || 'medium_term'
  );

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
    onTimeRangeChange?.(timeRange);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">{title}</h2>
        
        {timeRangeOptions && (
          <div className="flex space-x-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeRangeChange(option.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  selectedTimeRange === option.value
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {children}
        </div>
      )}
    </div>
  );
} 