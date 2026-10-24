// src/sections/ProgramFeaturesSection.tsx

import React from 'react';
// Import the ScrollStack components from the file you created
import ScrollStack, { ScrollStackItem } from "../../components/ScrollStack"; // Adjust path if needed

// ==================================================================
// 1. We define the FeatureCard component and its props here again
//    to keep this file self-contained.
// ==================================================================
export type FeatureCardProps = {
  title: string;
  description: string;
  iconUrl: string;
};

const FeatureCard = (props: FeatureCardProps) => {
  return (
    // This component only styles the *content* inside the card.
    // The ScrollStackItem handles the card's background, border, and shadow.
    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12 gap-4 sm:gap-6 md:gap-8">
      {/* Icon - responsive sizing */}
      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32">
        <img src={props.iconUrl} alt="Feature icon" className="w-full h-full object-contain" />
      </div>
      
      {/* Text content - always centered on mobile, can be left-aligned on larger screens if needed */}
      <div className="flex-1 text-center max-w-2xl">
        <h3 className="text-dreamxec-orange text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-display mb-3 sm:mb-4">
          {props.title}
        </h3>
        <p className="text-dreamxec-cream text-base sm:text-lg md:text-xl leading-relaxed">
          {props.description}
        </p>
      </div>
    </div>
  );
};

// ==================================================================
// 2. Your feature data array.
// ==================================================================
const programFeatures: FeatureCardProps[] = [
    {
      title: "3-Month Immersion Program",
      description: "An in-depth program with founders that defines strategic direction, from a go-to-market plan and product validation to compelling storytelling—all to build ventures that are impossible to ignore.",
      iconUrl: "https://c.animaapp.com/mhd6hm18SGcCN3/assets/icon-24.svg",
    },
    {
      title: "Sherpa-Led Model",
      description: "Each company is closely guided by the WTFund team through a highly hands-on, integrated approach that ensures active support at every stage.",
      iconUrl: "https://c.animaapp.com/mhd6hm18SGcCN3/assets/icon-25.svg",
    },
    {
      title: "INR 20 Lakh in Non-Dilutive Capital",
      description: "Fuel your growth with no-strings attached, non-dilutive capital.",
      iconUrl: "https://c.animaapp.com/mhd6hm18SGcCN3/assets/icon-26.svg",
    },
    {
      title: "Operator-Led Mentorship",
      description: "Learn from experts through sessions, mentorship, and office hours designed to drive execution, build founder resilience, and connect you with world-class operators and investors.",
      iconUrl: "https://c.animaapp.com/mhd6hm18SGcCN3/assets/icon-27.svg",
    },
    {
      title: "Access to First Users",
      description: "Leverage the dynamic WTF ecosystem for user connections and access a strategic GTM Studio.",
      iconUrl: "https://c.animaapp.com/mhd6hm18SGcCN3/assets/icon-28.svg",
    },
    // ... Add the rest of your features here if you have more
];


// ==================================================================
// 3. The main section component, now with the correct content.
// ==================================================================
export default function ProgramFeaturesSection() {
  return (
    // Responsive height: taller on mobile to accommodate content, full screen on larger devices
    <section className="relative w-full min-h-screen">
      <ScrollStack className="min-h-screen">
        {/* We map over the data array to create a card for each feature */}
        {programFeatures.map((feature, index) => (
          <ScrollStackItem 
            key={index}
            // Removed the bg-red-500 test class
          >
            <FeatureCard 
              title={feature.title}
              description={feature.description}
              iconUrl={feature.iconUrl}
            />
          </ScrollStackItem>
        ))}
      </ScrollStack>
    </section>
  );
}