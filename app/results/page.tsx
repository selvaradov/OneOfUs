'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Sparkles, Target } from 'lucide-react';
import { GameSession } from '@/lib/types';
import { getGameSessions } from '@/lib/storage';
import { getPositionDescription } from '@/lib/positionDescriptions';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Results</h1>
        </div>

        {/* Main Result - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Detection Result */}
            <div className="flex items-center gap-4">
              <div className={`text-5xl`}>
                {passed ? '✓' : '✗'}
              </div>
              <div>
                <h2 className={`text-3xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {passed ? 'Undetected!' : 'Detected!'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {passed ? 'You passed' : 'You were spotted'}
                </p>
              </div>
            </div>

            {/* Center: Score */}
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {gradingResult.score}
                <span className="text-xl text-gray-500">/100</span>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col gap-2">
              <Link
                href="/game"
                className="px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors text-center"
              >
                Play Again
              </Link>
              <Link
                href="/"
                className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Home
              </Link>
            </div>
          </div>

          {/* Rubric Scores - Visual Progress Bars with Icons */}
          {gradingResult.rubricScores && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Understanding */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Understanding</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {gradingResult.rubricScores.understanding}
                      <span className="text-xs text-gray-500">/65</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-orange-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${(gradingResult.rubricScores.understanding / 65) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Authenticity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Authenticity</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {gradingResult.rubricScores.authenticity}
                      <span className="text-xs text-gray-500">/20</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-orange-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${(gradingResult.rubricScores.authenticity / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Execution */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Execution</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {gradingResult.rubricScores.execution}
                      <span className="text-xs text-gray-500">/15</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-orange-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${(gradingResult.rubricScores.execution / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {passed ? 'What worked' : 'What gave you away'}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {gradingResult.feedback}
          </p>
        </div>

        {/* Scenario Context - Compact */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 text-sm">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-medium">Scenario:</span> {prompt.scenario}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Argued from the perspective of{' '}
            <span className="font-semibold">{getPositionDescription(positionChosen)}</span>
          </p>
        </div>

        {/* Side-by-side comparison - More Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Response */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-xl">👤</span>
              Your Response
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {userResponse}
            </div>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                AI Response
              </h3>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {aiResponse}
              </div>
            </div>
          )}
        </div>

        {/* History Link */}
        <div className="text-center mt-6">
          <Link
            href="/history"
            className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
          >
            View all your games →
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
