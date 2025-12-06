'use client';

import { useState } from 'react';
import { UserAlignment } from '@/lib/types';
import { saveUserAlignment } from '@/lib/storage';
import { ModalBackdrop } from '@/components/ui/Modal';

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [alignmentValue, setAlignmentValue] = useState(3); // Default to center (1-5 scale)
  const [touched, setTouched] = useState(false);
  const [ageRange, setAgeRange] = useState('');
  const [country, setCountry] = useState(''); // No default - user must explicitly select
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Slider labels: 1=Left, 2=Centre-left, 3=Centre, 4=Centre-right, 5=Right
  const sliderLabels = ['Left', 'Centre-left', 'Centre', 'Centre-right', 'Right'];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlignmentValue(Number(e.target.value));
    setTouched(true);
  };

  const handleSliderClick = () => {
    setTouched(true);
  };

  const handleSubmit = async () => {
    if (!touched || !privacyConsent) return;

    let userId = crypto.randomUUID();

    // Try to create user in database
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          politicalAlignment: alignmentValue, // 1-5 scale
          ageRange: ageRange || null,
          country,
        }),
      });

      const data = await response.json();

      if (data.success && data.userId) {
        userId = data.userId;
        console.log('User created in database with ID:', userId);
      } else {
        console.warn('Failed to create user in database, using local UUID:', data.error);
      }
    } catch (error) {
      console.warn('Database unavailable, using local storage only:', error);
    }

    // Always save to localStorage as well (fallback and offline access)
    const userAlignment: UserAlignment = {
      id: userId,
      politicalAlignment: alignmentValue, // 1-5 scale
      ageRange: ageRange || undefined,
      country,
      createdAt: new Date().toISOString(),
    };

    saveUserAlignment(userAlignment);
    onComplete();
  };

  const ageOptions = [
    { value: '18-24', label: '18-24' },
    { value: '25-34', label: '25-34' },
    { value: '35-44', label: '35-44' },
    { value: '45-54', label: '45-54' },
    { value: '55+', label: '55+' },
  ];

  const countryOptions = [
    { value: 'UK', label: 'UK' },
    { value: 'US', label: 'US' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <ModalBackdrop maxWidth="max-w-lg">
      {/* Modal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 sm:p-8 max-h-[85dvh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Before we start...
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
          Just 3 quick questions (helps us understand how you do)
        </p>

        <div className="space-y-4 sm:space-y-6">
          {/* Question 1: Political Alignment Slider */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              1. Your political alignment?
            </label>
            <div className="px-2">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={alignmentValue}
                onChange={handleSliderChange}
                onClick={handleSliderClick}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((alignmentValue - 1) / 4) * 100}%, #e5e7eb ${((alignmentValue - 1) / 4) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                {sliderLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className={`${alignmentValue === idx + 1 ? 'font-bold text-orange-600 dark:text-orange-400' : ''}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            {!touched && (
              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                Move the slider to select your position
              </p>
            )}
          </div>

          {/* Question 2: Age Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              2. Age? (optional)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAgeRange(option.value)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium cursor-pointer ${
                    ageRange === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Country */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              3. Where are you? (optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {countryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCountry(option.value)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium cursor-pointer ${
                    country === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy Policy Consent */}
        <div className="mt-4 sm:mt-6 flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              id="privacy-consent"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              className="peer sr-only"
            />
            <label
              htmlFor="privacy-consent"
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-gray-300 bg-white transition-colors peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-focus:ring-2 peer-focus:ring-orange-500 peer-focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:border-orange-500 dark:peer-checked:bg-orange-500"
            >
              {/* Checkmark icon */}
              <svg
                className={`h-3 w-3 text-white transition-opacity ${privacyConsent ? 'opacity-100' : 'opacity-0'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </label>
          </div>
          <label
            htmlFor="privacy-consent"
            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            I agree to the{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
            >
              privacy policy
            </a>{' '}
            and consent to data collection as described
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!touched || !privacyConsent}
          className="mt-4 sm:mt-6 w-full px-6 py-3 text-base sm:text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Start Playing
        </button>
      </div>
    </ModalBackdrop>
  );
}
