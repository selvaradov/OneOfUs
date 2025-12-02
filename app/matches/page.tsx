'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MatchHistoryItem } from '@/lib/types';
import { getUserAlignment } from '@/lib/storage';
import MatchHistoryCard from '@/components/match/MatchHistoryCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadMatches() {
      const userAlignment = getUserAlignment();
      const userId = userAlignment?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/match/history?userId=${userId}&limit=50&offset=0`);
        const data = await response.json();

        if (data.success) {
          setMatches(data.matches || []);
          setTotal(data.total || 0);
          setHasMore(data.hasMore || false);
          setError(null);
        } else {
          throw new Error(data.error || 'Failed to load matches');
        }
      } catch (err) {
        console.error('Failed to fetch matches:', err);
        setError("Couldn't load your matches—try refreshing");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  // Calculate stats
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const pendingMatches = matches.filter((m) => m.status === 'pending');
  const wins = completedMatches.filter((m) => {
    if (m.role === 'creator') {
      return (m.creatorScore ?? 0) > (m.opponentScore ?? 0);
    } else {
      return (m.opponentScore ?? 0) > (m.creatorScore ?? 0);
    }
  }).length;
  const losses = completedMatches.filter((m) => {
    if (m.role === 'creator') {
      return (m.creatorScore ?? 0) < (m.opponentScore ?? 0);
    } else {
      return (m.opponentScore ?? 0) < (m.creatorScore ?? 0);
    }
  }).length;
  const draws = completedMatches.length - wins - losses;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Matches</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Challenge friends and see who can pass the Turing test better.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-lg text-gray-600 dark:text-gray-400">Loading matches...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
              <p className="text-lg text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 text-sm font-semibold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <div className="text-5xl mb-4">⚔️</div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">No matches yet!</p>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Play a new game and challenge a friend to compete, or choose a game from your
                history.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/game"
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Play a Game
                </Link>
                <Link
                  href="/history"
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  View History
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {wins}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{losses}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Losses</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{draws}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Draws</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {pendingMatches.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-4">
                {matches.map((match) => (
                  <MatchHistoryCard key={match.id} match={match} />
                ))}
              </div>

              {/* Load More / Info */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Showing {matches.length} of {total} matches
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
