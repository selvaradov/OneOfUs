'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GameSession } from '@/lib/types';
import { getGameSessions } from '@/lib/storage';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/game');
      return;
    }

    const sessions = getGameSessions();
    const foundSession = sessions.find(s => s.id === sessionId);

    if (!foundSession || !foundSession.gradingResult) {
      router.push('/game');
      return;
    }

    setSession(foundSession);
  }, [sessionId, router]);

  if (!session || !session.gradingResult) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const { gradingResult, prompt, positionChosen, userResponse } = session;
  const passed = !gradingResult.detected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Results
          </h1>
        </div>

        {/* Main Result Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6 mb-6">
          {/* Detection Result */}
          <div className="text-center py-6">
            <div className={`text-6xl mb-4`}>
              {passed ? '✓' : '✗'}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passed ? 'Undetected!' : 'Detected!'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {passed
                ? 'You successfully passed as one of them.'
                : 'The AI spotted that you were role-playing.'}
            </p>
          </div>

          {/* Score */}
          <div className="text-center py-4 border-t border-b border-gray-200 dark:border-gray-700">
            <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {gradingResult.score}
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Overall Score</p>
          </div>

          {/* Feedback */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Feedback
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {gradingResult.feedback}
              </p>
            </div>
          </div>

          {/* Rubric Scores */}
          {gradingResult.rubricScores && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(gradingResult.rubricScores).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {key}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {value}/20
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${(value / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Review Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Your Submission
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Position:</span> {positionChosen}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Scenario:</span> {prompt.scenario}
            </div>
          </div>
          <div className="pt-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your response:
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {userResponse}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/game"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Play Again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
