import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: November 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                What We Collect
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                When you use One of Us, we collect and store the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  <strong>Profile information:</strong> Your self-reported political alignment
                  (1-5 scale), age range, and country from the onboarding process
                </li>
                <li>
                  <strong>Game sessions:</strong> Every prompt you receive, your written responses,
                  the political position you were assigned, AI-generated scores and feedback, and
                  the time you spent on each prompt
                </li>
                <li>
                  <strong>Technical data:</strong> Your IP address (not hashed), browser user agent
                  string, and timestamps of all actions
                </li>
                <li>
                  <strong>Anonymous identifier:</strong> A randomly generated UUID stored in your
                  browser to link your sessions together
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                How We Use This Data
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use the collected data to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>Show you your personal game history and performance statistics</li>
                <li>Analyze which prompts are hardest/easiest and improve the game</li>
                <li>
                  Research how well people can embody different political perspectives, potentially
                  for academic publication or product improvement
                </li>
                <li>Debug technical issues and monitor system performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Data Sharing
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your data is stored in our database (Vercel Postgres via Neon). We do not currently
                sell or share your personal data with third parties. However:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  Anonymized, aggregated statistics may be shared publicly or in research contexts
                </li>
                <li>
                  Your responses are processed by Anthropic&apos;s Claude AI for grading (subject to
                  their privacy policy)
                </li>
                <li>
                  We may be required to disclose data if legally compelled to do so
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Data Retention
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We currently retain all data indefinitely to build a comprehensive research dataset.
                We may implement automatic deletion policies in the future.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Your Rights
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                You are identified in our system only by a random UUID. We do not collect your name,
                email, or other personally identifying information. This means:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                <li>
                  You are pseudonymous by default, but your IP address could potentially identify you
                </li>
                <li>
                  If you clear your browser data, you will lose access to your game history (we cannot
                  recover it without your UUID)
                </li>
                <li>
                  We do not currently offer data export or deletion features, but may implement these
                  in the future
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your data is stored in a secure PostgreSQL database with access controls. However,
                no system is completely secure. We take reasonable precautions but cannot guarantee
                absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Children&apos;s Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                This game is not intended for children under 13. We do not knowingly collect data
                from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We may update this policy as the project evolves. The &quot;Last updated&quot; date
                at the top will reflect any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                Consent
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By using One of Us, you consent to this data collection and use. If you do not agree,
                please do not use the game.
              </p>
            </section>
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
