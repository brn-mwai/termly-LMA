'use client';

import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const THINKING_PHRASES = [
  'Analyzing your request',
  'Searching the database',
  'Processing information',
  'Crunching the numbers',
  'Looking through covenants',
  'Reviewing loan data',
  'Checking compliance status',
  'Gathering insights',
  'Running calculations',
  'Almost there',
];

export function ThinkingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
        setIsTransitioning(false);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-3 px-1 py-2">
        {/* Lottie Animation */}
        <div className="h-8 w-8 flex-shrink-0">
          <DotLottieReact
            src="https://lottie.host/8250085d-48c5-4b65-aa27-492d6bb6a3cd/DE7FFcUHae.lottie"
            autoplay
            loop
            className="w-full h-full"
          />
        </div>

        {/* Animated Gradient Text */}
        <div className="flex items-center gap-1.5">
          <span
            className={`
              text-sm font-medium
              bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500
              dark:from-gray-400 dark:via-gray-300 dark:to-gray-400
              bg-[length:200%_100%]
              animate-gradient-x
              bg-clip-text text-transparent
              transition-opacity duration-300
              ${isTransitioning ? 'opacity-0' : 'opacity-100'}
            `}
          >
            {THINKING_PHRASES[phraseIndex]}
          </span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-400 dark:to-gray-300 animate-bounce [animation-delay:0ms]" />
            <span className="h-1 w-1 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-400 dark:to-gray-300 animate-bounce [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-400 dark:to-gray-300 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}
