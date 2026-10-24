import { useEffect, useState } from "react";
import apiRequest, { getCachedApiResponse } from "../services/api";

export type HeroCampaign = {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  category: string;
  raised: number;
  goal: number;
  image: string;
  club?: {
    name?: string;
    college?: string;
  };
};

const mapToHeroCampaigns = (campaignsList: any[]): HeroCampaign[] => {
  return campaignsList.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.shortDescription || c.description,
    category: c.category || "Research Project",
    raised: Number(c.currentRaisedAmount || 0),
    goal: Number(c.targetAmount || 0),
    image: c.coverImageUrl || "/assets/student_robotics_hero.webp",
    club: {
      name: c.institutionName || c.tenant?.name || "Institution",
      college: c.institutionName || c.tenant?.name || "Institution",
    },
  }));
};

const CACHE_ENDPOINT = "/campaigns";
const CACHE_PARAMS = { limit: 10 };

export function useHeroCampaigns() {
  const [data, setData] = useState<HeroCampaign[]>(() => {
    const cached = getCachedApiResponse<{ campaigns: any[] }>(CACHE_ENDPOINT, CACHE_PARAMS, true);
    const list = cached?.data?.campaigns || (cached as any)?.campaigns;
    return Array.isArray(list) && list.length > 0 ? mapToHeroCampaigns(list) : [];
  });
  const [loading, setLoading] = useState(() => data.length === 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHeroCampaigns = async () => {
      try {
        if (data.length === 0) {
          setLoading(true);
        }
        setError(false);

        const res = await apiRequest<{ campaigns: any[] }>(CACHE_ENDPOINT, {
          method: "GET",
          params: CACHE_PARAMS,
          cacheTtl: 120000,
        });

        if (!isMounted) return;

        const campaignsList = res.data?.campaigns || (res as any)?.campaigns || [];
        setData(mapToHeroCampaigns(campaignsList));
      } catch (e) {
        if (!isMounted) return;
        console.error("Hero carousel fetch error:", e);
        if (data.length === 0) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHeroCampaigns();

    const handleCampaignUpdated = (e: any) => {
      const updated = e.detail?.campaign;
      if (updated) {
        setData(prev =>
          prev.map(c =>
            c.id === updated.id || c.slug === updated.slug
              ? {
                  ...c,
                  raised: Number(updated.currentRaisedAmount ?? updated.currentAmount ?? updated.raised ?? c.raised),
                  goal: Number(updated.targetAmount ?? updated.goalAmount ?? updated.goal ?? c.goal),
                }
              : c
          )
        );
      } else {
        fetchHeroCampaigns();
      }
    };

    window.addEventListener("dx:campaign_updated", handleCampaignUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("dx:campaign_updated", handleCampaignUpdated);
    };
  }, []);

  return { data, loading, error };
}
