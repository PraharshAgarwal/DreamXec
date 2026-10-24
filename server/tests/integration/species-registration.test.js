const PrismaAuthUserAdapter = require('../../src/modules/auth/adapters/prisma-auth-user.adapter');
const speciesIdentityService = require('../../src/modules/species/services/species-identity.service');

describe('Endangered Species Registration Integration', () => {
  let mockPrisma;
  let adapter;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(async ({ where }) => null),
        create: jest.fn(async ({ data, include }) => {
          return {
            id: 'user-uuid-1',
            email: data.email,
            fullName: data.fullName,
            username: data.username,
            speciesId: data.speciesId,
            speciesNumber: data.speciesNumber,
            role: data.role || 'USER',
            accountStatus: 'ACTIVE',
            profileMetadata: data.profileMetadata || {},
            assignedSpecies: {
              id: data.speciesId,
              commonName: 'Amur Leopard',
              slug: 'amur_leopard',
              category: 'CRITICALLY_ENDANGERED',
              estimatedCount: 120,
              avatarUrl: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&auto=format&fit=crop&q=80',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }),
      },
      endangeredSpecies: {
        findMany: jest.fn(async () => [
          {
            id: 'species-amur',
            commonName: 'Amur Leopard',
            scientificName: 'Panthera pardus orientalis',
            slug: 'amur_leopard',
            category: 'CRITICALLY_ENDANGERED',
            taxonomicGroup: 'MAMMAL',
            estimatedCount: 120,
            assignedCount: 5,
            avatarUrl: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&auto=format&fit=crop&q=80',
            isActive: true,
          },
        ]),
        update: jest.fn(async ({ where, data }) => ({
          id: 'species-amur',
          commonName: 'Amur Leopard',
          slug: 'amur_leopard',
          category: 'CRITICALLY_ENDANGERED',
          estimatedCount: 120,
          assignedCount: 6,
          avatarUrl: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&auto=format&fit=crop&q=80',
          isActive: true,
        })),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    adapter = new PrismaAuthUserAdapter(mockPrisma);
    jest.spyOn(speciesIdentityService, 'assignNextSpeciesIdentity').mockResolvedValue({
      username: 'amur_leopard_6',
      speciesId: 'species-amur',
      speciesNumber: 6,
      profilePicture: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&auto=format&fit=crop&q=80',
      speciesIdentity: {
        speciesId: 'species-amur',
        commonName: 'Amur Leopard',
        slug: 'amur_leopard',
        category: 'CRITICALLY_ENDANGERED',
        speciesNumber: 6,
        totalCount: 120,
        avatarUrl: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&auto=format&fit=crop&q=80',
        badgeTitle: 'Amur Leopard #6 / 120',
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates new user with endangered species username, avatar, and species identity', async () => {
    const user = await adapter.create({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash: 'hashed_pwd',
      role: 'USER',
      accountStatus: 'ACTIVE',
    });

    expect(user.username).toBe('amur_leopard_6');
    expect(user.speciesId).toBe('species-amur');
    expect(user.speciesNumber).toBe(6);
    expect(user.profilePicture).toBe('/api/species/amur_leopard/avatar.svg');
    expect(user.profileMetadata.speciesIdentity).toBeDefined();
    expect(user.profileMetadata.speciesIdentity.badgeTitle).toBe('Amur Leopard #6 / 120');
  });

  test('creates OAuth user with endangered species identity', async () => {
    const oauthUser = await adapter.createOAuthUser({
      email: 'oauth@example.com',
      name: 'OAuth User',
      providerName: 'google',
      providerId: 'google_12345',
      role: 'USER',
      emailVerified: true,
    });

    expect(oauthUser.username).toBe('amur_leopard_6');
    expect(oauthUser.speciesNumber).toBe(6);
    expect(oauthUser.profilePicture).toBeDefined();
  });
});
