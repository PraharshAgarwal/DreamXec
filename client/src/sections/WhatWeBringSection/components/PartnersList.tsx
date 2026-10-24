import React from 'react';
import { ArrowRight } from 'lucide-react';

export const PartnersList = () => {
  const steps = [
    { day: "Day 0", role: "PARTNERS" },
    { day: "Day 1", role: "ENABLERS" },
    { day: "Day ∞", role: "CO-BUILDERS" },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 py-6 flex-wrap">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center text-center px-3">
            <span className="text-xs sm:text-base font-semibold text-gray-500 font-sans">
              {step.day}
            </span>
            <span className="text-sm sm:text-lg font-black text-[#0F534A] font-headline uppercase tracking-wide">
              {step.role}
            </span>
          </div>

          {idx < steps.length - 1 && (
            <div className="flex items-center text-[#FE4E1A]">
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
