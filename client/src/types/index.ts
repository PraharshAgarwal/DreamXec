// src/types/index.ts
// export type UserRole = "student" | "admin" | "DONOR" | "donor" | "STUDENT_PRESIDENT";
export type AccountStatus = "ACTIVE" | "BLOCKED" | "SUSPENDED" | "UNDER_REVIEW";

export type ProjectStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "PAUSED" | "FROZEN" | "pending" | "approved" | "rejected" | "completed" | "paused" | "frozen";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[],
  pagination: PaginationMeta;
}

/* =========================================================
   Club Types
========================================================= */

export interface Club {
  id: string;
  name: string;
  college: string;
  slug: string;
  verified: boolean;
}

/* =========================================================
   Campaign Sub-Types
========================================================= */

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
   User & Roles
========================================================= */

export type UserRole =
  | "student"
  | "STUDENT"
  | "admin"
  | "ADMIN"
  | "USER"
  | "donor"
  | "DONOR"
  | "STUDENT_PRESIDENT"
  | "COMPLIANCE_OFFICER"
  | "INCUBATOR_MANAGER"
  | "PROFESSOR"
  | "RESEARCHER"
  | "MENTOR"
  | "ORG_ADMIN"
  | "CORPORATE_ADMIN";

export interface SpeciesIdentity {
  speciesId?: string;
  commonName: string;
  scientificName?: string;
  slug: string;
  category?: string;
  speciesNumber?: number;
  totalCount?: number;
  estimatedCount?: number;
  assignedCount?: number;
  avatarUrl?: string;
  thumbnailUrl?: string;
  habitat?: string;
  region?: string;
  taxonomicGroup?: string;
  description?: string;
  badgeTitle?: string;
  assignedBy?: string;
  assignedOn?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  username?: string;
  phone?: string;
  designation?: string;
  department?: string;
  bio?: string;
  role: UserRole;
  permissions?: string[];

  accountStatus: AccountStatus;
  profileComplete: boolean;
  emailVerified: boolean;
  studentVerified: boolean;

  isClubPresident: boolean;
  isClubMember: boolean;
  clubVerified: boolean;

  clubIds: string[];

  profilePicture?: string;
  avatar?: string;
  realAvatar?: string;
  profileMetadata?: any;
  speciesId?: string;
  speciesNumber?: number;
  speciesIdentity?: SpeciesIdentity;

  createdAt: string;
  updatedAt: string;
  
  availableProfiles?: { organizationId: string; role: string; status?: string; orgName?: string; orgSlug?: string; orgType?: string }[];
  activeProfile?: { organizationId?: string | null; role: string; status?: string; orgName?: string; orgSlug?: string; orgType?: string; isIndependent?: boolean };
  activeIdentityType?: 'USER' | 'ORG_MEMBER' | 'ORG_ADMIN';
  independentProfile?: { organizationId?: null; role: string; label?: string; description?: string; isIndependent?: boolean };
  memberProfiles?: { organizationId: string; role: string; status?: string; orgName?: string; orgSlug?: string; orgType?: string }[];
  adminProfiles?: { organizationId: string; role: string; status?: string; orgName?: string; orgSlug?: string; orgType?: string }[];
  organizations?: { id: string; name: string; slug: string; orgType?: string; role: string; status?: string }[];
  memberships?: any[];
  isNewUser?: boolean;
  roles?: string[];
}

/* =========================================================
   Campaign Types (User Projects)
========================================================= */
/* =========================================================
   Campaign Sub-Types
========================================================= */

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
   Milestones
========================================================= */

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

export type MilestoneStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  budget: number;
  targetAmount?: number;
  sequenceOrder?: number;
  order?: number;
  acceptanceCriteria?: string[];
  criteria?: string[];
  requiredEvidenceTypes?: string[];

  status: MilestoneStatus | string;

  activatedAt?: string;
  dueDate?: string;
  deadline?: string;
  approvedAt?: string;
  disbursedAt?: string;

  submissions?: MilestoneSubmission[];
}

export interface CampaignMember {
  id: string;
  campaignId?: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  title?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    username?: string;
    profilePicture?: string | null;
    avatar?: string | null;
    speciesIdentity?: any;
  } | null;
  joinedAt?: string;
}

