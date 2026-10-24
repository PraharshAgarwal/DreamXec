class UserMapper {
  /**
   * Transforms a database User entity into a safe public DTO.
   * Strips all password hashes, security tokens, and internal metadata.
   */
  static toPublicUser(user, orgRoles = [], permissions = []) {
    if (!user) return null;

    const rawUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };

    // Extract profile metadata fields if available
    const metadata = rawUser.profileMetadata || {};
    const emailVerified = metadata.emailVerified ?? rawUser.emailVerified ?? false;
    const profileComplete = metadata.profileComplete ?? rawUser.profileComplete ?? false;

    const isClubPresident = orgRoles.some((r) => r.role === 'STUDENT_PRESIDENT');
    const isClubMember = orgRoles.some((r) => r.role === 'STUDENT' || r.role === 'STUDENT_PRESIDENT') || metadata.isClubMember === true;
    const studentVerified = metadata.studentVerified !== undefined ? Boolean(metadata.studentVerified) : (isClubPresident || isClubMember);
    const clubVerified = isClubPresident || Boolean(metadata.clubVerified);

    // Delete sensitive credentials and tokens
    delete rawUser.password;
    delete rawUser.passwordHash;
    delete rawUser.verificationToken;
    delete rawUser.verificationTokenExpiry;
    delete rawUser.resetPasswordToken;
    delete rawUser.resetPasswordExpiry;

    const roles = Array.from(
      new Set([rawUser.role, ...orgRoles.map((r) => r.role)].filter(Boolean))
    );
    const organizations = orgRoles.map((r) => ({
      id: r.organizationId || r.orgId || r.id,
      name: r.orgName || r.name || null,
      slug: r.orgSlug || r.slug || null,
      orgType: r.orgType || null,
      role: r.role,
      parentOrgId: r.parentOrgId || null,
      parentOrgName: r.parentOrgName || null,
      parentOrgSlug: r.parentOrgSlug || null,
      parentOrgType: r.parentOrgType || null,
    }));

    const speciesSlug =
      rawUser.assignedSpecies?.slug ||
      metadata.speciesIdentity?.slug ||
      (rawUser.username ? rawUser.username.replace(/_\d+$/, '') : null);

    const isCustomUpload =
      rawUser.profilePicture &&
      (rawUser.profilePicture.startsWith('data:') ||
        rawUser.profilePicture.includes('cloudfront.net') ||
        rawUser.profilePicture.includes('amazonaws.com') ||
        rawUser.profilePicture.includes('googleusercontent.com') ||
        rawUser.profilePicture.includes('cloudinary.com') ||
        rawUser.profilePicture.startsWith('/uploads/'));

    const profilePicture =
      isCustomUpload
        ? rawUser.profilePicture
        : metadata.profilePicture && !metadata.profilePicture.includes('unsplash.com')
        ? metadata.profilePicture
        : metadata.avatarUrl && !metadata.avatarUrl.includes('unsplash.com')
        ? metadata.avatarUrl
        : speciesSlug
        ? `/api/species/${speciesSlug}/avatar.svg`
        : rawUser.profilePicture || null;

    const speciesIdentity =
      metadata.speciesIdentity ||
      (rawUser.assignedSpecies
        ? {
            speciesId: rawUser.assignedSpecies.id,
            commonName: rawUser.assignedSpecies.commonName,
            scientificName: rawUser.assignedSpecies.scientificName,
            slug: rawUser.assignedSpecies.slug,
            category: rawUser.assignedSpecies.category,
            taxonomicGroup: rawUser.assignedSpecies.taxonomicGroup,
            region: rawUser.assignedSpecies.region,
            speciesNumber: rawUser.speciesNumber,
            totalCount: rawUser.assignedSpecies.estimatedCount,
            assignedCount: rawUser.assignedSpecies.assignedCount,
            avatarUrl: `/api/species/${rawUser.assignedSpecies.slug}/avatar.svg`,
            thumbnailUrl: `/api/species/${rawUser.assignedSpecies.slug}/avatar.svg`,
            habitat: rawUser.assignedSpecies.habitat,
            description: rawUser.assignedSpecies.description,
            badgeTitle: `${rawUser.assignedSpecies.commonName} #${rawUser.speciesNumber || 1} / ${rawUser.assignedSpecies.estimatedCount}`,
          }
        : speciesSlug
        ? {
            slug: speciesSlug,
            speciesNumber: rawUser.speciesNumber || 1,
            avatarUrl: `/api/species/${speciesSlug}/avatar.svg`,
            badgeTitle: `${speciesSlug.replace(/_/g, ' ')} #${rawUser.speciesNumber || 1}`,
          }
        : null);

    return {
      id: rawUser.id,
      email: rawUser.email,
      secondaryEmail: rawUser.secondaryEmail || null,
      fullName: rawUser.fullName || rawUser.name || '',
      name: rawUser.fullName || rawUser.name || '',
      username: rawUser.username || null,
      speciesId: rawUser.speciesId || null,
      speciesNumber: rawUser.speciesNumber || null,
      profilePicture,
      avatar: profilePicture,
      speciesIdentity,
      role: rawUser.role,
      roles,
      organizations,
      availableProfiles: orgRoles,
      orgRoles,
      independentProfile: {
        role: 'USER',
        label: 'Independent User',
        description: 'Individual platform user with no organization constraints',
        isIndependent: true,
        organizationId: null,
        orgName: 'Independent (No Organization)',
        orgSlug: null,
      },
      memberProfiles: orgRoles.filter((r) => !['ORG_ADMIN', 'CORPORATE_ADMIN', 'INCUBATOR_MANAGER', 'ADMIN', 'DX_ADMIN'].includes((r.role || '').toUpperCase())),
      adminProfiles: orgRoles.filter((r) => ['ORG_ADMIN', 'CORPORATE_ADMIN', 'INCUBATOR_MANAGER', 'ADMIN', 'DX_ADMIN'].includes((r.role || '').toUpperCase())),
      activeIdentityType: 'USER',
      accountStatus: rawUser.accountStatus,
      emailVerified,
      profileComplete,
      studentVerified,
      isClubPresident,
      isClubMember,
      clubVerified,
      permissions,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    };
  }
  /**
   * Transforms a database User entity into a clean domain representation.
   * Preserves credentials for authentication while decoupling ORM specifics.
   */
  static toDomainUser(user) {
    if (!user) return null;

    const rawUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    const metadata = rawUser.profileMetadata || {};

    const speciesSlug =
      rawUser.assignedSpecies?.slug ||
      metadata.speciesIdentity?.slug ||
      (rawUser.username ? rawUser.username.replace(/_\d+$/, '') : null);

    const isCustomUpload =
      rawUser.profilePicture &&
      (rawUser.profilePicture.startsWith('data:') ||
        rawUser.profilePicture.includes('cloudfront.net') ||
        rawUser.profilePicture.includes('amazonaws.com') ||
        rawUser.profilePicture.includes('googleusercontent.com') ||
        rawUser.profilePicture.includes('cloudinary.com') ||
        rawUser.profilePicture.startsWith('/uploads/'));

    const profilePicture =
      isCustomUpload
        ? rawUser.profilePicture
        : metadata.profilePicture && !metadata.profilePicture.includes('unsplash.com')
        ? metadata.profilePicture
        : metadata.avatarUrl && !metadata.avatarUrl.includes('unsplash.com')
        ? metadata.avatarUrl
        : speciesSlug
        ? `/api/species/${speciesSlug}/avatar.svg`
        : rawUser.profilePicture || null;

    return {
      id: rawUser.id,
      email: rawUser.email,
      secondaryEmail: rawUser.secondaryEmail || null,
      fullName: rawUser.fullName || rawUser.name || '',
      name: rawUser.fullName || rawUser.name || '',
      username: rawUser.username || null,
      speciesId: rawUser.speciesId || null,
      speciesNumber: rawUser.speciesNumber || null,
      profilePicture,
      assignedSpecies: rawUser.assignedSpecies || null,
      passwordHash: rawUser.passwordHash || null,
      role: rawUser.role,
      accountStatus: rawUser.accountStatus,
      profileMetadata: rawUser.profileMetadata || {},
      emailVerified: metadata.emailVerified ?? rawUser.emailVerified ?? false,
      googleId: rawUser.googleId || metadata.googleId || metadata.providers?.google || null,
      linkedinId: rawUser.linkedinId || metadata.linkedinId || metadata.providers?.linkedin || null,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    };
  }
}

module.exports = UserMapper;
