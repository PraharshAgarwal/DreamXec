import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Keyboard, A11y, Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

const criteria = [
  {
    title: "Merit First",
    text: "Ideas are judged by potential, not pedigree. Whether you're from IIT or a tier-3 college, if your project has merit, you get funded.",
    icon: "/assets/icon-pack/DX-ILLUSTRATION-PACK/3.svg",
    shadow: "#FF7F00", stripe: "#FF7F00", num: "01",
  },
  {
    title: "Transparency",
    text: "Every rupee is tracked. Every milestone is public. No hidden fees, no opacity—just honest impact.",
    icon: "/assets/icon-pack/DX-ILLUSTRATION-PACK/4.svg",
    shadow: "#0B9C2C", stripe: "#0B9C2C", num: "02",
  },
  {
    title: "Gurukul Spirit",
    text: "Like ancient Gurukuls where teachers and students co-created knowledge, DreamXec connects generations — alumni mentoring students, corporates enabling research.",
    icon: "/assets/icon-pack/DX-ILLUSTRATION-PACK/5.svg",
    shadow: "#003366", stripe: "#003366", num: "03",
  },
  {
    title: "Atmanirbhar Bharat",
    text: "We're building India's self-reliance in innovation. Not waiting for foreign funding, not copying Silicon Valley — creating our own model rooted in Indian context.",
    icon: "/assets/icon-pack/DX-ILLUSTRATION-PACK/6.svg",
    shadow: "#FF7F00", stripe: "#FF7F00", num: "04",
  },
  {
    title: "UN SDG Alignment",
    text: "Every project must contribute to at least one Sustainable Development Goal. Innovation for profit AND purpose.",
    icon: "/assets/icon-pack/DX-ILLUSTRATION-PACK/7.svg",
    shadow: "#0B9C2C", stripe: "#0B9C2C", num: "05",
  },
  {
    title: "Community First",
    text: "Students aren't 'users,' donors aren't 'customers'—we're all stakeholders in India's future.",
    icon: "/assets/icon-pack/DX-ILLUSTRATION-PACK/20.svg",
    shadow: "#003366", stripe: "#003366", num: "06",
  },
];

export const CriteriaGrid = () => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    /* No px-4 here — this div is full width of whatever the section gives us */
    <div className="w-full">

      {/* HEADING — constrained width, padded */}
      <div className="max-w-6xl mx-auto px-4 mt-[10%]">
        <div className="text-center mb-10 sm:mb-12 md:mb-14">
          <div className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-white"
              style={{ background: '#003366', border: '2px solid #003366' }}
            >
              ★ DreamXec Principles
            </span>
          </div>

          <h2 className="font-black leading-tight mb-3 italic">
            <span className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-dreamxec-primary-green uppercase tracking-tight">
              Our Values
            </span>
            <span className="block mt-1 sm:mt-2">
              <span className="relative inline-block">
                <span className="absolute inset-0 translate-x-[4px] translate-y-[4px] sm:translate-x-[6px] sm:translate-y-[6px]" style={{ background: '#0B9C2C' }} aria-hidden />
                <span className="relative z-10 inline-block px-3 sm:px-5 py-1 text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white font-black uppercase tracking-tight" style={{ background: '#003366', border: '3px solid #003366' }}>
                  & Principles
                </span>
              </span>
            </span>
          </h2>

          <p className="inline-block mt-5 sm:mt-6 px-4 sm:px-5 py-2 text-xs sm:text-sm md:text-base font-black text-dreamxec-primary-green uppercase tracking-wide" style={{ border: '2px dashed #0F534A', background: '#EBE7DF' }}>
            We seek students and young professionals whose projects embody these principles
          </p>
        </div>
      </div>

      {/* CAROUSEL — truly full width, arrows pinned to screen edges */}
      <div className="mt-10 relative w-full overflow-hidden">

        {/* Left arrow */}
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white transition-all hover:bg-[#003366] hover:translate-x-[-1px] hover:translate-y-[-1px] group"
          style={{ border: '3px solid #003366', boxShadow: '3px 3px 0 #FF7F00' }}
          aria-label="Previous"
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

        {/* Right arrow */}
        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white transition-all hover:bg-[#003366] hover:translate-x-[-1px] hover:translate-y-[-1px] group"
          style={{ border: '3px solid #003366', boxShadow: '3px 3px 0 #FF7F00' }}
          aria-label="Next"
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

        <Swiper
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          modules={[Pagination, Keyboard, A11y, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          speed={700}
          loop={true}
          keyboard={{ enabled: true }}
          grabCursor={true}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true, el: '.criteria-pagination' }}
          breakpoints={{
            768:  { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 2, spaceBetween: 28 },
          }}
          /* padding keeps cards from sitting behind the arrows */
          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
          className="criteria-carousel"
        >
          {criteria.map((item, index) => (
            <SwiperSlide key={index} className="h-auto">
              <div
                className="bg-white flex flex-col h-full transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px]"
                style={{ border: '3px solid #003366', boxShadow: `6px 6px 0 ${item.shadow}` }}
              >
                <div className="h-2" style={{ background: item.stripe }} />
                <div className="flex items-center justify-center flex-1 p-4 sm:p-5 md:p-6 gap-2">
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-black text-white text-xs sm:text-sm mb-3 flex-shrink-0" style={{ background: item.stripe, border: '2px solid #003366' }}>
                      {item.num}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-dreamxec-primary-green uppercase tracking-tight leading-snug mb-2 sm:mb-3">
                      {item.title}
                    </h3>
                    <div className="mb-2 sm:mb-3 h-0.5 w-8" style={{ background: item.stripe }} />
                    <p className="text-xs sm:text-sm text-dreamxec-primary-green/80 font-medium text-justify leading-relaxed flex-1">
                      {item.text}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 flex items-center justify-center"
                      style={{ border: `2px solid ${item.stripe}`, background: `${item.stripe}10` }}
                    >
                      <img src={item.icon} alt={`${item.title} icon`} className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center mt-6">
        <div className="criteria-pagination flex items-center justify-center gap-0" />
      </div>

      <style>{`
        .criteria-carousel .swiper-button-next,
        .criteria-carousel .swiper-button-prev { display: none; }

        .criteria-pagination .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: #fff;
          border: 2px solid #003366;
          border-radius: 0;
          opacity: 1;
          margin: 0 4px;
          display: inline-block;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
        }
        .criteria-pagination .swiper-pagination-bullet-active {
          background: #FF7F00;
          border-color: #003366;
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
};