import apiRequest, { type ApiResponse } from "./api";
import { API_BASE_URL } from "../utils/apiConfig";
import axios from "axios";

/* =========================================================
   TYPES
========================================================= */

export type MilestoneStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export interface MilestoneSubmission {
  id: string;
  milestoneId: string;
  projectId: string;
  proofUrl?: string;
  mediaUrl?: string;
  notes?: string;
  version: number;
  reviewedAt?: string;
  adminFeedback?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;

  durationDays: number;
  budget: number;
  order: number;

  status: MilestoneStatus;

  activatedAt?: string;
  dueDate?: string;
  approvedAt?: string;

  reminder3Sent?: boolean;
  reminder1Sent?: boolean;
  overdueSent?: boolean;
  ratingPenaltyDays?: number;

  submissions?: MilestoneSubmission[];
}

export interface TeamMember {
  name: string;
  role: string;
  image?: string; // Cloudinary URL
}

export interface FAQ {
  question: string;
  answer: string;
}

/* =========================================================
   USER PROJECT (CAMPAIGN)
========================================================= */

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "PI" | "CO_PI" | "RESEARCHER" | "MENTOR";
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assignedToId?: string;
  startDate?: string;
  endDate?: string;
  status: "TODO" | "IN_PROGRESS" | "UNDER_REVIEW" | "DONE";
}

export interface LabNotebookEntry {
  id: string;
  projectId: string;
  authorId: string;
  notes: string;
  hashSignature: string;
  timestamp: string;
}

export interface UserProject {
  id: string;
  title: string;
  description: string;
  slug?: string;

  userId?: string;
  user?: {
    id: string;
    name: string;
  };

  clubId?: string | null;
  club?: {
    id: string;
    name: string;
    college: string;
    slug?: string;
  };

  goalAmount?: number;
  amountRaised?: number;

  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;

  campaignType?: "INDIVIDUAL" | "TEAM";
  teamMembers?: any[];
  faqs?: any[];
  youtubeUrl?: string;

  imageUrl?: string;
  campaignMedia?: string[];
  presentationDeckUrl?: string | null;

  rating?: number;
  rejectionReason?: string;
  reapprovalCount?: number;
  milestones?: any[];

  // NEW ERP fields
  stage?: "DISCOVERY" | "FEASIBILITY" | "PROTOTYPE" | "PILOT" | "COMMERCIALIZATION";
  members?: ProjectMember[];
  tasks?: Task[];
  labNotebooks?: LabNotebookEntry[];
}

export type Project = UserProject;


/* =========================================================
   CREATE PAYLOAD
========================================================= */

export interface CreateMilestone {
  title: string;
  durationDays: number;
  budget: number;
  description?: string;
}
export interface CreateUserProjectData {
  title: string;
  description: string;

  /** UI field → mapped to companyName */
  collegeName: string;

  /** 🔑 REQUIRED */
  clubId: string;

  skillsRequired: string[];
  goalAmount: number;

  presentationDeckUrl?: string | null;

  campaignType?: "INDIVIDUAL" | "TEAM";
  teamMembers?: TeamMember[];
  faqs?: FAQ[];
  youtubeUrl?: string;

  milestones: CreateMilestone[];
}

/* =========================================================
   UPDATE PAYLOAD
========================================================= */

export interface UpdateMilestone {
  title: string;
  durationDays: number;
  budget: number;
  description?: string;
}

export interface UpdateUserProjectData {
  title?: string;
  description?: string;

  /** UI field */
  collegeName?: string;

  clubId?: string;
  club?: {
    id: string;
    name: string;
    college: string;
    slug?: string;
  }

  skillsRequired?: string[];
  goalAmount?: number;

  presentationDeckUrl?: string | null;

  campaignType?: "INDIVIDUAL" | "TEAM";
  teamMembers?: TeamMember[];
  faqs?: FAQ[];
  youtubeUrl?: string;

  milestones?: UpdateMilestone[];
}

/* =========================================================
   API CALLS
========================================================= */

// PUBLIC CAMPAIGNS (paginated — cursor-based)
export const getPublicUserProjects = async (params?: {
  cursor?: string;
  limit?: number;
}): Promise<
  ApiResponse<{
    userProjects: UserProject[];
    pagination?: { nextCursor: string | null; hasNextPage: boolean };
  }>
