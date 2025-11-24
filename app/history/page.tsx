'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GameSession } from '@/lib/types';
import { getGameSessions, getUserAlignment } from '@/lib/storage';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [userAlignment, setUserAlignment] = useState<string>('');

  useEffect(() => {
    const allSessions = getGameSessions();
    setSessions(allSessions.reverse()); // Most recent first

    const alignment = getUserAlignment();
    if (alignment) {
      setUserAlignment(alignment.politicalAlignment);
    }
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your History
          </h1>
          {userAlignment && (
            <p className="text-gray-600 dark:text-gray-400">
              Your alignment: <span className="font-semibold capitalize">{userAlignment}</span>
            </p>
          )}
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
                {sessions.filter(s => s.gradingResult && !s.gradingResult.detected).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Undetected</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {sessions.filter(s => s.gradingResult && s.gradingResult.detected).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Detected</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {sessions.length > 0
                  ? Math.round(
                      sessions
                        .filter(s => s.gradingResult)
                        .reduce((acc, s) => acc + (s.gradingResult?.score || 0), 0) / sessions.filter(s => s.gradingResult).length
                    )
                  : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Score</div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              No games played yet!
            </p>
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 rounded uppercase">
                        {session.prompt.category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        as {session.positionChosen}
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

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/game"
            className="px-6 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Play Again
          </Link>
          <Link
            href="/"
            className="px-6 py-3 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
