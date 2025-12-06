'use client';

import { MatchAnalytics } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MatchStatsTableProps {
  analytics: MatchAnalytics;
}

// Custom tooltip component for charts
interface TooltipPayload {
  payload: { tooltipName: string };
  value: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--tooltip-bg, #fff)',
          border: '1px solid var(--tooltip-border, #ccc)',
          borderRadius: '4px',
          padding: '8px 12px',
        }}
      >
        <p style={{ color: 'var(--tooltip-text, #000)', margin: 0 }}>
          <span style={{ fontWeight: 600 }}>{payload[0].payload.tooltipName}:</span>{' '}
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

// Compute nice Y-axis ticks
function getNiceTicks(maxValue: number, intOnly: boolean = false): number[] {
  if (maxValue <= 0) return [0];
  const roughStep = maxValue / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  let niceStep: number;
  if (residual <= 1) niceStep = magnitude;
  else if (residual <= 2) niceStep = 2 * magnitude;
  else if (residual <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  const ticks: number[] = [];
  for (let t = 0; t <= maxValue; t += niceStep) {
    if (!intOnly || Number.isInteger(t)) {
      ticks.push(t);
    }
  }
  return ticks;
}

export default function MatchStatsTable({ analytics }: MatchStatsTableProps) {
  return (
    <div className="space-y-6">
      {/* Status Distribution and Top Creators - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Match Status Distribution
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                    Count
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.statusDistribution.map((item) => (
                  <tr key={item.status} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-900 dark:text-white capitalize">
                      {item.status}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Match Creators */}
        {analytics.topCreators.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Top Match Creators
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                      Rank
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                      User ID
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                      Created
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                      Completed
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                      Wins
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topCreators.map((creator, index) => (
                    <tr
                      key={creator.userId}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{index + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {creator.userId.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                        {creator.matchesCreated}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                        {creator.completedMatches}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                        {creator.wins}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-orange-600 dark:text-orange-400">
                        {creator.winRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Score Distribution by Role */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Score Distribution by Role
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creators */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Creators
            </h4>
            {(() => {
              const creatorData = analytics.scoreDistributionByRole.creators.map((item) => ({
                name: item.range,
                tooltipName: item.range,
                count: item.count,
              }));
              const creatorMax = Math.max(...creatorData.map((d) => d.count), 0);

              return (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={creatorData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      className="text-gray-600 dark:text-gray-400"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor' }}
                      className="text-gray-600 dark:text-gray-400"
                      allowDecimals={false}
                      domain={[0, creatorMax]}
                      ticks={getNiceTicks(creatorMax, true)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>

          {/* Opponents */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Challengers
            </h4>
            {(() => {
              const opponentData = analytics.scoreDistributionByRole.opponents.map((item) => ({
                name: item.range,
                tooltipName: item.range,
                count: item.count,
              }));
              const opponentMax = Math.max(...opponentData.map((d) => d.count), 0);

              return (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={opponentData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'currentColor', fontSize: 11 }}
                      className="text-gray-600 dark:text-gray-400"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: 'currentColor' }}
                      className="text-gray-600 dark:text-gray-400"
                      allowDecimals={false}
                      domain={[0, opponentMax]}
                      ticks={getNiceTicks(opponentMax, true)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
