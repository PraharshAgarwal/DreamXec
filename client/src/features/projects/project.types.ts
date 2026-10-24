import type { Project, ProjectStatus, ProjectApplication } from "../../types";

export type { Project, ProjectStatus, ProjectApplication };

export interface CreateProjectParams {
  title: string;
  companyName: string;
  description: string;
  skillsRequired: string[];
  startDate: Date;
  endDate: Date;
}
