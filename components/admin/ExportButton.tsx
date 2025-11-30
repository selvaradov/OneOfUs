'use client';

import { useState } from 'react';

interface ExportButtonProps {
  token: string;
}

type ExportType = 'sessions' | 'users' | 'analytics' | 'full';

export default function ExportButton({ token }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (type: ExportType) => {
    setExporting(true);
    setShowMenu(false);

    try {
      const params = new URLSearchParams({ type });

      const response = await fetch(`/api/admin/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oneofus-export-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {exporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export JSON
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              <button
                onClick={() => handleExport('full')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export All Data
              </button>
              <button
                onClick={() => handleExport('sessions')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export Sessions Only
              </button>
              <button
                onClick={() => handleExport('users')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export Users Only
              </button>
              <button
                onClick={() => handleExport('analytics')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export Analytics Only
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
