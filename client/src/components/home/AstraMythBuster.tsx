import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { HelpCircle, Sparkles, Send, CheckCircle2, MessageSquare, Flame } from 'lucide-react';

export const AstraMythBuster: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmitted(true);
    toast.success('Your curiosity question has been recorded! Our mentor network will review it.');
  };

  return (
    <div className="w-full bg-[#FCFBF7] py-12 px-4 sm:px-6 lg:px-8 border-t-4 border-b-4 border-[#121316]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* SECTION HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] px-4 py-1 font-headline font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_#121316]">
            <Flame className="w-4 h-4 text-[#FE4E1A]" /> ASTRA Busts It | Myth #01
          </div>
          <h2 className="text-3xl sm:text-5xl font-headline font-black text-[#0F534A] uppercase tracking-tight italic">
            MYTH: Research is only for toppers.
          </h2>
          <p className="text-xs sm:text-base font-bold text-gray-700 max-w-2xl mx-auto">
            A lot of students think they need to be the smartest person in the room before they can begin. But most research starts much earlier with noticing, questioning, and wanting to understand something better.
          </p>
        </div>

        {/* COMIC STRIP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel 1: The Myth */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 space-y-3 relative overflow-hidden">
            <div className="bg-[#FE4E1A] text-white border-2 border-[#121316] px-3 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider inline-block">
              1. THE MYTH
            </div>
            <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
              "I don't have 95% marks."
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              Myth says you need a flawless grade card to get lab access, grants, or mentorship.
            </p>
            <div className="pt-2 font-brush text-base text-[#F4002C]">
              Sigh... So curiosity needs a mark sheet now?
            </div>
          </div>

          {/* Panel 2: The Shift */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FFDD33] p-6 space-y-3 relative overflow-hidden">
            <div className="bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-3 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider inline-block">
              2. THE SHIFT
            </div>
            <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
              It Starts With A Question
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              Research doesn't start with perfect marks. If you've ever asked: <em>"Why is this like this? Can this be better?"</em> — you're already thinking like a researcher.
            </p>
            <div className="pt-2 font-brush text-base text-[#0F534A]">
              Wait... good point!
            </div>
          </div>

          {/* Panel 3: Bust The Myth */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#9EFC5F] p-6 space-y-3 relative overflow-hidden">
            <div className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-3 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider inline-block">
              3. THE TRUTH
            </div>
            <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
              Being Curious Is All It Takes
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              TRUTH: Research is not about knowing everything. It's about being curious enough to look deeper and build a solution.
            </p>
            <div className="pt-2 font-brush text-base text-[#FE4E1A]">
              Bust the myth!
            </div>
          </div>
        </div>

        {/* INTERACTIVE CTA QUESTION BOX */}
        <div className="bg-[#0F534A] text-white border-4 border-[#121316] shadow-[8px_8px_0_#FFDD33] p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-white/20 pb-4">
            <div>
              <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-3 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                YOUR TURN TO START
              </span>
              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#9EFC5F] uppercase tracking-tight mt-1">
                What's one question around you that deserves a deeper look?
              </h3>
            </div>
            <p className="text-xs text-gray-200 font-medium max-w-xs">
              Your rank doesn't decide if you can start. Your question does!
            </p>
          </div>

          {submitted ? (
            <div className="p-4 bg-[#9EFC5F] text-[#0F534A] border-3 border-[#121316] font-headline font-black text-sm uppercase flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" /> Question recorded! Explore active campaigns below to see how other students started.
            </div>
          ) : (
            <form onSubmit={handleSubmitQuestion} className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                required
                placeholder="e.g. Why is hostel food wasted every night? / How to filter urban air with low-cost sensors?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 px-4 py-3 bg-white text-[#121316] border-3 border-[#121316] text-xs font-bold focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[3px_3px_0_#FFDD33] font-headline font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                Submit Question <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
