'use client';

import { useState } from 'react';
import { UserAlignment, PoliticalPosition } from '@/lib/types';
import { saveUserAlignment } from '@/lib/storage';

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [alignmentValue, setAlignmentValue] = useState(3); // Default to center (0-6 scale)
  const [touched, setTouched] = useState(false);
  const [ageRange, setAgeRange] = useState('');
  const [country, setCountry] = useState('UK');

  // Map slider values to positions
  const sliderToPosition: PoliticalPosition[] = [
    'left',
    'left',
    'centre-left',
    'centre',
    'centre-right',
    'right',
    'right'
  ];

  const sliderLabels = ['Left', '', 'Centre-left', 'Centre', 'Centre-right', '', 'Right'];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAlignmentValue(Number(e.target.value));
    setTouched(true);
  };

  const handleSubmit = () => {
    if (!touched) return;

    const userAlignment: UserAlignment = {
      id: crypto.randomUUID(),
      politicalAlignment: sliderToPosition[alignmentValue],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 mx-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Before we start...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Just 3 quick questions (helps us understand how you do)
        </p>

        <div className="space-y-6">
          {/* Question 1: Political Alignment Slider */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              1. Your political alignment?
            </label>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={alignmentValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${(alignmentValue / 6) * 100}%, #e5e7eb ${(alignmentValue / 6) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                {sliderLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className={`${alignmentValue === idx ? 'font-bold text-orange-600 dark:text-orange-400' : ''}`}
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
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
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
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
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

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!touched}
          className="mt-8 w-full px-6 py-3 text-lg font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
