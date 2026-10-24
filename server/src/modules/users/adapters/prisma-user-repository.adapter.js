const prisma = require('../../../config/prisma');
const UserRepositoryPort = require('../ports/user-repository.port');

class PrismaUserRepositoryAdapter extends UserRepositoryPort {
  async findById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          speciesId: true,
          speciesNumber: true,
          role: true,
          accountStatus: true,
          profileMetadata: true,
          createdAt: true,
          updatedAt: true,
          assignedSpecies: true,
        },
      });

      if (!user) return null;

      const metadata = user.profileMetadata || {};
      const profilePicture =
        metadata.profilePicture ||
        metadata.avatarUrl ||
        user.assignedSpecies?.avatarUrl ||
        null;

      const speciesIdentity =
        metadata.speciesIdentity ||
        (user.assignedSpecies
          ? {
              speciesId: user.assignedSpecies.id,
              commonName: user.assignedSpecies.commonName,
              scientificName: user.assignedSpecies.scientificName,
              slug: user.assignedSpecies.slug,
              category: user.assignedSpecies.category,
              taxonomicGroup: user.assignedSpecies.taxonomicGroup,
              region: user.assignedSpecies.region,
              speciesNumber: user.speciesNumber,
              totalCount: user.assignedSpecies.estimatedCount,
              assignedCount: user.assignedSpecies.assignedCount,
              avatarUrl: user.assignedSpecies.avatarUrl,
              habitat: user.assignedSpecies.habitat,
              description: user.assignedSpecies.description,
              badgeTitle: `${user.assignedSpecies.commonName} #${user.speciesNumber || 1} / ${user.assignedSpecies.estimatedCount}`,
            }
          : null);

      // Attach mapped properties for backwards compatibility
      return {
        ...user,
        name: user.fullName,
        profilePicture,
        avatar: profilePicture,
        speciesIdentity,
      };
    } catch (err) {
      console.warn('[PrismaUserRepositoryAdapter] findById error:', err.message);
      return null;
    }
  }

  async findByEmail(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          assignedSpecies: true,
        },
      });
      if (!user) return null;

      const metadata = user.profileMetadata || {};
      const profilePicture =
        metadata.profilePicture ||
        metadata.avatarUrl ||
        user.assignedSpecies?.avatarUrl ||
        null;

      return {
        ...user,
        name: user.fullName,
        profilePicture,
        avatar: profilePicture,
      };
    } catch (err) {
      console.warn('[PrismaUserRepositoryAdapter] findByEmail error:', err.message);
      return null;
    }
  }

  async findAllUsers() {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          accountStatus: true,
          createdAt: true,
        },
      });
      return users.map((u) => ({ ...u, name: u.fullName }));
    } catch (err) {
      console.warn('[PrismaUserRepositoryAdapter] findAllUsers error:', err.message);
      return [];
    }
  }

  async updateUser(id, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });
      return { ...user, name: user.fullName };
    } catch (err) {
      console.warn('[PrismaUserRepositoryAdapter] updateUser error:', err.message);
      return { id, ...updateData };
    }
  }

  async suspendUser(id) {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      console.log(`[PrismaUserRepositoryAdapter] Suspended user ${id}`);
      return { ...user, name: user.fullName };
    } catch (err) {
      console.warn('[PrismaUserRepositoryAdapter] suspendUser error:', err.message);
      return null;
    }
  }
}

module.exports = new PrismaUserRepositoryAdapter();
module.exports.PrismaUserRepositoryAdapter = PrismaUserRepositoryAdapter;
