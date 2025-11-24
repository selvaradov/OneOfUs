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
  const [assignedPosition, setAssignedPosition] = useState<PoliticalPosition | null>(null);
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

    // Randomly assign a position from available positions
    if (randomPrompt.positions.length > 0) {
      const randomIndex = Math.floor(Math.random() * randomPrompt.positions.length);
      setAssignedPosition(randomPrompt.positions[randomIndex]);
    }
  }, []);

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserResponse(text);
    setCharCount(text.length);
  };

  const handleSubmit = async () => {
    if (!prompt || !assignedPosition || !userResponse.trim()) return;

    setIsSubmitting(true);

    try {
      // Create game session
      const session: GameSession = {
        id: crypto.randomUUID(),
        promptId: prompt.id,
        prompt,
        positionChosen: assignedPosition,
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
          position: assignedPosition,
          userResponse,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        // Update session with grading result and AI response
        session.gradingResult = data.result;
        session.aiResponse = data.aiResponse;
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
      setIsSubmitting(false);
    }
  };

  const isOverLimit = prompt ? charCount > prompt.charLimit : false;
  const canSubmit = assignedPosition && userResponse.trim() && !isOverLimit && !isSubmitting;

  if (showOnboarding) {
    return <OnboardingModal onComplete={() => setShowOnboarding(false)} />;
  }

  if (!prompt || !assignedPosition) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
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
              <span className="px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 rounded-full uppercase">
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

          {/* Assigned Position */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                You&apos;re writing as someone who is:
              </p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 capitalize">
                {assignedPosition}
              </p>
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
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className={`${isOverLimit ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {charCount} / {prompt.charLimit} characters
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
              className="w-full px-6 py-4 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Checking if you pass...
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
