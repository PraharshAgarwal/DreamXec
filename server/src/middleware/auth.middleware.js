const defaultJwtTokenAdapter = require('../modules/auth/adapters/jwt-token.adapter');
const defaultUserRepositoryAdapter = require('../modules/users/adapters/prisma-user-repository.adapter');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { canUserPerformAction } = require('../permissions/matrix');
const { loadUserOrgMemberships, getOrganizationId } = require('./organization.middleware');
const permissionMiddleware = require('./permission.middleware');
const { getTraceContext } = require('./performance-tracer');
const redis = require('../config/redis');

// High-Performance Two-Tier L1 Memory Cache for Auth User Sessions
const l1UserAuthCache = new Map();
const L1_USER_AUTH_TTL_MS = parseInt(process.env.AUTH_L1_CACHE_TTL_MS || String(60 * 1000), 10);
const MAX_L1_AUTH_ENTRIES = parseInt(process.env.AUTH_MAX_L1_ENTRIES || "5000", 10);

function getFromL1Auth(userId) {
  const item = l1UserAuthCache.get(userId);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    l1UserAuthCache.delete(userId);
    return null;
  }
  return item.user;
}

function setToL1Auth(userId, user, ttlMs = L1_USER_AUTH_TTL_MS) {
  if (l1UserAuthCache.size >= MAX_L1_AUTH_ENTRIES) {
    const oldest = l1UserAuthCache.keys().next().value;
    if (oldest) l1UserAuthCache.delete(oldest);
  }
  l1UserAuthCache.set(userId, {
    user: { ...user },
    expiresAt: Date.now() + ttlMs,
  });
}

async function invalidateUserAuth(userId) {
  if (!userId) return;
  l1UserAuthCache.delete(userId);
  try {
    if (redis && redis.del) {
      await redis.del(`dx:auth:user:${userId}`);
    }
  } catch (_) {}
}

/**
 * Binds dynamic req.user.can(permissionKey, resourceContext) evaluator to req.user.
 * Queries fresh organization memberships dynamically to prevent stale JWT claim vulnerabilities.
 */
const attachPermissionHelper = (user) => {
  if (!user) return;
  user.can = async function (permissionKey, resourceContext = null) {
    const orgRoles = await loadUserOrgMemberships(user.id);
    return canUserPerformAction(user, permissionKey, orgRoles, resourceContext);
  };
};

/**
 * AuthMiddleware class enforcing Dependency Inversion Principle (DIP).
 * Receives TokenProviderPort and UserRepositoryPort abstractions via Constructor DI.
 */
class AuthMiddleware {
  constructor({
    tokenProvider = defaultJwtTokenAdapter,
    userRepository = defaultUserRepositoryAdapter,
  } = {}) {
    this.tokenProvider = tokenProvider;
    this.userRepository = userRepository;
  }

