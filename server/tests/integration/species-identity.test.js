const { SpeciesIdentityService } = require('../../src/modules/species/services/species-identity.service');

describe('SpeciesIdentityService Dynamic Decay Engine Tests', () => {
  let mockSpeciesDb;
  let mockUsersDb;
  let mockPrisma;
  let service;

  beforeEach(() => {
    mockSpeciesDb = [
      {
        id: 'species-vaquita',
        commonName: 'Vaquita',
        scientificName: 'Phocoena sinus',
        slug: 'vaquita',
        category: 'CRITICALLY_ENDANGERED',
        taxonomicGroup: 'MAMMAL',
        estimatedCount: 3,
        assignedCount: 0,
        avatarUrl: 'https://example.com/vaquita.jpg',
        thumbnailUrl: 'https://example.com/vaquita-thumb.jpg',
        habitat: 'Gulf of California',
        description: 'Vaquita porpoise',
        isActive: true,
      },
      {
        id: 'species-leopard',
        commonName: 'Amur Leopard',
        scientificName: 'Panthera pardus orientalis',
        slug: 'amur_leopard',
        category: 'CRITICALLY_ENDANGERED',
        taxonomicGroup: 'MAMMAL',
        estimatedCount: 100,
        assignedCount: 0,
        avatarUrl: 'https://example.com/amur_leopard.jpg',
        thumbnailUrl: 'https://example.com/amur_leopard-thumb.jpg',
        habitat: 'Russian Far East',
        description: 'Rare snowy leopard',
        isActive: true,
      },
    ];

    mockUsersDb = [];

    mockPrisma = {
      user: {
        findMany: jest.fn(async ({ where }) => {
          return mockUsersDb.filter((u) => u.speciesId === where?.speciesId);
        }),
      },
      endangeredSpecies: {
        findMany: jest.fn(async ({ where, skip, take }) => {
          let list = [...mockSpeciesDb];
          if (where?.isActive !== undefined) {
            list = list.filter((s) => s.isActive === where.isActive);
          }
          if (where?.slug) {
            list = list.filter((s) => s.slug === where.slug);
          }
          if (skip !== undefined && take !== undefined) {
            list = list.slice(skip, skip + take);
          }
          return list;
        }),
        findFirst: jest.fn(async ({ where }) => {
          return mockSpeciesDb.find((s) => s.slug === where?.slug || s.id === where?.id) || null;
        }),
        count: jest.fn(async () => mockSpeciesDb.length),
        update: jest.fn(async ({ where, data }) => {
          const item = mockSpeciesDb.find((s) => s.id === where.id);
          if (!item) throw new Error('Not found');
          if (typeof data.assignedCount === 'number') {
            item.assignedCount = data.assignedCount;
          }
          return { ...item };
        }),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    service = new SpeciesIdentityService(mockPrisma);
  });

  test('sampleDecaySlot biases towards lower unassigned numbers in the dynamic window', () => {
    const unallocated = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const samples = [];
    for (let i = 0; i < 500; i++) {
      samples.push(service.sampleDecaySlot(unallocated, 0));
    }

    // Numbers in top 3 should represent the vast majority of samples
    const top3Count = samples.filter((s) => s <= 3).length;
    expect(top3Count).toBeGreaterThan(350); // >70%

    // Should still contain some higher early slots (e.g. 4 or 5)
    const higherCount = samples.filter((s) => s >= 4).length;
    expect(higherCount).toBeGreaterThan(10);
  });

  test('allocates unique slots and strictly caps at estimatedCount without duplicates', async () => {
    // Vaquita has capacity = 3
    const a1 = await service.assignNextSpeciesIdentity({ preferredSpeciesSlug: 'vaquita' });
    mockUsersDb.push({ id: 'u1', speciesId: a1.speciesId, speciesNumber: a1.speciesNumber });

    const a2 = await service.assignNextSpeciesIdentity({ preferredSpeciesSlug: 'vaquita' });
    mockUsersDb.push({ id: 'u2', speciesId: a2.speciesId, speciesNumber: a2.speciesNumber });

    const a3 = await service.assignNextSpeciesIdentity({ preferredSpeciesSlug: 'vaquita' });
    mockUsersDb.push({ id: 'u3', speciesId: a3.speciesId, speciesNumber: a3.speciesNumber });

    // All 3 numbers should be unique between 1 and 3
    const numbers = [a1.speciesNumber, a2.speciesNumber, a3.speciesNumber];
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(3);
    numbers.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    });

    // 4th allocation for Vaquita must roll over to another available species
    const a4 = await service.assignNextSpeciesIdentity({ preferredSpeciesSlug: 'vaquita' });
    expect(a4.speciesIdentity.slug).toBe('amur_leopard');
    expect(a4.speciesNumber).toBeGreaterThanOrEqual(1);
  });
});
