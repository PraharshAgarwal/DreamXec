import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard, A11y, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

const columns = [
  {
    title: "The Funding Gap",
    text: "₹50,000 is all it takes to turn a breakthrough idea into reality. Yet brilliant projects die every year because students can't afford equipment, prototyping, or research materials.",
    accent: "#FE4E1A",
    num: "01",
    tag: "Problem",
  },
  {
    title: "The Lost Potential",
    text: "IIT Bombay's ideaForge started as a student project. Today it's IPO-listed. But most student innovations never get the chance to scale — not because of lack of talent, but lack of funding.",
    accent: "#4717AE",
    num: "02",
    tag: "Reality",
  },
  {
    title: "The Solution",
    text: "DreamXec bridges the gap. Alumni who want to give back. Corporates seeking innovation. Students who need support. One platform, infinite possibilities.",
    accent: "#0F534A",
    num: "03",
    tag: "Our Answer",
  },
];

export const WhatWeBringSection = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <div className="w-full py-16">
      <div className="max-w-7xl mx-auto text-center">

        {/* Label */}
        <div className="flex justify-center mb-4 px-4">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-white"
            style={{ background: '#4717AE', border: '2px solid #4717AE' }}
          >
            ★ DreamXec Insight
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-black leading-tight mb-10 px-4 italic">
          <span className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-dreamxec-primary-green uppercase tracking-tight">
            Why 95% of Student Projects
          </span>
          <span className="block mt-1 sm:mt-2">
            <span className="relative inline-block">
              <span
                className="absolute inset-0 translate-x-[4px] translate-y-[4px] sm:translate-x-[6px] sm:translate-y-[6px]"
                style={{ background: '#0B9C2C' }}
                aria-hidden
              />
              <span
                className="relative z-10 inline-block px-3 sm:px-5 py-1 text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white font-black uppercase tracking-tight"
                style={{ background: '#0F534A', border: '3px solid #0F534A' }}
              >
                Die in College Labs
              </span>
            </span>
          </span>
        </h2>

        {/* ── CAROUSEL WRAPPER ── */}
        <div className="relative w-full overflow-hidden">

          {/* Left arrow — hidden on lg+ (all 3 cards visible, no scrolling needed) */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="wwb-arrow absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white transition-all hover:bg-[#4717AE] hover:translate-x-[-1px] hover:translate-y-[-1px] group"
            style={{ border: '3px solid #4717AE', boxShadow: '3px 3px 0 #FE4E1A' }}
            aria-label="Previous"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path
                d="M8 2L2 8L8 14"
                stroke="#4717AE"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-white transition-colors duration-150"
              />
            </svg>
          </button>

          {/* Right arrow — hidden on lg+ */}
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="wwb-arrow absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white transition-all hover:bg-[#4717AE] hover:translate-x-[-1px] hover:translate-y-[-1px] group"
            style={{ border: '3px solid #4717AE', boxShadow: '3px 3px 0 #FE4E1A' }}
            aria-label="Next"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path
                d="M2 2L8 8L2 14"
                stroke="#4717AE"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:stroke-white transition-colors duration-150"
              />
            </svg>
          </button>

          <Swiper
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            modules={[Pagination, Keyboard, A11y, Autoplay]}
            spaceBetween={32}
            slidesPerView={1}
            speed={800}
            loop={false}
            pagination={{ clickable: true, el: '.wwb-pagination' }}
            keyboard={{ enabled: true }}
            grabCursor={true}
            autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            breakpoints={{
              768:  { slidesPerView: 2, spaceBetween: 32 },
              1024: { slidesPerView: 3, spaceBetween: 32 },
            }}
            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
            className="whiteboard-carousel"
          >
            {columns.map((col, index) => (
              <SwiperSlide key={index} className="h-auto">
                <div
                  className="relative flex flex-col h-full text-left transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px]"
                  style={{
                    border: '3px solid #4717AE',
                    boxShadow: `6px 6px 0 ${col.accent}`,
                    background: '#FDFAF4',
                  }}
                >
                  <div className="h-2 flex-shrink-0" style={{ background: col.accent }} />

                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, #e2ddd480 28px)`,
                      backgroundPositionY: '3rem',
                      zIndex: 0,
                    }}
                  />

                  {/* <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{ left: '2.8rem', width: '2px', background: '#ffb3b380', zIndex: 1 }}
                  /> */}

                  <div className="relative z-10 flex flex-col flex-1 p-5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl leading-none" role="img" aria-label="pin">📌</span>
                      <span
                        className="text-[10px] font-black text-white px-2 py-0.5 uppercase tracking-widest"
                        style={{ background: col.accent, border: '2px solid #4717AE' }}
                      >
                        {col.num}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span
                        className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                        style={{
                          background: `${col.accent}18`,
                          border: `1.5px solid ${col.accent}`,
                          color: col.accent,
                          transform: 'rotate(-1deg)',
                          display: 'inline-block',
                        }}
                      >
                        {col.tag}
                      </span>
                    </div>

                    <div
                      className="mb-3 h-0.5 w-full"
                      style={{ background: `linear-gradient(to right, ${col.accent}, transparent)` }}
                    />

                    <h3 className="text-lg md:text-xl font-black text-dreamxec-primary-green uppercase tracking-tight leading-snug mb-3">
                      {col.title}
                    </h3>

                    <p className="text-xs md:text-sm text-dreamxec-primary-green/80 font-medium leading-relaxed flex-1">
                      {col.text}
                    </p>

                    <div
                      className="mt-5 h-4 w-12 self-end opacity-60"
                      style={{
                        background: `${col.accent}40`,
                        border: `1.5px solid ${col.accent}80`,
                        transform: 'rotate(2deg)',
                      }}
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center mt-6">
          <div className="wwb-pagination flex items-center justify-center gap-0" />
        </div>

        <style>{`
          /* Hide arrows on desktop where all 3 slides are visible */
          @media (min-width: 1024px) {
            .wwb-arrow { display: none !important; }
          }

          .whiteboard-carousel .swiper-button-next,
          .whiteboard-carousel .swiper-button-prev { display: none; }

          .wwb-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            background: #fff;
            border: 2px solid #4717AE;
            border-radius: 0;
            opacity: 1;
            margin: 0 4px;
            display: inline-block;
            cursor: pointer;
            transition: transform 0.15s, background 0.15s;
          }
          .wwb-pagination .swiper-pagination-bullet-active {
            background: #FE4E1A;
            border-color: #4717AE;
            transform: scale(1.3);
          }
        `}</style>

      </div>
    </div>
  );
};