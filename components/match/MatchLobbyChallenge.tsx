'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MatchWithParticipants, PoliticalPosition } from '@/lib/types';
import { getPromptById } from '@/lib/prompts';
import { hasCompletedOnboarding, getUserAlignment } from '@/lib/storage';
import { getPositionDescription } from '@/lib/positionDescriptions';
import OnboardingModal from '@/components/OnboardingModal';
import Link from 'next/link';

interface MatchLobbyChallengeProps {
  matchCode: string;
  match: MatchWithParticipants;
  userId: string | null;
  alreadyJoined: boolean;
  hasOtherOpponent: boolean;
  position: PoliticalPosition | null;
  onNeedOnboarding: () => void;
}

export default function MatchLobbyChallenge({
  matchCode,
  match,
  alreadyJoined,
  hasOtherOpponent,
  position,
  onNeedOnboarding,
}: MatchLobbyChallengeProps) {
  const isOnboarded = hasCompletedOnboarding();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Get prompt details
  const prompt = getPromptById(match.promptId);

  // Get creator's position from their session (we need this to show what position opponent will play)
  // The API will return the same position for the opponent
  const handleAcceptChallenge = async () => {
    // Check if user needs onboarding
    if (!hasCompletedOnboarding()) {
      onNeedOnboarding();
      setShowOnboarding(true);
      return;
    }

    const userAlignment = getUserAlignment();
    if (!userAlignment?.id) {
      setError('Please complete onboarding first');
      setShowOnboarding(true);
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/match/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchCode: matchCode,
          userId: userAlignment.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to join match');
        setIsJoining(false);
        return;
      }

      // Redirect to game with match context
      router.push(
        `/game?matchId=${data.matchId}&promptId=${data.promptId}&position=${data.position}`
      );
    } catch (err) {
      console.error('Error joining match:', err);
      setError('Failed to join match. Please try again.');
      setIsJoining(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Retry accepting the challenge after onboarding
    handleAcceptChallenge();
  };

  if (showOnboarding) {
    return <OnboardingModal onComplete={handleOnboardingComplete} />;
  }

  // If match already has a different opponent, show "match full" message
  if (hasOtherOpponent) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Challenge Already Accepted
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Someone else has already accepted this challenge. Each match is limited to two players.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/game"
              className="inline-flex justify-center w-full px-6 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Start Your Own Game
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center w-full px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If already joined, show "continue" message
  if (alreadyJoined) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
              <div className="text-4xl">✓</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re In!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You&apos;ve already joined this challenge. Complete the game to see the results!
          </p>

          <Link
            href={`/game?matchId=${match.id}&promptId=${match.promptId}`}
            className="inline-flex justify-center w-full px-6 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue Challenge
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Challenge Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
            <div className="text-4xl">⚔️</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You&apos;ve Been Challenged!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Someone wants to test your political shapeshifting skills
          </p>
        </div>

        {/* What is this? - only show for non-onboarded users */}
        {!isOnboarded && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              What is this?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>One of Us</strong> is the Ideological Turing Test game. Write a political
              response convincingly enough to fool an AI judge, then compare your score
              head-to-head!
            </p>
          </div>
        )}

        {/* Scenario Preview */}
        {prompt && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              The Scenario
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
              {prompt.scenario}
            </p>
            {position && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You&apos;ll respond as{' '}
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {getPositionDescription(position)}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Accept Button */}
        <button
          onClick={handleAcceptChallenge}
          disabled={isJoining}
          className="w-full px-6 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isJoining ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Joining...
            </>
          ) : (
            'Accept Challenge'
          )}
        </button>

        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
          You&apos;ll write a response to the same scenario, then see who scored higher!
        </p>
      </div>
    </div>
  );
}
