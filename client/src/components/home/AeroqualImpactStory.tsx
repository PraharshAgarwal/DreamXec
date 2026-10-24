import React from 'react';
import { ShieldCheck, Wind, AlertCircle, ArrowRight, Rocket } from 'lucide-react';

export const AeroqualImpactStory: React.FC = () => {
  return (
    <div className="w-full bg-[#0F534A] py-14 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background Green Smoke Scribble Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" viewBox="0 0 800 400" fill="none">
          <path d="M50 350 C150 200, 200 400, 300 250 C400 100, 450 300, 550 150 C650 0, 700 200, 800 100" stroke="#9EFC5F" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* HEADER */}
        <div className="text-center space-y-3">
          <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-4 py-1 font-headline font-black text-xs uppercase tracking-widest inline-block shadow-[3px_3px_0_#121316]">
            REAL STUDENT IMPACT STORY
          </span>
          <h2 className="text-3xl sm:text-5xl font-headline font-black text-white uppercase tracking-tight italic">
            From Student Idea to City Policy
          </h2>
          <p className="text-xs sm:text-base font-bold text-gray-200 max-w-2xl mx-auto">
            How early CSR micro-funding backed a simple student question and transformed it into nationwide environmental action.
          </p>
        </div>

        {/* 4 STORY CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Aeroqual Sensor Device */}
          <div className="bg-white text-[#121316] border-4 border-[#121316] shadow-[6px_6px_0_#9EFC5F] p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#FE4E1A] text-white border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                <Wind className="w-3 h-3" /> AEROQUAL INDIA
              </div>
              <h3 className="font-headline font-black text-xl uppercase mt-2 text-[#0F534A]">
                Urban Air Sensor
              </h3>
              <p className="text-xs text-gray-700 font-medium mt-1">
                Backed early by CSR micro-funding, now shaping city air quality policy across urban centers.
              </p>
            </div>
            <div className="p-3 bg-[#9EFC5F]/20 border-2 border-[#0F534A] rounded text-center font-mono font-bold text-xs text-[#0F534A]">
              PM2.5: 498 µg/m³ • Live Sensor
            </div>
          </div>

          {/* Card 2: The Original Question (2016) */}
          <div className="bg-[#0F534A] text-white border-4 border-[#121316] shadow-[6px_6px_0_#FFDD33] p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                THE ORIGIN (2016)
              </span>
              <h3 className="font-headline font-black text-xl uppercase mt-2 text-[#9EFC5F]">
                Low-Cost Sensor Mapping
              </h3>
              <p className="text-xs text-gray-200 font-medium mt-1">
                Someone had the simple idea to map neighborhood air pollution using affordable open-hardware sensors.
              </p>
            </div>
            <div className="font-brush text-base text-[#9EFC5F]">
              Can we measure air quality for ₹2,000?
            </div>
          </div>

          {/* Card 3: Most Ignored It */}
          <div className="bg-[#FCFBF7] text-[#121316] border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="bg-red-100 text-red-700 border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                THE SKEPTICISM
              </span>
              <h3 className="font-headline font-black text-xl uppercase mt-2 text-[#F4002C]">
                MOST IGNORED IT.
              </h3>
              <p className="text-xs text-gray-700 font-medium mt-1">
                Traditional investors thought it was too small, too unproven, and <span className="underline decoration-[#F4002C] decoration-2">too risky</span>.
              </p>
            </div>
            <div className="p-2 bg-red-50 border-2 border-[#F4002C] text-center font-headline font-black text-[10px] uppercase text-[#F4002C]">
              Status: Rejected by VCs
            </div>
          </div>

          {/* Card 4: सोच से शुरू कर */}
          <div className="bg-[#FFDD33] text-[#121316] border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                THE DREAMXEC IMPACT
              </span>
              <h3 className="font-headline font-black text-xl uppercase mt-2 text-[#121316]">
                Chalo Shuru Kare Research
              </h3>
              <p className="text-xs font-bold mt-1">
                DreamXec micro-grants provided the first ₹50,000 escrow tranche for lab validation.
              </p>
            </div>
            <div className="font-brush text-2xl text-[#0F534A] font-black">
              सोच से शुरू कर
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="text-center pt-4">
          <button
            onClick={() => { window.location.href = '/campaigns'; }}
            className="px-8 py-4 bg-[#9EFC5F] hover:bg-[#FFDD33] text-[#0F534A] border-4 border-[#121316] shadow-[6px_6px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Rocket className="w-4 h-4" /> Fund The Next Big Student Idea <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
