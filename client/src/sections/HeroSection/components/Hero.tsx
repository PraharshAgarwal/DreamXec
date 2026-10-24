import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Rocket, PlusCircle, Sparkles, ShieldCheck, GraduationCap, Coins } from 'lucide-react';
import TypingEffect from '../../../components/TypingEffect';

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center text-white">
      
      {/* ════════════════════════════════
          EYEBROW BADGE
      ════════════════════════════════ */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider mb-6 animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-[#0F534A]" />
        India's Collegiate Deep-Tech &amp; Research Network
      </div>

      {/* ════════════════════════════════
          MASTER HEADLINE BLOCK
      ════════════════════════════════ */}
      <div className="flex flex-col items-center mb-8 text-center space-y-4 z-10 max-w-4xl">
        
        {/* Primary Headline */}
        <h1 className="font-headline font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white uppercase tracking-tight leading-[0.95] drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          BEING CURIOUS <span className="text-[#9EFC5F] italic">IS ALL IT TAKES</span>
        </h1>

        {/* Dynamic Typing Subtitle */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xl sm:text-3xl md:text-4xl font-headline font-black text-[#FFDD33] uppercase tracking-tight">
            Igniting India's Next Generation of
          </span>
          <span className="inline-block px-3 py-1 bg-white text-[#0F534A] font-headline font-black text-xl sm:text-3xl uppercase tracking-tight border-2 border-[#121316] shadow-[3px_3px_0_#FE4E1A] rounded-lg">
            <TypingEffect />
          </span>
        </div>

        {/* Mission Statement */}
        <p className="text-sm sm:text-base md:text-lg font-medium text-emerald-100 max-w-2xl mx-auto pt-2 leading-relaxed">
          <strong className="text-[#FFDD33] font-bold">Research Karega India, Toh Badhega India.</strong> Backing university labs, student robotics, and deep-tech innovation through verified milestone escrow, academic mentorship, and community-powered grants.
        </p>
      </div>

      {/* ════════════════════════════════
          CALL TO ACTION BUTTONS
      ════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8 z-10">
        <button
          onClick={() => navigate('/campaigns')}
          className="px-7 py-3.5 bg-[#9EFC5F] hover:bg-[#FFDD33] text-[#0F534A] font-headline font-black text-sm uppercase tracking-wider border-2 border-[#121316] shadow-[4px_4px_0_#FE4E1A] transition-all hover:-translate-y-0.5 inline-flex items-center gap-2.5 cursor-pointer rounded-xl"
        >
          <Rocket className="w-4 h-4 text-[#0F534A]" /> Explore Live Innovations <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/create')}
          className="px-7 py-3.5 bg-white hover:bg-[#FFDD33] text-[#121316] font-headline font-black text-sm uppercase tracking-wider border-2 border-[#121316] shadow-[4px_4px_0_#0F534A] transition-all hover:-translate-y-0.5 inline-flex items-center gap-2.5 cursor-pointer rounded-xl"
        >
          <PlusCircle className="w-4 h-4 text-[#FE4E1A]" /> Submit Student Project
        </button>
      </div>

      {/* ════════════════════════════════
          TRUST PILLARS
      ════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12 z-10">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0F534A]/80 border border-emerald-400/40 rounded-full text-xs font-medium text-emerald-100 backdrop-blur-sm">
          <GraduationCap className="w-3.5 h-3.5 text-[#FFDD33]" />
          <span>Faculty &amp; Lab Mentorship</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0F534A]/80 border border-emerald-400/40 rounded-full text-xs font-medium text-emerald-100 backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9EFC5F]" />
          <span>Dual-Custody Milestone Escrow</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0F534A]/80 border border-emerald-400/40 rounded-full text-xs font-medium text-emerald-100 backdrop-blur-sm">
          <Coins className="w-3.5 h-3.5 text-[#18D7E8]" />
          <span>Transparent Ledger Backing</span>
        </div>
      </div>

      {/* ════════════════════════════════
          REFINED DUAL SHOWCASE CARDS
      ════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Card 1: Curious Student Researcher */}
        <div className="group bg-white text-[#121316] border-2 border-[#121316] shadow-[5px_5px_0_#9EFC5F] p-4 rounded-2xl transition-all hover:-translate-y-1">
          <div className="relative h-56 sm:h-64 overflow-hidden border-2 border-[#121316] rounded-xl">
            <img
              src="/assets/curious_student_hero.webp"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80';
              }}
              alt="Curious Student Researcher"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 font-headline font-black text-[11px] uppercase shadow-[2px_2px_0_#121316] rounded">
              #BeingCurious
            </div>
            <div className="absolute bottom-3 right-3 bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316] px-3 py-1 font-brush text-sm shadow-[2px_2px_0_#121316] rounded">
              Idea to Impact
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="font-headline font-black text-base sm:text-lg text-[#0F534A] uppercase">
              Student Lab &amp; Hardware Innovators
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              From drone telemetry to agricultural robotics—turn university prototypes into funded research breakthroughs.
            </p>
          </div>
        </div>

        {/* Card 2: Faculty & Lab Validation */}
        <div className="group bg-white text-[#121316] border-2 border-[#121316] shadow-[5px_5px_0_#FE4E1A] p-4 rounded-2xl transition-all hover:-translate-y-1">
          <div className="relative h-56 sm:h-64 overflow-hidden border-2 border-[#121316] rounded-xl">
            <img
              src="/assets/student_robotics_hero.webp"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
              }}
              alt="Faculty and Lab Validation"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 bg-[#FE4E1A] text-white border-2 border-[#121316] px-2.5 py-0.5 font-headline font-black text-[11px] uppercase shadow-[2px_2px_0_#121316] rounded">
              #SmartEscrow
            </div>
            <div className="absolute bottom-3 right-3 bg-[#4717AE] text-[#FEB3FC] border-2 border-[#121316] px-3 py-1 font-brush text-sm shadow-[2px_2px_0_#121316] rounded">
              Verified Proofs
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="font-headline font-black text-base sm:text-lg text-[#0F534A] uppercase">
              Faculty Endorsed &amp; Tranche Escrow
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              Every milestone is verified by university mentors and platform arbiters before escrow funds disburse.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Hero;