export interface Campaign {
  id: string;
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;

  category?: string;
  campaignType?: "INDIVIDUAL" | "TEAM";
  stage?: "DISCOVERY" | "FEASIBILITY" | "PROTOTYPE" | "PILOT" | "COMMERCIALIZATION";

  coverImageUrl?: string;
  imageUrl?: string;
  galleryImageUrls?: string[];
  videoUrl?: string;
  youtubeUrl?: string;
  presentationDeckUrl?: string | null;

  targetAmount?: number;
  goalAmount: number;
  currentRaisedAmount?: number;
  currentAmount?: number;
  raisedAmount?: number;
  progressPercentage?: number;
  minDonationAmount?: number;
  donorCount?: number;
  currency?: string;

  status: "approved" | "pending" | "rejected" | "live" | "draft" | "completed" | "paused" | "submitted" | "SUBMITTED" | "LIVE" | "REJECTED" | "DRAFT" | "APPROVED" | "COMPLETED" | "PAUSED" | string;
  
  faqs?: FAQ[];
  teamMembers?: TeamMember[];
  members?: CampaignMember[];
  beneficiaryDetails?: any;
  milestones?: Milestone[];
  endorsements?: any[];

  studentName?: string;
  student?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    profilePicture?: string;
    speciesId?: string;
    speciesNumber?: number;
    speciesIdentity?: any;
  };
  user?: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    username?: string;
    avatar?: string;
    profilePicture?: string;
    speciesId?: string;
    speciesNumber?: number;
    speciesIdentity?: any;
  };
  creator?: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    username?: string;
    avatar?: string;
    profilePicture?: string;
    speciesId?: string;
    speciesNumber?: number;
    speciesIdentity?: any;
  };
  college?: string;
  clubId?: string | null;
  club?: {
    id: string;
    name: string;
    college: string;
    slug: string;
  };

  rejectionReason?: string;
  reapprovalCount?: number;
  userId?: string;
  createdBy?: string | { id: string };
  rating?: number;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/* =========================================================
   Donor Project Types
========================================================= */

export interface Project {
  id: string;
  title: string;
  imageUrl?: string;
  description: string;
  organization?: string; // mapped from organizationName
  companyName?: string; // Alias for organization used by components

  donor?: {
    id: string;
    name: string;
    email: string;
    organizationName: string;
  };

  createdBy?: string; // Donor ID who created the project
  interestedUsers?: Array<{ id: string; name: string; email: string }>; // Users who applied

  skillsRequired?: string[];
  timeline?: string | { startDate: Date | string; endDate: Date | string } | null; // DB string or parsed object

  totalBudget?: number;
  allocatedFunds?: number;

  status: ProjectStatus;
  rejectionReason?: string;

  createdAt: string | Date;
  updatedAt?: string;

  stage?: "DISCOVERY" | "FEASIBILITY" | "PROTOTYPE" | "PILOT" | "COMMERCIALIZATION";
  members?: any[];
  tasks?: any[];
  labNotebooks?: any[];
}

export interface ProjectApplication {
  id: string;
  projectId: string;

  userId: string;
  userName: string;
  userEmail: string;

  coverLetter: string;
  skills: string[];

  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string;

  appliedAt: Date;
}

/* =========================================================
   Student
========================================================= */

export interface Student {
  id: string;
  name: string;
  email: string;
  university: string;
  avatar?: string;
}


/* =========================================================
   Admin Specific Types
========================================================= */

export interface DashboardStats {
  kpi: {
    totalUsers: number;
    totalDonors: number;
    totalClubs: number;
    totalDonations: number;
    campaigns: {
      APPROVED: number;
      PENDING: number;
      REJECTED: number;
      PAUSED: number;
      FROZEN: number;
      total: number;
    };
    milestones?: {
      PENDING: number;
      SUBMITTED: number;
      APPROVED: number;
      REJECTED: number;
      total: number;
    };
    pendingApprovals: number;
    openTickets: number;
  };
  attention: {
    slaBreaches: number;
    frozenCampaigns: number;
    pendingMilestones: number;
  }
}

export interface AuditLog {
  id: string,
  action: string,
  entityType: string,
  entityId: string,
  performedBy: string,
  details?: any;
  createdAt: string;
}