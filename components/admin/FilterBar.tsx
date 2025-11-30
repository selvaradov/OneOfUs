'use client';

import { useState, useEffect } from 'react';
import { VALID_POSITIONS } from '@/lib/types';

interface FilterBarProps {
  filters: {
    sortBy: 'created_at' | 'score' | 'detected';
    sortOrder: 'ASC' | 'DESC';
    detected: 'all' | 'true' | 'false';
    position: string[];
    promptId: string[];
    dateFrom: string;
    dateTo: string;
  };
  onFilterChange: (filters: any) => void;
  token?: string;
}

export default function FilterBar({ filters, onFilterChange, token }: FilterBarProps) {
  const [promptIds, setPromptIds] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      fetchPromptIds();
    }
  }, [token]);

  const fetchPromptIds = async () => {
    try {
      const response = await fetch('/api/admin/prompt-ids', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPromptIds(data.promptIds);
      }
    } catch (error) {
      console.error('Error fetching prompt IDs:', error);
    }
  };

  const handleChange = (key: string, value: string | string[]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleMultiSelectChange = (key: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    onFilterChange({ ...filters, [key]: selectedOptions });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="created_at">Date</option>
            <option value="score">Score</option>
            <option value="detected">Detected</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
        </div>

        {/* Detection Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Detection Status
          </label>
          <select
            value={filters.detected}
            onChange={(e) => handleChange('detected', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All</option>
            <option value="true">Detected</option>
            <option value="false">Undetected</option>
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position <span className="text-gray-500">(Ctrl+Click for multiple)</span>
          </label>
          <select
            multiple
            value={filters.position}
            onChange={(e) => handleMultiSelectChange('position', e)}
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            size={5}
          >
            {VALID_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Question ID Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question ID <span className="text-gray-500">(Ctrl+Click for multiple)</span>
          </label>
          <select
            multiple
            value={filters.promptId}
            onChange={(e) => handleMultiSelectChange('promptId', e)}
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
            size={5}
          >
            {promptIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.detected !== 'all' ||
        filters.position.length > 0 ||
        filters.promptId.length > 0 ||
        filters.dateFrom ||
        filters.dateTo) && (
        <button
          onClick={() =>
            onFilterChange({
              ...filters,
              detected: 'all',
              position: [],
              promptId: [],
              dateFrom: '',
              dateTo: '',
            })
          }
          className="mt-3 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
