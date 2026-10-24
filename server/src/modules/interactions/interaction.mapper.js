function toCommentDto(comment, context = {}) {
  if (!comment) return null;

  const isOwner = !!(
    (context.ownerUserId && context.ownerUserId === comment.userId) ||
    context.ownerUserIds?.has?.(comment.userId)
  );
  const isTeam = isOwner || !!context.teamUserIds?.has?.(comment.userId);
  const isBacker = !!context.donorUserIds?.has?.(comment.userId);
  const isVerified = !!(comment.user?.profileMetadata?.studentVerified || comment.user?.role === 'STUDENT');
  const metadata = comment.user?.profileMetadata || {};
  const speciesSlug =
    comment.user?.assignedSpecies?.slug ||
    metadata.speciesIdentity?.slug ||
    (comment.user?.username ? comment.user.username.replace(/_\d+$/, '') : null);

  const isCustomUpload =
    comment.user?.profilePicture &&
    (comment.user.profilePicture.startsWith('data:') ||
      comment.user.profilePicture.includes('cloudfront.net') ||
      comment.user.profilePicture.includes('amazonaws.com') ||
      comment.user.profilePicture.includes('cloudinary.com') ||
      comment.user.profilePicture.startsWith('/uploads/'));

  const avatar = isCustomUpload
    ? comment.user.profilePicture
    : metadata.profilePicture && !metadata.profilePicture.includes('unsplash.com')
    ? metadata.profilePicture
    : metadata.avatarUrl && !metadata.avatarUrl.includes('unsplash.com')
    ? metadata.avatarUrl
    : speciesSlug
    ? `/api/species/${speciesSlug}/avatar.svg`
    : comment.user?.profilePicture || null;

  const speciesIdentity =
    metadata.speciesIdentity ||
    (comment.user?.assignedSpecies
      ? {
          speciesId: comment.user.assignedSpecies.id,
          commonName: comment.user.assignedSpecies.commonName,
          scientificName: comment.user.assignedSpecies.scientificName,
          slug: comment.user.assignedSpecies.slug,
          category: comment.user.assignedSpecies.category,
          speciesNumber: comment.user.speciesNumber,
          totalCount: comment.user.assignedSpecies.estimatedCount,
          avatarUrl: `/api/species/${comment.user.assignedSpecies.slug}/avatar.svg`,
          thumbnailUrl: `/api/species/${comment.user.assignedSpecies.slug}/avatar.svg`,
          badgeTitle: `${comment.user.assignedSpecies.commonName} #${comment.user.speciesNumber || 1} / ${comment.user.assignedSpecies.estimatedCount}`,
        }
      : speciesSlug
      ? {
          slug: speciesSlug,
          speciesNumber: comment.user?.speciesNumber || 1,
          avatarUrl: `/api/species/${speciesSlug}/avatar.svg`,
          badgeTitle: `${speciesSlug.replace(/_/g, ' ')} #${comment.user?.speciesNumber || 1}`,
        }
      : null);

  return {
    id: comment.id,
    content: comment.content,
    parentId: comment.parentId || null,
    campaignId: comment.campaignId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isFlagged: !!comment.reported,
    reported: !!comment.reported,
    author: comment.user
      ? {
          id: comment.user.id,
          name: comment.user.fullName || comment.user.name || 'User',
          username: comment.user.username || null,
          profilePicture: avatar,
          avatar: avatar,
          speciesIdentity,
          role: comment.user.role,
          isProjectLead: isOwner,
          isTeamMember: isTeam,
          isBacker: isBacker,
          isVerified: isVerified,
          type: comment.user.role === 'DONOR' ? 'DONOR' : 'USER',
        }
      : null,
    user: comment.user
      ? {
          id: comment.user.id,
          name: comment.user.fullName || comment.user.name || 'User',
          username: comment.user.username || null,
          profilePicture: avatar,
          avatar: avatar,
          speciesIdentity,
          isProjectLead: isOwner,
          isTeamMember: isTeam,
          isBacker: isBacker,
        }
      : null,
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((r) => toCommentDto(r, context))
      : [],
  };
}

function toWishlistProjectDto(wishlistItem) {
  if (!wishlistItem) return null;
  const p = wishlistItem.userProject || wishlistItem;
  return {
    id: p.id,
    title: p.title,
    description: p.description || null,
    imageUrl: p.imageUrl || null,
    goalAmount: p.goalAmount || 0,
    amountRaised: p.amountRaised || 0,
    status: p.status || null,
    createdAt: p.createdAt,
    companyName: p.companyName || null,
  };
}

module.exports = {
  toCommentDto,
  toWishlistProjectDto,
};
