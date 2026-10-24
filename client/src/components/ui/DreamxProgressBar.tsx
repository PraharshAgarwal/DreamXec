import React from 'react';

export interface MilestoneMarker {
  order: number;
  percentage: number;
  label?: string;
  isCompleted?: boolean;
}

export interface DreamxProgressBarProps {
  currentAmount: number;
  targetAmount: number;
  currency?: string;
  markers?: MilestoneMarker[];
  height?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export const DreamxProgressBar: React.FC<DreamxProgressBarProps> = ({
  currentAmount,
  targetAmount,
  currency = 'INR',
  markers = [],
  height = 'md',
  showLabels = true,
  className = '',
}) => {
  const percentage = Math.min(
    100,
    targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0
  );

  const heightStyles = {
    sm: 'h-3',
    md: 'h-5',
    lg: 'h-7',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline font-black text-base md:text-lg text-[#0F534A]">
              {currency} {currentAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-500">
              raised of {currency} {targetAmount.toLocaleString()}
            </span>
          </div>
          <span className="font-headline font-black text-sm md:text-base text-[#FE4E1A]">
            {percentage}%
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div
        className={`w-full bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] relative overflow-hidden ${heightStyles[height]}`}
      >
        {/* Progress Bar Fill */}
        <div
          className="h-full bg-[#FE4E1A] transition-all duration-500 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
          {/* Subtle Neobrutalist Diagonal Striping */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #000 0, #000 4px, transparent 4px, transparent 8px)',
            }}
          />
        </div>

        {/* Milestone Pin Markers */}
        {markers.map((marker) => {
          const isPassed = percentage >= marker.percentage;
          return (
            <div
              key={marker.order}
              className="absolute top-0 bottom-0 flex items-center justify-center -translate-x-1/2 z-10 pointer-events-none"
              style={{ left: `${marker.percentage}%` }}
            >
              <div
                className={`w-1 h-full ${
                  isPassed ? 'bg-[#0F534A]' : 'bg-[#4717AE]'
                } opacity-60`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
