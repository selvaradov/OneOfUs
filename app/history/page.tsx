'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameSession } from '@/lib/types';
import { getUserAlignment } from '@/lib/storage';
import { getPositionDescription } from '@/lib/positionDescriptions';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HistoryPage() {
  // Initialize with cached data immediately (no loading screen)
  const [sessions, setSessions] = useState<GameSession[]>(() => {
    // Try sessionStorage cache only
    try {
      const cached = sessionStorage.getItem('cachedSessions');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      // Ignore cache errors
    }

    return []; // Start empty, will load from database
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    // Get user ID from localStorage (still used for user alignment)
    const userAlignment = getUserAlignment();
    const userId = userAlignment?.id;

    if (!userId) {
      // User hasn't completed onboarding yet
      return;
    }

    try {
      const response = await fetch(`/api/history?userId=${userId}&limit=50&offset=0`);
      const data = await response.json();

      if (data.success && data.sessions) {
        // Convert database format to GameSession format
        const dbSessions: GameSession[] = data.sessions.map((dbSession: any) => ({
          id: dbSession.id,
          userId: dbSession.user_id,
          promptId: dbSession.prompt_id,
          prompt: {
            id: dbSession.prompt_id,
            category: dbSession.prompt_category,
            scenario: dbSession.prompt_scenario,
            positions: [],
            charLimit: dbSession.char_count || 280,
          },
          positionChosen: dbSession.position_assigned,
          userResponse: dbSession.user_response,
          gradingResult: dbSession.score
            ? {
                detected: dbSession.detected,
                score: dbSession.score,
                feedback: dbSession.feedback,
                rubricScores: {
                  understanding: dbSession.rubric_understanding,
                  authenticity: dbSession.rubric_authenticity,
                  execution: dbSession.rubric_execution,
                },
                timestamp: dbSession.completed_at,
              }
            : undefined,
          aiResponse: dbSession.ai_comparison_response,
          createdAt: dbSession.created_at,
          completedAt: dbSession.completed_at,
        }));

        setSessions(dbSessions);
        setError(null); // Clear any previous errors

        // Cache sessions for instant access from results page
        sessionStorage.setItem('cachedSessions', JSON.stringify(dbSessions));
      } else {
        throw new Error(data.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Failed to fetch from database:', error);
      // Only set error if we don't have cached data to show
      if (sessions.length === 0) {
        setError("Couldn't load your game history—try refreshing");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your History</h1>
          </div>

          {/* Stats */}
          {sessions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {sessions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Games Played</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {sessions.filter((s) => s.gradingResult && !s.gradingResult.detected).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Undetected</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {sessions.filter((s) => s.gradingResult && s.gradingResult.detected).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Detected</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {sessions.length > 0
                    ? Math.round(
                        sessions
                          .filter((s) => s.gradingResult)
                          .reduce((acc, s) => acc + (s.gradingResult?.score || 0), 0) /
                          sessions.filter((s) => s.gradingResult).length
                      )
                    : 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
              </div>
            </div>
          )}

          {/* Sessions List */}
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
              <p className="text-lg text-red-700 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 text-sm font-semibold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">No games played yet!</p>
              <Link
                href="/game"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Play Your First Game
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/results?sessionId=${session.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          As {getPositionDescription(session.positionChosen)}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {session.prompt.scenario}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    {session.gradingResult && (
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {session.gradingResult.score}
                        </div>
                        <div
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            session.gradingResult.detected
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {session.gradingResult.detected ? 'Detected' : 'Undetected'}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
