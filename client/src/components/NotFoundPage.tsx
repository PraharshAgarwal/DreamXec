import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Home, Search, ArrowLeft, Sparkles } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans selection:bg-[#FFDD33] selection:text-[#0F534A]">
      {/* Background Decorative Shapes */}
      <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-[#FEB3FC]/30 blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-[#18D7E8]/20 blur-2xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full bg-[#9EFC5F]/20 blur-xl pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10">
        {/* Playful Badlooking Brush annotation */}
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="font-brush text-2xl sm:text-3xl text-[#FE4E1A] -rotate-3 inline-block">
            Lost in the innovation matrix?
          </span>
          <Sparkles className="w-5 h-5 text-[#FFDD33] animate-bounce" />
        </div>

        {/* Massive Neobrutalist 404 Display */}
        <div className="relative inline-block mb-6">
          <div className="text-8xl sm:text-9xl font-black text-[#0F534A] tracking-tighter select-none drop-shadow-[6px_6px_0px_#FE4E1A]">
            404
          </div>
          <div className="absolute -bottom-3 -right-3 bg-[#FFDD33] text-[#0F534A] font-black text-xs uppercase px-3 py-1 rounded-md border-2 border-[#0F534A] shadow-[2px_2px_0px_0px_#0F534A] rotate-6">
            Page Not Found
          </div>
        </div>

        {/* Message */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F534A] mb-3 uppercase tracking-tight">
          We couldn't find the page you're searching for
        </h2>
        <p className="text-gray-600 font-normal text-base max-w-md mx-auto mb-8 leading-relaxed">
          The campaign, club, or resource link you followed might have moved, expired, or never existed in the first place.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-[#0F534A] font-bold text-sm uppercase rounded-xl border-2 border-[#0F534A] shadow-[4px_4px_0px_0px_#0F534A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FE4E1A] hover:bg-[#e04314] text-white font-bold text-sm uppercase rounded-xl border-2 border-[#0F534A] shadow-[4px_4px_0px_0px_#0F534A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>

          <Link
            to="/campaigns"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#18D7E8] hover:bg-[#14bccc] text-[#0F534A] font-bold text-sm uppercase rounded-xl border-2 border-[#0F534A] shadow-[4px_4px_0px_0px_#0F534A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Explore Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