> => {
  const query = new URLSearchParams();
  if (params?.cursor) query.set('cursor', params.cursor);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/user-projects/public${qs}`, { method: 'GET' });
};


// SINGLE CAMPAIGN
export const getUserProject = async (
  id: string
): Promise<ApiResponse<{ userProject: UserProject }>> => {
  return apiRequest(`/user-projects/${id}`, { method: "GET" });
};

// MY CAMPAIGNS
export const getMyUserProjects = async (): Promise<
  ApiResponse<{ userProjects: UserProject[] }>
> => {
  return apiRequest("/user-projects/my", { method: "GET" });
};

// STUDENT ANALYTICS
export const getStudentAnalytics = async (): Promise<
  ApiResponse<{ analytics: { total: number; approved: number; pending: number; rejected: number; fundsRaised: number } }>
> => {
  return apiRequest("/user-projects/analytics", { method: "GET" });
};

// CREATE CAMPAIGN
export const createUserProject = async (
  data: FormData | CreateUserProjectData
): Promise<ApiResponse<{ userProject: UserProject }>> => {
  if (data instanceof FormData) {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/user-projects`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (err: any) {
      // Extract backend validation / business-logic error messages
      const responseData = err?.response?.data;
      if (responseData) {
        // Structured Zod errors array: [{ field, message }, ...]
        if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          const combinedMsg = responseData.errors
            .map((e: any) => e.message || String(e))
            .join("\n");
          throw new Error(combinedMsg);
        }
        // Plain message string from AppError
        if (responseData.message) {
          throw new Error(responseData.message);
        }
      }
      // Network / unknown error
      throw new Error(
        err?.message || "Network error — please check your connection."
      );
    }
  }

  // JSON fallback (rare)
  return apiRequest("/user-projects", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      companyName: data.collegeName,
    }),
  });
};

// UPDATE CAMPAIGN
export const updateUserProject = async (
  id: string,
  data: UpdateUserProjectData
): Promise<ApiResponse<{ userProject: UserProject }>> => {
  return apiRequest(`/user-projects/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...data,
      ...(data.collegeName && { companyName: data.collegeName }),
    }),
  });
};

// DELETE CAMPAIGN
export const deleteUserProject = async (
  id: string
): Promise<ApiResponse<null>> => {
  return apiRequest(`/user-projects/${id}`, {
    method: "DELETE",
  });
};

/* =========================================================
   ERP CORE INTERFACES (NEW)
   ========================================================= */

export interface Organization {
  id: string;
  name: string;
  type: "UNIVERSITY" | "CORPORATE_RD" | "INCUBATOR" | "RESEARCH_LAB" | "FUNDING_AGENCY";
  verified: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
}

export interface ResearchGroup {
  id: string;
  name: string;
  departmentId: string;
}

export interface Lab {
  id: string;
  name: string;
  researchGroupId: string;
}

export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  role: "ORG_ADMIN" | "PROFESSOR" | "RESEARCHER" | "COMPLIANCE_OFFICER" | "INCUBATOR_MANAGER";
  verified: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  model?: string;
  specifications: string[];
  hourlyCost: number;
  labId: string;
}

export interface EquipmentBooking {
  id: string;
  equipmentId: string;
  userId: string;
  startTime: string;
  endTime: string;
  cost: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  researchArea: string;
  expectedImpact?: string;
  trlLevel: number;
  sdgGoals: string[];
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  creatorId: string;
  projectId?: string;
  createdAt: string;
}

export interface IdeaReview {
  id: string;
  ideaId: string;
  reviewerId: string;
  noveltyScore: number;
  feasibilityScore: number;
  impactScore: number;
  feedback: string;
}

export interface ProjectDependency {
  id: string;
  projectId: string;
  requiresId: string;
}

export interface StageGateReview {
  id: string;
  projectId: string;
  stage: "DISCOVERY" | "FEASIBILITY" | "PROTOTYPE" | "PILOT" | "COMMERCIALIZATION";
  approved: boolean;
  reviewerId: string;
  comments: string;
}

export interface Grant {
  id: string;
  title: string;
  description: string;
  budget: number;
  agencyId?: string;
  donorId?: string;
  createdAt: string;
}

export interface GrantProposal {
  id: string;
  grantId: string;
  title: string;
  proposalText: string;
  budgetPlan: number;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
}

export interface GrantAllocation {
  id: string;
  proposalId: string;
  projectId: string;
  amountAllocated: number;
  milestoneOrder: number;
  released: boolean;
}

