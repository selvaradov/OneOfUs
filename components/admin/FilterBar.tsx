'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';
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

  const handleMultiSelectChange = (key: string, selectedOptions: any) => {
    const values = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
    onFilterChange({ ...filters, [key]: values });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Detection Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Detection Status
          </label>
          <Select
            options={[
              { value: 'all', label: 'All' },
              { value: 'true', label: 'Detected' },
              { value: 'false', label: 'Undetected' },
            ]}
            value={{
              value: filters.detected,
              label:
                filters.detected === 'all'
                  ? 'All'
                  : filters.detected === 'true'
                    ? 'Detected'
                    : 'Undetected',
            }}
            onChange={(selected: any) => handleChange('detected', selected?.value || 'all')}
            className="text-sm"
            classNamePrefix="react-select"
          />
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position
          </label>
          <Select
            isMulti
            closeMenuOnSelect={false}
            options={VALID_POSITIONS.map((pos) => ({ value: pos, label: pos }))}
            value={filters.position.map((p) => ({ value: p, label: p }))}
            onChange={(selected) => handleMultiSelectChange('position', selected)}
            placeholder="Select positions..."
            className="text-sm"
            classNamePrefix="react-select"
          />
        </div>

        {/* Question ID Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question ID
          </label>
          <Select
            isMulti
            closeMenuOnSelect={false}
            options={promptIds.map((id) => ({ value: id, label: id }))}
            value={filters.promptId.map((id) => ({ value: id, label: id }))}
            onChange={(selected) => handleMultiSelectChange('promptId', selected)}
            placeholder="Select questions..."
            className="text-sm"
            classNamePrefix="react-select"
          />
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
