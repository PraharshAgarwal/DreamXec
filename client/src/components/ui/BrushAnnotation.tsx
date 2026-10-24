import React from 'react';

export type BrushAnnotationType = 'tag' | 'underline' | 'circle' | 'highlight';
export type BrushColor = 'orange' | 'yellow' | 'forest' | 'pink' | 'blue';

export interface BrushAnnotationProps {
  children: React.ReactNode;
  type?: BrushAnnotationType;
  color?: BrushColor;
  rotate?: number;
  className?: string;
}

export const BrushAnnotation: React.FC<BrushAnnotationProps> = ({
  children,
  type = 'tag',
  color = 'orange',
  rotate = -2,
  className = '',
}) => {
  const colorMap: Record<BrushColor, { text: string; bg: string; stroke: string }> = {
    orange: { text: 'text-[#FE4E1A]', bg: 'bg-[#FE4E1A]', stroke: '#FE4E1A' },
    yellow: { text: 'text-[#B8860B]', bg: 'bg-[#FFDD33]', stroke: '#FFDD33' },
    forest: { text: 'text-[#0F534A]', bg: 'bg-[#0F534A]', stroke: '#0F534A' },
    pink: { text: 'text-[#D81B60]', bg: 'bg-[#FEB3FC]', stroke: '#FEB3FC' },
    blue: { text: 'text-[#00838F]', bg: 'bg-[#18D7E8]', stroke: '#18D7E8' },
  };

  const selectedColor = colorMap[color];

  if (type === 'highlight') {
    return (
      <span
        className={`font-headline font-bold px-1 relative inline-block ${className}`}
        style={{
          background: `linear-gradient(180deg, transparent 60%, ${selectedColor.stroke} 60%)`,
        }}
      >
        {children}
      </span>
    );
  }

  if (type === 'underline') {
    return (
      <span className={`relative inline-block ${className}`}>
        <span>{children}</span>
        <svg
          className="absolute left-0 -bottom-2 w-full h-3 overflow-visible pointer-events-none"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
        >
          <path
            d="M 2,8 Q 50,1 98,6"
            stroke={selectedColor.stroke}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
    );
  }

  if (type === 'circle') {
    return (
      <span className={`relative inline-block px-2 py-0.5 ${className}`}>
        <span>{children}</span>
        <svg
          className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible pointer-events-none"
          viewBox="0 0 120 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 5,20 C 5,5 115,5 115,20 C 115,35 5,35 5,20 Z"
            stroke={selectedColor.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="4 2"
          />
        </svg>
      </span>
    );
  }

  // Default: 'tag' with Badlooking Brush handwritten font
  return (
    <span
      className={`font-brush inline-block select-none ${selectedColor.text} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
};
