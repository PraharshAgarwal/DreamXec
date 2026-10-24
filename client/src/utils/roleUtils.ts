/**
 * Unified Role and Profile Utility for DreamXec Dual-Custody Network
 * Centralizes role formatting, persona resolution, and label generation across all UI components.
 */

export interface UserRoleProfile {
  isIndependent: boolean;
  roleRaw: string;
  roleLabel: string;
  orgName: string;
  orgType?: string;
  badgeLabel: string;
  identityType: 'USER' | 'ORG_MEMBER' | 'ORG_ADMIN';
}

const ADMIN_ROLES = [
  'ORG_ADMIN',
  'CORPORATE_ADMIN',
  'INCUBATOR_MANAGER',
  'ADMIN',
  'DX_ADMIN',
  'SUPER_ADMIN',
];

/**
 * Maps any role string into a clean, human-readable display label.
 */
export function formatRoleLabel(roleStr?: string, isIndependent?: boolean): string {
  if (isIndependent) return 'Independent User';
  if (!roleStr) return 'Independent User';

  const r = roleStr.toUpperCase().trim();

  switch (r) {
    case 'USER':
    case 'INDEPENDENT':
    case 'PUBLIC_USER':
      return 'Independent User';
    case 'STUDENT':
      return 'Student Researcher';
    case 'STUDENT_PRESIDENT':
      return 'Club President';
    case 'RESEARCHER':
      return 'Researcher';
    case 'PROFESSOR':
      return 'Faculty Lead';
    case 'INCUBATOR_MANAGER':
      return 'Incubator Manager';
    case 'DONOR':
      return 'Impact Backer';
    case 'MENTOR':
      return 'Technical Mentor';
    case 'ORG_ADMIN':
      return 'Organization Admin';
    case 'CORPORATE_ADMIN':
      return 'Corporate Admin';
    case 'DX_ADMIN':
    case 'ADMIN':
      return 'Platform Admin';
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'COMPLIANCE_OFFICER':
      return 'Compliance Officer';
    case 'FINANCE_OFFICER':
      return 'Finance Officer';
    case 'GRANT_OFFICER':
      return 'Grant Officer';
    case 'GOV_OFFICER':
    case 'GOV_OFFICIAL':
      return 'Government Official';
    case 'SPONSOR':
      return 'Corporate Sponsor';
    case 'ALUMNI':
      return 'Alumni Network';
    case 'CSR_MANAGER':
      return 'CSR Manager';
    case 'CORPORATE_RECRUITER':
      return 'Corporate Recruiter';
    case 'VOLUNTEER':
      return 'Volunteer';
    case 'PROGRAM_MANAGER':
      return 'Program Manager';
    case 'EXTERNAL_ORG_MEMBER':
    case 'EXTERNAL_ORG':
      return 'External Organisation Member';
    default:
      return r.replace(/_/g, ' ');
  }
}

/**
 * Evaluates the active user state and resolves identity mode, role, and organization consistently.
 */
