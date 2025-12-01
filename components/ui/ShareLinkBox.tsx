'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareLinkBoxProps {
  url: string;
  shareTitle?: string;
  shareText?: string;
}

/**
 * Reusable share link component with copy and native share functionality.
 * Used in ShareMatchModal and MatchLobbyPending.
 */
export function ShareLinkBox({
  url,
  shareTitle = 'Challenge me in One of Us!',
  shareText = "I've challenged you to a political Turing test. Can you beat my score?",
}: ShareLinkBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed - fallback to copy
        if ((error as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-4">
      {/* Link input with copy button */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Copy link"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
        {copied && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            Link copied to clipboard!
          </p>
        )}
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
      >
        <Share2 className="w-5 h-5" />
        Share Challenge
      </button>
    </div>
  );
}
