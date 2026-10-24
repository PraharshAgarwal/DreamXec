import { useState, useEffect, useCallback } from "react";
import type { User } from "../../../types";
import type { Project, CreateProjectParams } from "../project.types";
import {
  getPublicDonorProjects,
  createDonorProject,
  getMyDonorProjects,
} from "../../../services/donorProjectService";
import {
  getAllProjects,
  verifyDonorProject,
} from "../../../services/adminService";
import {
  applyToProject as apiApplyToProject,
  getMyApplications,
} from "../../../services/applicationService";
import { mapDonorProjectToProject } from "../../../services/mappers";
import { useLoader } from "../../../context/LoaderContext";

export function useProjects(user: User | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const { showLoader, hideLoader } = useLoader();

  // Load public donor projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await getPublicDonorProjects();
        if (response.data?.donorProjects) {
          const mapped = response.data.donorProjects.map(mapDonorProjectToProject);
          setProjects(mapped);
        }
      } catch (error) {
        console.error("Failed to load public donor projects:", error);
      }
    };
    loadProjects();
  }, []);

  // Load admin projects
  useEffect(() => {
    if (user?.role === "admin") {
      const loadAdminProjects = async () => {
        try {
          const response = await getAllProjects();
          if (response.data?.donorProjects?.data) {
            setProjects(response.data.donorProjects.data);
          }
        } catch (error) {
          console.error("Failed to load admin donor projects:", error);
        }
      };
      loadAdminProjects();
    }
  }, [user?.role]);

  // Load donor-specific projects
  useEffect(() => {
    if (user?.role === "donor") {
      const loadDonorProjects = async () => {
        try {
          const response = await getMyDonorProjects();
          if (response.data?.donorProjects) {
            const mapped = response.data.donorProjects.map(mapDonorProjectToProject);
            setProjects(mapped);
          }
        } catch (error) {
          console.error("Failed to load my donor projects:", error);
        }
      };
      loadDonorProjects();
    }
  }, [user?.role, user?.id]);

  // Load student applications
  useEffect(() => {
    if (user?.role === "student") {
      const loadApplications = async () => {
        try {
          const response = await getMyApplications();
          if (response.success === true && response.data?.applications) {
            const appliedIds = response.data.applications.map(
              (app: any) => app.donorProjectId
            );
            setUserApplications(appliedIds);
          } else {
            setUserApplications([]);
          }
        } catch (error) {
          console.error("Failed to load student applications:", error);
          setUserApplications([]);
        }
      };
      loadApplications();
    } else {
      setUserApplications([]);
    }
  }, [user?.role, user?.id]);

  const handleCreateProject = useCallback(
    async (data: CreateProjectParams) => {
      showLoader();
      try {
        const diffTime = Math.abs(data.endDate.getTime() - data.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.ceil(diffDays / 30);
        const timeline = `${months} month${months > 1 ? "s" : ""}`;

        const projectData = {
          title: data.title,
          description: data.description,
          organization: data.companyName,
          skillsRequired: data.skillsRequired,
          timeline,
          totalBudget: 10000,
        };

        const response = await createDonorProject(projectData);
        if (response.data?.donorProject) {
          const newProject = mapDonorProjectToProject(response.data.donorProject);
          setProjects((prev) => [...prev, newProject]);
          return newProject;
        }
      } catch (error) {
        console.error("Failed to create project:", error);
        throw error;
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  const handleApplyToProject = useCallback(
    async (projectId: string, coverLetter: string, skills: string[]) => {
      if (!user) throw new Error("Please log in to apply");
      if (userApplications.includes(projectId))
        throw new Error("You have already applied to this project");

      try {
        const response = await apiApplyToProject({
          donorProjectId: projectId,
          coverLetter,
          skills,
        });
        if (response.data?.application) {
          setUserApplications((prev) => [...prev, projectId]);
        }
      } catch (error) {
        console.error("Failed to apply to project:", error);
        throw error;
      }
    },
    [user, userApplications]
  );

  const handleApproveProject = useCallback(
    async (id: string) => {
      showLoader();
      try {
        await verifyDonorProject(id, { status: "APPROVED" });
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" as const } : p))
        );
      } catch (error) {
        console.error("Failed to approve donor project:", error);
        alert("Failed to approve donor project.");
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  const handleRejectProject = useCallback(
    async (id: string, reason: string) => {
      showLoader();
      try {
        await verifyDonorProject(id, { status: "REJECTED", reason });
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "REJECTED" as const, rejectionReason: reason } : p
          )
        );
      } catch (error) {
        console.error("Failed to reject donor project:", error);
        alert("Failed to reject donor project.");
      } finally {
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  return {
    projects,
    userApplications,
    donorProjects: projects.filter((p) => p.createdBy === user?.id),
    approvedProjects: projects.filter((p) => p.status?.toLowerCase() === "approved"),
    pendingProjects: projects.filter((p) => p.status?.toLowerCase() === "pending"),
    handleCreateProject,
    handleApplyToProject,
    handleApproveProject,
    handleRejectProject,
  };
}
