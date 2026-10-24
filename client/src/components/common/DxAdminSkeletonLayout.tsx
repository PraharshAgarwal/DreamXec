import React from 'react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { Skeleton, LeetCodeCardSkeleton, LeetCodeMetricSkeleton } from './LeetCodeSkeleton';

export const DxAdminSkeletonLayout: React.FC = () => {
  return (
    <UnifiedDashboardLayout
      title="Loading DX Governance Console | DreamX"
      headerTitle="DX Platform Governance Hub"
      headerSubtitle="Centralized super-admin access control, manual verification task queues, and org onboarding"
    >
      <div className="space-y-6">
        {/* Top Governance Banner Skeleton */}
        <div className="bg-white border-4 border-[#121316] p-6 sm:p-8 shadow-[6px_6px_0_#0F534A] flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-8 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
          <Skeleton className="h-12 w-48 rounded-md shrink-0" />
        </div>

        {/* Action Queue Alert Banner Skeleton */}
        <div className="bg-white border-4 border-[#121316] p-6 shadow-[6px_6px_0_#FE4E1A] flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-6 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md shrink-0" />
        </div>

        {/* 4 Core Metric Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LeetCodeMetricSkeleton />
          <LeetCodeMetricSkeleton />
          <LeetCodeMetricSkeleton />
          <LeetCodeMetricSkeleton />
        </div>

        {/* Verification / Proposal List Container Skeleton */}
        <div className="bg-white border-4 border-[#121316] p-6 shadow-[6px_6px_0_#4717AE] space-y-4">
          <div className="flex justify-between items-center pb-3 border-b-2 border-[#121316]">
            <Skeleton className="h-6 w-64 rounded-md" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="space-y-3 pt-2">
            <LeetCodeCardSkeleton />
            <LeetCodeCardSkeleton />
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default DxAdminSkeletonLayout;
