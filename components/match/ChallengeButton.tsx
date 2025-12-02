'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';
import ShareMatchModal from './ShareMatchModal';
import { ModalBackdrop } from '@/components/ui/Modal';
import { getUserAlignment } from '@/lib/storage';

interface ChallengeButtonProps {
  sessionId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}

interface PendingMatchConfirmProps {
  matchCode: string;
  onUseExisting: () => void;
  onCreateNew: () => void;
  onClose: () => void;
}

function PendingMatchConfirm({
  matchCode,
  onUseExisting,
  onCreateNew,
  onClose,
}: PendingMatchConfirmProps) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Existing Challenge Found
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You already have a pending challenge for this game (code:{' '}
          <span className="font-mono font-semibold">{matchCode}</span>). Would you like to share the
          existing challenge or create a new one?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onUseExisting}
            className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use Existing Challenge
          </button>
          <button
            onClick={onCreateNew}
            className="w-full px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Create New Challenge
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default function ChallengeButton({
  sessionId,
  className = '',
  variant = 'secondary',
}: ChallengeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMatchCode, setPendingMatchCode] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<{
    matchCode: string;
    existingMatch: boolean;
  } | null>(null);

  const createMatch = async (forceNew: boolean = false) => {
    const userAlignment = getUserAlignment();
    if (!userAlignment?.id) {
      setError('Please complete onboarding first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: userAlignment.id,
          forceNew,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (response.status === 429) {
          setError('Too many challenges created. Please try again later.');
        } else {
          setError(data.error || 'Failed to create challenge');
        }
        setIsLoading(false);
        return;
      }

      // If there's an existing pending match and we're not forcing new, show confirmation
      if (data.existingMatch && data.existingMatchStatus === 'pending' && !forceNew) {
        setPendingMatchCode(data.matchCode);
        setShowConfirm(true);
        setIsLoading(false);
        return;
      }

      setMatchData({
        matchCode: data.matchCode,
        existingMatch: data.existingMatch || false,
      });
      setShowModal(true);
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError('Failed to create challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => createMatch(false);

  const handleUseExisting = () => {
    setShowConfirm(false);
    if (pendingMatchCode) {
      setMatchData({
        matchCode: pendingMatchCode,
        existingMatch: true,
      });
      setShowModal(true);
    }
  };

  const handleCreateNew = () => {
    setShowConfirm(false);
    createMatch(true);
  };

  const baseStyles =
    variant === 'compact'
      ? 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      : 'inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700',
    secondary: 'text-white bg-blue-600 hover:bg-blue-700',
    compact: 'text-white bg-blue-600 hover:bg-blue-700',
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      >
        {isLoading ? (
          <>
            <div
              className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-current border-t-transparent rounded-full animate-spin`}
            />
            {variant !== 'compact' && 'Creating...'}
          </>
        ) : (
          <>
            <Users className={variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} />
            Challenge a Friend
          </>
        )}
      </button>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {showConfirm &&
        pendingMatchCode &&
        typeof document !== 'undefined' &&
        createPortal(
          <PendingMatchConfirm
            matchCode={pendingMatchCode}
            onUseExisting={handleUseExisting}
            onCreateNew={handleCreateNew}
            onClose={() => setShowConfirm(false)}
          />,
          document.body
        )}

      {showModal &&
        matchData &&
        typeof document !== 'undefined' &&
        createPortal(
          <ShareMatchModal
            matchCode={matchData.matchCode}
            existingMatch={matchData.existingMatch}
            onClose={() => setShowModal(false)}
          />,
          document.body
        )}
    </>
  );
}
