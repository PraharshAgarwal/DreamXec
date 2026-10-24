import apiRequest, { type ApiResponse } from './api';

export interface Application {
  id: string;
  userId: string;
  donorProjectId: string;
  coverLetter: string;
  skills: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  donorProject?: {
    id: string;
    title: string;
    organization: string;
    timeline: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateApplicationData {
  donorProjectId: string;
  coverLetter: string;
  skills?: string[];
}

export interface UpdateApplicationStatusData {
  status: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
}

// Apply to a donor project (Student)
export const applyToProject = async (data: CreateApplicationData): Promise<ApiResponse<{ application: Application }>> => {
  return apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get my applications (Student)
export const getMyApplications = async (): Promise<ApiResponse<{ applications: Application[] }>> => {
  return apiRequest('/applications/my', {
    method: 'GET',
  });
};

// Get all applications for donor's projects (Donor)
export const getDonorApplications = async (): Promise<ApiResponse<{ applications: Application[] }>> => {
  console.log('ApplicationService: Calling /applications/donor/all');
  const result = await apiRequest<{ applications: Application[] }>('/applications/donor/all', {
    method: 'GET',
  });
  console.log('ApplicationService: getDonorApplications result:', result);
  return result;
};

// Get applications for specific project (Donor)
export const getProjectApplications = async (projectId: string): Promise<ApiResponse<{ applications: Application[] }>> => {
  console.log(`ApplicationService: Calling /applications/donor/project/${projectId}`);
  const result = await apiRequest<{ applications: Application[] }>(`/applications/donor/project/${projectId}`, {
    method: 'GET',
  });
  console.log(`ApplicationService: getProjectApplications result for ${projectId}:`, result);
  return result;
};

// Accept/Reject application (Donor)
export const updateApplicationStatus = async (
  applicationId: string,
  data: UpdateApplicationStatusData
): Promise<ApiResponse<{ application: Application }>> => {
  return apiRequest(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// Withdraw application (Student)
export const withdrawApplication = async (applicationId: string): Promise<ApiResponse<null>> => {
  return apiRequest(`/applications/${applicationId}`, {
    method: 'DELETE',
  });
};
