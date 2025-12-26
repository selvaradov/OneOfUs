import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
        {/* Large screens: three-column layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex-1 text-gray-600 dark:text-gray-400">
            <span>Created by </span>
            <a
              href="https://selvaradov.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Rohan Selva-Radov
            </a>
          </div>
          <div className="flex-1 text-center text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">One of Us</span> &mdash;
            The Ideological Turing Test
          </div>
          <div className="flex-1 flex items-center justify-end gap-4">
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

        {/* Small/medium screens: stacked layout */}
        <div className="lg:hidden flex flex-col items-center gap-1">
          {/* Project info on top */}
          <div className="text-gray-600 dark:text-gray-400 text-center">
            <span className="font-semibold text-gray-900 dark:text-white">One of Us</span> &mdash;
            The Ideological Turing Test
          </div>
          {/* Author and links with separator */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Created by{' '}
              <a
                href="https://selvaradov.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Rohan Selva-Radov
              </a>
            </span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link
              href="/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <a
              href="https://github.com/selvaradov/OneOfUs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
