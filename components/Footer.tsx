import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Left side - Project info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">One of Us</span>
            {' '}&mdash; The Ideological Turing Test
          </div>

          {/* Right side - Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <a
              href="https://github.com/selvaradov/OneOfUs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
