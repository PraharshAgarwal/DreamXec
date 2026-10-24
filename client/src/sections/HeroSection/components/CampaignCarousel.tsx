import { useEffect, useRef, useState } from "react";
import { useHeroCampaigns, type HeroCampaign } from "../../../hooks/useHeroCampaigns";
import { CampaignCard } from "./CampaignCard";
import { SkeletonCard } from "./SkeletonCard";

const SPEED = 1;

const LazyCampaignCardWrapper = ({
  campaign,
  rootRef
}: {
  campaign: HeroCampaign;
  rootRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Once visible, load the card content permanently
        }
      },
      {
        root: rootEl || null, // Observe relative to the scroll container
        rootMargin: "150px",  // Pre-load slightly before entering the screen for smooth sliding
        threshold: 0.01
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [rootRef]);

  return (
    <div ref={elementRef} className="w-full h-full">
      {isVisible ? (
        <CampaignCard campaign={campaign} />
      ) : (
        <SkeletonCard />
      )}
    </div>
  );
};

export const CampaignCarousel = () => {
  const { data, loading, error } = useHeroCampaigns();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const items = data.length > 0 ? [...data, ...data, ...data] : [];

  const checkScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 10);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const container = containerRef.current;
    let lastCheck = 0;

    const animate = () => {
      if (!isPausedRef.current && container) {
        container.scrollLeft += SPEED;
        const maxScroll = container.scrollWidth / 3;
        if (container.scrollLeft >= maxScroll) container.scrollLeft = 0;
        const now = Date.now();
        if (now - lastCheck > 100) { checkScroll(); lastCheck = now; }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [data.length]);

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;
    isPausedRef.current = true;
    const targetScroll = direction === 'left'
      ? container.scrollLeft - 350
      : container.scrollLeft + 350;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setTimeout(() => { isPausedRef.current = false; checkScroll(); }, 500);
  };

  return (
    <div className="w-full">

      {/* ── SECTION HEADING ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">

          {/* Left: title stack */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                style={{ background: '#003366', border: '2px solid #003366' }}
              >
                ★ Live Now
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-dreamxec-primary-purple"
                style={{ border: '2px solid #003366', background: '#fff7ed' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF7F00' }} />
                Active Campaigns
              </span>
            </div>

            <h2 className="font-black leading-none">
              <span className="block text-2xl sm:text-3xl md:text-4xl text-dreamxec-primary-purple uppercase tracking-tight">
                Featured
              </span>
              <span className="relative inline-block mt-1">
                <span
                  className="absolute inset-0 translate-x-[4px] translate-y-[4px]"
                  style={{ background: '#0B9C2C' }}
                  aria-hidden
                />
                <span
                  className="relative z-10 inline-block px-3 py-0.5 text-2xl sm:text-3xl md:text-4xl text-white font-black uppercase tracking-tight"
                  style={{ background: '#003366', border: '3px solid #003366' }}
                >
                  Campaigns
                </span>
              </span>
            </h2>
          </div>

          {/* Right: subtle label */}
          <p className="text-[10px] sm:text-xs font-black text-dreamxec-primary-purple/40 uppercase tracking-widest pb-1 hidden sm:block">
            Scroll to explore →
          </p>
        </div>

        {/* Accent rule */}
        <div className="flex items-center gap-2 mt-4 mb-0">
          <div className="h-1 w-10" style={{ background: '#FF7F00' }} />
          <div className="h-1 w-4" style={{ background: '#003366' }} />
          <div className="h-1 w-2" style={{ background: '#0B9C2C' }} />
        </div>
      </div>

      {/* ── CAROUSEL ── */}
      <div className="mt-6 relative w-full overflow-hidden">

        {/* Error state */}
        {error && (
          <div
            className="mx-4 mb-4 px-4 py-3 flex items-center gap-3 bg-white text-dreamxec-primary-purple font-black text-xs uppercase tracking-wide"
            style={{ border: '2px solid #003366', boxShadow: '3px 3px 0 #FF7F00' }}
          >
            <span className="text-base">🕐</span>
            <span>Campaigns are on their way — check back in a moment.</span>
          </div>
        )}

        {/* Left arrow */}
        {!loading && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white transition-all hover:bg-dreamxec-primary-purple hover:translate-x-[-1px] hover:translate-y-[-1px] group"
            style={{ border: '3px solid #003366', boxShadow: '3px 3px 0 #FF7F00' }}
            aria-label="Scroll left"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path
                d="M8 2L2 8L8 14"
                stroke="#003366"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-white transition-colors duration-150"
              />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {!loading && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white transition-all hover:bg-dreamxec-primary-purple hover:translate-x-[-1px] hover:translate-y-[-1px] group"
            style={{ border: '3px solid #003366', boxShadow: '3px 3px 0 #FF7F00' }}
            aria-label="Scroll right"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path
                d="M2 2L8 8L2 14"
                stroke="#003366"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-white transition-colors duration-150"
              />
            </svg>
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={containerRef}
          onScroll={checkScroll}
          onMouseEnter={() => (isPausedRef.current = true)}
          onMouseLeave={() => (isPausedRef.current = false)}
          onTouchStart={() => (isPausedRef.current = true)}
          onTouchEnd={() => (isPausedRef.current = false)}
          className="flex gap-4 sm:gap-5 px-6 sm:px-8 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2"
          style={{ alignItems: 'stretch', scrollBehavior: 'auto' }}
        >
          {/* Skeleton */}
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px]">
                <SkeletonCard />
              </div>
            ))}

          {/* Empty State when no campaigns are live */}
          {!loading && data.length === 0 && (
            <div className="w-full max-w-2xl mx-auto my-4 p-8 bg-white border-4 border-[#003366] shadow-[6px_6px_0px_#FF7F00] text-center space-y-4">
              <div className="inline-block px-3 py-1 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] text-[10px] font-headline font-black uppercase tracking-widest shadow-[2px_2px_0px_#121316]">
                ✦ Live Research Telemetry Active
              </div>
              <h3 className="font-headline font-black text-2xl sm:text-3xl text-[#003366] uppercase tracking-tight">
                New Student Campaigns Launching Soon
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 font-medium max-w-md mx-auto leading-relaxed">
                Be the first innovator to launch an official research or engineering initiative on DreamXec.
              </p>
              <div className="pt-2">
                <a
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                >
                  <span>+ Start A Campaign</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          )}

          {/* Cards */}
          {!loading &&
            items.map((campaign, i) => (
              <div
                key={`${campaign.id}-${i}`}
                className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px] h-auto"
              >
                <LazyCampaignCardWrapper campaign={campaign} rootRef={containerRef} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};