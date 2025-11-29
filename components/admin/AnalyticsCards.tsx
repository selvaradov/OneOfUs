'use client';

import { AdminAnalytics } from '@/lib/types';

interface AnalyticsCardsProps {
  analytics: AdminAnalytics;
}

export default function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          icon="👥"
        />
        <StatCard
          title="Total Games"
          value={analytics.totalGames.toLocaleString()}
          icon="🎮"
        />
        <StatCard
          title="Avg Score"
          value={`${analytics.avgScore.toFixed(1)}/100`}
          icon="🏆"
        />
        <StatCard
          title="Detection Rate"
          value={`${analytics.detectionRate.toFixed(1)}%`}
          icon="👁️"
        />
      </div>

      {/* Score Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Score Distribution
        </h3>
        <div className="space-y-2">
          {analytics.scoreDistribution.map((bucket) => (
            <div key={bucket.range} className="flex items-center gap-3">
              <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                {bucket.range}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                <div
                  className="bg-orange-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${(bucket.count / Math.max(...analytics.scoreDistribution.map((b) => b.count))) * 100}%`,
                    minWidth: bucket.count > 0 ? '40px' : '0',
                  }}
                >
                  <span className="text-xs font-medium text-white">
                    {bucket.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Position Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  Position
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Attempts
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Score
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  Detection Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.positionPerformance.map((pos) => (
                <tr
                  key={pos.position}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {pos.position}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {pos.total}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                    {pos.avgScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {pos.detectionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Alignment */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            By Political Alignment
          </h3>
          <div className="space-y-2 text-sm">
            {analytics.demographicBreakdown.byAlignment.map((item) => (
              <div
                key={item.alignment}
                className="flex justify-between items-center"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  Alignment {item.alignment}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.count} users
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By Country */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            By Country
          </h3>
          <div className="space-y-2 text-sm">
            {analytics.demographicBreakdown.byCountry.map((item) => (
              <div
                key={item.country}
                className="flex justify-between items-center"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {item.country}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By Age */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            By Age Range
          </h3>
          <div className="space-y-2 text-sm">
            {analytics.demographicBreakdown.byAge.map((item) => (
              <div
                key={item.ageRange}
                className="flex justify-between items-center"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {item.ageRange}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
