import apiRequest from './api';

export interface BeneficiaryDetails {
  recipientType?: 'INDIVIDUAL' | 'ORGANIZATION';
  accountHolderName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  upiId?: string | null;
  kycDocumentUrl?: string | null;
  orgRegistrationDocUrl?: string | null;
}

export interface MilestoneInput {
  title: string;
  description?: string;
  durationDays?: number;
  deadline?: string | null;
  budget: number;
  sequenceOrder?: number;
  acceptanceCriteria?: string[];
  requiredEvidenceTypes?: string[];
}

export interface TeamMemberItem {
  id?: string;
  name: string;
  role: string;
  email?: string;
  title?: string;
  avatarUrl?: string | null;
  image?: string | null;
}

export interface CampaignMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  title?: string | null;
  joinedAt?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    profilePicture?: string | null;
  } | null;
}

export interface CreateCampaignInput {
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  campaignType?: 'INDIVIDUAL' | 'TEAM';
  stage?: 'DISCOVERY' | 'FEASIBILITY' | 'PROTOTYPE' | 'PILOT' | 'COMMERCIALIZATION';
  goalAmount: number;
  minDonationAmount?: number;
  currency?: string;
  coverImageUrl?: string | null;
  galleryImageUrls?: string[];
  videoUrl?: string | null;
  presentationDeckUrl?: string | null;
  tenantId?: string;
  clubId?: string | null;
  organizationId?: string | null;
  beneficiaryUserId?: string | null;
  beneficiaryDetails?: BeneficiaryDetails | null;
  faqs?: Array<{ question: string; answer: string }>;
  teamMembers?: TeamMemberItem[];
  milestones: MilestoneInput[];
}

export interface UpdateCampaignInput {
  title?: string;
  category?: string;
  status?: string;
  description?: string;
  shortDescription?: string;
  stage?: 'DISCOVERY' | 'FEASIBILITY' | 'PROTOTYPE' | 'PILOT' | 'COMMERCIALIZATION';
  goalAmount?: number;
  currency?: string;
  coverImageUrl?: string | null;
  galleryImageUrls?: string[];
  videoUrl?: string | null;
  presentationDeckUrl?: string | null;
  beneficiaryDetails?: BeneficiaryDetails | null;
  faqs?: Array<{ question: string; answer: string }>;
  teamMembers?: TeamMemberItem[];
  milestones?: MilestoneInput[];
}

