'use client';

import { MatchAnalytics } from '@/lib/types';

interface MatchAnalyticsCardsProps {
  analytics: MatchAnalytics;
}

// Helper component for stat cards
function StatCard({ title, value, icon }: { title: React.ReactNode; value: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

export default function MatchAnalyticsCards({ analytics }: MatchAnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard title="Total Matches" value={analytics.totalMatches.toLocaleString()} icon="⚔️" />
      <StatCard
        title="Completion Rate"
        value={`${analytics.completionRate.toFixed(1)}%`}
        icon="✅"
      />
      <StatCard title="Avg Score Gap" value={analytics.avgScoreGap.toFixed(1)} icon="📊" />
      <StatCard
        title={
          <span
            className="inline-block border-b border-dashed border-gray-400 cursor-help"
            title="% of users who have participated in matches"
          >
            Participation Rate
          </span>
        }
        value={`${analytics.participationRate.toFixed(1)}%`}
        icon="👥"
      />
    </div>
  );
}
