import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Rocket } from 'lucide-react';

type Side = 'left' | 'right';

interface VerticalStickyCTAProps {
  side?: Side;
  topOffset?: string;
}

export const VerticalStickyCTA = ({
  side = 'left',
  topOffset = '35%',
}: VerticalStickyCTAProps) => {
  const [visible, setVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const isLeft = side === 'left';

  return (
    <div
      className="fixed z-50 flex items-start"
      style={{
        left: isLeft ? 0 : 'auto',
        right: !isLeft ? 0 : 'auto',
        top: topOffset,
      }}
    >
      <div
        className="relative flex items-start transition-transform duration-300"
        style={{
          transform: visible
            ? isCollapsed
              ? `translateX(${isLeft ? '-100%' : '100%'})`
              : 'translateX(0)'
            : `translateX(${isLeft ? '-100%' : '100%'})`,
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Collapsible Hide/Show Trigger Tab */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2 py-3 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs cursor-pointer z-50 flex items-center justify-center transition-transform hover:scale-110 flex-shrink-0"
          style={{
            order: isLeft ? 2 : 1,
          }}
          title={isCollapsed ? 'Show Quick Action' : 'Hide Quick Action'}
        >
          {isLeft ? (
            isCollapsed ? <ChevronRight className="w-4 h-4 text-[#121316]" /> : <ChevronLeft className="w-4 h-4 text-[#121316]" />
          ) : (
            isCollapsed ? <ChevronLeft className="w-4 h-4 text-[#121316]" /> : <ChevronRight className="w-4 h-4 text-[#121316]" />
          )}
        </button>

        {/* Main Vertical CTA Button */}
        <div
          className="flex flex-col items-center bg-[#0F534A] text-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-2 space-y-3 flex-shrink-0"
          style={{
            order: isLeft ? 1 : 2,
          }}
        >
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-[#9EFC5F] animate-ping absolute inset-0" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#9EFC5F] border border-[#121316]" />
        </div>

        <a
          href="/campaigns"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="font-sans font-black text-xs uppercase tracking-widest px-3 py-6 text-center transition-all cursor-pointer flex items-center justify-center gap-2 text-[#121316]"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            background: hovered ? '#FE4E1A' : '#FFDD33',
            border: '2px solid #121316',
          }}
        >
          <Rocket className="w-4 h-4 text-[#121316] rotate-90 mb-2" /> SUPPORT DREAMS
        </a>
      </div>
    </div>
  </div>
);
};