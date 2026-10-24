import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

const INDIA = { code: 'in', name: 'India', value: 255 };

const COUNTRIES = [
  { code: 'kr', name: 'S. Korea', value: 8714 },
  { code: 'dk', name: 'Denmark',  value: 7953 },
  { code: 'us', name: 'USA',      value: 4412 },
  { code: 'cn', name: 'China',    value: 1307 },
  { code: 'br', name: 'Brazil',   value: 888  },
];

function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      width={size}
      height={size * 0.67}
      alt={code.toUpperCase()}
      style={{ objectFit: 'cover', borderRadius: 2, display: 'block' }}
    />
  );
}

function FlipDigit({ digit, isRed }: { digit: string; isRed: boolean }) {
  const [current, setCurrent] = useState(digit);
  const [next, setNext] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevRef.current) {
      setNext(digit);
      setFlipping(true);
      const t = setTimeout(() => {
        setCurrent(digit);
        setFlipping(false);
        prevRef.current = digit;
      }, 340);
      return () => clearTimeout(t);
    }
  }, [digit]);

  const bg  = isRed ? '#dc2626' : '#003366';
  const bdr = isRed ? '#991b1b' : '#001a4d';
  const half: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '50%',
    background: bg,
    border: `1px solid ${bdr}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: "'Courier New', monospace",
    fontWeight: 900,
    fontSize: '0.85em',
    lineHeight: 1,
  };

  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      width: '0.75em', height: '1.1em', margin: '1px 0',
      verticalAlign: 'middle', perspective: 400,
    }}>
      <span style={{ ...half, top: 0, borderBottom: 'none', alignItems: 'flex-end', paddingBottom: 1 }}>
        <span style={{ transform: 'translateY(50%)' }}>{current}</span>
      </span>
      <span style={{ ...half, bottom: 0, borderTop: 'none', alignItems: 'flex-start', paddingTop: 1 }}>
        <span style={{ transform: 'translateY(-50%)' }}>{current}</span>
      </span>
      <span style={{
        position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5,
        background: 'rgba(0,0,0,0.35)', zIndex: 5, transform: 'translateY(-50%)',
      }} />
      {flipping && (
        <span style={{ ...half, top: 0, borderBottom: 'none', alignItems: 'flex-end', paddingBottom: 1,
          transformOrigin: 'bottom center', animation: 'flipDown 0.34s ease-in forwards', zIndex: 6 }}>
          <span style={{ transform: 'translateY(50%)' }}>{next}</span>
        </span>
      )}
      {flipping && (
        <span style={{ ...half, bottom: 0, borderTop: 'none', alignItems: 'flex-start', paddingTop: 1,
          transformOrigin: 'top center', animation: 'flipUp 0.34s ease-out forwards', zIndex: 6 }}>
          <span style={{ transform: 'translateY(-50%)' }}>{next}</span>
        </span>
      )}
    </span>
  );
}

function VerticalFlipNumber({ value, isRed }: { value: number; isRed: boolean }) {
  const str = value.toLocaleString('en-IN');
  return (
    <div className="flex flex-col items-center">
      {str.split('').map((ch, i) =>
        ch === ',' ? (
          <span key={i} style={{
            color: isRed ? '#fca5a5' : '#93c5fd',
            fontSize: '0.6em', fontWeight: 900, margin: '1px 0',
          }}>,</span>
        ) : (
          <FlipDigit key={i} digit={ch} isRed={isRed} />
        )
      )}
    </div>
  );
}

interface VerticalResearchStatsProps {
  topOffset?: string;
  leftOffset?: string;
}

export const VerticalResearchStats: React.FC<VerticalResearchStatsProps> = ({
  topOffset = '13%',
  leftOffset = '2px',
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % COUNTRIES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const other = COUNTRIES[activeIdx];

  return (
    <>
      <style>{`
        @keyframes flipDown { 0%{transform:rotateX(0deg);opacity:1} 100%{transform:rotateX(-90deg);opacity:0} }
        @keyframes flipUp   { 0%{transform:rotateX(90deg);opacity:0} 100%{transform:rotateX(0deg);opacity:1} }
      `}</style>

      <div
        className="hidden lg:block fixed z-40"
        style={{
          top: topOffset,
          left: leftOffset,
        }}
      >
        {/* STATS BOX CONTAINER SLIDING LEFT */}
        <div
          className="relative flex flex-col items-center bg-white border-3 border-[#003366] shadow-[4px_4px_0_#FF7F00] py-3 px-2 w-14 space-y-3 transition-transform duration-300"
          style={{
            transform: visible
              ? isCollapsed
                ? 'translateX(-100%)'
                : 'translateX(0)'
              : 'translateX(-100%)',
            opacity: visible ? 1 : 0,
          }}
        >
          
          {/* VERTICAL HEADER */}
          <div
            className="bg-[#003366] text-white py-2 px-1 text-center border-b-2 border-[#FF7F00] w-full flex items-center justify-center"
          >
            <span
              className="font-mono text-[9px] font-black uppercase tracking-wider block text-[#9EFC5F] whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
              }}
            >
              RESEARCHERS / MILLION
            </span>
          </div>

          {/* INDIA VERTICAL BLOCK */}
          <div className="bg-red-50/80 border border-red-300 py-2 px-1 rounded flex flex-col items-center gap-1.5 w-full">
            <FlagImg code={INDIA.code} size={20} />
            <span
              className="font-sans font-black text-[9px] uppercase text-[#dc2626] tracking-wider whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
              }}
            >
              {INDIA.name}
            </span>
            <VerticalFlipNumber value={INDIA.value} isRed={true} />
          </div>

          {/* VS DIVIDER */}
          <span className="font-mono font-black text-[10px] text-[#003366]">
            VS
          </span>

          {/* CYCLING OTHER COUNTRY VERTICAL BLOCK */}
          <div className="bg-blue-50/80 border border-blue-300 py-2 px-1 rounded flex flex-col items-center gap-1.5 w-full">
            <FlagImg code={other.code} size={20} />
            <span
              className="font-sans font-black text-[9px] uppercase text-[#003366] tracking-wider whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
              }}
            >
              {other.name}
            </span>
            <VerticalFlipNumber value={other.value} isRed={false} />
          </div>

          {/* VERTICAL DOT NAV PAGER */}
          <div className="flex flex-col items-center gap-1 py-1">
            {COUNTRIES.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`w-1.5 transition-all ${
                  i === activeIdx ? 'h-4 bg-[#003366]' : 'h-1.5 bg-gray-300'
                }`}
                title={c.name}
              />
            ))}
          </div>

          {/* SOURCE ICON TOOLTIP */}
          <a
            href="https://data.worldbank.org/indicator/SP.POP.SCIE.RD.P6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono text-center text-[#FF7F00] font-black hover:underline"
            title="Source: World Bank — Researchers in R&D"
          >
            WB
          </a>

          {/* TOGGLE BUTTON ANCHORED AT ABSOLUTE LEFT-FULL (STAYS AT LEFT: 0 WHEN COLLAPSED) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute left-full top-10 px-2 py-3 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs cursor-pointer z-50 flex items-center justify-center transition-transform hover:scale-110"
            title={isCollapsed ? 'Show Research Stats' : 'Hide Research Stats'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#121316]" /> : <ChevronLeft className="w-4 h-4 text-[#121316]" />}
          </button>
        </div>
      </div>
    </>
  );
};
