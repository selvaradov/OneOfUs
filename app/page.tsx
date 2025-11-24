import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center px-6 py-16">
        <div className="text-center space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              One of Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              The Ideological Turing Test
            </p>
          </div>

          {/* Explanation */}
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Can you convincingly argue for a political position that isn&apos;t your own?
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              The Ideological Turing Test challenges you to understand opposing viewpoints so well
              that you can write from their perspective authentically. Write responses to political
              scenarios, and see if an AI can detect whether you&apos;re being genuine or playing a role.
            </p>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              This isn&apos;t about trolling or caricature—it&apos;s about truly understanding the
              strongest version of views different from your own.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Link
              href="/game"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Start Playing
            </Link>
          </div>

          {/* Additional Info */}
          <div className="pt-8 text-sm text-gray-500 dark:text-gray-500">
            <p>
              Answer 3 quick questions, then jump into scenarios like Twitter threads,
              Reddit comments, and letters to MPs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
