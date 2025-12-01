'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MatchWithParticipants } from '@/lib/types';
import { ShareLinkBox } from '@/components/ui/ShareLinkBox';

interface MatchLobbyPendingProps {
  matchCode: string;
  match: MatchWithParticipants;
  onRefresh: () => void;
}

export default function MatchLobbyPending({ matchCode, match, onRefresh }: MatchLobbyPendingProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/match/${matchCode}`
      : `/match/${matchCode}`;

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
  };

  // Calculate time remaining until expiry
  const expiresAt = new Date(match.expiresAt);
  const now = new Date();
  const hoursRemaining = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Waiting Animation */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <div className="text-4xl animate-pulse">⏳</div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Waiting for Opponent
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Share this link with a friend to challenge them!
        </p>

        {/* Share Link Component */}
        <ShareLinkBox url={shareUrl} />

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Check for Opponent
        </button>

        {/* Expiry Notice */}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
          This challenge expires in {hoursRemaining} hour{hoursRemaining !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
