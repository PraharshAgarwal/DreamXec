// mapper.ts
// Utility functions to map between backend API types and frontend types

import type { Campaign, Project, UserRole } from '../types';
import type { UserProject } from './userProjectService';
import type { DonorProject } from './donorProjectService';

/* =========================================================
   Shared Types
========================================================= */



/* =========================================================
   Role Mapping
========================================================= */

export const CAMPAIGN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const PROJECT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  FROZEN: 'frozen',
} as const;

export type BackendRole =
  | 'USER'
  | 'DONOR'
  | 'ADMIN'
  | 'STUDENT_PRESIDENT'
  | 'COMPLIANCE_OFFICER'
  | 'INCUBATOR_MANAGER'
  | 'PROFESSOR'
  | 'RESEARCHER'
  | 'MENTOR'
  | 'ORG_ADMIN'
  | 'CORPORATE_ADMIN';

// Backend → Frontend
export const mapBackendRole = (
  backendRole: string
): UserRole => {
  const roleMap: Record<string, UserRole> = {
    USER: 'student',
    DONOR: 'donor',
    ADMIN: 'admin',
    STUDENT_PRESIDENT: 'STUDENT_PRESIDENT',
    COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
    INCUBATOR_MANAGER: 'INCUBATOR_MANAGER',
    PROFESSOR: 'PROFESSOR',
    RESEARCHER: 'RESEARCHER',
    MENTOR: 'MENTOR',
    ORG_ADMIN: 'ORG_ADMIN',
    CORPORATE_ADMIN: 'CORPORATE_ADMIN',
  };

  return roleMap[backendRole] ?? (backendRole as UserRole) ?? 'student';
};

// Frontend → Backend
export const mapFrontendRole = (
  frontendRole: UserRole
): BackendRole => {
  const roleMap: Record<UserRole, BackendRole> = {
    student: 'USER',
    STUDENT: 'USER',
    USER: 'USER',
    donor: 'DONOR',
    DONOR: 'DONOR',
    admin: 'ADMIN',
    ADMIN: 'ADMIN',
    STUDENT_PRESIDENT: 'STUDENT_PRESIDENT',
    COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
    INCUBATOR_MANAGER: 'INCUBATOR_MANAGER',
    PROFESSOR: 'PROFESSOR',
    RESEARCHER: 'RESEARCHER',
    MENTOR: 'MENTOR',
    ORG_ADMIN: 'ORG_ADMIN',
    CORPORATE_ADMIN: 'CORPORATE_ADMIN',
  };

  return roleMap[frontendRole] ?? 'USER';
};

/* =========================================================
   Status Mapping
========================================================= */

export const mapBackendStatus = (
  backendStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
): 'pending' | 'approved' | 'rejected' => {
  if (!backendStatus) return 'approved';
  return backendStatus.toLowerCase() as
    | 'pending'
    | 'approved'
    | 'rejected';
};


export const mapFrontendStatus = (
  frontendStatus: 'pending' | 'approved' | 'rejected'
): 'PENDING' | 'APPROVED' | 'REJECTED' => {
  return frontendStatus.toUpperCase() as
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';
};

/* =========================================================
   UserProject (Backend) → Campaign (Frontend)
   ✅ Single source of truth = Club Relation
========================================================= */

export const mapUserProjectToCampaign = (
  userProject: UserProject
): Campaign => {
  return {
    id: userProject.id,
    title: userProject.title,
    description: userProject.description,

    clubId: userProject.clubId,
    club: userProject.club
      ? {
        id: userProject.club.id,
        name: userProject.club.name,
        college: userProject.club.college,
        slug: userProject.club.slug,
      }
      : undefined,

    goalAmount: userProject.goalAmount,
    currentAmount: userProject.amountRaised || 0,

    rating: userProject.rating ?? 5, // ⭐ DEFAULT SAFE

    userId: userProject.userId,

    status: mapBackendStatus(userProject.status), // KEEP UPPERCASE

    createdAt: new Date(userProject.createdAt),

    campaignType: userProject.campaignType || "INDIVIDUAL",
    teamMembers: userProject.teamMembers || [],
    faqs: userProject.faqs || [],
    youtubeUrl: userProject.youtubeUrl,

    imageUrl: userProject.imageUrl,
    coverImageUrl: userProject.imageUrl,
    galleryImageUrls: userProject.campaignMedia || [],
    presentationDeckUrl: userProject.presentationDeckUrl || null,

    rejectionReason: userProject.rejectionReason,

    milestones:
      userProject.milestones?.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        durationDays: m.durationDays,
        budget: m.budget,
        order: m.order,
        status: m.status,
        activatedAt: m.activatedAt,
        dueDate: m.dueDate,
        approvedAt: m.approvedAt,
        submissions: m.submissions || [],
      })) || [],
  };
};

/* =========================================================
   DonorProject (Backend) → Project (Frontend)
========================================================= */

export const mapDonorProjectToProject = (
  donorProject: DonorProject & { interestedUsers?: any[] }
): Project => {
  return {
    id: donorProject.id,
    title: donorProject.title,
    imageUrl: donorProject.imageUrl,
    companyName: donorProject.organization,
    organization: donorProject.organization,
    description: donorProject.description,
    skillsRequired: donorProject.skillsRequired,
    createdBy: donorProject.donorId,
    createdAt: donorProject.createdAt,
    interestedUsers: donorProject.interestedUsers || [],
    status: mapBackendStatus(donorProject.status),
    rejectionReason: donorProject.rejectionReason,
    timeline: {
      startDate: new Date(donorProject.createdAt),
      endDate: new Date(donorProject.createdAt),
    },
  };
};

/* =========================================================
   Campaign (Frontend) → CreateUserProjectData (Backend)
   🚀 clubId is sent directly (NO names)
========================================================= */

export const mapCampaignToUserProjectData = (
  campaign: Partial<Campaign>
) => {
  return {
    title: campaign.title || '',
    description: campaign.description || '',
    clubId: campaign.club?.id,
    goalAmount: campaign.goalAmount || 0,
    milestones: campaign.milestones || [],
  };
};

/* =========================================================
   Project (Frontend) → CreateDonorProjectData (Backend)
========================================================= */

export const mapProjectToDonorProjectData = (
  project: Partial<Project>
) => {
  return {
    title: project.title || '',
    description: project.description || '',
    organization: project.companyName || '',
    skillsRequired: project.skillsRequired || [],
  };
};
