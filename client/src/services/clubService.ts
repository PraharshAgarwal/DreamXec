import apiRequest, { type ApiResponse } from "./api";

/* =========================================================
   TYPES
========================================================= */
export interface MyClub {
    id: string;
    name: string;
    college: string;
}
export interface ClubMember {
    id: string;
    clubId: string;
    email: string;
    name?: string | null;
    phone?: string | null;

    isUserRegistered: boolean;
    userId?: string | null;

    isVerified: boolean;
    addedBy?: string | null;

    createdAt: string;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role?: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface ClubCampaign {
    id: string;

    /* BASIC */
    title: string;
    description: string;
    companyName: string;

    skillsRequired: string[];

    goalAmount: number;
    amountRaised: number;

    /* MEDIA */
    imageUrl?: string;
    campaignMedia?: string[];
    presentationDeckUrl?: string | null;

    /* NEW FIELDS */
    campaignType?: "INDIVIDUAL" | "TEAM";
    teamMembers?: TeamMember[];
    faqs?: FAQ[];
    youtubeUrl?: string;

    /* STATUS */
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;

    /* OWNER */
    userId: string;
    bankAccountId?: string | null;

    createdAt: string;
    updatedAt: string;
}

/* =========================================================
   PUBLIC DISCOVERY TYPES
========================================================= */

export interface PublicClub {
    id: string;
    name: string;
    slug: string;
    college: string;
    description?: string;
    logoUrl?: string;
    totalCampaigns: number;
    totalRaised: number;
    membersCount?: number;
    parentId?: string | null;
    parent?: {
        id: string;
        name: string;
        slug: string;
        orgType?: string;
    } | null;
    isIndependent?: boolean;
    createdAt?: string;
    category?: string;
    motto?: string;
    tagline?: string;
    technicalStacks?: Array<{ tag: string; name: string; description: string }> | null;
    facilities?: Array<{ name: string; specs: string }> | null;
    allowedRoles?: string[];
    orgType?: string;
}

export interface ClubRosterMember {
    id: string;
    userId?: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    role: string;
    designation?: string;
    department?: string | null;
    joinedAt?: string;
}

export interface ClubMilestoneSummary {
    id: string;
    title: string;
    status: string;
    targetAmount: string | number;
    sequenceOrder?: number;
}

export interface ClubCampaignItem {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    currentAmount: number;
    amountRaised?: number;
    goalAmount: number;
    targetAmount?: number;
    category: string;
    status: string;
    imageUrl?: string;
    coverImageUrl?: string;
    studentName?: string;
    milestones?: ClubMilestoneSummary[];
    createdAt?: string;
}

export interface PublicSingleClub {
    id: string;
    name: string;
    slug: string;
    college: string;
    description?: string | null;
    logoUrl?: string | null;
    verified?: boolean;
    totalCampaigns: number;
    totalRaised: number;
    totalMilestones?: number;
    completedMilestones?: number;
    membersCount?: number;
    parentId?: string | null;
    parent?: {
        id: string;
        name: string;
        slug: string;
        orgType?: string;
    } | null;
    isIndependent?: boolean;
    president?: ClubRosterMember | null;
    members?: ClubRosterMember[];
    campaigns: ClubCampaignItem[];
    createdAt?: string;

