/**
 * Transforms database club entity into client-facing DTO.
 */
function toClubDto(club) {
  if (!club) return null;
  const isIndependent = !club.parentId;
  const college =
    club.parent?.name ||
    club.college ||
    club.institutionName ||
    club.university ||
    (isIndependent ? 'Independent / Open' : 'Campus Affiliated');

  const totalCampaigns =
    club._count?.tenantCampaigns ??
    (Array.isArray(club.tenantCampaigns) ? club.tenantCampaigns.length : (club.totalCampaigns || 0));

  const totalRaised = Array.isArray(club.tenantCampaigns)
    ? club.tenantCampaigns.reduce((sum, c) => sum + Number(c.currentRaisedAmount || 0), 0)
    : (club.totalRaised || 0);

  const memberships = Array.isArray(club.memberships) ? club.memberships : [];
  const members = memberships.map((m) => ({
    id: m.id,
    userId: m.user?.id,
    name: m.user?.fullName || 'Researcher',
    email: m.user?.email || null,
    avatarUrl: m.user?.avatarUrl || null,
    role: m.role || 'STUDENT',
    designation: m.designation || (m.role === 'STUDENT_PRESIDENT' ? 'President & Lead' : 'Core Researcher'),
    department: m.department || null,
    joinedAt: m.joinedAt,
  }));

  const leads = members.filter((m) => m.role === 'STUDENT_PRESIDENT' || m.role === 'ORG_ADMIN');
  const president = leads.length > 0 ? leads[0] : (members.length > 0 ? members[0] : null);

  const campaigns = Array.isArray(club.tenantCampaigns)
    ? club.tenantCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug || c.id,
        description: c.description,
        currentAmount: Number(c.currentRaisedAmount || 0),
        amountRaised: Number(c.currentRaisedAmount || 0),
        goalAmount: Number(c.targetAmount || 0),
        targetAmount: Number(c.targetAmount || 0),
        category: c.category,
        status: c.status,
        imageUrl: c.coverImageUrl || c.imageUrl || null,
        coverImageUrl: c.coverImageUrl || c.imageUrl || null,
        createdAt: c.createdAt,
        studentName: c.student?.fullName || 'Student Researcher',
        milestones: Array.isArray(c.milestones) ? c.milestones : [],
      }))
    : (club.campaigns || []);

  const totalMilestones = campaigns.reduce((acc, camp) => acc + (camp.milestones?.length || 0), 0);
  const completedMilestones = campaigns.reduce((acc, camp) => {
    return acc + (camp.milestones?.filter((m) => ['COMPLETED', 'VERIFIED', 'APPROVED'].includes(m.status)).length || 0);
  }, 0);

  return {
    id: club.id,
    name: club.name || club.organizationName || 'Unnamed Club',
    college,
    slug: club.slug || club.id,
    verified: Boolean(
      club.verified ||
      club.status === 'VERIFIED' ||
      club.status === 'APPROVED' ||
      club.lifecycleStatus === 'ACTIVE'
    ),
    description: club.description || null,
    logoUrl: club.logoUrl || club.profilePicture || null,
    membersCount: club.membersCount || club._count?.memberships || members.length || 0,
    totalCampaigns,
    totalRaised,
    totalMilestones,
    completedMilestones,
    createdAt: club.createdAt,
    parentId: club.parentId || null,
    parent: club.parent
      ? {
          id: club.parent.id,
          name: club.parent.name,
          slug: club.parent.slug,
          orgType: club.parent.orgType,
        }
      : null,
    isIndependent,
    president,
    members,
    campaigns,
    motto: club.motto || club.metadata?.motto || null,
    tagline: club.tagline || club.metadata?.tagline || null,
    category: club.category || club.metadata?.category || null,
    labLocation: club.labLocation || club.metadata?.labLocation || null,
    meetingSchedule: club.meetingSchedule || club.metadata?.meetingSchedule || null,
    facultyAdvisor: club.facultyAdvisor || club.metadata?.facultyAdvisor || null,
    technicalStacks: club.technicalStacks || club.metadata?.technicalStacks || null,
    facilities: club.facilities || club.metadata?.facilities || null,
    metadata: club.metadata || null,
    allowedRoles: club.allowedRoles && club.allowedRoles.length > 0 ? club.allowedRoles : ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
    orgType: club.orgType || 'CLUB',
  };
}

/**
 * Transforms collection of club entities into paginated response DTO.
 */
function toPaginatedClubsDto(clubs, pagination) {
  const formatted = Array.isArray(clubs) ? clubs.map(toClubDto) : [];
  return {
    success: true,
    data: formatted,
    clubs: formatted,
    pagination: pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
    meta: pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
  };
}

module.exports = {
  toClubDto,
  toPaginatedClubsDto,
};
