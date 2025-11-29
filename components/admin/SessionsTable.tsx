'use client';

import { useState, useEffect } from 'react';
import { AdminGameSession, GeolocationData } from '@/lib/types';

interface SessionsTableProps {
  sessions: AdminGameSession[];
  token: string;
}

export default function SessionsTable({ sessions, token }: SessionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [geolocations, setGeolocations] = useState<Map<string, GeolocationData>>(
    new Map()
  );
  const [loadingGeo, setLoadingGeo] = useState(false);

  // Fetch geolocation data for visible sessions
  useEffect(() => {
    fetchGeolocations();
  }, [sessions]);

  const fetchGeolocations = async () => {
    if (loadingGeo) return;

    const ipsToFetch = sessions
      .filter((s) => s.ip_address && s.ip_address !== 'unknown')
      .map((s) => s.ip_address)
      .filter((ip) => !geolocations.has(ip));

    if (ipsToFetch.length === 0) return;

    setLoadingGeo(true);

    try {
      // Fetch geolocation for each unique IP
      const uniqueIps = [...new Set(ipsToFetch)];
      const geoPromises = uniqueIps.map(async (ip) => {
        try {
          const response = await fetch(`http://ip-api.com/json/${ip}`);
          const data = await response.json();
          if (data.status === 'success') {
            return {
              ip,
              geo: {
                city: data.city || 'Unknown',
                country: data.country || 'Unknown',
                countryCode: data.countryCode || 'XX',
                region: data.regionName || 'Unknown',
                lat: data.lat || 0,
                lon: data.lon || 0,
              },
            };
          }
        } catch (err) {
          console.error(`Geolocation error for ${ip}:`, err);
        }
        return null;
      });

      const results = await Promise.all(geoPromises);
      const newGeolocations = new Map(geolocations);

      results.forEach((result) => {
        if (result) {
          newGeolocations.set(result.ip, result.geo);
        }
      });

      setGeolocations(newGeolocations);
    } catch (err) {
      console.error('Geolocation batch error:', err);
    } finally {
      setLoadingGeo(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const truncateUUID = (uuid: string) => {
    return uuid.slice(0, 8) + '...';
  };

  const getLocation = (ip: string): string => {
    const geo = geolocations.get(ip);
    if (geo) {
      return `${geo.city}, ${geo.country}`;
    }
    return ip || 'Unknown';
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400">
          No sessions found matching the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Detected
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Expand
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <>
                {/* Collapsed Row */}
                <tr
                  key={session.id}
                  onClick={() => toggleExpand(session.id)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(session.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                    {truncateUUID(session.user_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {session.position_assigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                    {session.score}/100
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        session.detected
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}
                    >
                      {session.detected ? 'Detected' : 'Undetected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {getLocation(session.ip_address)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        expandedId === session.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedId === session.id && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-6 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Q&A */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              Scenario
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded">
                              {session.prompt_scenario}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              User Response
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded">
                              {session.user_response}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {session.char_count} characters
                            </p>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              AI Feedback
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded">
                              {session.feedback}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              AI Comparison Response
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded">
                              {session.ai_comparison_response}
                            </p>
                          </div>
                        </div>

                        {/* Right Column - Details */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              Rubric Breakdown
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Understanding
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {session.rubric_understanding}/65
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{
                                      width: `${(session.rubric_understanding / 65) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Authenticity
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {session.rubric_authenticity}/20
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{
                                      width: `${(session.rubric_authenticity / 20) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700 dark:text-gray-300">
                                    Execution
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {session.rubric_execution}/15
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{
                                      width: `${(session.rubric_execution / 15) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              User Demographics
                            </h4>
                            <dl className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">
                                  Political Alignment:
                                </dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                  {session.political_alignment || 'N/A'}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Age Range:</dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                  {session.age_range || 'N/A'}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Country:</dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                  {session.country || 'N/A'}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">
                                  User Total Games:
                                </dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                  {session.user_total_games || 0}
                                </dd>
                              </div>
                            </dl>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                              Technical Details
                            </h4>
                            <dl className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">IP Address:</dt>
                                <dd className="text-gray-900 dark:text-white font-mono text-xs">
                                  {session.ip_address || 'unknown'}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Duration:</dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                  {session.duration_seconds || 0}s
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gray-600 dark:text-gray-400 mb-1">
                                  User Agent:
                                </dt>
                                <dd className="text-gray-900 dark:text-white text-xs break-all">
                                  {session.user_agent || 'N/A'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
