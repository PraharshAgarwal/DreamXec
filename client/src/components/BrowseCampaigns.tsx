import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CampaignCard from './CampaignCard';
import { StarDecoration } from './icons/StarDecoration';
import { FooterContent } from '../sections/Footer/components/FooterContent';
import { campaignService } from '../services/campaignService';
import type { Campaign } from '../types';
import SEO from "../components/SEO";
import { CategoryFilterPills } from './campaigns/CategoryFilterPills';
import { BrushAnnotation } from './ui/BrushAnnotation';
import { getCampaignUrl } from '../utils/campaignRouting';

const LIMIT = 20;

/* ── Icons ── */
const SearchIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const SlidersIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
    <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
    <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
    <line x1="2" x2="6" y1="14" y2="14" /><line x1="10" x2="14" y1="8" y2="8" />
    <line x1="18" x2="22" y1="16" y2="16" />
  </svg>
);

/* ──────────────────────────────────────────────
   SKELETON CARD
─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#4717AE] overflow-hidden">
      <div className="browse-skeleton-shimmer h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="browse-skeleton-shimmer h-6 bg-gray-200 w-3/4" />
        <div className="browse-skeleton-shimmer h-4 bg-gray-200 w-1/2" />
        <div className="browse-skeleton-shimmer h-3 bg-gray-200 w-full" />
        <div className="browse-skeleton-shimmer h-10 bg-gray-200 w-full" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   INITIAL FULL-PAGE SKELETON (first load)
─────────────────────────────────────────────── */
function InitialSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   LOAD-MORE SPINNER (bottom of page)
─────────────────────────────────────────────── */
function LoadMoreSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '40px 0 20px' }}>
      <div
        style={{
          width: 52,
          height: 52,
          border: '4px solid #0F534A',
          borderTopColor: '#FE4E1A',
          boxShadow: '3px 3px 0 #0F534A',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      <p className="font-headline font-black text-xs uppercase tracking-wider text-[#0F534A]">
        Loading more campaigns...
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────
   ALL LOADED BADGE
─────────────────────────────────────────────── */
function AllLoadedBadge({ total }: { total: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0 24px' }}>
      <div className="bg-[#0F534A] text-white border-3 border-[#121316] shadow-[4px_4px_0px_#FE4E1A] px-6 py-2.5 font-headline font-black text-xs uppercase tracking-wider">
        ✓ All {total} campaign{total !== 1 ? 's' : ''} loaded
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN COMPONENT (self-contained, fetches own data)
─────────────────────────────────────────────── */
type SortOption = 'recent' | 'goal' | 'progress';

interface BrowseCampaignsProps {
  campaigns?: Campaign[];
  onViewCampaign?: (id: string) => void;
}

import { getCachedApiResponse } from '../services/api';

const mapRawCampaigns = (list: any[]): Campaign[] => {
  return list.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.shortDescription || c.description || '',
    category: c.category || 'STARTUP_INNOVATION',
    stage: c.stage,
    goalAmount: Number(c.targetAmount || 0),
    currentAmount: Number(c.currentRaisedAmount || 0),
    raisedAmount: Number(c.currentRaisedAmount || 0),
    status: (c.status || 'LIVE').toLowerCase() as any,
    imageUrl: c.coverImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    studentName: c.studentName || c.student?.fullName || c.student?.name || 'Student Lead',
    college: c.institutionName || c.tenant?.name || 'Institution',
    milestones: c.milestones || [],
    donorCount: c.donorCount || 0,
    currency: c.currency || 'INR',
    createdAt: c.createdAt,
  }));
};

export default function BrowseCampaigns(_props: BrowseCampaignsProps) {
  /* ── state ── */
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const cached = getCachedApiResponse<{ campaigns: any[] }>('/campaigns', { limit: LIMIT, category: 'ALL' }, true);
    const list = cached?.data?.campaigns || (cached as any)?.campaigns;
    return Array.isArray(list) && list.length > 0 ? mapRawCampaigns(list) : [];
  });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [initialLoading, setInitialLoading] = useState(() => campaigns.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchPage = useCallback(async (cursor: string | null, isNewFilter = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      let mapped: Campaign[] = [];
      let nextCur: string | null = null;
      let hasNext = false;

      const params: any = {
        limit: LIMIT,
        ...(cursor ? { cursor } : {}),
        ...(selectedCategory && selectedCategory !== 'ALL' ? { category: selectedCategory } : {}),
        ...(debouncedQuery ? { search: debouncedQuery } : {}),
      };

      const res = await campaignService.getPublicCampaigns(params);
      const list = res.data?.campaigns || (res as any)?.campaigns || [];
      mapped = mapRawCampaigns(list);
      hasNext = res.data?.hasNextPage || false;
      nextCur = (res.data as any)?.nextCursor || null;

      setCampaigns(prev => (cursor && !isNewFilter) ? [...prev, ...mapped] : mapped);
      setNextCursor(nextCur);
      setHasNextPage(hasNext);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load campaigns from database:', err);
      setError(err?.message || 'Failed to load campaigns from database');
      if (!cursor || isNewFilter) {
        setCampaigns([]);
      }
    } finally {
      isFetchingRef.current = false;
      setInitialLoading(false);
    }
  }, [selectedCategory, debouncedQuery]);

  useEffect(() => {
    // Check cached state for filter combo first
    const params: any = {
      limit: LIMIT,
      ...(selectedCategory && selectedCategory !== 'ALL' ? { category: selectedCategory } : {}),
      ...(debouncedQuery ? { search: debouncedQuery } : {}),
    };
    const cached = getCachedApiResponse<{ campaigns: any[] }>('/campaigns', params, true);
    const list = cached?.data?.campaigns || (cached as any)?.campaigns;
    if (Array.isArray(list) && list.length > 0) {
      setCampaigns(mapRawCampaigns(list));
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }
    fetchPage(null, true);
  }, [fetchPage]);

  // Real-time synchronization when any campaign is updated or funded
  useEffect(() => {
    const handleCampaignUpdated = (e: any) => {
      const updated = e.detail?.campaign;
      if (updated) {
        setCampaigns(prev =>
          prev.map(c =>
            c.id === updated.id || c.slug === updated.slug
              ? {
                  ...c,
                  currentAmount: Number(updated.currentRaisedAmount ?? updated.currentAmount ?? updated.raisedAmount ?? c.currentAmount),
                  raisedAmount: Number(updated.currentRaisedAmount ?? updated.currentAmount ?? updated.raisedAmount ?? c.raisedAmount),
                  donorCount: Number(updated.donorCount ?? c.donorCount),
                  status: (updated.status || c.status).toLowerCase() as any,
                }
              : c
          )
        );
      } else {
        fetchPage(null, true);
      }
    };

    window.addEventListener('dx:campaign_updated', handleCampaignUpdated);
    return () => window.removeEventListener('dx:campaign_updated', handleCampaignUpdated);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNextPage || !nextCursor) return;
    setLoadingMore(true);
    await fetchPage(nextCursor, false);
    setLoadingMore(false);
  }, [loadingMore, hasNextPage, nextCursor, fetchPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const filtered = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      if (sortBy === 'goal') return b.goalAmount - a.goalAmount;
      if (sortBy === 'progress') return (b.currentAmount / (b.goalAmount || 1)) - (a.currentAmount / (a.goalAmount || 1));
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 'recent'
    });
  }, [campaigns, sortBy]);

  /* ────────────────────────────────────────────────────────── */

  return (
    <>
      <SEO
        title="Browse Innovation Campaigns | DreamXec"
        description="Discover and support student-led innovation projects across India. Fund research, technology, and groundbreaking ideas from college innovators."
        url="https://dreamxec.com/campaigns"
      />
      <div className="min-h-screen bg-[#FCFBF7]">
        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden bg-[#0F534A] border-b-5 border-[#4717AE] shadow-[0_6px_0px_#4717AE]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute top-8 right-12 opacity-20"><StarDecoration className="w-14 h-14" color="#FE4E1A" /></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="inline-flex items-center gap-2 mb-4 bg-[#FFDD33] text-[#0F534A] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] px-3.5 py-1 font-headline font-black text-xs uppercase tracking-wider">
              <span>★</span> Tranche-Protected Crowdfunding
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight leading-none mb-3">
                  Explore <span className="text-[#FE4E1A]">Campaigns</span>
                </h1>
                <p className="text-base sm:text-lg max-w-2xl text-[#FFF9F2] font-medium leading-relaxed">
                  Support verified student researchers, innovators, and club breakthroughs protected by dual-entry milestone escrow.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 bg-[#FE4E1A] hover:bg-[#ff6333] text-white px-5 py-3 font-headline font-black text-sm uppercase tracking-wider border-3 border-white shadow-[4px_4px_0px_#121316] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  <span>+</span> Start a Campaign
                </Link>

                <Link
                  to="/my-campaigns"
                  className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#002244] text-[#FFDD33] px-5 py-3 font-headline font-black text-sm uppercase tracking-wider border-3 border-white shadow-[4px_4px_0px_#121316] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  <span>📋</span> My Campaigns
                </Link>

                <BrushAnnotation
                  type="tag"
                  color="yellow"
                  rotate={-2}
                  className="bg-[#121316] text-white p-3 border-3 border-white shadow-[4px_4px_0px_#121316] text-sm md:text-base font-bold select-none"
                >
                  100% Verified Milestones ✦
                </BrushAnnotation>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTROLS & CATEGORY FILTER PILLS ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {/* Category Filter Horizontal Pills */}
          <div className="mb-8">
            <CategoryFilterPills
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 mb-10">
            {/* Search */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search campaigns, clubs, universities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] focus:shadow-[6px_6px_0px_#FE4E1A] focus:border-[#FE4E1A] font-headline font-bold text-sm text-[#121316] outline-none transition-all"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <SlidersIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none z-10" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="w-full min-w-[240px] pl-12 pr-10 py-3.5 bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] focus:shadow-[6px_6px_0px_#FE4E1A] font-headline font-bold text-xs uppercase tracking-wider text-[#121316] outline-none cursor-pointer appearance-none transition-all"
              >
                <option value="recent">Most Recent First</option>
                <option value="goal">Highest Goals</option>
                <option value="progress">Nearing Completion</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-bold">
                ▼
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              className="text-center mb-8 p-6"
              style={{ background: '#fee2e2', border: '2.5px solid #dc2626', borderRadius: 12, boxShadow: '4px 4px 0 #dc2626' }}
            >
              <p style={{ fontFamily: "'Sora', system-ui, sans-serif", fontWeight: 800, color: '#dc2626' }}>{error}</p>
              <button
                onClick={() => { setError(null); setInitialLoading(true); fetchPage(null).then(() => setInitialLoading(false)); }}
                style={{ marginTop: 12, padding: '8px 20px', background: '#dc2626', color: '#fff', border: '2px solid #111', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Initial loading skeleton ── */}
          {initialLoading ? (
            <InitialSkeleton />
          ) : filtered.length === 0 ? (
            /* ── Empty state ── */
            <div
              className="text-center max-w-xl mx-auto p-16 sm:p-20"
              style={{ background: '#fff', border: '2.5px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0 #111' }}
            >
              <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                style={{ background: '#FFE066', border: '2.5px solid #111', borderRadius: '12px', boxShadow: '4px 4px 0 #111' }}>
                <SearchIcon className="w-12 h-12" style={{ color: '#111' }} />
              </div>
                <h2 className="text-2xl sm:text-3xl mb-3 font-headline font-black uppercase text-[#0F534A] tracking-tight">
                  {searchQuery ? 'No Campaigns Found' : 'No Active Campaigns Yet'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-6">
                  {searchQuery
                    ? 'Try adjusting your search query or category filters.'
                    : 'Be the first student innovator or research guild to launch a verified campaign.'}
                </p>
                {!searchQuery && (
                  <Link
                    to="/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[4px_4px_0px_#121316] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  >
                    <span>+ Launch Campaign</span>
                    <span>→</span>
                  </Link>
                )}
            </div>
          ) : (
            /* ── Results ── */
            <div>
              {/* Count badge + showing info */}
              <div className="mb-10 flex items-center gap-4 flex-wrap">
                <div
                  className="inline-flex items-center gap-3"
                  style={{
                    background: '#FF7F00', border: '2.5px solid #111',
                    borderRadius: '8px', padding: '8px 18px', boxShadow: '4px 4px 0 #111',
                    fontFamily: "'Sora', system-ui, sans-serif",
                  }}
                >
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{campaigns.length}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                    campaign{campaigns.length !== 1 ? 's' : ''} loaded
                  </span>
                </div>
                {hasNextPage && (
                  <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: '#666' }}>
                    Scroll for more ↓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filtered.map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    href={getCampaignUrl(campaign.slug || campaign.id)}
                  />
                ))}
                {loadingMore && Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={`sk-${i}`} />
                ))}
              </div>

              <div ref={sentinelRef}>
                {loadingMore && <LoadMoreSpinner />}
              </div>

              {!hasNextPage && campaigns.length > LIMIT && (
                <AllLoadedBadge total={campaigns.length} />
              )}
            </div>
          )}
        </div>

        <FooterContent />
      </div>
    </>
  );
}