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

  const { gradingResult, prompt, positionChosen, userResponse, aiResponse } = session;
  const passed = !gradingResult.detected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
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
          </div>

          {/* Feedback */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              What gave it away (or what worked)
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {gradingResult.feedback}
              </p>
            </div>
          </div>
        </div>

        {/* Scenario Context */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 rounded-full uppercase">
                {prompt.category}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Position: <span className="font-semibold capitalize">{positionChosen}</span>
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">Scenario:</span> {prompt.scenario}
            </p>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* User Response */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Your Response
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[120px]">
              {userResponse}
            </div>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Response
              </h3>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[120px]">
                {aiResponse}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                How Claude would write from the same position
              </p>
            </div>
          )}
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