export interface MilestoneHistoryEntry {
  id: string;
  revisionNumber: number;
  title: string;
  description: string | null;
  targetAmount: number;
  changeReason: string;
  status: string;
  requestedBy?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface CampaignMilestone {
  id: string;
  sequenceOrder: number;
  currentVersion: number;
  title: string;
  description?: string;
  durationDays: number;
  deadline?: string | null;
  targetAmount: number;
  budget?: number;
  acceptanceCriteria?: string[];
  requiredEvidenceTypes?: string[];
  status: string;
  disbursedAt?: string | null;
  submissions?: Array<{
    id: string;
    submissionNumber: number;
    status: string;
    studentNotes?: string | null;
    rejectionReason?: string | null;
    reviewedAt?: string | null;
    evidenceDoc?: { id: string; name: string; storageKey: string; mimeType?: string } | null;
    reviewedBy?: { id: string; fullName: string } | null;
    createdAt: string;
  }>;
  revisions?: MilestoneHistoryEntry[];
}

export interface CampaignData {
  id: string;
  slug: string;
  title: string;
  category: string;
  campaignType: string;
  stage?: 'DISCOVERY' | 'FEASIBILITY' | 'PROTOTYPE' | 'PILOT' | 'COMMERCIALIZATION';
  shortDescription: string;
  description: string;
  coverImageUrl: string;
  galleryImageUrls?: string[];
  videoUrl?: string | null;
  presentationDeckUrl?: string | null;
  targetAmount: number;
  currentRaisedAmount: number;
  progressPercentage: number;
  donorCount: number;
  currency: string;
  status: string;
  faqs: Array<{ question: string; answer: string }>;
  teamMembers: TeamMemberItem[];
  members?: CampaignMember[];
  beneficiaryDetails?: BeneficiaryDetails | null;
  rejectionReason?: string | null;
  reapprovalCount?: number;
  student?: { id: string; name: string; email?: string; avatar?: string | null } | null;
  user?: { id: string; name: string; email?: string } | null;
  tenant?: { id: string; name: string; slug: string; orgType?: string } | null;
  department?: { id: string; name: string; slug: string; orgType?: string } | null;
  milestones: CampaignMilestone[];
  endorsements?: Array<{
    id: string;
    designation: string;
    status: string;
    comments?: string | null;
    endorser?: { id: string; name: string } | null;
  }>;
  updates?: Array<{
    id: string;
    title: string;
    content: string;
    mediaUrls?: string[];
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCampaignsResponse {
  campaigns: any[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

/**
 * Type-safe Campaign Service communicating with /api/campaigns
 */
export const campaignService = {
  /**
   * Fetches public live campaigns for browsing.
   */
  async getPublicCampaigns(params: { category?: string; search?: string; page?: number; limit?: number } = {}, skipCache: boolean = false) {
    return apiRequest<PublicCampaignsResponse>('/campaigns', {
      method: 'GET',
      params,
      skipCache,
    });
  },

  /**
   * Fetches full campaign details by UUID or slug.
   */
  async getCampaignDetails(idOrSlug: string, skipCache: boolean = false) {
    return apiRequest<{ campaign: CampaignData }>(`/campaigns/${idOrSlug}`, {
      method: 'GET',
      skipCache,
    });
  },

  /**
   * Fetches current user's campaigns, optionally filtered by active profile's organization.
   */
  async getMyCampaigns(orgId?: string | null, skipCache: boolean = false) {
    const url = orgId ? `/campaigns/my?orgId=${encodeURIComponent(orgId)}` : '/campaigns/my';
    return apiRequest<{ campaigns: CampaignData[] }>(url, {
      method: 'GET',
      skipCache,
      headers: orgId ? { 'x-organization-id': orgId } : undefined,
    });
  },

  /**
   * Fetches campaigns pending administrative approval.
   */
  async getPendingCampaigns() {
    return apiRequest<{ campaigns: CampaignData[] }>('/campaigns/pending-review', {
      method: 'GET',
    });
  },

  /**
   * Looks up a registered platform user by @username or email.
   */
  async lookupUser(query: string) {
    return apiRequest<{
      user: {
        id: string;
        name: string;
        fullName: string;
        username: string;
        email: string;
        avatar?: string;
        role: string;
        institution?: string;
      };
    }>(`/campaigns/lookup-user?query=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
  },

  /**
   * Backwards compatible lookupUserByEmail
   */
  async lookupUserByEmail(email: string) {
    return this.lookupUser(email);
  },

  /**
   * Creates a new campaign with milestones.
   */
  async createCampaign(payload: CreateCampaignInput) {
    return apiRequest<{ campaign: CampaignData }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Submits campaign draft for faculty/admin review.
   */
  async submitCampaignForReview(id: string) {
    return apiRequest<{ campaign: CampaignData }>(`/campaigns/${id}/submit`, {
      method: 'POST',
    });
  },

  /**
   * Updates an existing campaign post-launch.
   */
  async updateCampaign(id: string, payload: UpdateCampaignInput) {
    return apiRequest<{ campaign: CampaignData }>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Deletes a campaign and its milestones.
   */
  async deleteCampaign(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Requests a milestone revision (budget or scope change).
   */
  async requestMilestoneRevision(
    campaignId: string,
    milestoneId: string,
    payload: { title?: string; description?: string; budget?: number; durationDays?: number; changeReason: string }
  ) {
    return apiRequest<{ milestone: CampaignMilestone; revision: MilestoneHistoryEntry }>(
      `/campaigns/${campaignId}/milestones/${milestoneId}/revisions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Alias for requestMilestoneRevision.
   */
  async editMilestone(
    campaignId: string,
    milestoneId: string,
    payload: { title?: string; description?: string; budget?: number; durationDays?: number; changeReason: string }
  ) {
    return this.requestMilestoneRevision(campaignId, milestoneId, payload);
  },

  /**
   * Reviews (approves or rejects) a requested milestone revision.
   */
  async reviewMilestoneRevision(
    campaignId: string,
    milestoneId: string,
    revisionId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
  ) {
    return apiRequest<{ milestone?: CampaignMilestone; revision: MilestoneHistoryEntry }>(
      `/campaigns/${campaignId}/milestones/${milestoneId}/revisions/${revisionId}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Fetches the complete change history for a milestone.
   */
  async getMilestoneHistory(campaignId: string, milestoneId: string) {
    return apiRequest<{ revisions: MilestoneHistoryEntry[] }>(
      `/campaigns/${campaignId}/milestones/${milestoneId}/history`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Submits evidence document and completion notes for milestone verification.
   */
  async submitMilestoneProof(
    campaignId: string,
    milestoneId: string,
    payload: {
      evidenceDocId?: string;
      studentNotes?: string;
      narrative?: string;
      evidenceMediaUrls?: string[];
      evidenceDocumentUrls?: string[];
      criteriaChecklist?: any[];
    }
  ) {
    return apiRequest<{ submission: any }>(
      `/campaigns/${campaignId}/milestones/${milestoneId}/submit-proof`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Reviews (approves or rejects) a milestone completion proof submission.
   */
  async reviewMilestoneSubmission(
    campaignId: string,
    milestoneId: string,
    submissionId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
  ) {
    return apiRequest<{ submission: any }>(
      `/campaigns/${campaignId}/milestones/${milestoneId}/submissions/${submissionId}/review`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Verifies (approves or rejects) a campaign by an admin.
   */
  async verifyCampaign(id: string, payload: { status: 'LIVE' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'COMPLETED'; rejectionReason?: string }) {
    return apiRequest<{ campaign: CampaignData }>(`/campaigns/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Adds faculty/mentor endorsement.
   */
  async endorseCampaign(id: string, payload: { designation: string; status?: string; comments?: string }) {
    return apiRequest<{ endorsement: any }>(`/campaigns/${id}/endorse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetches registered team members for a campaign.
   */
  async getCampaignMembers(campaignId: string) {
    return apiRequest<{ members: any[] }>(`/campaigns/${campaignId}/members`, {
      method: 'GET',
    });
  },

  /**
   * Invites/adds a member to the campaign team.
   */
  async addCampaignMember(campaignId: string, payload: { email: string; role?: 'OWNER' | 'MEMBER'; title?: string }) {
    return apiRequest<{ member: any }>(`/campaigns/${campaignId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates a campaign team member's role or title.
   */
  async updateCampaignMember(campaignId: string, memberId: string, payload: { role?: 'OWNER' | 'MEMBER'; title?: string }) {
    return apiRequest<{ member: any }>(`/campaigns/${campaignId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Removes a member from the campaign team.
   */
  async removeCampaignMember(campaignId: string, memberId: string) {
    return apiRequest<{ message: string }>(`/campaigns/${campaignId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetches real-time aggregated public impact metrics.
   */
  async getImpactDashboardMetrics() {
    return apiRequest<{
      totalMovedToResearch: number;
      totalMovedFormatted: string;
      studentProjectsBacked: number;
      peopleReached: string;
      openDatasetsAndPublications: number;
      stateDistribution: Array<{ state: string; count: number }>;
      sdgTracker: Array<{
        id: string;
        title: string;
        count: number;
        funding: number;
        fundingFormatted: string;
        color: string;
        textColor: string;
      }>;
    }>('/campaigns/impact-dashboard', {
      method: 'GET',
    });
  },
};
