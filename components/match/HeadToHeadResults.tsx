'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  FingerprintPattern,
  Goal,
  Trophy,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
} from 'lucide-react';
import { MatchResults as MatchResultsType, ParticipantWithSession } from '@/lib/types';
import { getPositionDescription } from '@/lib/positionDescriptions';

// Rubric bar component for score visualization
function RubricBar({
  label,
  score,
  max,
  icon: Icon,
}: {
  label: string;
  score: number;
  max: number;
  icon: typeof Brain;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Icon className="w-3 h-3 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
        </div>
        <span className="font-medium text-gray-900 dark:text-white">
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-orange-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

// Participant card showing score and response
function ParticipantCard({
  participant,
  label,
  isCurrentUser,
  isWinner,
}: {
  participant: ParticipantWithSession;
  label: string;
  isCurrentUser: boolean;
  isWinner: boolean;
}) {
  const [showFeedback, setShowFeedback] = useState(true);
  const session = participant.session;

  if (!session) return null;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${isWinner ? 'ring-2 ring-orange-500' : ''}`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 ${isWinner ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-900'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {isCurrentUser ? '👤' : label === 'Creator' ? '🔨' : '⚔️'}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {label}
              {isCurrentUser && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(You)</span>
              )}
            </span>
          </div>
          {isWinner && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-semibold">Winner</span>
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">
            {session.score}
            <span className="text-xl text-gray-500">/100</span>
          </span>
          <span
            className={`px-3 py-1 rounded text-sm font-semibold ${
              session.detected
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {session.detected ? 'Detected' : 'Undetected'}
          </span>
        </div>

        {/* Response - styled as quote with elegant opening quotation mark */}
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-orange-300 dark:border-orange-600">
            <div className="flex gap-3">
              <span className="text-4xl leading-none text-orange-300 dark:text-orange-600 mt-1 flex-shrink-0">
                {'\u201c'}
              </span>
              <blockquote className="italic text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {session.userResponse}
              </blockquote>
            </div>
          </div>
        </div>

        {/* Rubric Breakdown */}
        <div className="space-y-2">
          <RubricBar
            label="Understanding"
            score={session.rubricUnderstanding ?? 0}
            max={65}
            icon={Brain}
          />
          <RubricBar
            label="Authenticity"
            score={session.rubricAuthenticity ?? 0}
            max={20}
            icon={FingerprintPattern}
          />
          <RubricBar label="Execution" score={session.rubricExecution ?? 0} max={15} icon={Goal} />
        </div>
      </div>

      {/* AI Feedback toggle for this participant */}
      {session.feedback && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            {showFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            AI Feedback
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${showFeedback ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {session.feedback}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface HeadToHeadResultsProps {
  results: MatchResultsType;
  currentUserId: string | null;
}

export default function HeadToHeadResults({ results, currentUserId }: HeadToHeadResultsProps) {
  const [copied, setCopied] = useState(false);

  const { prompt, participants, winner } = results;

  const creator = participants.find((p) => p.role === 'creator');
  const opponent = participants.find((p) => p.role === 'opponent');

  const creatorScore = creator?.session?.score ?? 0;
  const opponentScore = opponent?.session?.score ?? 0;

  // Determine if current user is creator or opponent
  const isCreator = currentUserId === creator?.userId;
  const isOpponent = currentUserId === opponent?.userId;
  const isParticipant = isCreator || isOpponent;

  // Get winner display text
  const getWinnerText = () => {
    if (winner === 'tie') return "It's a Tie!";
    if (winner === 'creator') {
      return isCreator ? 'You Win!' : isOpponent ? 'You Lose!' : 'Creator Wins!';
    }
    if (winner === 'opponent') {
      return isOpponent ? 'You Win!' : isCreator ? 'You Lose!' : 'Challenger Wins!';
    }
    return 'Results';
  };

  const getWinnerEmoji = () => {
    if (winner === 'tie') return '🤝';
    if (winner === 'creator') {
      return isCreator ? '🏆' : isOpponent ? '😔' : '🏆';
    }
    if (winner === 'opponent') {
      return isOpponent ? '🏆' : isCreator ? '😔' : '🏆';
    }
    return '📊';
  };

  const handleCopyLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'One of Us - Match Results',
          text: `I ${winner === 'tie' ? 'tied' : creatorScore > opponentScore === isCreator ? 'won' : 'lost'} a political Turing test challenge! Score: ${isCreator ? creatorScore : opponentScore}/100`,
          url: window.location.href,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Helper to check if participant is a winner
  const isParticipantWinner = (role: 'creator' | 'opponent') =>
    (role === 'creator' && winner === 'creator') || (role === 'opponent' && winner === 'opponent');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Winner Announcement */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{getWinnerEmoji()}</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{getWinnerText()}</h1>
      </div>

      {/* Score Comparison Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {isCreator ? 'You' : 'Creator'}
            </div>
            <div
              className={`text-4xl font-bold ${winner === 'creator' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {creatorScore}
            </div>
          </div>

          <div className="text-2xl font-bold text-gray-400">vs</div>

          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {isOpponent ? 'You' : 'Challenger'}
            </div>
            <div
              className={`text-4xl font-bold ${winner === 'opponent' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {opponentScore}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share Results
            </>
          )}
        </button>
        <Link
          href="/game"
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {isParticipant ? 'Play Again' : 'Try it Yourself'}
        </Link>
      </div>

      {/* Scenario Context - larger text */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">The Scenario</h3>
        <p className="text-base text-gray-700 dark:text-gray-300 mb-4">{prompt.scenario}</p>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Both players argued from the perspective of{' '}
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            {getPositionDescription(creator?.session?.positionAssigned || 'left')}
          </span>
          .
        </p>
      </div>

      {/* Side-by-side Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {creator && (
          <ParticipantCard
            participant={creator}
            label="Creator"
            isCurrentUser={isCreator}
            isWinner={isParticipantWinner('creator')}
          />
        )}
        {opponent && (
          <ParticipantCard
            participant={opponent}
            label="Challenger"
            isCurrentUser={isOpponent}
            isWinner={isParticipantWinner('opponent')}
          />
        )}
      </div>

      {/* AI Reference Response */}
      {creator?.session?.aiComparisonResponse && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Reference Response</h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-orange-300 dark:border-orange-600">
            <div className="flex gap-3">
              <span className="text-4xl leading-none text-orange-300 dark:text-orange-600 mt-1 flex-shrink-0">
                {'\u201c'}
              </span>
              <blockquote className="italic text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {creator.session.aiComparisonResponse}
              </blockquote>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
