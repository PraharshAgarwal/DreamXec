const AuthUserRepositoryPort = require('../ports/auth-user-repository.port');
const defaultPrisma = require('../../../config/prisma');
const UserMapper = require('../auth.mapper');
const { generateUniqueUsername } = require('../../../utils/username-generator');

const speciesIdentityService = require('../../species/services/species-identity.service');

/**
 * Concrete Adapter implementing AuthUserRepositoryPort using Prisma ORM.
 */
class PrismaAuthUserAdapter extends AuthUserRepositoryPort {
  constructor(dbClient = defaultPrisma) {
    super();
    this.prisma = dbClient;
  }

  /**
   * Helper translating domain provider names (or DB keys) to Prisma model field names.
   * @param {string} providerNameOrKey
   * @returns {string}
   */
  #resolveProviderIdKey(providerNameOrKey) {
    const keyMap = {
      google: 'googleId',
      linkedin: 'linkedinId',
      github: 'githubId',
    };
    return keyMap[providerNameOrKey?.toLowerCase()] || providerNameOrKey;
  }

  /**
   * Find a user by UUID id.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;
    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          assignedSpecies: true,
        },
      });
    } catch (err) {
      user = await this.prisma.user.findUnique({
        where: { id },
      });
    }
    return UserMapper.toDomainUser(user);
  }

  /**
   * Find a user by email address.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    if (!email) return null;
    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          assignedSpecies: true,
        },
      });
    } catch (err) {
      user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    }
    return UserMapper.toDomainUser(user);
  }

  /**
   * Guarantees a unique username in the users table by checking existence
   * and incrementing/appending numeric suffixes if collision occurs.
   * @param {string} candidateUsername
   * @param {string} [nameFallback]
   * @param {Object} [client] - Prisma client or transaction
   * @returns {Promise<string>}
   */
  async resolveUniqueUsername(candidateUsername, nameFallback = 'user', client = this.prisma) {
    let username = (candidateUsername || '').trim();
    if (!username) {
      username = (nameFallback || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 30) || 'user';
    }

    let attempts = 0;
    while (attempts < 25) {
      const existing = await client.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!existing) {
        return username;
      }

      attempts++;
      const match = username.match(/^(.*)_(\d+)$/);
      if (match) {
        const base = match[1];
        const nextNum = parseInt(match[2], 10) + attempts;
        username = `${base}_${nextNum}`;
      } else {
        username = `${username}_${attempts}`;
      }
    }

    return `${username.slice(0, 40)}_${Date.now().toString().slice(-6)}`;
  }

  /**
   * Create a new user record in database with automatic endangered species identity.
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    if (!userData.username || !userData.speciesId) {
      try {
        const speciesAlloc = await speciesIdentityService.assignNextSpeciesIdentity();
        userData.username = userData.username || speciesAlloc.username;
        userData.speciesId = userData.speciesId || speciesAlloc.speciesId;
        userData.speciesNumber = userData.speciesNumber || speciesAlloc.speciesNumber;

        const meta = userData.profileMetadata || {};
        meta.profilePicture = meta.profilePicture || speciesAlloc.profilePicture;
        meta.avatarUrl = meta.avatarUrl || speciesAlloc.profilePicture;
        meta.speciesIdentity = meta.speciesIdentity || speciesAlloc.speciesIdentity;
        userData.profileMetadata = meta;
      } catch (err) {
        console.warn('[PrismaAuthUserAdapter] Species allocation fallback:', err.message);
        if (!userData.username) {
          userData.username = await generateUniqueUsername(userData.fullName || userData.name);
        }
      }
    }

    userData.username = await this.resolveUniqueUsername(userData.username, userData.fullName || userData.name);

    let createAttempts = 0;
    while (createAttempts < 3) {
      try {
        const user = await this.prisma.user.create({
          data: userData,
          include: {
            assignedSpecies: true,
          },
        });
        return UserMapper.toDomainUser(user);
      } catch (createErr) {
        createAttempts++;
        const isUsernameCollision =
          createErr.code === 'P2002' &&
          (createErr.meta?.target?.includes('username') ||
            String(createErr.message).includes('username'));

        const isSpeciesCollision =
          createErr.code === 'P2002' &&
          (createErr.meta?.target?.includes('speciesId') ||
            createErr.meta?.target?.includes('speciesNumber') ||
            String(createErr.message).includes('species'));

        if ((isUsernameCollision || isSpeciesCollision) && createAttempts < 3) {
          console.warn(`[PrismaAuthUserAdapter] Constraint collision on user create (attempt ${createAttempts}):`, createErr.message);
          if (isUsernameCollision) {
            userData.username = await this.resolveUniqueUsername(`${userData.username}_${createAttempts}`, userData.fullName || userData.name);
          }
          if (isSpeciesCollision) {
            userData.speciesId = null;
            userData.speciesNumber = null;
          }
        } else {
          throw createErr;
        }
      }
    }
  }

  /**
   * Update an existing user record.
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        assignedSpecies: true,
      },
    });
    return UserMapper.toDomainUser(user);
  }

  /**
   * Update user provider ID if not set.
   * @param {string} userId
   * @param {string} providerName Domain provider identifier or DB key
   * @param {string} providerId
   * @returns {Promise<Object|null>}
   */
  async linkOAuthProvider(userId, providerName, providerId, avatarUrl = null) {
    const user = await this.findById(userId);
    if (!user) return null;

    const providerIdKey = this.#resolveProviderIdKey(providerName);
    const meta = { ...(user.profileMetadata || {}) };
    meta.providers = { ...(meta.providers || {}), [providerName]: providerId };
    meta[providerIdKey] = providerId;
    if (avatarUrl) {
      meta.googleAvatarUrl = avatarUrl;
      if (!meta.profilePicture || meta.profilePicture.includes('unsplash.com')) {
        meta.profilePicture = avatarUrl;
        meta.avatarUrl = avatarUrl;
      }
    }
    if (providerName === 'orcid') {
      const { isFuzzyNameMatch } = require('../../../utils/fuzzyMatch');
      const orcidName = (typeof providerId === 'object' ? providerId.name : null) || user.fullName;
      const orcidIdStr = typeof providerId === 'object' ? (providerId.orcid || providerId.orcidId || providerId.providerUserId) : providerId;
      const matchResult = isFuzzyNameMatch(user.fullName, orcidName);

      meta.orcid = orcidIdStr;
      meta.orcidVerified = matchResult.matched;
      meta.orcidMatchScore = matchResult.similarityScore;
      meta.orcidPublicationsCount = (typeof providerId === 'object' && providerId.publicationsCount !== undefined) ? providerId.publicationsCount : 1;
      meta.orcidVerifiedAt = new Date().toISOString();
    }
    if (meta.emailVerified === undefined || meta.emailVerified === false) {
      meta.emailVerified = true;
    }

    return this.update(userId, {
      profileMetadata: meta,
    });
  }

  /**
   * Create new first-time OAuth user record with endangered species identity.
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async createOAuthUser({ email, name, providerName, providerIdKey, providerId, role, emailVerified, avatarUrl }) {
    const keyToUse = this.#resolveProviderIdKey(providerName || providerIdKey);
    let username = '';
    let speciesId = null;
    let speciesNumber = null;
    let speciesIdentity = null;
    let profilePicture = null;

    try {
      const speciesAlloc = await speciesIdentityService.assignNextSpeciesIdentity();
      username = speciesAlloc.username;
      speciesId = speciesAlloc.speciesId;
      speciesNumber = speciesAlloc.speciesNumber;
      speciesIdentity = speciesAlloc.speciesIdentity;
      profilePicture = speciesAlloc.profilePicture;
    } catch (err) {
      console.warn('[PrismaAuthUserAdapter] OAuth species allocation error:', err.message);
      username = await generateUniqueUsername(name);
    }

    username = await this.resolveUniqueUsername(username, name);

    const effectiveAvatar = avatarUrl || profilePicture;

    const meta = {
      profilePicture: effectiveAvatar,
      avatarUrl: effectiveAvatar,
      googleAvatarUrl: avatarUrl || null,
      speciesIdentity,
      emailVerified: emailVerified ?? true,
      providers: { [providerName || 'oauth']: providerId },
      [keyToUse]: providerId,
    };

    if (providerName === 'orcid' || providerIdKey === 'orcid') {
      meta.orcid = providerId;
      meta.orcidVerified = true;
      meta.orcidVerifiedAt = new Date().toISOString();
    }

    let user;
    let createAttempts = 0;
    while (createAttempts < 3) {
      try {
        user = await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            fullName: name || 'User',
            username,
            speciesId,
            speciesNumber,
            role: role || 'USER',
            profileMetadata: meta,
          },
          include: {
            assignedSpecies: true,
          },
        });
        return UserMapper.toDomainUser(user);
      } catch (createErr) {
        createAttempts++;
        const isUsernameCollision =
          createErr.code === 'P2002' &&
          (createErr.meta?.target?.includes('username') ||
            String(createErr.message).includes('username'));

        const isSpeciesCollision =
          createErr.code === 'P2002' &&
          (createErr.meta?.target?.includes('speciesId') ||
            createErr.meta?.target?.includes('speciesNumber') ||
            String(createErr.message).includes('species'));

        if ((isUsernameCollision || isSpeciesCollision) && createAttempts < 3) {
          console.warn(`[PrismaAuthUserAdapter] Constraint collision on OAuth user create (attempt ${createAttempts}):`, createErr.message);
          if (isUsernameCollision) {
            username = await this.resolveUniqueUsername(`${username}_${createAttempts}`, name);
          }
          if (isSpeciesCollision) {
            speciesId = null;
            speciesNumber = null;
          }
        } else {
          throw createErr;
        }
      }
    }
  }
}

module.exports = PrismaAuthUserAdapter;
