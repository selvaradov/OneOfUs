'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Prompt, PoliticalPosition, GameSession } from '@/lib/types';
import { getRandomPrompt } from '@/lib/prompts';
import { hasCompletedOnboarding, saveGameSession } from '@/lib/storage';
import OnboardingModal from '@/components/OnboardingModal';

export default function GamePage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<PoliticalPosition | ''>('');
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Check onboarding status and load prompt
  useEffect(() => {
    const completed = hasCompletedOnboarding();
    setShowOnboarding(!completed);

    // Load a random prompt
    const randomPrompt = getRandomPrompt();
    setPrompt(randomPrompt);
  }, []);

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserResponse(text);
    setCharCount(text.length);
  };

  const handleSubmit = async () => {
    if (!prompt || !selectedPosition || !userResponse.trim()) return;

    setIsSubmitting(true);

    try {
      // Create game session
      const session: GameSession = {
        id: crypto.randomUUID(),
        promptId: prompt.id,
        prompt,
        positionChosen: selectedPosition,
        userResponse,
        createdAt: new Date().toISOString(),
      };

      // Call grading API
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: prompt.id,
          scenario: prompt.scenario,
          position: selectedPosition,
          userResponse,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        // Update session with grading result
        session.gradingResult = data.result;
        session.completedAt = new Date().toISOString();

        // Save to localStorage
        saveGameSession(session);

        // Navigate to results page
        router.push(`/results?sessionId=${session.id}`);
      } else {
        throw new Error(data.error || 'Grading failed');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverLimit = prompt ? charCount > prompt.charLimit : false;
  const canSubmit = selectedPosition && userResponse.trim() && !isOverLimit && !isSubmitting;

  if (showOnboarding) {
    return <OnboardingModal onComplete={() => setShowOnboarding(false)} />;
  }

  if (!prompt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            One of Us
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Can you fool the AI?
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
          {/* Scenario */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 rounded-full uppercase">
                {prompt.category}
              </span>
              {prompt.metadata?.topic && (
                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700 rounded-full">
                  {prompt.metadata.topic}
                </span>
              )}
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed">
                {prompt.scenario}
              </p>
            </div>
          </div>

          {/* Position Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Choose your position
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {prompt.positions.map((position) => (
                <button
                  key={position}
                  onClick={() => setSelectedPosition(position)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedPosition === position
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              Your response
            </label>
            <textarea
              value={userResponse}
              onChange={handleResponseChange}
              placeholder="Write your response here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className={`${isOverLimit ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {charCount} / {prompt.charLimit} characters
                {prompt.wordLimit && ` (aim for ~${prompt.wordLimit} words)`}
              </span>
              {isOverLimit && (
                <span className="text-red-600 font-medium">
                  Over limit by {charCount - prompt.charLimit}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full px-6 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Grading'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
