'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Prompt, PoliticalPosition, GameSession } from '@/lib/types';
import { getRandomPrompt } from '@/lib/prompts';
import { hasCompletedOnboarding, getUserAlignment } from '@/lib/storage';
import { getPositionDescription } from '@/lib/positionDescriptions';
import OnboardingModal from '@/components/OnboardingModal';
import Navbar from '@/components/Navbar';
import DartingLoader from '@/components/DartingLoader';
import Footer from '@/components/Footer';

const LOADING_MESSAGES = [
  'Analyzing your chameleon skills...',
  'Checking if you blend in...',
  'Consulting the ideology experts...',
  'Sniffing for tells...',
  'Reading between the lines...',
  'Checking your receipts...',
  'Seeing if you pass the vibe check...',
  'Testing your shapeshifting abilities...',
  'Asking: who are you, really?',
  'Detecting any sus energy...',
];

export default function GamePage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [assignedPosition, setAssignedPosition] = useState<PoliticalPosition | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

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

    // Reset form state and start timer
    setUserResponse('');
    setCharCount(0);
    setStartTime(Date.now());
  }, [refreshTrigger]);

  // Listen for new prompt event
  useEffect(() => {
    const handleNewPrompt = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener('newPrompt', handleNewPrompt);
    return () => window.removeEventListener('newPrompt', handleNewPrompt);
  }, []);

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setUserResponse(text);
    setCharCount(text.length);
  };

  const handleSubmit = async () => {
    if (!prompt || !assignedPosition || !userResponse.trim()) return;

    // Select random loading message
    const randomMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    setLoadingMessage(randomMessage);
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

      // Get user ID from localStorage
      const userAlignment = getUserAlignment();
      const userId = userAlignment?.id;

      // Calculate duration in seconds
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // Call grading API
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: prompt.id,
          position: assignedPosition,
          userResponse,
          userId, // Pass userId for database storage
          durationSeconds, // Pass duration for analytics
        }),
      });

      const data = await response.json();

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        const retryAfter = data.retryAfter || 3600; // Default to 1 hour
        const hours = Math.floor(retryAfter / 3600);
        const minutes = Math.floor((retryAfter % 3600) / 60);

        let timeMessage = '';
        if (hours > 0) {
          timeMessage = `${hours} hour${hours > 1 ? 's' : ''}`;
          if (minutes > 0) timeMessage += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
          timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }

        alert(`Whoah, slow down!\n\n${data.error}\n\nPlease try again in ${timeMessage}.`);
        setIsSubmitting(false);
        return;
      }

      if (data.success && data.result) {
        // Update session with grading result and AI response
        session.gradingResult = data.result;
        session.aiResponse = data.aiResponse;
        session.completedAt = new Date().toISOString();

        // Cache this session for instant access on results page
        // (Database save happens in /api/grade, but cache ensures instant load)
        try {
          const cached = sessionStorage.getItem('cachedSessions');
          const cachedSessions = cached ? JSON.parse(cached) : [];
          // Add this session to cache (or update if exists)
          const existingIndex = cachedSessions.findIndex((s: GameSession) => s.id === session.id);
          if (existingIndex >= 0) {
            cachedSessions[existingIndex] = session;
          } else {
            cachedSessions.unshift(session); // Add to front (most recent)
          }
          sessionStorage.setItem('cachedSessions', JSON.stringify(cachedSessions));
        } catch (error) {
          console.warn('Failed to cache session:', error);
        }

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
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {isSubmitting && <DartingLoader message={loadingMessage} />}
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
            {/* Scenario */}
            <div className="space-y-3">
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
                  You&apos;re writing as:
                </p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {getPositionDescription(assignedPosition)}
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
                <span
                  className={`${isOverLimit ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
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
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
