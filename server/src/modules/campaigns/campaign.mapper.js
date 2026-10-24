/**
 * Data Transfer Object (DTO) Mappers for Campaigns & Milestones.
 * Ensures zero leakage of internal database metadata or secrets.
 */
class CampaignMapper {
  static resolveUserAvatar(user) {
    if (!user) return null;
    const metadata = user.profileMetadata || {};
    const speciesSlug =
      user.assignedSpecies?.slug ||
      metadata.speciesIdentity?.slug ||
      (user.username ? user.username.replace(/_\d+$/, '') : null);

    const isCustomUpload =
      user.profilePicture &&
      (user.profilePicture.startsWith('data:') ||
        user.profilePicture.includes('cloudfront.net') ||
        user.profilePicture.includes('amazonaws.com') ||
        user.profilePicture.includes('cloudinary.com') ||
        user.profilePicture.startsWith('/uploads/'));

    return isCustomUpload
      ? user.profilePicture
      : metadata.profilePicture && !metadata.profilePicture.includes('unsplash.com')
      ? metadata.profilePicture
      : metadata.avatarUrl && !metadata.avatarUrl.includes('unsplash.com')
      ? metadata.avatarUrl
      : speciesSlug
      ? `/api/species/${speciesSlug}/avatar.svg`
      : user.profilePicture || null;
  }

  static resolveSpeciesIdentity(user) {
    if (!user) return null;
    const metadata = user.profileMetadata || {};
    if (metadata.speciesIdentity) return metadata.speciesIdentity;

    if (user.assignedSpecies) {
      return {
        speciesId: user.assignedSpecies.id,
        commonName: user.assignedSpecies.commonName,
        scientificName: user.assignedSpecies.scientificName,
        slug: user.assignedSpecies.slug,
        category: user.assignedSpecies.category,
        speciesNumber: user.speciesNumber,
        totalCount: user.assignedSpecies.estimatedCount,
        avatarUrl: `/api/species/${user.assignedSpecies.slug}/avatar.svg`,
        thumbnailUrl: `/api/species/${user.assignedSpecies.slug}/avatar.svg`,
        habitat: user.assignedSpecies.habitat,
        description: user.assignedSpecies.description,
        badgeTitle: `${user.assignedSpecies.commonName} #${user.speciesNumber || 1} / ${user.assignedSpecies.estimatedCount}`,
      };
    }

    if (user.username) {
      const slugMatch = user.username.match(/^([a-z0-9_-]+?)(?:_\d+)?$/i);
      if (slugMatch && slugMatch[1] && !['user', 'student', 'admin', 'donor', 'mentor'].includes(slugMatch[1].toLowerCase())) {
        const slug = slugMatch[1].toLowerCase();
        return {
          slug,
          speciesNumber: user.speciesNumber || 1,
          avatarUrl: `/api/species/${slug}/avatar.svg`,
          badgeTitle: `${slug.replace(/_/g, ' ')} #${user.speciesNumber || 1}`,
        };
      }
    }

    return null;
  }

