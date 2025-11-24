'use client';

import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';

interface DartingLoaderProps {
  message: string;
}

export default function DartingLoader({ message }: DartingLoaderProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    // Generate a new random target position every 800ms
    const interval = setInterval(() => {
      setTargetPosition({
        x: Math.random() * 80 + 10, // 10-90% range
        y: Math.random() * 60 + 20, // 20-80% range
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Smoothly move towards target position
    const interval = setInterval(() => {
      setPosition((current) => {
        const dx = targetPosition.x - current.x;
        const dy = targetPosition.y - current.y;
        const speed = 0.15; // Adjust for smoother/faster movement

        return {
          x: current.x + dx * speed,
          y: current.y + dy * speed,
        };
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [targetPosition]);

  return (
    <div className="fixed inset-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
      {/* Darting icon */}
      <div
        className="absolute transition-all duration-200 ease-out"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="animate-bounce">
          <Brain className="w-12 h-12 text-orange-500 animate-pulse" />
        </div>
      </div>

      {/* Message at bottom */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
