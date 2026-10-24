import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // adjust if needed

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Mentor Application Data Interface
 */
export interface MentorApplicationData {
  name: string;
  email: string;
  linkedin?: string;
  role: string;
  organization?: string;
  country: string;
  city?: string;
  yearsOfExperience: number;
  expertiseAreas: string[];
  achievement: string;
  mentoringExperience: "Yes" | "No";
  mentoringDescription?: string;
  projectsOrResearch?: string;
  mentorshipIntent: string;
  scenarioResponse: string;
  monthlyCommitment: "2-3 hours" | "4-6 hours" | "6-10 hours" | "10+ hours";
  mentorshipFormat: string[];
  studentPreference: string[];
  portfolioLinks?: string;
  innovationImpactView: string;
  studentMistakeObservation: string;
  thirtyDayBuildPlan?: string;
  publicMentorFeature?: boolean;
  mentorReferral?: string;
}

/**
 * Submit Mentor Application (PUBLIC)
 */
export const submitMentorApplication = async (
  data: MentorApplicationData
) => {
  try {
    const response = await api.post("/mentor", data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string }>;

      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to submit mentor application"
      );
    }

    throw new Error("Network error or server unavailable");
  }
};

/**
 * Get Mentor Application Status (ADMIN ONLY)
 */
export const getMentorApplicationStatus = async (
  applicationId: string
) => {
  try {
    const response = await api.get(`/mentor/${applicationId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string }>;

      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to fetch application"
      );
    }

    throw new Error("Network error or server unavailable");
  }
};