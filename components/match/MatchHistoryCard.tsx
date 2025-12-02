'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MatchHistoryItem } from '@/lib/types';
import { Clock, Trophy, Users, Hourglass, Share2 } from 'lucide-react';
import ShareMatchModal from './ShareMatchModal';

interface MatchHistoryCardProps {
  match: MatchHistoryItem;
}

export default function MatchHistoryCard({ match }: MatchHistoryCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine winner/result
  const getMatchResult = () => {
    if (match.status !== 'completed') return null;

    const creatorScore = match.creatorScore ?? 0;
    const opponentScore = match.opponentScore ?? 0;

    if (creatorScore === opponentScore) {
      return { result: 'draw', text: 'Draw', color: 'text-gray-600 dark:text-gray-400' };
    }

    const userWon =
      (match.role === 'creator' && creatorScore > opponentScore) ||
      (match.role === 'opponent' && opponentScore > creatorScore);

    return userWon
      ? { result: 'win', text: 'Won', color: 'text-green-600 dark:text-green-400' }
      : { result: 'loss', text: 'Lost', color: 'text-red-600 dark:text-red-400' };
  };

  const matchResult = getMatchResult();

  // Get your score
  const yourScore = match.role === 'creator' ? match.creatorScore : match.opponentScore;
  const theirScore = match.role === 'creator' ? match.opponentScore : match.creatorScore;

  // Status badge
  const getStatusBadge = () => {
    switch (match.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Hourglass className="w-3 h-3" />
            Waiting
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Trophy className="w-3 h-3" />
            Completed
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
    }
  };

  // Role badge
  const getRoleBadge = () => {
    return match.role === 'creator' ? (
      <span className="text-xs text-gray-500 dark:text-gray-500">Created by you</span>
    ) : (
      <span className="text-xs text-gray-500 dark:text-gray-500">Challenged you</span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Match info - this part links to the match */}
        <Link href={`/match/${match.matchCode}`} className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {getStatusBadge()}
            {getRoleBadge()}
          </div>

          {/* Scenario preview */}
          <p className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {match.promptScenario || 'Match challenge'}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(match.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {match.participantCount}/2 joined
            </span>
          </div>
        </Link>

        {/* Right side - scores and share button (not inside the Link) */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Completed: show scores */}
          {match.status === 'completed' && (
            <Link href={`/match/${match.matchCode}`} className="flex flex-col items-end gap-1">
              {matchResult && (
                <div className={`text-lg font-bold ${matchResult.color}`}>{matchResult.text}</div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {yourScore ?? '-'}
                </span>
                <span className="text-gray-400">vs</span>
                <span className="text-gray-600 dark:text-gray-400">{theirScore ?? '-'}</span>
              </div>
            </Link>
          )}

          {/* Pending state */}
          {match.status === 'pending' && (
            <Link href={`/match/${match.matchCode}`} className="flex flex-col items-end">
              <div className="text-2xl">⏳</div>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {match.participantCount === 1 ? 'Awaiting opponent' : 'In progress'}
              </span>
            </Link>
          )}

          {/* Expired state */}
          {match.status === 'expired' && (
            <Link href={`/match/${match.matchCode}`} className="flex flex-col items-end">
              <div className="text-2xl">⌛</div>
              <span className="text-xs text-gray-500 dark:text-gray-500">Expired</span>
            </Link>
          )}

          {/* Share button - outside the Link */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-1"
          >
            <Share2 className="w-3 h-3" />
            <span className="text-xs">Share</span>
          </button>
        </div>
      </div>

      {/* Share Modal - rendered via portal to avoid Link issues */}
      {showShareModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <ShareMatchModal
            matchCode={match.matchCode}
            isShareOnly={true}
            onClose={() => setShowShareModal(false)}
          />,
          document.body
        )}
    </div>
  );
}
