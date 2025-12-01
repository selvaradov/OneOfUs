'use client';

import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ModalBackdrop } from '@/components/ui/Modal';
import { ShareLinkBox } from '@/components/ui/ShareLinkBox';

interface ShareMatchModalProps {
  matchCode: string;
  existingMatch: boolean;
  onClose: () => void;
}

export default function ShareMatchModal({
  matchCode,
  existingMatch,
  onClose,
}: ShareMatchModalProps) {
  // Generate share URL on client side to get correct origin
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/match/${matchCode}`
      : `/match/${matchCode}`;

  return (
    <ModalBackdrop onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
            <span className="text-3xl">⚔️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Challenge Created!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {existingMatch
              ? 'Share this link with your friend to challenge them!'
              : 'Share this link with a friend to see who can score higher!'}
          </p>
        </div>

        {/* Share Link Component */}
        <ShareLinkBox url={shareUrl} />

        {/* View Match Link */}
        <div className="mt-4">
          <Link
            href={`/match/${matchCode}`}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Match
          </Link>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
          This challenge expires in 24 hours
        </p>
      </div>
    </ModalBackdrop>
  );
}
