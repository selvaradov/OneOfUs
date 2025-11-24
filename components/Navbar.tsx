'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleRefresh = () => {
    if (pathname === '/game') {
      router.refresh();
      window.location.reload(); // Force full reload to get new prompt
    }
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
        <div className="flex items-center gap-4">
          {pathname === '/game' && (
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              New Prompt
            </button>
          )}
          <Link
            href="/history"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
