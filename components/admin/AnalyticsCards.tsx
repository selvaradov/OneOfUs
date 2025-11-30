'use client';

import { AdminAnalytics } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Position Performance
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Detection rate (circle percentage) shows how often users were identified as role-playing. Average score indicates how convincingly they argued their assigned position.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {analytics.positionPerformance.map((pos) => (
            <div
              key={pos.position}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex flex-col items-center"
            >
              <h4 className="text-xs font-medium text-gray-900 dark:text-white text-center mb-2">
                {pos.position}
              </h4>
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="8"
                    strokeDasharray={`${(pos.detectionRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white transform rotate-0">
                    {pos.detectionRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
                <div>{pos.total} attempts</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {pos.avgScore.toFixed(1)} avg
                </div>
              </div>
            </div>
          ))}
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(() => {
                // Database stores: 'left', 'centre-left', 'centre', 'centre-right', 'right'
                // Onboarding has 7 slider positions that map to these 5 values:
                // [0,1]→'left', [2]→'centre-left', [3]→'centre', [4]→'centre-right', [5,6]→'right'

                // Get counts from database (stored as strings)
                const leftCount = analytics.demographicBreakdown.byAlignment.find(
                  (item) => (item.alignment as any) === 'left'
                )?.count || 0;
                const centreLeftCount = analytics.demographicBreakdown.byAlignment.find(
                  (item) => (item.alignment as any) === 'centre-left'
                )?.count || 0;
                const centreCount = analytics.demographicBreakdown.byAlignment.find(
                  (item) => (item.alignment as any) === 'centre'
                )?.count || 0;
                const centreRightCount = analytics.demographicBreakdown.byAlignment.find(
                  (item) => (item.alignment as any) === 'centre-right'
                )?.count || 0;
                const rightCount = analytics.demographicBreakdown.byAlignment.find(
                  (item) => (item.alignment as any) === 'right'
                )?.count || 0;

                // Create 5 bars for the 5 database values
                // Only furthest-left, centre, and furthest-right get x-axis labels
                return [
                  { name: 'Left', tooltipName: 'Left', count: leftCount },
                  { name: '', tooltipName: 'Centre-left', count: centreLeftCount },
                  { name: 'Centre', tooltipName: 'Centre', count: centreCount },
                  { name: '', tooltipName: 'Centre-right', count: centreRightCount },
                  { name: 'Right', tooltipName: 'Right', count: rightCount },
                ];
              })()}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #ccc)',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: 'var(--tooltip-text, #000)' }}
                formatter={(value: any, _name: string, props: any) => {
                  return [value, props.payload.tooltipName];
                }}
              />
              <Bar dataKey="count" fill="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Country */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Country Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.demographicBreakdown.byCountry
                .filter((item) => ['US', 'UK', 'Other'].includes(item.country))
                .map((item) => ({
                  name:
                    item.country === 'US' ? 'United States' :
                    item.country === 'UK' ? 'United Kingdom' :
                    'Other',
                  count: item.count,
                }))}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #ccc)',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: 'var(--tooltip-text, #000)' }}
              />
              <Bar dataKey="count" fill="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Age */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Age Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(() => {
                const allAges = ['18-24', '25-34', '35-44', '45-54', '55+'];
                return allAges.map((ageRange) => {
                  const found = analytics.demographicBreakdown.byAge.find(
                    (item) => item.ageRange === ageRange
                  );
                  return { name: ageRange, count: found?.count || 0 };
                });
              })()}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #ccc)',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: 'var(--tooltip-text, #000)' }}
              />
              <Bar dataKey="count" fill="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
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
