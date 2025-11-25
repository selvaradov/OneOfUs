import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center px-6 py-16 mx-auto">
        <div className="text-center space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
              One of Us
            </h1>
            <p className="text-2xl md:text-3xl text-orange-600 dark:text-orange-400 font-semibold">
              The Ideological Turing Test
            </p>
          </div>

          {/* Explanation */}
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
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
              className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Playing →
            </Link>
          </div>

          {/* Additional Info */}
          <div className="pt-8 text-sm text-gray-500 dark:text-gray-500">
            <p>
              Answer 3 quick questions, then jump into scenarios like tweets,
              Reddit comments, and letters to MPs.
            </p>
          </div>

          {/* History Link */}
          <div className="pt-4">
            <Link
              href="/history"
              className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
            >
              View your history →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
