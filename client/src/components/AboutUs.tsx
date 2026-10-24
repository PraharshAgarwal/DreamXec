import { useNavigate } from 'react-router-dom';
import { FooterContent } from '../sections/Footer/components/FooterContent';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const CORE_VALUES = [
  {
    emoji: '🌱',
    title: 'Belief in Potential',
    body: 'We see possibility in every student idea—regardless of background, college, or connections.',
    accent: '#FE4E1A',
  },
  {
    emoji: '🤝',
    title: 'Community Over Competition',
    body: 'Students, mentors, and backers grow together—collaboration beats rivalry.',
    accent: '#0F534A',
  },
  {
    emoji: '🚀',
    title: 'Impact First',
    body: 'Success is measured by real outcomes—careers built, startups launched, and problems solved.',
    accent: '#4717AE',
  },
];

const STATS = [
  { value: '40M+', label: 'College Students in India' },
  { value: '5M+', label: 'Actively Wanting to Innovate' },
  { value: '0.1%', label: 'Receive Meaningful Funding' },
  { value: '2030', label: 'Target: 1M Students Funded' },
];

const AboutUs = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  return (
    <div className="min-h-screen pt-20 bg-[#FCFBF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <div className="text-center relative">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-4 w-10 h-10 rotate-12 opacity-20 pointer-events-none border-4 border-[#FE4E1A]" />
          <div className="absolute top-8 right-6 w-7 h-7 rotate-45 opacity-20 pointer-events-none bg-[#0F534A]" />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-[10px] font-headline font-black uppercase tracking-[0.25em] text-white bg-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#FFDD33]">
            🇮🇳 DreamXec — Student Innovation Platform
          </div>

          <h1
            className="text-4xl md:text-6xl font-headline font-black text-[#0F534A] uppercase leading-none tracking-tight mb-6 mx-auto max-w-4xl"
          >
            Research Karega India{' '}
            <span className="inline-block px-2 bg-[#FE4E1A] text-white shadow-[3px_3px_0_#121316] border-2 border-[#121316]">
              Toh Badhega India
            </span>
          </h1>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-base md:text-lg font-bold text-[#0F534A]/80 leading-relaxed font-sans">
              DreamXec is India's student innovation crowdfunding platform.
            </p>
            <p className="text-base md:text-lg font-bold text-[#0F534A]/80 leading-relaxed font-sans">
              We fund ideas, connect mentors, and help students turn research and curiosity into real-world impact.
            </p>
          </div>

          {/* Tricolor strip */}
          <div className="flex h-2 max-w-xs mx-auto mt-8 border-2 border-[#121316]">
            <div className="flex-1 bg-[#FE4E1A]" />
            <div className="flex-1 bg-[#FFDD33]" />
            <div className="flex-1 bg-[#0F534A]" />
          </div>
        </div>

        {/* ══════════════════════════════════
            MISSION & VISION
        ══════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            {/* Section label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 text-[10px] font-headline font-black uppercase tracking-widest text-white bg-[#FE4E1A] border-2 border-[#121316]">
              Our Mission & Vision
            </div>

            <h2 className="text-3xl md:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight leading-tight mb-6">
              Democratizing Access to{' '}
              <span className="inline-block px-1 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316]">
                Opportunity
              </span>
            </h2>

            <div
              className="space-y-4 p-6 bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A]"
            >
              <p className="text-sm font-bold text-gray-700 leading-relaxed text-justify">
                Our mission is to democratize access to funding and mentorship for student innovators across India.
                We believe that great ideas are not limited by college rankings, cities, or personal networks.
                Talent exists everywhere—opportunity does not.
              </p>
              <div className="h-0.5 bg-[#FE4E1A]/40" />
              <p className="text-sm font-bold text-gray-700 leading-relaxed text-justify">
                By 2030, DreamXec aims to enable over one million Indian students to launch, fund,
                and execute innovation projects—building startups, creating jobs, filing patents,
                and solving real problems.
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div
              className="absolute -inset-3 pointer-events-none bg-[#FE4E1A]/10 border-3 border-dashed border-[#FE4E1A]"
            />
            <img
              src="/assets/identity_hero_students.webp"
              alt="Students collaborating"
              className="relative w-full h-auto object-cover border-4 border-[#121316] shadow-[8px_8px_0_#0F534A]"
            />
          </div>
        </div>

        {/* ══════════════════════════════════
            STATS — PROBLEM STATEMENT
        ══════════════════════════════════ */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-[10px] font-headline font-black uppercase tracking-widest text-white bg-[#0F534A] border-2 border-[#121316]">
              The Gap We're Closing
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight mb-4">
              India's Student{' '}
              <span className="inline-block px-1 bg-[#FE4E1A] text-white border-2 border-[#121316]">
                Innovation Gap
              </span>
            </h2>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {STATS.map(({ value, label }, i) => {
              const accents = ['#FE4E1A', '#0F534A', '#4717AE', '#FFDD33'];
              return (
                <div
                  key={label}
                  className="bg-white flex flex-col items-center justify-center text-center p-5 border-3 border-[#121316] transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  style={{ boxShadow: `5px 5px 0 ${accents[i]}` }}
                >
                  <p className="text-3xl md:text-4xl font-headline font-black text-[#0F534A] leading-none mb-1">{value}</p>
                  <p className="text-[10px] font-headline font-black uppercase tracking-widest text-gray-500">{label}</p>
                </div>
              );
            })}
          </div>

          {/* Text block */}
          <div
            className="p-6 bg-white max-w-4xl mx-auto border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A]"
          >
            <p className="text-sm font-bold text-gray-700 leading-relaxed mb-3 text-center">
              Traditional banks consider student projects too risky. Venture capital focuses only on large-ticket
              opportunities. Mentorship remains gatekept by networks rather than merit.
            </p>
            <div className="flex h-1 mb-3 max-w-xs mx-auto border border-[#121316]">
              <div className="flex-1 bg-[#FE4E1A]" />
              <div className="flex-1 bg-[#4717AE]" />
              <div className="flex-1 bg-[#0F534A]" />
            </div>
            <p className="text-sm font-bold text-gray-700 leading-relaxed text-center">
              Global platforms are expensive and not built for Indian students. The ideas exist.
              The students exist. What's missing is the right platform. <strong className="text-[#0F534A]">DreamXec exists to close this gap.</strong>
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════
            CORE VALUES CAROUSEL
        ══════════════════════════════════ */}
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-[10px] font-headline font-black uppercase tracking-widest text-white bg-[#0F534A] border-2 border-[#121316]">
              What We Stand For
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
              Our Core{' '}
              <span className="inline-block px-1 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316]">
                Values
              </span>
            </h2>
          </div>

          <div className="relative">
            {/* Custom nav */}
            <button
              className="swiper-values-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center font-black text-sm text-white transition-all hover:translate-x-[-2px] bg-[#0F534A] border-3 border-[#121316] shadow-[3px_3px_0_#FE4E1A] cursor-pointer"
            >←</button>
            <button
              className="swiper-values-next absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center font-black text-sm text-white transition-all hover:translate-x-[2px] bg-[#0F534A] border-3 border-[#121316] shadow-[3px_3px_0_#FE4E1A] cursor-pointer"
            >→</button>

            <Swiper
              modules={[Navigation, Pagination, Keyboard, A11y, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              speed={800}
              navigation={{ prevEl: '.swiper-values-prev', nextEl: '.swiper-values-next' }}
              pagination={{ clickable: true }}
              keyboard={{ enabled: true }}
              grabCursor={true}
              autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 20 },
              }}
              className="about-values-carousel !pb-10 !px-10"
            >
              {CORE_VALUES.map(({ emoji, title, body, accent }) => (
                <SwiperSlide key={title} className="h-auto">
                  <div
                    className="bg-white flex flex-col h-full p-5 border-4 border-[#121316] transition-all duration-150 hover:translate-x-[-3px] hover:translate-y-[-3px]"
                    style={{ boxShadow: `6px 6px 0 ${accent}` }}
                  >
                    {/* Top accent bar */}
                    <div className="h-1.5 -mx-5 -mt-5 mb-5 flex">
                      <div className="flex-1" style={{ background: accent }} />
                    </div>

                    <div
                      className="w-10 h-10 flex items-center justify-center text-xl mb-4 flex-shrink-0 border-2 border-[#121316]"
                      style={{ background: `${accent}22` }}
                    >
                      {emoji}
                    </div>

                    <h3 className="font-headline font-black text-sm text-[#0F534A] uppercase tracking-tight mb-3"
                      style={{ borderLeft: `3px solid ${accent}`, paddingLeft: '8px' }}>
                      {title}
                    </h3>

                    <p className="text-xs font-medium text-gray-600 leading-relaxed mt-auto px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316]">
                      {body}
                    </p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* ══════════════════════════════════
            HOW WE'RE DIFFERENT
        ══════════════════════════════════ */}
        <div
          className="p-6 md:p-10 bg-white border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A]"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-[10px] font-headline font-black uppercase tracking-widest text-white bg-[#FE4E1A] border-2 border-[#121316]">
                Why DreamXec
              </div>
              <h2 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight leading-tight">
                How We're{' '}
                <span className="inline-block px-1 bg-[#4717AE] text-white border-2 border-[#121316]">
                  Different
                </span>
              </h2>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '₹', label: 'Low pledges from ₹100' },
                { icon: '🎓', label: 'Built-in mentorship during campaigns' },
                { icon: '🇮🇳', label: 'India-specific payments & UPI integration' },
                { icon: '🔍', label: 'Transparent governance with zero hidden fees' },
                { icon: '📈', label: 'Milestone escrow outcome releases' },
                { icon: '🌐', label: 'Student-first, impact-first network' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 px-3 py-2 border-2 border-[#121316] bg-[#FCFBF7]">
                  <div className="w-8 h-8 flex items-center justify-center text-base flex-shrink-0 font-headline font-black bg-[#FE4E1A] border-2 border-[#121316] text-white">
                    {icon}
                  </div>
                  <p className="text-xs font-headline font-black text-[#0F534A] uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════
            CTA
        ══════════════════════════════════ */}
        <div
          className="text-center relative overflow-hidden p-10 md:p-14 bg-[#0F534A] border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A]"
        >
          {/* Decorative shapes */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rotate-12 opacity-10 pointer-events-none bg-[#FE4E1A] border-4 border-white" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rotate-45 opacity-10 pointer-events-none bg-[#FFDD33]" />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-[10px] font-headline font-black uppercase tracking-[0.25em] text-[#121316] bg-[#FFDD33] border-2 border-[#121316]">
            Join the Revolution
          </div>

          <h2 className="text-3xl md:text-5xl font-headline font-black text-white uppercase tracking-tight mb-4 leading-none">
            Ready to{' '}
            <span className="inline-block px-2 bg-[#FE4E1A] text-white border-2 border-[#121316]">
              Change India?
            </span>
          </h2>

          <p className="text-sm font-bold text-white/80 mb-8 max-w-xl mx-auto leading-relaxed font-sans">
            Whether you're a student with a dream or a supporter who believes in the power of youth,
            there's a place for you here.
          </p>

          {/* Tricolor strip */}
          <div className="flex h-1.5 max-w-xs mx-auto mb-8 border border-white">
            <div className="flex-1 bg-[#FE4E1A]" />
            <div className="flex-1 bg-[#FFDD33]" />
            <div className="flex-1 bg-[#9EFC5F]" />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate(role === 'DONOR' ? '/profile/setup' : '/dashboard')}
              className="px-8 py-3 font-headline font-black text-sm uppercase tracking-widest text-[#121316] bg-[#FFDD33] hover:bg-[#FE4E1A] hover:text-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer"
            >
              Get Started →
            </button>
            <button
              onClick={() => navigate('/campaigns')}
              className="px-8 py-3 font-headline font-black text-sm uppercase tracking-widest text-white border-3 border-white shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer hover:bg-white/10"
            >
              Explore Campaigns
            </button>
          </div>
        </div>

      </div>

      <FooterContent />
    </div>
  );
};

export default AboutUs;