  static toCampaignDTO(c) {
    if (!c) return null;

    const targetAmount = parseFloat(c.targetAmount || 0);
    const currentRaised = parseFloat(c.currentRaisedAmount || 0);
    const progressPercentage = targetAmount > 0 ? Math.min(Math.round((currentRaised / targetAmount) * 100), 100) : 0;

    const studentAvatar = CampaignMapper.resolveUserAvatar(c.student);
    const studentSpeciesIdentity = CampaignMapper.resolveSpeciesIdentity(c.student);

    const studentDTO = c.student
      ? {
          id: c.student.id,
          name: c.student.fullName || c.student.name,
          username: c.student.username || null,
          email: c.student.email,
          avatar: studentAvatar,
          profilePicture: studentAvatar,
          speciesIdentity: studentSpeciesIdentity,
        }
      : null;

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      tenantId: c.tenantId,
      organizationId: c.organizationId || null,
      category: c.category,
      campaignType: c.campaignType || 'INDIVIDUAL',
      stage: c.stage || 'DISCOVERY',
      trlLevel: c.trlLevel !== undefined ? c.trlLevel : null,
      sdgGoals: Array.isArray(c.sdgGoals) ? c.sdgGoals : [],
      shortDescription: c.shortDescription,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      galleryImageUrls: Array.isArray(c.galleryImageUrls) ? c.galleryImageUrls : [],
      videoUrl: c.videoUrl || null,
      presentationDeckUrl: c.presentationDeckUrl || null,
      targetAmount,
      goalAmount: targetAmount,
      currentRaisedAmount: currentRaised,
      currentAmount: currentRaised,
      raisedAmount: currentRaised,
      progressPercentage,
      minDonationAmount: parseFloat(c.minDonationAmount || 1.00),
      donorCount: c.donorCount || 0,
      currency: c.currency || 'INR',
      status: c.status,
      faqs: Array.isArray(c.faqs) ? c.faqs : [],
      teamMembers: Array.isArray(c.teamMembers) ? c.teamMembers : [],
      beneficiaryDetails: c.beneficiaryDetails || null,
      rejectionReason: c.rejectionReason || null,
      reapprovalCount: c.reapprovalCount || 0,
      verifiedAt: c.verifiedAt || null,
      startDate: c.startDate || null,
      endDate: c.endDate || null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      student: studentDTO,
      user: studentDTO,
      creator: studentDTO,
      tenant: c.tenant
        ? {
            id: c.tenant.id,
            name: c.tenant.name,
            slug: c.tenant.slug,
            orgType: c.tenant.orgType,
          }
        : null,
      department: c.department
        ? {
            id: c.department.id,
            name: c.department.name,
            slug: c.department.slug,
          }
        : null,
      organization: c.department
        ? {
            id: c.department.id,
            name: c.department.name,
            slug: c.department.slug,
          }
        : (c.organization || null),
      club: c.department
        ? {
            id: c.department.id,
            name: c.department.name,
            slug: c.department.slug,
          }
        : null,
      milestones: Array.isArray(c.milestones)
        ? c.milestones.map((m) => CampaignMapper.toMilestoneDTO(m))
        : [],
      members: Array.isArray(c.members)
        ? c.members.map((m) => {
            const memberAvatar = CampaignMapper.resolveUserAvatar(m.user);
            const memberSpeciesIdentity = CampaignMapper.resolveSpeciesIdentity(m.user);
            return {
              id: m.id,
              userId: m.userId,
              role: m.role,
              title: m.title || 'Team Member',
              joinedAt: m.joinedAt,
              user: m.user
                ? {
                    id: m.user.id,
                    name: m.user.fullName || m.user.name,
                    username: m.user.username || null,
                    email: m.user.email,
                    avatar: memberAvatar,
                    profilePicture: memberAvatar,
                    speciesIdentity: memberSpeciesIdentity,
                  }
                : null,
            };
          })
        : [],
      endorsements: Array.isArray(c.endorsements)
        ? c.endorsements.map((e) => ({
            id: e.id,
            designation: e.designation,
            status: e.status,
            comments: e.comments,
            endorsedAt: e.endorsedAt,
            endorser: e.endorser ? { id: e.endorser.id, name: e.endorser.fullName } : null,
          }))
        : [],
    };
  }

  static toCampaignListDTO(c) {
    if (!c) return null;

    const targetAmount = parseFloat(c.targetAmount || 0);
    const currentRaised = parseFloat(c.currentRaisedAmount || 0);
    const progressPercentage = targetAmount > 0 ? Math.min(Math.round((currentRaised / targetAmount) * 100), 100) : 0;
    const studentAvatar = CampaignMapper.resolveUserAvatar(c.student);
    const studentSpeciesIdentity = CampaignMapper.resolveSpeciesIdentity(c.student);

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      category: c.category,
      campaignType: c.campaignType || 'INDIVIDUAL',
      stage: c.stage || 'DISCOVERY',
      shortDescription: c.shortDescription,
      coverImageUrl: c.coverImageUrl,
      targetAmount,
      goalAmount: targetAmount,
      currentRaisedAmount: currentRaised,
      currentAmount: currentRaised,
      raisedAmount: currentRaised,
      progressPercentage,
      donorCount: c.donorCount || 0,
      currency: c.currency || 'INR',
      status: c.status,
      createdAt: c.createdAt,
      studentName: c.student?.fullName || c.student?.name || 'Student Lead',
      student: c.student
        ? {
            id: c.student.id,
            name: c.student.fullName || c.student.name,
            username: c.student.username || null,
            avatar: studentAvatar,
            profilePicture: studentAvatar,
            speciesIdentity: studentSpeciesIdentity,
          }
        : null,
      institutionName: c.tenant?.name || 'Institution',
      milestonesCount: c.milestones?.length || 0,
      milestones: Array.isArray(c.milestones)
        ? c.milestones.map((m) => CampaignMapper.toMilestoneDTO(m))
        : [],
    };
  }

  static toMilestoneDTO(m) {
    if (!m) return null;

    let criteria = [];
    if (Array.isArray(m.acceptanceCriteria)) {
      criteria = m.acceptanceCriteria;
    } else if (typeof m.acceptanceCriteria === 'string') {
      try {
        criteria = JSON.parse(m.acceptanceCriteria);
      } catch {
        criteria = [m.acceptanceCriteria];
      }
    } else if (m.acceptanceCriteria && typeof m.acceptanceCriteria === 'object') {
      criteria = m.acceptanceCriteria.criteria || [];
    }

    return {
      id: m.id,
      sequenceOrder: m.sequenceOrder,
      currentVersion: m.currentVersion || 1,
      title: m.title,
      description: m.description || null,
      durationDays: m.durationDays || 30,
      targetAmount: parseFloat(m.targetAmount || 0),
      releasedAmount: parseFloat(m.releasedAmount || m.disbursedAmount || 0),
      utilizedAmount: parseFloat(m.utilizedAmount || 0),
      disbursedAmount: parseFloat(m.releasedAmount || m.disbursedAmount || 0),
      acceptanceCriteria: criteria,
      requiredEvidenceTypes: Array.isArray(m.requiredEvidenceTypes) ? m.requiredEvidenceTypes : ['INVOICE', 'VIDEO_WALKTHROUGH', 'ON_SITE_PHOTO'],
      status: m.status, // PLANNED, ACTIVE, SUBMITTED, APPROVED, REJECTED, DISBURSED
      disbursedAt: m.disbursedAt || null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      submissions: Array.isArray(m.submissions)
        ? m.submissions.map((s) => ({
            id: s.id,
            submissionNumber: s.submissionNumber || 1,
            status: s.status,
            studentNotes: s.studentNotes,
            rejectionReason: s.rejectionReason,
            reviewedAt: s.reviewedAt,
            reviewedBy: s.reviewedBy ? { id: s.reviewedBy.id, name: s.reviewedBy.fullName } : null,
            evidenceDoc: s.evidenceDoc
              ? {
                  id: s.evidenceDoc.id,
                  name: s.evidenceDoc.name,
                  storageKey: s.evidenceDoc.storageKey,
                  mimeType: s.evidenceDoc.mimeType,
                }
              : null,
            createdAt: s.createdAt,
          }))
        : [],
      revisions: Array.isArray(m.revisions)
        ? m.revisions.map((r) => CampaignMapper.toRevisionHistoryDTO(r))
        : [],
    };
  }

  static toRevisionHistoryDTO(r) {
    if (!r) return null;

    return {
      id: r.id,
      revisionNumber: r.revisionNumber,
      title: r.title,
      description: r.description,
      targetAmount: parseFloat(r.targetAmount || 0),
      changeReason: r.changeReason,
      status: r.status,
      requestedBy: r.requestedBy ? { id: r.requestedBy.id, name: r.requestedBy.fullName } : null,
      reviewedBy: r.reviewedBy ? { id: r.reviewedBy.id, name: r.reviewedBy.fullName } : null,
      reviewedAt: r.reviewedAt,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
    };
  }
}

module.exports = CampaignMapper;
