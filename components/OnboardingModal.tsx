'use client';

import { useState } from 'react';
import { UserAlignment, PoliticalPosition } from '@/lib/types';
import { saveUserAlignment } from '@/lib/storage';

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [alignment, setAlignment] = useState<PoliticalPosition | ''>('');
  const [ageRange, setAgeRange] = useState('');
  const [country, setCountry] = useState('UK');

  const handleSubmit = () => {
    if (!alignment) return;

    const userAlignment: UserAlignment = {
      id: crypto.randomUUID(),
      politicalAlignment: alignment,
      ageRange: ageRange || undefined,
      country,
      createdAt: new Date().toISOString(),
    };

    saveUserAlignment(userAlignment);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 mx-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Before we start...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Answer 3 quick questions so we can understand how well you embody different perspectives.
        </p>

        <div className="space-y-6">
          {/* Question 1: Political Alignment */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              1. How would you describe your political alignment?
            </label>
            <select
              value={alignment}
              onChange={(e) => setAlignment(e.target.value as PoliticalPosition)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="left">Left / Labour</option>
              <option value="centre-left">Centre-left / Liberal Democrat</option>
              <option value="centre">Centre / Moderate</option>
              <option value="centre-right">Centre-right</option>
              <option value="right">Right / Conservative</option>
              <option value="green">Green / Environmental</option>
              <option value="libertarian">Libertarian</option>
              <option value="socialist">Socialist</option>
            </select>
          </div>

          {/* Question 2: Age Range */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              2. Age range (optional)
            </label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Prefer not to say</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65+">65+</option>
            </select>
          </div>

          {/* Question 3: Country */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">
              3. Country (optional)
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="UK">United Kingdom</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!alignment}
          className="mt-8 w-full px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
