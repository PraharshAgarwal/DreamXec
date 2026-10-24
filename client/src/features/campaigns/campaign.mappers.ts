import { mapUserProjectToCampaign } from "../../services/mappers";
import type { Campaign } from "../../types";

export { mapUserProjectToCampaign };

export function filterApprovedCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((c) => c.status?.toLowerCase() === "approved");
}

export function filterPendingCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((c) => c.status?.toLowerCase() === "pending");
}