    /* Dynamic metadata & club profile configuration */
    motto?: string | null;
    tagline?: string | null;
    category?: string | null;
    labLocation?: string | null;
    meetingSchedule?: string | null;
    facultyAdvisor?: { name: string; designation: string; department: string } | null;
    technicalStacks?: Array<{ name: string; description: string; tag: string }> | null;
    facilities?: string[] | null;
    metadata?: Record<string, any> | null;
    allowedRoles?: string[];
    orgType?: string;
}






/* =========================================================
   MEMBER MANAGEMENT
========================================================= */


export const getMyClubs = async (): Promise<MyClub[]> => {
    const res = await apiRequest("/clubs/my", { method: "GET" });
    return res.data as MyClub[]; // backend returns { data: [...] }
};

// GET CLUB MEMBERS
export const getClubMembers = async (
    clubId: string
): Promise<ApiResponse<{ members: ClubMember[] }>> => {
    return apiRequest(`/clubs/${clubId}/members`, {
        method: "GET",
    });
};

// ADD SINGLE MEMBER
export const addClubMember = async (
    clubId: string,
    payload: {
        email: string;
        name?: string;
        phone?: string;
    }
): Promise<ApiResponse<{ action: "created" | "updated" | "noop" }>> => {
    return apiRequest(`/clubs/${clubId}/add-member`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

// REMOVE MEMBER
export const removeClubMember = async (
    clubId: string,
    memberId: string
): Promise<ApiResponse<null>> => {
    return apiRequest(`/clubs/${clubId}/members/${memberId}`, {
        method: "DELETE",
    });
};

// BULK UPLOAD MEMBERS (CSV)
export const uploadClubMembers = async (
    clubId: string,
    file: File
): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append("membersFile", file);

    return apiRequest(`/clubs/${clubId}/upload-members`, {
        method: "POST",
        body: formData,
    });
};

/* =========================================================
   PRESIDENT GOVERNANCE
========================================================= */

// CHANGE CLUB PRESIDENT
export const changeClubPresident = async (
    clubId: string,
    payload: {
        memberId?: string;
        email?: string;
        name?: string;
        phone?: string;
    }
): Promise<ApiResponse<null>> => {
    return apiRequest(`/clubs/${clubId}/change-president`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/* =========================================================
   CLUB CAMPAIGNS
========================================================= */

// APPROVED CAMPAIGNS
export const getApprovedClubCampaigns = async (
    clubId: string
): Promise<ApiResponse<{ campaigns: ClubCampaign[] }>> => {
    return apiRequest(`/clubs/${clubId}/campaigns/approved`, {
        method: "GET",
    });
};

// PENDING CAMPAIGNS
export const getPendingClubCampaigns = async (
    clubId: string
): Promise<ApiResponse<{ campaigns: ClubCampaign[] }>> => {
    return apiRequest(`/clubs/${clubId}/campaigns/pending`, {
        method: "GET",
    });
};

// REJECTED CAMPAIGNS
export const getRejectedClubCampaigns = async (
    clubId: string
): Promise<ApiResponse<{ campaigns: ClubCampaign[] }>> => {
    return apiRequest(`/clubs/${clubId}/campaigns/rejected`, {
        method: "GET",
    });
};

/* =========================================================
   PUBLIC CLUB DISCOVERY
========================================================= */

export const getPublicClubs = async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    orgId?: string;
    scope?: "all" | "enrolled" | "org" | "independent" | "explore_all";
  }
): Promise<ApiResponse<PublicClub[]>> => {
  return apiRequest<PublicClub[]>("/clubs/public", {
    method: "GET",
    params,
  });
};


export const getPublicClubById = async (
  id: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PublicSingleClub>> => {
  return apiRequest<PublicSingleClub>(
    `/clubs/public/${id}`,
    {
      method: "GET",
      params,
    }
  );
};

/* =========================================================
   JOIN REQUESTS
========================================================= */

export const sendJoinRequest = async (
    clubId: string,
    role?: string
): Promise<ApiResponse<any>> => {
    return apiRequest(`/clubs/${clubId}/join`, {
        method: "POST",
        body: JSON.stringify(role ? { role } : {}),
    });
};

export const getPendingJoinRequests = async (): Promise<ApiResponse<any[]>> => {
    return apiRequest(`/clubs/president/join-requests`, {
        method: "GET",
    });
};

export const reviewJoinRequest = async (
    requestId: string,
    action: "APPROVE" | "REJECT"
): Promise<ApiResponse<any>> => {
    return apiRequest(`/clubs/join-requests/${requestId}/review`, {
        method: "PUT",
        body: JSON.stringify({ action }),
    });
};

export const getMyJoinRequests = async (): Promise<ApiResponse<any[]>> => {
    return apiRequest(`/clubs/my/join-requests`, {
        method: "GET",
    });
};

/* =========================================================
   CLUB PROFILE MANAGEMENT (PRESIDENT / ADMIN)
========================================================= */

export interface UpdateClubProfilePayload {
    motto?: string;
    tagline?: string;
    category?: string;
    labLocation?: string;
    meetingSchedule?: string;
    facultyAdvisor?: { name: string; designation: string; department: string };
    technicalStacks?: Array<{ name: string; description: string; tag: string }>;
    facilities?: string[];
    name?: string;
    description?: string;
}

export const updateClubProfile = async (
    clubId: string,
    payload: UpdateClubProfilePayload
): Promise<ApiResponse<PublicSingleClub>> => {
    return apiRequest<PublicSingleClub>(`/clubs/${clubId}/profile`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
};


