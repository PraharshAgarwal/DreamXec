const prisma = require('../../../config/prisma');
const generateUniqueSlug = require('../utils/generateSlug');
const ProjectRepositoryPort = require('../ports/project-repository.port');

class PrismaProjectRepositoryAdapter extends ProjectRepositoryPort {
  async createProject(userId, projectData) {
    const { title, description } = projectData;
    return prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(title, tx);
      if (tx.project) {
        return tx.project.create({
          data: {
            title,
            slug,
            description,
            stage: 'DISCOVERY',
            members: {
              create: {
                userId,
                role: 'PI',
              },
            },
          },
          include: {
            members: true,
          },
        });
      }

      return tx.campaign.create({
        data: {
          title,
          slug,
          summary: description || title,
          description: description || title,
          studentUserId: userId,
          status: 'DRAFT',
          fundingGoalAmount: 0,
        },
      });
    });
  }

  async findByIdOrSlug(identifier) {
    if (!identifier) return null;
    const isObjectId = identifier.length === 24;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    try {
      if (prisma.project) {
        return await prisma.project.findUnique({
          where: isObjectId ? { id: identifier } : { slug: identifier },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true } },
              },
            },
            tasks: true,
            labNotebooks: true,
            comments: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true } },
              },
            },
          },
        });
      }

      const campaign = await prisma.campaign.findFirst({
        where: isUuid ? { OR: [{ id: identifier }, { slug: identifier }] } : { slug: identifier },
        include: {
          student: { select: { id: true, fullName: true, email: true } },
          beneficiary: { select: { id: true, fullName: true, email: true } },
          comments: {
            include: {
              user: { select: { id: true, fullName: true } },
            },
          },
          milestones: true,
        },
      });

      if (!campaign) return null;

      return {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description || campaign.summary,
        stage: campaign.status,
        createdAt: campaign.createdAt,
        members: [
          ...(campaign.student ? [{ userId: campaign.student.id, role: 'PI', user: { id: campaign.student.id, name: campaign.student.fullName } }] : []),
        ],
        tasks: [],
        labNotebooks: [],
        comments: campaign.comments || [],
      };
    } catch (err) {
      console.warn('[PrismaProjectRepositoryAdapter] findByIdOrSlug error:', err.message);
      return null;
    }
  }

  async findPublicProjects({ cursor, limit = 20 }) {
    const limitNum = Math.min(parseInt(limit || '20', 10), 100);

    try {
      if (prisma.project) {
        const rawProjects = await prisma.project.findMany({
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          take: limitNum + 1,
          select: {
            id: true,
            title: true,
            description: true,
            stage: true,
            createdAt: true,
            members: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const hasNextPage = rawProjects.length > limitNum;
        const projects = hasNextPage ? rawProjects.slice(0, limitNum) : rawProjects;
        const nextCursor = hasNextPage ? projects[projects.length - 1].id : null;

        return {
          rawProjects: projects,
          limit: limitNum,
          nextCursor,
          hasNextPage,
        };
      }

      const rawCampaigns = await prisma.campaign.findMany({
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: limitNum + 1,
        include: {
          student: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const hasNextPage = rawCampaigns.length > limitNum;
      const campaigns = hasNextPage ? rawCampaigns.slice(0, limitNum) : rawCampaigns;
      const nextCursor = hasNextPage ? campaigns[campaigns.length - 1].id : null;

      const mapped = campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.summary || c.description,
        stage: c.status,
        createdAt: c.createdAt,
        members: c.student ? [{ user: { id: c.student.id, name: c.student.fullName } }] : [],
      }));

      return {
        rawProjects: mapped,
        limit: limitNum,
        nextCursor,
        hasNextPage,
      };
    } catch (err) {
      console.warn('[PrismaProjectRepositoryAdapter] findPublicProjects error:', err.message);
      return {
        rawProjects: [],
        limit: limitNum,
        nextCursor: null,
        hasNextPage: false,
      };
    }
  }

  async findUserProjects(userId) {
    try {
      if (prisma.project) {
        return await prisma.project.findMany({
          where: {
            members: {
              some: { userId },
            },
          },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
            tasks: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const campaigns = await prisma.campaign.findMany({
        where: {
          OR: [{ studentUserId: userId }, { beneficiaryUserId: userId }],
        },
        include: {
          student: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.summary || c.description,
        stage: c.status,
        createdAt: c.createdAt,
        members: c.student ? [{ user: { id: c.student.id, name: c.student.fullName } }] : [],
        tasks: [],
      }));
    } catch (err) {
      console.warn('[PrismaProjectRepositoryAdapter] findUserProjects error:', err.message);
      return [];
    }
  }

  async findDonorProjects() {
    try {
      if (prisma.donorProject) {
        return await prisma.donorProject.findMany({
          orderBy: { createdAt: 'desc' },
        });
      }

      const campaigns = await prisma.campaign.findMany({
        where: { status: 'LIVE' },
        include: {
          student: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.summary || c.description,
        amountRaised: Number(c.currentRaisedAmount || 0),
        goalAmount: Number(c.fundingGoalAmount || 0),
        status: c.status,
        createdAt: c.createdAt,
      }));
    } catch (err) {
      console.warn('[PrismaProjectRepositoryAdapter] findDonorProjects error:', err.message);
      return [];
    }
  }

  async updateProject(id, updateData) {
    if (prisma.project) {
      return prisma.project.update({
        where: { id },
        data: updateData,
      });
    }

    return prisma.campaign.update({
      where: { id },
      data: {
        ...(updateData.title ? { title: updateData.title } : {}),
        ...(updateData.description ? { description: updateData.description, summary: updateData.description } : {}),
      },
    });
  }

  async deleteProject(id) {
    if (prisma.project) {
      return prisma.project.delete({
        where: { id },
      });
    }

    return prisma.campaign.delete({
      where: { id },
    });
  }
}

module.exports = new PrismaProjectRepositoryAdapter();
module.exports.PrismaProjectRepositoryAdapter = PrismaProjectRepositoryAdapter;