export function getUserRoleProfile(user: any): UserRoleProfile {
  if (!user) {
    return {
      isIndependent: true,
      roleRaw: 'USER',
      roleLabel: 'Independent User',
      orgName: 'DreamXec Dual-Custody Network',
      badgeLabel: 'Independent User',
      identityType: 'USER',
    };
  }

  const activeProfile = user.activeProfile;
  const isExternal =
    (activeProfile?.role && activeProfile.role.toUpperCase() === 'EXTERNAL_ORG_MEMBER') ||
    (user.role && user.role.toString().toUpperCase() === 'EXTERNAL_ORG_MEMBER') ||
    activeProfile?.orgType === 'EXTERNAL_ORG';

  if (isExternal) {
    const orgName = activeProfile?.orgName || 'External Partner Organisation';
    return {
      isIndependent: false,
      roleRaw: 'EXTERNAL_ORG_MEMBER',
      roleLabel: 'External Organisation Member',
      orgName,
      orgType: 'EXTERNAL_ORG',
      badgeLabel: 'External Organisation Member',
      identityType: 'ORG_MEMBER',
    };
  }

  const isExplicitIndependent =
    !activeProfile ||
    user.activeIdentityType === 'USER' ||
    (activeProfile.role && activeProfile.role.toUpperCase() === 'USER') ||
    activeProfile.isIndependent === true;

  if (isExplicitIndependent) {
    const accountRole = (user.role || '').toString().toUpperCase();
    const displayRoleRaw = accountRole === 'USER' ? 'STUDENT' : accountRole;
    const displayRoleLabel =
      displayRoleRaw && displayRoleRaw !== 'USER'
        ? formatRoleLabel(displayRoleRaw)
        : 'Independent User';

    return {
      isIndependent: true,
      roleRaw: 'USER',
      roleLabel: displayRoleLabel,
      orgName: 'DreamXec Dual-Custody Network',
      badgeLabel: displayRoleLabel,
      identityType: 'USER',
    };
  }

  const roleRaw = (activeProfile.role || user.role || 'USER').toUpperCase();
  const roleLabel = formatRoleLabel(roleRaw, false);
  const orgName = activeProfile.orgName || 'DreamXec Network';
  const orgType = activeProfile.orgType;
  const identityType: 'ORG_ADMIN' | 'ORG_MEMBER' = ADMIN_ROLES.includes(roleRaw)
    ? 'ORG_ADMIN'
    : 'ORG_MEMBER';

  return {
    isIndependent: false,
    roleRaw,
    roleLabel,
    orgName,
    orgType,
    badgeLabel: roleLabel,
    identityType,
  };
}

export interface UserDisplayPersona {
  displayName: string;
  handle: string;
  avatarUrl?: string;
  isSpecies: boolean;
  speciesCommonName?: string;
  speciesNumber?: number;
  speciesTotalCount?: number;
  speciesSlug?: string;
  speciesAvatarUrl?: string;
  realName: string;
  realAvatarUrl?: string;
  realInitials: string;
}

/**
 * Resolves the public display persona (Species vs Real Identity) for a user.
 */
export function getUserDisplayPersona(
  user: any,
  personaMode: 'species' | 'real' = 'species'
): UserDisplayPersona {
  const realName = user?.fullName || user?.name || 'User';
  const realInitials =
    realName
      .trim()
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  const realAvatarUrl =
    user?.realAvatar ||
    user?.profileMetadata?.avatarUrl ||
    user?.profileMetadata?.googleAvatarUrl ||
    user?.profileMetadata?.profilePicture ||
    (user?.profilePicture && !user.profilePicture.includes('/api/species/')
      ? user.profilePicture
      : undefined) ||
    undefined;

  const species = user?.speciesIdentity || user?.profileMetadata?.speciesIdentity || null;
  const speciesCommonName = species?.commonName || 'Endangered Species';
  const speciesSlug = species?.slug || null;
  const speciesNumber = species?.speciesNumber || user?.speciesNumber || 1;
  const speciesTotalCount = species?.totalCount || 76;
  const speciesAvatarUrl =
    species?.avatarUrl || (speciesSlug ? `/api/species/${speciesSlug}/avatar.svg` : undefined);
  const speciesHandle = user?.username
    ? `@${user.username}`
    : `@${speciesSlug || 'species'}_${speciesNumber}`;

  // If in species mode AND user has a species identity (or species slug)
  const isSpecies = personaMode === 'species' && Boolean(species || speciesSlug);

  return {
    displayName: isSpecies ? speciesCommonName : realName,
    handle: isSpecies ? speciesHandle : user?.username ? `@${user.username}` : '@user',
    avatarUrl: isSpecies ? speciesAvatarUrl || realAvatarUrl : realAvatarUrl || speciesAvatarUrl,
    isSpecies,
    speciesCommonName,
    speciesNumber,
    speciesTotalCount,
    speciesSlug: speciesSlug || undefined,
    speciesAvatarUrl,
    realName,
    realAvatarUrl,
    realInitials,
  };
}
