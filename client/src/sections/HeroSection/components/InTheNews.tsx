import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────
   NEWS OUTLETS — styled text logo marks
   (same approach as NYT, Bloomberg "as seen in" sections)
───────────────────────────────────────────── */
const outlets = [
  {
    name: 'PTI',
    full: 'Press Trust of India',
    url: 'https://www.ptinews.com/story/business/crowdfunding-platform-launched-to-support-student-research-innovation/3419744',
    style: { fontFamily: 'Georgia, serif', fontWeight: 900, letterSpacing: '0.05em' },
  },
  {
    name: 'The Hindu',
    full: 'The Hindu',
    url: 'https://www.thehindu.com/education/news-from-the-world-of-education-february-28-2026/article70687301.ece/amp/',
    style: { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '-0.01em' },
  },
  {
    name: 'news18',
    full: 'News18',
    url: 'https://www.news18.com/agency-feeds/crowdfunding-platform-launched-to-support-student-research-innovation-9934069.html',
    style: { fontFamily: "'Arial Black', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' },
  },
  {
    name: 'THE WEEK',
    full: 'The Week',
    url: 'https://www.theweek.in/wire-updates/business/2026/02/27/crowdfunding-platform-launched-to-support-student-research-innovation.amp.html',
    style: { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '0.12em' },
  },
  {
    name: 'Prittle Prattle',
    full: 'Prittle Prattle News',
    url: 'https://www.prittleprattlenews.com/education/dreamxec-national-science-day-student-research-funding-2026/',
    style: { fontFamily: "'Arial', sans-serif", fontWeight: 800, letterSpacing: '0.02em' },
  },
  {
    name: 'Financial Express',
    full: 'Financial Express',
    url: 'https://www.financialexpress.com/jobs-career/education/dreamxec-indias-first-student-research-crowdfunding-platform-launched/4159420/',
    style: { fontFamily: "'Arial Black', sans-serif", fontWeight: 900, letterSpacing: '-0.02em' },
  },
];

// Duplicate for seamless loop
const marqueeItems = [...outlets, ...outlets, ...outlets];

export const InTheNews = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full mt-16 sm:mt-20 md:mt-24">

      {/* ── Section header ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-7 bg-[#FE4E1A] flex-shrink-0" />
            <div>
              <p className="text-[10px] font-headline font-black text-[#9EFC5F] uppercase tracking-[0.2em] mb-0.5">
                Media Coverage
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-headline font-black text-white uppercase tracking-tight leading-none">
                As Seen{' '}
                <span
                  className="inline-block px-2 py-0.5"
                  style={{ background: '#FFDD33', color: '#121316' }}
                >
                  In
                </span>
              </h2>
            </div>
          </div>

          {/* Stats + CTA */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/press')}
              className="px-5 py-2.5 font-headline font-black text-xs uppercase tracking-widest text-[#121316] transition-all hover:bg-[#FE4E1A] hover:text-white cursor-pointer"
              style={{ background: '#FFDD33', border: '3px solid #121316', boxShadow: '3px 3px 0 #FE4E1A' }}
            >
              View All Coverage →
            </button>
          </div>
        </div>
      </div>

      {/* ── Marquee strip ── */}
      <div
        className="w-full relative overflow-hidden py-0"
        style={{ borderTop: '3px solid #121316', borderBottom: '3px solid #121316', background: '#FCFBF7' }}
      >
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #FCFBF7 0%, transparent 100%)' }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #FCFBF7 0%, transparent 100%)' }}
        />

        {/* Scrolling track */}
        <div className="flex items-stretch">
          <div
            className="flex items-stretch animate-marquee"
            style={{ width: 'max-content' }}
          >
            {marqueeItems.map((outlet, i) => (
              <a
                key={i}
                href={outlet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-0 flex-shrink-0 transition-all duration-150"
              >
                {/* Outlet name block */}
                <div
                  className="flex items-center px-6 sm:px-8 md:px-10 py-4 sm:py-5 h-full transition-colors group-hover:bg-[#FFDD33]"
                  style={{ borderRight: '2px solid #121316' }}
                >
                  <span
                    className="text-lg sm:text-xl md:text-2xl text-[#121316] font-headline font-black transition-colors whitespace-nowrap"
                    style={outlet.style}
                  >
                    {outlet.name}
                  </span>
                </div>

                {/* Separator dot */}
                <div
                  className="w-2.5 h-2.5 flex-shrink-0 mx-0 self-center border border-[#121316]"
                  style={{ background: '#FE4E1A', margin: '0 0' }}
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Headline ticker below marquee ── */}
      <div
        className="w-full overflow-hidden"
        style={{ background: '#0F534A', borderBottom: '3px solid #121316' }}
      >
        <div className="flex items-center">
          {/* Label stamp */}
          <div
            className="flex-shrink-0 px-4 py-2 text-[10px] font-headline font-black uppercase tracking-widest text-[#121316] z-10"
            style={{ background: '#FFDD33', borderRight: '3px solid #121316' }}
          >
            📰 Latest
          </div>

          {/* Scrolling text */}
          <div className="overflow-hidden flex-1">
            <div className="flex animate-ticker whitespace-nowrap">
              {[
                '"Crowdfunding Platform Launched to Support Student Research & Innovation" — PTI',
                '★',
                '"DreamXec on National Science Day — Student Research Funding 2026" — Prittle Prattle News',
                '★',
                '"News from the World of Education, Feb 28 2026" — The Hindu',
                '★',
                '"Crowdfunding Platform Launched to Support Student Research" — News18',
                '★',
                '"Crowdfunding Platform Launched to Support Student Innovation" — The Week',
                '★',
                '"DreamXec, India’s first student research crowdfunding platform, launched" — Financial Express',
                '★',
              ].map((item, i) => (
                <span
                  key={i}
                  className="inline-block px-6 py-2 text-xs font-headline font-bold text-[#9EFC5F] whitespace-nowrap"
                >
                  {item}
                </span>
              ))}
              {/* Duplicate for loop */}
              {[
                '"Crowdfunding Platform Launched to Support Student Research & Innovation" — PTI',
                '★',
                '"DreamXec on National Science Day — Student Research Funding 2026" — Prittle Prattle News',
                '★',
                '"News from the World of Education, Feb 28 2026" — The Hindu',
                '★',
                '"Crowdfunding Platform Launched to Support Student Research" — News18',
                '★',
                '"Crowdfunding Platform Launched to Support Student Innovation" — The Week',
                '★',
                '"DreamXec, India’s first student research crowdfunding platform, launched" — Financial Express',
                '★',
              ].map((item, i) => (
                <span
                  key={`b-${i}`}
                  className="inline-block px-6 py-2 text-xs font-headline font-bold text-[#9EFC5F] whitespace-nowrap"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 22s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 35s linear infinite;
        }
      `}</style>
    </section>
  );
};