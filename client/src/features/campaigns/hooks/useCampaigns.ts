import { useState, useEffect, useCallback } from "react";
import type { Campaign, User } from "../../../types";
import { campaignService, CreateCampaignInput, UpdateCampaignInput } from "../../../services/campaignService";
import apiRequest from "../../../services/api";
import { useLoader } from "../../../context/LoaderContext";

export interface UseCampaignsOptions {
  fetchPublic?: boolean;
  fetchUser?: boolean;
}

export function useCampaigns(user: User | null, options: UseCampaignsOptions = {}) {
  const { fetchPublic = false, fetchUser = false } = options;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const { showLoader, hideLoader } = useLoader();

  // Load public campaigns on demand
  const loadPublicCampaigns = useCallback(async (params = {}) => {
    try {
      setLoadingCampaigns(true);
      const res = await campaignService.getPublicCampaigns(params);
      const list = res.data?.campaigns || (res as any)?.campaigns || [];
      const mapped: Campaign[] = list.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.shortDescription || c.description || "",
        category: c.category || "STARTUP_INNOVATION",
        goalAmount: Number(c.targetAmount || 0),
        raisedAmount: Number(c.currentRaisedAmount || 0),
        currentAmount: Number(c.currentRaisedAmount || 0),
        currentRaisedAmount: Number(c.currentRaisedAmount || 0),
        status: (c.status || "LIVE").toLowerCase() as any,
        imageUrl: c.coverImageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
        videoUrl: c.videoUrl,
        presentationDeckUrl: c.presentationDeckUrl,
        campaignType: c.campaignType || "INDIVIDUAL",
        studentName: c.studentName || c.student?.name || "Student Lead",
        college: c.institutionName || c.tenant?.name || "Institution",
        milestones: c.milestones || [],
        donorCount: c.donorCount || 0,
        currency: c.currency || "INR",
        createdAt: c.createdAt,
      }));
      setCampaigns(mapped);
    } catch (error) {
      console.error("Failed to load public campaigns:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (fetchPublic) {
      loadPublicCampaigns();
    }
  }, [fetchPublic, loadPublicCampaigns]);

  // Load user campaigns on demand
  const loadUserCampaigns = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingCampaigns(true);
      const res = await campaignService.getMyCampaigns();
      const list = res.data?.campaigns || (res as any)?.campaigns || [];
      const mapped: Campaign[] = list.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description || "",
        category: c.category || "STARTUP_INNOVATION",
        goalAmount: Number(c.targetAmount || 0),
        raisedAmount: Number(c.currentRaisedAmount || 0),
        currentAmount: Number(c.currentRaisedAmount || 0),
        currentRaisedAmount: Number(c.currentRaisedAmount || 0),
        status: (c.status || "DRAFT").toLowerCase() as any,
        imageUrl: c.coverImageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
        videoUrl: c.videoUrl,
        presentationDeckUrl: c.presentationDeckUrl,
        campaignType: c.campaignType || "INDIVIDUAL",
        studentName: c.student?.name || user?.name || "Me",
        college: c.tenant?.name || "Institution",
        milestones: c.milestones || [],
        donorCount: c.donorCount || 0,
        currency: c.currency || "INR",
        rejectionReason: c.rejectionReason,
        reapprovalCount: c.reapprovalCount || 0,
        createdAt: c.createdAt,
      }));
      setUserCampaigns(mapped);
    } catch (error) {
      console.error("Failed to fetch user campaigns:", error);
      setUserCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (fetchUser && user?.id) {
      loadUserCampaigns();
    }
  }, [fetchUser, loadUserCampaigns, user?.id]);

  const handleCreateCampaign = useCallback(
    async (data: any) => {
      showLoader();
      try {
        let coverImageUrl = data.coverImageUrl;

        // Upload banner file if provided as File object
        if (data.bannerFile instanceof File) {
          try {
            const formData = new FormData();
            formData.append("file", data.bannerFile);
            formData.append("folder", "campaign_banners");

            const uploadRes = await apiRequest<{ url: string }>("/upload", {
              method: "POST",
              body: formData,
            });
            coverImageUrl = uploadRes.data?.url || (uploadRes as any)?.url || coverImageUrl;
          } catch (uploadErr) {
            console.warn("Banner file upload fallback to default:", uploadErr);
          }
        }

        if (!coverImageUrl) {
          coverImageUrl = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";
        }

        const goalAmountNum = Number(data.goalAmount) || (data.milestones || []).reduce((sum: number, m: any) => sum + (Number(m.budget || m.targetAmount) || 0), 0) || 1000;
        const desc = data.description || data.storyMarkdown || data.shortDescription || data.title || "Campaign overview and milestone execution plan.";

        const payload: CreateCampaignInput = {
          title: data.title || "New Campaign",
          description: desc,
          shortDescription: data.shortDescription || desc.slice(0, 200),
          category: data.category || "STARTUP_INNOVATION",
          campaignType: data.campaignType || "INDIVIDUAL",
          stage: data.stage || "DISCOVERY",
          goalAmount: goalAmountNum,
          minDonationAmount: Number(data.minDonationAmount || 1.00),
          currency: data.currency || "INR",
          coverImageUrl,
          galleryImageUrls: data.galleryImageUrls || [],
          videoUrl: data.youtubeUrl || data.videoUrl || null,
          presentationDeckUrl: data.presentationDeckUrl || null,
          clubId: data.clubId || data.organizationId || null,
          organizationId: data.organizationId || data.clubId || null,
          tenantId: data.tenantId || undefined,
          beneficiaryDetails: data.beneficiaryDetails || null,
          faqs: data.faqs || [],
          teamMembers: data.teamMembers || [],
          milestones: (data.milestones && data.milestones.length > 0 ? data.milestones : [{
            title: 'Initial Tranche: Project Initiation & Prototype',
            description: 'Complete initial setup, requirements and prototyping.',
            durationDays: 30,
            budget: goalAmountNum,
            acceptanceCriteria: ['Prototype milestone delivered'],
            requiredEvidenceTypes: ['ON_SITE_PHOTO', 'INVOICE'],
          }]).map((m: any, idx: number) => ({
            sequenceOrder: m.sequenceOrder || m.order || idx + 1,
            title: m.title || `Phase ${idx + 1}`,
            description: m.description || m.objective || '',
            durationDays: Number(m.durationDays || 30),
            deadline: m.deadline ? new Date(m.deadline).toISOString() : null,
            budget: Number(m.budget || m.targetAmount || (goalAmountNum / (data.milestones?.length || 1))),
            acceptanceCriteria: m.acceptanceCriteria || [],
            requiredEvidenceTypes: m.requiredEvidenceTypes || [],
          })),
        };

        const res = await campaignService.createCampaign(payload);
        const created = res.data?.campaign || (res as any)?.campaign;

        await loadUserCampaigns();
        return created;
      } catch (error) {
        console.error("Campaign creation failed:", error);
        throw error;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadUserCampaigns]
  );

  const handleSubmitForReview = useCallback(
    async (id: string) => {
      showLoader();
      try {
        const res = await campaignService.submitCampaignForReview(id);
        await loadUserCampaigns();
        return res.data?.campaign;
      } catch (error) {
        console.error("Submit for review failed:", error);
        throw error;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadUserCampaigns]
  );

  const handleUpdateCampaign = useCallback(
    async (id: string, updateData: UpdateCampaignInput) => {
      showLoader();
      try {
        const res = await campaignService.updateCampaign(id, updateData);
        await loadUserCampaigns();
        return res.data?.campaign;
      } catch (error) {
        console.error("Campaign update failed:", error);
        throw error;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadUserCampaigns]
  );

  const handleEditMilestone = useCallback(
    async (
      campaignId: string,
      milestoneId: string,
      payload: { title?: string; description?: string; budget?: number; durationDays?: number; changeReason: string }
    ) => {
      showLoader();
      try {
        const res = await campaignService.requestMilestoneRevision(campaignId, milestoneId, payload);
        await loadUserCampaigns();
        return res.data;
      } catch (error) {
        console.error("Milestone edit failed:", error);
        throw error;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadUserCampaigns]
  );

  const handleGetMilestoneHistory = useCallback(async (campaignId: string, milestoneId: string) => {
    try {
      const res = await campaignService.getMilestoneHistory(campaignId, milestoneId);
      return res.data?.revisions || [];
    } catch (error) {
      console.error("Failed to load milestone history:", error);
      return [];
    }
  }, []);

  const handleSubmitMilestoneProof = useCallback(
    async (
      campaignId: string,
      milestoneId: string,
      payload: { evidenceDocId?: string; studentNotes: string }
    ) => {
      showLoader();
      try {
        const res = await campaignService.submitMilestoneProof(campaignId, milestoneId, payload);
        await loadUserCampaigns();
        return res.data?.submission;
      } catch (error) {
        console.error("Milestone proof submission failed:", error);
        throw error;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadUserCampaigns]
  );

  const handleApproveCampaign = useCallback(
    async (id: string) => {
      showLoader();
      try {
        await campaignService.verifyCampaign(id, { status: "LIVE" });
        await loadPublicCampaigns();
        await loadUserCampaigns();
      } catch (error) {
        console.error("Failed to approve campaign:", error);
        alert("Failed to approve campaign.");
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadPublicCampaigns, loadUserCampaigns]
  );

  const handleRejectCampaign = useCallback(
    async (id: string, reason: string) => {
      showLoader();
      try {
        await campaignService.verifyCampaign(id, { status: "REJECTED", rejectionReason: reason });
        await loadPublicCampaigns();
        await loadUserCampaigns();
      } catch (error) {
        console.error("Failed to reject campaign:", error);
        alert("Failed to reject campaign.");
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader, loadPublicCampaigns, loadUserCampaigns]
  );

  return {
    campaigns,
    userCampaigns,
    loadingCampaigns,
    approvedCampaigns: campaigns.filter((c) => {
      const s = String(c.status).toLowerCase();
      return s === "approved" || s === "live" || s === "fully_funded" || s === "disbursing" || s === "completed";
    }),
    pendingCampaigns: userCampaigns.filter((c) => {
      const s = String(c.status).toLowerCase();
      return s === "pending" || s === "submitted" || s === "pending_verification" || s === "pending_endorsement" || s === "draft";
    }),
    loadPublicCampaigns,
    loadUserCampaigns,
    handleCreateCampaign,
    handleUpdateCampaign,
    handleEditMilestone,
    handleGetMilestoneHistory,
    handleSubmitMilestoneProof,
    handleSubmitForReview,
    handleApproveCampaign,
    handleRejectCampaign,
  };
}
