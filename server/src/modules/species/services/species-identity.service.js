const prisma = require('../../../config/prisma');

/**
 * Core Species Identity & Dynamic Allotment Engine.
 * Implements Dynamic Windowed Decay Sampling so early users receive lower numbers with high probability,
 * while preserving sparse low-to-mid slots for subsequent users ("Golden Ticket" discovery),
 * and strictly enforcing species population capacity.
 */
class SpeciesIdentityService {
  constructor(dbClient = prisma) {
    this.prisma = dbClient;
  }

  /**
   * Samples a number from an array of unallocated slots using a power decay probability distribution.
   * Lower rank in the unallocated window has a higher probability, but does not strictly monopolize.
   *
   * @param {Array<number>} unallocatedSlots - Sorted array of unallocated numbers
   * @param {number} currentAssignedCount - Number of users already assigned this species
   * @returns {number} Selected slot number
   */
  sampleDecaySlot(unallocatedSlots, currentAssignedCount = 0) {
    if (!unallocatedSlots || unallocatedSlots.length === 0) {
      throw new Error('No unallocated slots available');
    }

    if (unallocatedSlots.length === 1) {
      return unallocatedSlots[0];
    }

    // Dynamic window size: expands smoothly as adoption progresses
    // For early adoption (count=0), window size is 5 slots {1, 2, 3, 4, 5}
    const windowSize = Math.min(
      unallocatedSlots.length,
      Math.max(5, Math.min(25, Math.floor(currentAssignedCount * 1.5) + 5))
    );

    const candidateWindow = unallocatedSlots.slice(0, windowSize);

    // Calculate decay weights w_i = 1 / (rank)^1.2
    const weights = candidateWindow.map((_, index) => {
      const rank = index + 1;
      return 1 / Math.pow(rank, 1.2);
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    const randomVal = Math.random() * totalWeight;

    let cumulative = 0;
    for (let i = 0; i < candidateWindow.length; i++) {
      cumulative += weights[i];
      if (randomVal <= cumulative) {
        return candidateWindow[i];
      }
    }

    return candidateWindow[0];
  }

  /**
   * Selects an available endangered species and assigns a dynamic decay slot number.
   * Strictly enforces that speciesNumber <= estimatedCount and assignedCount <= estimatedCount.
   *
   * @param {Object} [options]
   * @param {string} [options.preferredSpeciesSlug] - Optional preference
   * @param {Object} [options.tx] - Optional existing Prisma transaction
   * @returns {Promise<{
   *   username: string,
   *   speciesId: string,
   *   speciesNumber: number,
   *   profilePicture: string,
   *   speciesIdentity: Object
   * }>}
   */
  async assignNextSpeciesIdentity(options = {}) {
    const { preferredSpeciesSlug = null, tx = null } = options;

    const executeAssignment = async (client) => {
      // 1. Fetch active species with remaining capacity (assignedCount < estimatedCount)
      const availableSpecies = await client.endangeredSpecies.findMany({
        where: {
          isActive: true,
          ...(preferredSpeciesSlug ? { slug: preferredSpeciesSlug } : {}),
        },
        orderBy: [
          { assignedCount: 'asc' },
          { estimatedCount: 'asc' },
        ],
      });

      // Filter in-memory for strict inequality: assignedCount < estimatedCount
      const eligible = availableSpecies.filter((s) => s.assignedCount < s.estimatedCount);

      if (eligible.length === 0) {
        if (preferredSpeciesSlug) {
          return this.assignNextSpeciesIdentity({ preferredSpeciesSlug: null, tx: client });
        }

        // Fallback if all species are 100% adopted
        const fallbackSpecies = await client.endangeredSpecies.findFirst({
          where: { isActive: true },
          orderBy: { estimatedCount: 'desc' },
        });

        let fallbackNumber = (fallbackSpecies?.assignedCount || 0) + 1;
        const fallbackSlug = fallbackSpecies?.slug || 'earth_guardian';
        let fallbackUsername = `${fallbackSlug}_${fallbackNumber}`;

        // Verify fallback username uniqueness against existing users if client supports findUnique
        let fallbackExists = typeof client.user?.findUnique === 'function'
          ? await client.user.findUnique({
              where: { username: fallbackUsername },
              select: { id: true },
            })
          : null;

        while (fallbackExists) {
          fallbackNumber++;
          fallbackUsername = `${fallbackSlug}_${fallbackNumber}`;
          fallbackExists = typeof client.user?.findUnique === 'function'
            ? await client.user.findUnique({
                where: { username: fallbackUsername },
                select: { id: true },
              })
            : null;
        }

        const fallbackAvatar = `/api/species/${fallbackSlug}/avatar.svg`;

        return {
          username: fallbackUsername,
          speciesId: fallbackSpecies?.id || null,
          speciesNumber: fallbackNumber,
          profilePicture: fallbackAvatar,
          speciesIdentity: {
            speciesId: fallbackSpecies?.id || null,
            commonName: fallbackSpecies?.commonName || 'Earth Guardian',
            scientificName: fallbackSpecies?.scientificName || 'Guardian',
            slug: fallbackSlug,
            category: fallbackSpecies?.category || 'CRITICALLY_ENDANGERED',
            speciesNumber: fallbackNumber,
            totalCount: fallbackSpecies?.estimatedCount || 1000,
            avatarUrl: fallbackAvatar,
            habitat: fallbackSpecies?.habitat || 'Global',
            badgeTitle: `${fallbackSpecies?.commonName || 'Guardian'} #${fallbackNumber}`,
          },
        };
      }

      // Group eligible species across rarity tiers to ensure diverse distribution
      // (Critically Rare < 100, Endangered 100-2000, Vulnerable > 2000)
      const criticallyRare = eligible.filter((s) => s.estimatedCount < 100);
      const endangered = eligible.filter((s) => s.estimatedCount >= 100 && s.estimatedCount <= 2000);
      const vulnerable = eligible.filter((s) => s.estimatedCount > 2000);

      const roll = Math.random();
      let chosenTierPool;

      if (roll < 0.35 && criticallyRare.length > 0) {
        chosenTierPool = criticallyRare;
      } else if (roll < 0.70 && endangered.length > 0) {
        chosenTierPool = endangered;
      } else if (vulnerable.length > 0) {
        chosenTierPool = vulnerable;
      } else {
        chosenTierPool = eligible;
      }

      // Pick randomly from top least-assigned in the chosen tier
      const poolWindow = Math.min(6, chosenTierPool.length);
      const chosenSpecies = chosenTierPool[Math.floor(Math.random() * poolWindow)];

      // 2. Discover unallocated slot numbers for this chosen species
      const existingAllocations = await client.user.findMany({
        where: {
          speciesId: chosenSpecies.id,
          speciesNumber: { not: null },
        },
        select: { speciesNumber: true, username: true },
      });

      let slugAllocations = [];
      try {
        if (typeof client.user?.findMany === 'function') {
          slugAllocations = await client.user.findMany({
            where: {
              username: {
                startsWith: `${chosenSpecies.slug}_`,
              },
            },
            select: { speciesNumber: true, username: true },
          });
        }
      } catch (err) {
        // Client or mock may not support startsWith
      }

      const allUserRecords = [...(existingAllocations || []), ...(slugAllocations || [])];
      const allocatedSet = new Set();
      for (const u of allUserRecords) {
        if (u.speciesNumber) {
          allocatedSet.add(u.speciesNumber);
        }
        if (u.username && u.username.startsWith(`${chosenSpecies.slug}_`)) {
          const suffix = u.username.substring(chosenSpecies.slug.length + 1);
          const parsed = parseInt(suffix, 10);
          if (!isNaN(parsed) && String(parsed) === suffix) {
            allocatedSet.add(parsed);
          }
        }
      }

      const maxCount = chosenSpecies.estimatedCount;
      const unallocated = [];

      for (let i = 1; i <= maxCount; i++) {
        if (!allocatedSet.has(i)) {
          unallocated.push(i);
        }
      }

      if (unallocated.length === 0) {
        // Species is full, mark and retry
        await client.endangeredSpecies.update({
          where: { id: chosenSpecies.id },
          data: { assignedCount: chosenSpecies.estimatedCount },
        });
        return this.assignNextSpeciesIdentity({ preferredSpeciesSlug: null, tx: client });
      }

      // 3. Sample slot using Dynamic Windowed Decay Distribution
      let selectedSlot = this.sampleDecaySlot(unallocated, allocatedSet.size);
      let candidateUsername = `${chosenSpecies.slug}_${selectedSlot}`;

      // Double-check candidate username against users table to prevent unique constraint violation
      let exists = false;
      if (typeof client.user?.findUnique === 'function') {
        exists = await client.user.findUnique({
          where: { username: candidateUsername },
          select: { id: true },
        });

        if (exists) {
          for (const slot of unallocated) {
            const testHandle = `${chosenSpecies.slug}_${slot}`;
            const isTaken = await client.user.findUnique({
              where: { username: testHandle },
              select: { id: true },
            });
            if (!isTaken) {
              selectedSlot = slot;
              candidateUsername = testHandle;
              exists = false;
              break;
            }
          }
        }
      }

        if (exists) {
          // If all sampled slots are occupied, mark species as full and retry
          await client.endangeredSpecies.update({
            where: { id: chosenSpecies.id },
            data: { assignedCount: chosenSpecies.estimatedCount },
          });
          return this.assignNextSpeciesIdentity({ preferredSpeciesSlug: null, tx: client });
        }

      // 4. Update assignedCount on EndangeredSpecies
      const newAssignedCount = allocatedSet.size + 1;
      const updated = await client.endangeredSpecies.update({
        where: { id: chosenSpecies.id },
        data: {
          assignedCount: newAssignedCount,
        },
      });

      const username = candidateUsername;
      const avatarUrl = updated.avatarUrl && !updated.avatarUrl.includes('unsplash.com')
        ? updated.avatarUrl
        : `/api/species/${updated.slug}/avatar.svg`;

      const speciesIdentity = {
        speciesId: updated.id,
        commonName: updated.commonName,
        scientificName: updated.scientificName,
        slug: updated.slug,
        category: updated.category,
        taxonomicGroup: updated.taxonomicGroup,
        speciesNumber: selectedSlot,
        totalCount: updated.estimatedCount,
        avatarUrl,
        thumbnailUrl: updated.thumbnailUrl || avatarUrl,
        habitat: updated.habitat,
        region: updated.region,
        description: updated.description,
        badgeTitle: `${updated.commonName} #${selectedSlot} / ${updated.estimatedCount}`,
      };

      return {
        username,
        speciesId: updated.id,
        speciesNumber: selectedSlot,
        profilePicture: avatarUrl,
        speciesIdentity,
      };
    };

    if (tx) {
      return executeAssignment(tx);
    }

    return this.prisma.$transaction(async (trx) => {
      return executeAssignment(trx);
    });
  }

  /**
   * Retrieves all endangered species with adoption stats and filters.
   */
  async getAllSpecies(filter = {}) {
    const { category, taxonomicGroup, search, page = 1, limit = 50 } = filter;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const where = {
      isActive: true,
      ...(category ? { category } : {}),
      ...(taxonomicGroup ? { taxonomicGroup } : {}),
      ...(search
        ? {
            OR: [
              { commonName: { contains: search, mode: 'insensitive' } },
              { scientificName: { contains: search, mode: 'insensitive' } },
              { habitat: { contains: search, mode: 'insensitive' } },
              { region: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [species, total] = await Promise.all([
      this.prisma.endangeredSpecies.findMany({
        where,
        skip,
        take: parseInt(limit, 10),
        orderBy: [{ category: 'asc' }, { commonName: 'asc' }],
      }),
      this.prisma.endangeredSpecies.count({ where }),
    ]);

    const mapped = species.map((s) => ({
      ...s,
      remainingCount: Math.max(0, s.estimatedCount - s.assignedCount),
      adoptionPercentage: Math.min(100, Math.round((s.assignedCount / s.estimatedCount) * 100)),
      isFullyAdopted: s.assignedCount >= s.estimatedCount,
    }));

    return {
      species: mapped,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single species by slug or id.
   */
  async getSpeciesBySlug(slugOrId) {
    if (!slugOrId) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const where = isUuid
      ? { OR: [{ id: slugOrId }, { slug: slugOrId }] }
      : { slug: slugOrId };

    const species = await this.prisma.endangeredSpecies.findFirst({
      where,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            speciesNumber: true,
            createdAt: true,
          },
          take: 15,
          orderBy: { speciesNumber: 'asc' },
        },
      },
    });

    if (!species) return null;

    return {
      ...species,
      remainingCount: Math.max(0, species.estimatedCount - species.assignedCount),
      adoptionPercentage: Math.min(100, Math.round((species.assignedCount / species.estimatedCount) * 100)),
      isFullyAdopted: species.assignedCount >= species.estimatedCount,
    };
  }
}

module.exports = new SpeciesIdentityService();
module.exports.SpeciesIdentityService = SpeciesIdentityService;
