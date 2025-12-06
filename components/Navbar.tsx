'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const handleNewPrompt = () => {
    // Dispatch custom event to trigger new prompt
    window.dispatchEvent(new CustomEvent('newPrompt'));
  };

  return (
    <nav className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Home */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          One of Us
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          {pathname === '/game' ? (
            <button
              onClick={handleNewPrompt}
              className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              New Prompt
            </button>
          ) : (
            <Link
              href="/game"
              className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Play
            </Link>
          )}
          <Link
            href="/matches"
            className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            Matches
          </Link>
          <Link
            href="/history"
            className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
