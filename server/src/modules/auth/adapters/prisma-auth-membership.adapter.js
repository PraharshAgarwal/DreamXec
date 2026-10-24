const AuthMembershipRepositoryPort = require('../ports/auth-membership-repository.port');
const defaultPrisma = require('../../../config/prisma');

/**
 * Concrete Adapter implementing AuthMembershipRepositoryPort using Prisma ORM.
 */
class PrismaAuthMembershipAdapter extends AuthMembershipRepositoryPort {
  constructor(dbClient = defaultPrisma) {
    super();
    this.prisma = dbClient;
  }

  /**
   * Find organization memberships for a given user.
   * @param {string} userId
   * @returns {Promise<Array<{ orgId: string, role: string }>>}
   */
  async findUserOrganizations(userId) {
    if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return [];
    }
    try {
      const memberships = await this.prisma.membership.findMany({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PENDING'] },
          organization: {
            lifecycleStatus: { in: ['ACTIVE', 'APPROVED'] },
          },
        },
        select: {
          organizationId: true,
          role: true,
          status: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              orgType: true,
              parentId: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  orgType: true,
                },
              },
            },
          },
        },
      });

      return memberships.map((m) => ({
        organizationId: m.organizationId,
        role: m.role,
        status: m.status,
        orgName: m.organization?.name || null,
        orgSlug: m.organization?.slug || null,
        orgType: m.organization?.orgType || null,
        parentOrgId: m.organization?.parent?.id || m.organization?.parentId || null,
        parentOrgName: m.organization?.parent?.name || null,
        parentOrgSlug: m.organization?.parent?.slug || null,
        parentOrgType: m.organization?.parent?.orgType || null,
      }));
    } catch (err) {
      console.error('[PrismaAuthMembershipAdapter] Could not fetch org memberships:', err.message);
      return [];
    }
  }
}

module.exports = PrismaAuthMembershipAdapter;
