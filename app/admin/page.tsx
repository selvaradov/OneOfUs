'use client';

import { useState, useEffect } from 'react';
import { AdminGameSession, AdminAnalytics } from '@/lib/types';
import SessionsTable from '@/components/admin/SessionsTable';
import AnalyticsCards from '@/components/admin/AnalyticsCards';
import FilterBar from '@/components/admin/FilterBar';
import ExportButton from '@/components/admin/ExportButton';

// Login component
function AdminLogin({ onAuth }: { onAuth: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting admin login...');
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', { success: data.success, hasToken: !!data.token });

      if (data.success && data.token) {
        console.log('Login successful, storing token');
        sessionStorage.setItem('admin_token', data.token);
        onAuth(data.token);
      } else {
        console.error('Login failed:', data.error);
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Login network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                {error}
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main dashboard
export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AdminGameSession[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  // Filter state
  const [filters, setFilters] = useState({
    sortBy: 'created_at' as 'created_at' | 'score' | 'detected',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
    detected: 'all' as 'all' | 'true' | 'false',
    position: [] as string[],
    promptId: [] as string[],
    dateFrom: '',
    dateTo: '',
  });

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      setAuthenticated(true);
    }
  }, []);

  // Fetch analytics on auth
  useEffect(() => {
    if (authenticated && token) {
      fetchAnalytics();
    }
  }, [authenticated, token]);

  // Fetch sessions when filters or page change
  useEffect(() => {
    if (authenticated && token) {
      fetchSessions();
    }
  }, [authenticated, token, filters, page]);

  const fetchAnalytics = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchSessions = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.detected !== 'all') {
        params.append('detected', filters.detected);
      }
      if (filters.position.length > 0) {
        params.append('position', filters.position.join(','));
      }
      if (filters.promptId.length > 0) {
        params.append('promptId', filters.promptId.join(','));
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/admin/sessions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
        setTotalCount(data.pagination.total);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (newToken: string) => {
    setToken(newToken);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setAuthenticated(false);
    setToken(null);
  };

  if (!authenticated) {
    return <AdminLogin onAuth={handleAuth} />;
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Table of Contents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard Sections
          </h2>
          <div className="flex flex-col gap-2 text-sm">
            <a href="#summary-stats" className="text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
              📊 Summary Statistics
            </a>
            <a href="#performance-analysis" className="text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
              📈 Performance & Score Analysis
            </a>
            <a href="#demographics" className="text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
              👥 User Demographics
            </a>
            <a href="#sessions" className="text-orange-600 dark:text-orange-400 hover:underline hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
              💬 All Game Sessions
            </a>
          </div>
        </div>

        {/* Analytics Section */}
        <div id="analytics">
          {analytics && <AnalyticsCards analytics={analytics} />}
        </div>

        {/* All Sessions Section */}
        <div id="sessions" className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            All Game Sessions
          </h2>

          {/* Controls */}
          <div className="space-y-4 my-6">
            <FilterBar filters={filters} onFilterChange={setFilters} token={token || undefined} />
            {token && (
              <div className="flex justify-start">
                <ExportButton token={token} filters={filters} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Sessions Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading sessions...
            </p>
          </div>
        ) : token ? (
          <>
            <SessionsTable sessions={sessions} token={token} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {page * limit + 1} to{' '}
                  {Math.min((page + 1) * limit, totalCount)} of {totalCount}{' '}
                  sessions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            Please log in to view sessions.
          </div>
        )}
      </div>
    </div>
  );
}
