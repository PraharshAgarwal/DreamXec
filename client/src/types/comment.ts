export type CommentAuthorType = "USER" | "DONOR";

export interface CommentAuthor {
  id: string;
  name: string;
  username?: string | null;
  type: CommentAuthorType;
  profilePicture?: string | null;
  avatar?: string | null;
  speciesIdentity?: any;
  role?: string;
  isProjectLead?: boolean;
  isTeamMember?: boolean;
  isBacker?: boolean;
  isVerified?: boolean;
}

export interface CampaignComment {
  id: string;
  content: string;
  createdAt: string;
  isFlagged: boolean;
  parentId: string | null;
  author: CommentAuthor | null;
  replies: CampaignComment[];
}
