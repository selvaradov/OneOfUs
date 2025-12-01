'use client';

import { useEffect, useState, use, useMemo } from 'react';
import {
  MatchWithParticipants,
  MatchResults as MatchResultsType,
  PoliticalPosition,
} from '@/lib/types';
import { getUserAlignment } from '@/lib/storage';
import MatchLobbyPending from '@/components/match/MatchLobbyPending';
import MatchLobbyChallenge from '@/components/match/MatchLobbyChallenge';
import HeadToHeadResults from '@/components/match/HeadToHeadResults';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

type MatchState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'not-found' }
  | { type: 'expired' }
  | { type: 'pending-creator'; match: MatchWithParticipants }
  | {
      type: 'pending-opponent';
      match: MatchWithParticipants;
      alreadyJoined: boolean;
      hasOtherOpponent: boolean;
      position: PoliticalPosition | null;
    }
  | { type: 'completed'; results: MatchResultsType };

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function MatchLobbyPage({ params }: PageProps) {
  const { code } = use(params);
  const [matchState, setMatchState] = useState<MatchState>({ type: 'loading' });

  // Get user ID from localStorage using useMemo to avoid effect issues
  const userId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const userAlignment = getUserAlignment();
    return userAlignment?.id || null;
  }, []);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const response = await fetch(`/api/match/${code}`);
        const data = await response.json();

        if (!data.success) {
          if (response.status === 404) {
            setMatchState({ type: 'not-found' });
          } else {
            setMatchState({ type: 'error', message: data.error || 'Failed to load match' });
          }
          return;
        }

        // If completed, we get full results
        if (data.isCompleted) {
          setMatchState({ type: 'completed', results: data.match });
          return;
        }

        const match = data.match as MatchWithParticipants;

        // Check match status
        if (match.status === 'expired') {
          setMatchState({ type: 'expired' });
          return;
        }

        // Determine user context
        const creatorId = match.participants.find((p) => p.role === 'creator')?.userId;
        const isCreator = userId && creatorId === userId;

        if (isCreator) {
          setMatchState({ type: 'pending-creator', match });
        } else {
          // Check if current user already joined as opponent
          const currentUserIsOpponent = match.participants.find(
            (p) => p.role === 'opponent' && p.userId === userId
          );
          // Check if there's any opponent at all (different from current user)
          const anyOpponent = match.participants.find((p) => p.role === 'opponent');
          const hasOtherOpponent = !!(anyOpponent && anyOpponent.userId !== userId);

          setMatchState({
            type: 'pending-opponent',
            match,
            alreadyJoined: !!currentUserIsOpponent,
            hasOtherOpponent,
            position: data.position || null,
          });
        }
      } catch (error) {
        console.error('Error fetching match:', error);
        setMatchState({ type: 'error', message: 'Failed to load match. Please try again.' });
      }
    }

    fetchMatch();
  }, [code, userId]);

  const handleRefresh = () => {
    setMatchState({ type: 'loading' });
    // Re-trigger the effect by updating a dependency
    window.location.reload();
  };

  // Render based on state
  const renderContent = () => {
    switch (matchState.type) {
      case 'loading':
        return (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading match...</div>
          </div>
        );

      case 'error':
        return (
          <div className="max-w-lg mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <p className="text-lg text-red-700 dark:text-red-400 mb-4">{matchState.message}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 text-sm font-semibold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      case 'not-found':
        return (
          <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Match Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This match code doesn&apos;t exist. Check the link and try again.
            </p>
            <Link
              href="/"
              className="inline-flex px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go Home
            </Link>
          </div>
        );

      case 'expired':
        return (
          <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Match Expired</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This match has expired. Matches are valid for 24 hours after creation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/history"
                className="inline-flex justify-center px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                View Your History
              </Link>
              <Link
                href="/game"
                className="inline-flex justify-center px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Play a Game
              </Link>
            </div>
          </div>
        );

      case 'pending-creator':
        return (
          <MatchLobbyPending matchCode={code} match={matchState.match} onRefresh={handleRefresh} />
        );

      case 'pending-opponent':
        return (
          <MatchLobbyChallenge
            matchCode={code}
            match={matchState.match}
            userId={userId}
            alreadyJoined={matchState.alreadyJoined}
            hasOtherOpponent={matchState.hasOtherOpponent}
            position={matchState.position}
            onNeedOnboarding={() => {
              // Store the match code so we can return after onboarding
              sessionStorage.setItem('pendingMatchCode', code);
            }}
          />
        );

      case 'completed':
        return <HeadToHeadResults results={matchState.results} currentUserId={userId} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex-1 py-8 px-4">{renderContent()}</div>
      <Footer />
    </div>
  );
}
