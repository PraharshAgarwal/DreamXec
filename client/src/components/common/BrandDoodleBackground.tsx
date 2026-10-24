import React from 'react';

export const BrandDoodleBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-25">
      {/* Lightbulb Top Left */}
      <svg className="absolute top-[6%] left-[4%] w-12 h-12 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
      </svg>

      {/* Question Person Top Middle */}
      <svg className="absolute top-[4%] left-[42%] w-14 h-14 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
        <path d="M12 4a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5" />
      </svg>

      {/* Mail Envelope with Coins Top Right */}
      <svg className="absolute top-[8%] right-[18%] w-16 h-16 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
        <circle cx="18" cy="16" r="3" />
        <path d="M18 14.5v3" />
      </svg>

      {/* Stamp Document Top Right Edge */}
      <svg className="absolute top-[12%] right-[5%] w-14 h-14 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <circle cx="12" cy="14" r="3" />
        <path d="M12 11v3" />
      </svg>

      {/* Brain with Lightning Middle Left */}
      <svg className="absolute top-[35%] left-[3%] w-16 h-16 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
        <path d="M13 10l-2 3h3l-2 3" strokeWidth="2.5" />
      </svg>

      {/* Direction Arrows Center Left */}
      <svg className="absolute top-[48%] left-[22%] w-16 h-16 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M5 10l7-7 7 7M5 14l7 7 7-7" />
      </svg>

      {/* Question Person Center Right */}
      <svg className="absolute top-[42%] right-[28%] w-16 h-16 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
      </svg>

      {/* Network Nodes Right Middle */}
      <svg className="absolute top-[52%] right-[4%] w-14 h-14 text-[#9EFC5F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M10 8.5L7.5 15.5M14 8.5l2.5 7" />
      </svg>

      {/* Scribble Circle Bottom Left */}
      <svg className="absolute bottom-[10%] left-[8%] w-20 h-20 text-[#9EFC5F]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M 20 50 C 15 20, 80 15, 85 50 C 90 85, 20 90, 25 50 C 30 25, 75 30, 70 55" />
      </svg>

      {/* Scribble Underline Bottom Right */}
      <svg className="absolute bottom-[8%] right-[12%] w-24 h-12 text-[#9EFC5F]" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="3.5">
        <path d="M 5 20 Q 30 5, 50 25 T 95 15 M 10 30 Q 40 15, 85 28" />
      </svg>
    </div>
  );
};
