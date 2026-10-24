import type { User, UserRole, AccountStatus } from "../../types";

export type { User, UserRole, AccountStatus };

export interface AuthState {
  user: User | null;
  loading: boolean;
  isSubmitting: boolean;
}

export interface LoginParams {
  email: string;
  password: string;
  role?: string;
}

export interface SignupParams {
  name: string;
  email: string;
  password: string;
  role?: string;
  institution?: string;
  institutionMeta?: {
    institutionName: string;
    aicteId?: string;
    state?: string;
  };
}
