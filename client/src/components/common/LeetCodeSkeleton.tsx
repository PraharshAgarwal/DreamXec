import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  return (
    <div
      className={`skeleton-shimmer border border-gray-300/60 ${className}`}
      style={{ width, height }}
    />
  );
};

export const LeetCodeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border-2 border-[#121316] p-5 shadow-[4px_4px_0_#121316] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Left Avatar / Thumbnail + Multiline Content */}
      <div className="flex items-start gap-4 flex-1 w-full">
        {/* Square Thumbnail Placeholder (like LeetCode problem / submission icon) */}
        <Skeleton className="w-14 h-14 rounded-md shrink-0" />

        <div className="space-y-2.5 flex-1">
          {/* Top Tag Badges */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          {/* Title Bar */}
          <Skeleton className="h-6 w-3/4 rounded-md" />
          {/* Subtitle / Metadata Lines */}
          <div className="space-y-1.5 pt-0.5">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
          </div>
        </div>
      </div>

      {/* Right Side Metric / Action Button Placeholder */}
      <div className="flex flex-col md:items-end gap-2 w-full md:w-auto shrink-0">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
    </div>
  );
};

export const LeetCodeMetricSkeleton: React.FC = () => {
  return (
    <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#121316] flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md my-1" />
      <Skeleton className="h-3.5 w-36 rounded" />
    </div>
  );
};

export const LeetCodeBannerSkeleton: React.FC = () => {
  return (
    <div className="bg-white border-4 border-[#121316] p-6 shadow-[6px_6px_0_#FE4E1A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-2 flex-1 w-full">
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-7 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
      <Skeleton className="h-11 w-44 rounded-md shrink-0" />
    </div>
  );
};

export default LeetCodeCardSkeleton;
