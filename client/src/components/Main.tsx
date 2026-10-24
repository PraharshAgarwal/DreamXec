import { HeroSection } from "../sections/HeroSection";
import { LookingForSection } from "../sections/LookingForSection";
import { WhatWeBringSection } from "../sections/WhatWeBringSection";
import { VerticalResearchStats } from './VerticalResearchStats';
import { AstraMythBuster } from "./home/AstraMythBuster";
import { AeroqualImpactStory } from "./home/AeroqualImpactStory";
import { PartnersSection } from "../sections/PartnerSection";
import { Footer } from "../sections/Footer";

export const Main = () => {
  return (
    <main className="flex flex-col items-center bg-[#FCFBF7] min-h-screen w-full">
      <VerticalResearchStats />
      <HeroSection />
      <AstraMythBuster />
      <LookingForSection />
      <AeroqualImpactStory />
      <WhatWeBringSection />
      <PartnersSection />
      <Footer />
    </main>
  );
};
