'use client';

import { AdminAnalytics } from '@/lib/types';

interface AnalyticsCardsProps {
  analytics: AdminAnalytics;
}

export default function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <div className="space-y-8 mb-8">
      {/* Summary Statistics Section */}
      <section id="summary-stats">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Summary Statistics
        </h2>
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
      </section>

      {/* Performance & Score Analysis Section */}
      <section id="performance-analysis">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Performance & Score Analysis
        </h2>
        <div className="space-y-6">

        {/* Score Distribution */}
        <div id="score-dist" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                  Position
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                  Attempts
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                  Avg Score
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
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
                  <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                    {pos.position}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                    {pos.total}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                    {pos.avgScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                    {pos.detectionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question/Prompt Performance */}
      <div id="question-performance" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Question Performance (Top 20)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Top 20 most-played scenarios with at least 2 attempts, ranked by average score. Higher scores indicate questions where users successfully embodied their assigned political position.
        </p>
        {analytics.promptPerformance.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>No question data available yet.</p>
            <p className="text-sm mt-2">Questions need at least 2 attempts to appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                    Question ID
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                    Scenario
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                    Attempts
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                    Avg Score
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                    Detection %
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.promptPerformance.map((prompt) => (
                <tr
                  key={prompt.promptId}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                    {prompt.promptId}
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white max-w-md truncate">
                    {prompt.promptScenario}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                    {prompt.attempts}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                    {prompt.avgScore.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                    {prompt.detectionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
      </div>
      </section>

      {/* Demographics Section */}
      <section id="demographics">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          User Demographics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Alignment */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Political Alignment
          </h3>
          <div className="space-y-3">
            {analytics.demographicBreakdown.byAlignment.map((item) => {
              const maxCount = Math.max(...analytics.demographicBreakdown.byAlignment.map(a => a.count));
              const percentage = (item.count / maxCount) * 100;
              const alignmentLabel =
                item.alignment === 1 ? 'Far Left' :
                item.alignment === 2 ? 'Left' :
                item.alignment === 3 ? 'Center-Left' :
                item.alignment === 4 ? 'Center' :
                item.alignment === 5 ? 'Center-Right' :
                item.alignment === 6 ? 'Right' :
                item.alignment === 7 ? 'Far Right' : `${item.alignment}`;

              return (
                <div key={item.alignment}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {alignmentLabel}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${percentage}%`,
                        minWidth: item.count > 0 ? '30px' : '0',
                      }}
                    >
                      {item.count > 0 && (
                        <span className="text-xs font-medium text-white">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Country */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Top Countries
          </h3>
          <div className="space-y-3">
            {analytics.demographicBreakdown.byCountry.slice(0, 10).map((item) => {
              const maxCount = Math.max(...analytics.demographicBreakdown.byCountry.map(c => c.count));
              const percentage = (item.count / maxCount) * 100;

              return (
                <div key={item.country}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.country}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                    <div
                      className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${percentage}%`,
                        minWidth: item.count > 0 ? '30px' : '0',
                      }}
                    >
                      {item.count > 0 && (
                        <span className="text-xs font-medium text-white">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Age */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Age Distribution
          </h3>
          <div className="space-y-3">
            {analytics.demographicBreakdown.byAge.map((item) => {
              const maxCount = Math.max(...analytics.demographicBreakdown.byAge.map(a => a.count));
              const percentage = (item.count / maxCount) * 100;

              return (
                <div key={item.ageRange}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.ageRange}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                    <div
                      className="bg-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${percentage}%`,
                        minWidth: item.count > 0 ? '30px' : '0',
                      }}
                    >
                      {item.count > 0 && (
                        <span className="text-xs font-medium text-white">
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </section>
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