  /**
   * protect — requires valid JWT token and populates req.user
   */
  protect = catchAsync(async (req, res, next) => {
    const traceCtx = getTraceContext ? getTraceContext() : null;
    if (traceCtx) traceCtx.timestamps.auth_start = process.hrtime.bigint();
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not logged in',
      });
    }

    let decoded;
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is not configured');
      decoded = await this.tokenProvider.verifyToken(token, secret);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
      });
    }

    // 1. Check L1 in-memory cache first (<0.01ms, zero I/O)
    let currentUser = getFromL1Auth(decoded.id);

    // 2. Check L2 Redis cache if L1 miss
    if (!currentUser) {
      const authCacheKey = `dx:auth:user:${decoded.id}`;
      try {
        if (redis && redis.get) {
          const cachedUser = await redis.get(authCacheKey);
          if (cachedUser) {
            currentUser = JSON.parse(cachedUser);
            setToL1Auth(decoded.id, currentUser);
          }
        }
      } catch (_) {}
    }

    // 3. Fallback to database query if cache miss
    if (!currentUser) {
      currentUser = await this.userRepository.findById(decoded.id);

      if (!currentUser) {
        return next(
          new AppError('The account belonging to this token no longer exists.', 401)
        );
      }

      if (currentUser.accountStatus !== 'ACTIVE') {
        return next(
          new AppError('Your account has been suspended or deleted. Please contact support.', 403)
        );
      }

      const cachedPayload = {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        fullName: currentUser.fullName,
        accountStatus: currentUser.accountStatus,
      };

      setToL1Auth(decoded.id, cachedPayload);

      try {
        if (redis && redis.set) {
          await redis.set(
            `dx:auth:user:${decoded.id}`,
            JSON.stringify(cachedPayload),
            { EX: 60 }
          );
        }
      } catch (_) {}
    } else {
      if (currentUser.accountStatus !== 'ACTIVE') {
        return next(
          new AppError('Your account has been suspended or deleted. Please contact support.', 403)
        );
      }
    }

    attachPermissionHelper(currentUser);
    
    // Fast logging & token payload caching
    currentUser.organizations = decoded.organizations || [];
    currentUser.roles = decoded.roles || [currentUser.role];
    currentUser.orgRoles = decoded.orgRoles || [];

    // Attach scoped token data if present
    if (decoded.activeTenantId) {
      currentUser.activeTenantId = decoded.activeTenantId;
      currentUser.scopedRole = decoded.role;
    }
    if (decoded.activeProfile) {
      currentUser.activeProfile = decoded.activeProfile;
    }

    req.user = currentUser;
    if (traceCtx) traceCtx.timestamps.auth_end = process.hrtime.bigint();
    next();
  });

  /**
   * optionalAuth — attaches req.user if a valid JWT is present,
   * but NEVER blocks the request.
   */
  optionalAuth = async (req, res, next) => {
    const traceCtx = getTraceContext ? getTraceContext() : null;
    if (traceCtx) traceCtx.timestamps.auth_start = process.hrtime.bigint();
    const endAuth = () => {
      if (traceCtx && !traceCtx.timestamps.auth_end) {
        traceCtx.timestamps.auth_end = process.hrtime.bigint();
      }
    };

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        endAuth();
        return next();
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        endAuth();
        return next();
      }

      let decoded;
      try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is not configured');
        decoded = await this.tokenProvider.verifyToken(token, secret);
      } catch {
        return next();
      }

      let currentUser = getFromL1Auth(decoded.id);

      if (!currentUser) {
        const authCacheKey = `dx:auth:user:${decoded.id}`;
        try {
          if (redis && redis.get) {
            const cachedUser = await redis.get(authCacheKey);
            if (cachedUser) {
              currentUser = JSON.parse(cachedUser);
              setToL1Auth(decoded.id, currentUser);
            }
          }
        } catch (_) {}
      }

      if (!currentUser) {
        currentUser = await this.userRepository.findById(decoded.id);
        if (currentUser && currentUser.accountStatus === 'ACTIVE') {
          const cachedPayload = {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            fullName: currentUser.fullName,
            accountStatus: currentUser.accountStatus,
          };
          setToL1Auth(decoded.id, cachedPayload);
          try {
            if (redis && redis.set) {
              await redis.set(`dx:auth:user:${decoded.id}`, JSON.stringify(cachedPayload), { EX: 60 });
            }
          } catch (_) {}
        }
      }

      if (currentUser && currentUser.accountStatus === 'ACTIVE') {
        attachPermissionHelper(currentUser);
        currentUser.organizations = decoded.organizations || [];
        currentUser.roles = decoded.roles || [currentUser.role];
        currentUser.orgRoles = decoded.orgRoles || [];
        if (decoded.activeTenantId) {
          currentUser.activeTenantId = decoded.activeTenantId;
          currentUser.scopedRole = decoded.role;
        }
        if (decoded.activeProfile) {
          currentUser.activeProfile = decoded.activeProfile;
        }
        req.user = currentUser;
      }
    } catch {
      // silently ignore errors
    }
    endAuth();
    next();
  };

  /**
   * restrictTo — basic global role check
   */
  restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action.', 403)
        );
      }
      next();
    };
  };
}

const defaultAuthMiddleware = new AuthMiddleware();

exports.AuthMiddleware = AuthMiddleware;
exports.protect = defaultAuthMiddleware.protect;
exports.optionalAuth = defaultAuthMiddleware.optionalAuth;
exports.restrictTo = defaultAuthMiddleware.restrictTo;
exports.invalidateUserAuth = invalidateUserAuth;

// Re-export permission and organization middleware helpers for backwards compatibility
exports.requirePermission = permissionMiddleware.requirePermission;
exports.requireOrgRole = permissionMiddleware.requireOrgRole;
exports.requireComplianceAccess = permissionMiddleware.requireComplianceAccess;
exports.getOrganizationId = getOrganizationId;
