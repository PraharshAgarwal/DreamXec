import apiRequest from "./api";

export interface StudentProfileData {
  name?: string;
  phone?: string;
  countryCode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  college?: string;
  institutionName?: string;
  institutionAicteId?: string;
  institutionState?: string;
  yearOfStudy?: "FIRST" | "SECOND" | "THIRD" | "FINAL";
  address?: string;
  instagram?: string;
  facebook?: string;
  twitterX?: string;
  reddit?: string;
  bio?: string;
  profilePicture?: string;
  skills?: string[];
  projectTitle?: string;
  fundingRequired?: number;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface DonorProfileData {
  name?: string;
  phone?: string;
  countryCode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  panNumber?: string;
  education?: string;
  occupation?: "SALARIED" | "BUSINESS" | "PROFESSIONAL" | "OTHER";
  address?: string;
  instagram?: string;
  facebook?: string;
  twitterX?: string;
  reddit?: string;
  bio?: string;
  profilePicture?: string;
  donationCategories?: string[];
  anonymousDonation?: boolean;
}

export interface ProfileResponse {
  profile: (StudentProfileData | DonorProfileData) & {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    profileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  completionPct?: number;
  role: string;
}

export const getProfile = async () => {
  return apiRequest<ProfileResponse>("/profile/me", { method: "GET" });
};

export const updateProfile = async (
  data: StudentProfileData | DonorProfileData,
) => {
  return apiRequest<ProfileResponse>("/profile/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export interface ProfilePictureResponse {
  profilePicture: string;
  profile: ProfileResponse["profile"];
}

export const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  return apiRequest<ProfilePictureResponse>("/profile/picture", {
    method: "POST",
    body: formData,
  });
};

export type KycStatusType = "UNVERIFIED" | "PENDING_VERIFICATION" | "REJECTED" | "VERIFIED";

export interface KycData {
  kycStatus: KycStatusType;
  govtDocType: string;
  govtDocNumber: string;
  govtDocUrl: string;
  collegeIdCardUrl: string;
  institution: string;
  rollNumber: string;
  branch: string;
  year: string;
  whatsappNumber: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  digilockerVerified?: boolean;
  apaarId?: string | null;
  issuer?: string | null;
}

export interface KycSubmitPayload {
  govtDocType: string;
  govtDocNumber: string;
  govtDocUrl?: string;
  collegeIdCardUrl?: string;
  institution?: string;
  rollNumber?: string;
  branch?: string;
  year?: string;
  whatsappNumber?: string;
  digilockerVerified?: boolean;
  apaarId?: string | null;
  issuer?: string | null;
}

export interface KycResponse {
  status: string;
  message?: string;
  data: KycData;
}

export const getKycStatus = async () => {
  return apiRequest<KycData>("/profile/kyc", { method: "GET" });
};

export const submitKyc = async (payload: KycSubmitPayload) => {
  return apiRequest<KycData>("/profile/kyc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
