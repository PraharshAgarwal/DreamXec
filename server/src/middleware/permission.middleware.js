const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ROLES } = require('../permissions/roles');
const PERMISSIONS = require('../permissions/permissions');
const { getOrganizationId, loadUserOrgMemberships } = require('./organization.middleware');

/**
 * requirePermission — ReBAC / PBAC / ABAC Action Guard
 */
exports.requirePermission = (permissionKey) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Not logged in' });
    }

    const orgId = getOrganizationId(req);
    const resourceContext = {
      organizationId: orgId,
      orgId: orgId,
      createdBy: req.body?.createdBy || req.params?.userId || null,
      userId: req.user.id,
      applicantId: req.body?.applicantId || req.params?.applicantId || null,
      assignedTo: req.body?.assignedTo || req.params?.assignedTo || null,
    };

    let hasPermission = false;
    if (typeof req.user.can === 'function') {
      hasPermission = await req.user.can(permissionKey, resourceContext);
    } else {
      const { canUserPerformAction } = require('../permissions/matrix');
      const orgRoles = await loadUserOrgMemberships(req.user.id);
      hasPermission = canUserPerformAction(req.user, permissionKey, orgRoles, resourceContext);
    }

    if (hasPermission) {
      return next();
    }


    return next(
      new AppError(
        `You do not have the required permission (${permissionKey}) for this operation.`,
        403
      )
    );
  });
};

/**
 * requireOrgRole — Verifies if user holds one of the allowed organization roles dynamically from DB
 */
exports.requireOrgRole = (...allowedRoles) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    const orgId = getOrganizationId(req);
    if (!orgId) {
      return next(
        new AppError('Organization context is missing for this tenant-scoped operation.', 400)
      );
    }

    if (
      req.user.scopedRole &&
      req.user.activeTenantId &&
      String(req.user.activeTenantId).toLowerCase() === String(orgId).toLowerCase() &&
      allowedRoles.includes(req.user.scopedRole)
    ) {
      req.userOrgRole = req.user.scopedRole;
      return next();
    }

    const memberships = await loadUserOrgMemberships(req.user.id);
    const match = memberships.find(
      (m) =>
        (String(m.orgId).toLowerCase() === String(orgId).toLowerCase() ||
          String(m.organizationId).toLowerCase() === String(orgId).toLowerCase()) &&
        allowedRoles.includes(m.role)
    );
    if (match) {
      req.userOrgRole = match.role;
      return next();
    }

    return next(
      new AppError(
        'You do not have permission to perform this operation in this organization context.',
        403
      )
    );
  });
};

/**
 * requireComplianceAccess — Restricts access to IRB compliance approvals
 */
exports.requireComplianceAccess = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  if (req.user.can && (await req.user.can(PERMISSIONS.IRB_APPROVE))) {
    return next();
  }

  return next(
    new AppError('Access restricted to Compliance Officers and Administrators.', 403)
  );
});
