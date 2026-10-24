function toProjectDto(project) {
  if (!project) return null;
  const piMember = Array.isArray(project.members)
    ? project.members.find((m) => m.role === 'PI')
    : null;

  return {
    id: project.id,
    title: project.title,
    slug: project.slug || project.id,
    description: project.description || null,
    stage: project.stage || 'DISCOVERY',
    goalAmount: project.goalAmount || 0,
    amountRaised: project.amountRaised || 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    user: piMember ? piMember.user : project.user || null,
    members: project.members || [],
    tasks: project.tasks || [],
    labNotebooks: project.labNotebooks || [],
    comments: project.comments || [],
  };
}

function toPublicProjectsListDto(rawProjects, limit, nextCursor, hasNextPage) {
  const userProjects = rawProjects.map((p) => {
    const piMember = Array.isArray(p.members) ? p.members.find((m) => m.role === 'PI') : null;
    return {
      ...p,
      user: piMember ? piMember.user : null,
    };
  });

  return {
    status: 'success',
    results: userProjects.length,
    pagination: { nextCursor, hasNextPage },
    data: { userProjects },
  };
}

module.exports = {
  toProjectDto,
  toPublicProjectsListDto,
};
