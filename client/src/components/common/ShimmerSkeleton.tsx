import React from 'react';

export const ShimmerCard: React.FC<{ className?: string }> = ({ className = "h-32 w-full" }) => {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl ${className}`}
    />
  );
};

export const ShimmerProfileCard: React.FC = () => {
  return (
    <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0_#121316] rounded-2xl p-6 space-y-6 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gray-200 border-3 border-[#121316] flex-shrink-0" />
        <div className="space-y-3 flex-1">
          <div className="h-6 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-32 bg-gray-200 rounded-md" />
          <div className="h-4 w-64 bg-gray-200 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-gray-200">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 border-2 border-gray-200 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 border-2 border-gray-200 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 border-2 border-gray-200 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-100 border-2 border-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ShimmerVaultCard: React.FC = () => {
  return (
    <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-[#121316]" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>

      <div className="h-10 w-full bg-gray-100 border-2 border-gray-200 rounded-lg" />

      <div className="flex justify-between items-center pt-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-24 bg-gray-200 rounded-md" />
      </div>
    </div>
  );
};

export const ShimmerSpeciesCard: React.FC = () => {
  return (
    <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#121316] rounded-2xl p-8 space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-[#121316] shadow-[4px_4px_0_#FE4E1A] flex-shrink-0" />
        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto md:mx-0" />
          <div className="h-4 w-40 bg-gray-200 rounded mx-auto md:mx-0" />
          <div className="h-6 w-48 bg-gray-200 rounded-full mx-auto md:mx-0" />
        </div>
      </div>

      <div className="h-12 w-full bg-gray-100 border-3 border-[#121316] rounded-xl" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-28 bg-gray-100 border-2 border-[#121316] rounded-xl" />
        <div className="h-28 bg-gray-100 border-2 border-[#121316] rounded-xl" />
        <div className="h-28 bg-gray-100 border-2 border-[#121316] rounded-xl" />
      </div>
    </div>
  );
};

export const ShimmerGrid: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ShimmerVaultCard key={idx} />
      ))}
    </div>
  );
};

export default ShimmerCard;
