import { Hero } from "./components/Hero";
import { CampaignCarousel } from "./components/CampaignCarousel";
import { InTheNews } from "./components/InTheNews";
import { BrandDoodleBackground } from "../../components/common/BrandDoodleBackground";

export const HeroSection = () => {
  return (
    <section className="relative w-full overflow-x-hidden bg-[#0F534A] text-white pb-12">
      {/* Brand Doodle Background */}
      <BrandDoodleBackground />

      {/* Constrained Content */}
      <div
        className="
          relative z-10
          max-w-7xl mx-auto px-4
          pt-12 pb-6
          sm:pt-16 sm:pb-8
          md:pt-20 md:pb-10
        "
      >
        {/* Unified Hero Experience */}
        <div className="w-full flex justify-center mb-8 md:mb-12">
          <Hero />
        </div>

        {/* Live News & Press Ticker */}
        <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] mt-6 bg-[#0B443C] border-y-2 border-[#121316]">
          <InTheNews />
        </div>
      </div>

      {/* FULL-WIDTH LIVE CAMPAIGN CAROUSEL */}
      <div className="relative z-10 w-screen left-1/2 right-1/2 -mx-[50vw] mt-8">
        <CampaignCarousel />
      </div>
    </section>
  );
};
