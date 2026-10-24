const { DX_SYSTEM_ORG_SLUG, isPlatformOrgSlug } = require('../constants/orgRoles.constants');

const ROLES = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

const ORG_ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  ORG_ADMIN: 'ORG_ADMIN',
  PROFESSOR: 'PROFESSOR',
  RESEARCHER: 'RESEARCHER',
  MENTOR: 'MENTOR',
  INCUBATOR_MANAGER: 'INCUBATOR_MANAGER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  GRANT_OFFICER: 'GRANT_OFFICER',
  GOV_OFFICER: 'GOV_OFFICER',
  GOV_OFFICIAL: 'GOV_OFFICIAL',
  STUDENT_PRESIDENT: 'STUDENT_PRESIDENT',
  CORPORATE_ADMIN: 'CORPORATE_ADMIN',
  DONOR: 'DONOR',
  SPONSOR: 'SPONSOR',
  ALUMNI: 'ALUMNI',
  CSR_MANAGER: 'CSR_MANAGER',
  CORPORATE_RECRUITER: 'CORPORATE_RECRUITER',
  VOLUNTEER: 'VOLUNTEER',
  PROGRAM_MANAGER: 'PROGRAM_MANAGER',
  EXTERNAL_ORG_MEMBER: 'EXTERNAL_ORG_MEMBER',
});

const PERMISSIONS = Object.freeze({
  IRB_APPROVE: 'irb:approve',
  GRANT_ALLOCATE: 'grant:allocate',
  GRANT_POST: 'grant:post',
  MILESTONE_VERIFY: 'milestone:verify',
  STAGEGATE_APPROVE: 'stagegate:approve',
  LAB_BOOK: 'lab:book',
  PROJECT_CREATE: 'project:create',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',
  ADMIN_ACCESS: 'admin:access',
  DX_ONBOARDING_MANAGE: 'dx:onboarding:manage',
  DX_VERIFICATION_TASK_MANAGE: 'dx:verification:task_manage',
  DX_WORKFLOW_DESIGN: 'dx:workflow:design',

  // Organization Management
  ORG_UPDATE: 'org:update',
  ORG_MEMBER_INVITE: 'org:member:invite',
  ORG_MEMBER_MANAGE: 'org:member:manage',
  ORG_BILLING_MANAGE: 'org:billing:manage',
  
  // Workflow Engine
  WORKFLOW_TEMPLATE_MANAGE: 'workflow:template:manage',
  WORKFLOW_INSTANCE_VIEW: 'workflow:instance:view',
  WORKFLOW_INSTANCE_CREATE: 'workflow:instance:create',
  WORKFLOW_STAGE_REVIEW: 'workflow:stage:review',

  // Verification & Compliance
  VERIFICATION_VIEW: 'verification:view',
  VERIFICATION_EVALUATE: 'verification:evaluate',
  FRAUD_CASE_MANAGE: 'fraud:case:manage',

  // Finance & Payments
  FINANCE_LEDGER_VIEW: 'finance:ledger:view',
  FINANCE_DISBURSE_CHECK: 'finance:disburse:check',
  FINANCE_RECONCILE: 'finance:reconcile',
  PAYMENT_REFUND: 'payment:refund',

  // Government Engagement
  GOV_PROBLEM_STATEMENT_MANAGE: 'gov:problem_statement:manage',
  GOV_GRANT_SCHEME_MANAGE: 'gov:grant_scheme:manage',
  GOV_UC_EXPORT: 'gov:uc:export',

  // External Organisations & Services
  EXTERNAL_ORG_ONBOARD: 'org:external:onboard',
  EXTERNAL_SERVICE_MANAGE: 'service:external:manage',
  EXTERNAL_ORDER_VIEW: 'order:external:view',
});

const PERMISSION_MATRIX = Object.freeze({
  [PERMISSIONS.IRB_APPROVE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.COMPLIANCE_OFFICER, ORG_ROLES.PROFESSOR],
  [PERMISSIONS.GRANT_ALLOCATE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.GRANT_OFFICER],
  [PERMISSIONS.GRANT_POST]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.GRANT_OFFICER],
  [PERMISSIONS.MILESTONE_VERIFY]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.PROFESSOR, ORG_ROLES.DONOR, ORG_ROLES.INCUBATOR_MANAGER, ORG_ROLES.MENTOR],
  [PERMISSIONS.STAGEGATE_APPROVE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.INCUBATOR_MANAGER, ORG_ROLES.PROFESSOR],
  [PERMISSIONS.LAB_BOOK]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.RESEARCHER, ORG_ROLES.PROFESSOR, ORG_ROLES.STUDENT, ORG_ROLES.MENTOR, ROLES.USER, ORG_ROLES.STUDENT_PRESIDENT, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.PROJECT_CREATE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.USER, ORG_ROLES.STUDENT, ORG_ROLES.MENTOR, ORG_ROLES.RESEARCHER, ORG_ROLES.STUDENT_PRESIDENT, ORG_ROLES.PROFESSOR, ORG_ROLES.DONOR, ORG_ROLES.SPONSOR, ORG_ROLES.CORPORATE_ADMIN, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.PROJECT_EDIT]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.STUDENT, ORG_ROLES.RESEARCHER, ORG_ROLES.PROFESSOR, ORG_ROLES.STUDENT_PRESIDENT, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.PROJECT_DELETE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.ADMIN_ACCESS]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  [PERMISSIONS.DX_ONBOARDING_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  [PERMISSIONS.DX_VERIFICATION_TASK_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  [PERMISSIONS.DX_WORKFLOW_DESIGN]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  
  // Organization Management (Restricted to their own organization scope)
  [PERMISSIONS.ORG_UPDATE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.ORG_MEMBER_INVITE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.ORG_MEMBER_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.ORG_BILLING_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.ORG_ADMIN],

  // Workflow Engine
  [PERMISSIONS.WORKFLOW_TEMPLATE_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.COMPLIANCE_OFFICER],
  [PERMISSIONS.WORKFLOW_INSTANCE_VIEW]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.ORG_ADMIN, ORG_ROLES.PROFESSOR, ORG_ROLES.INCUBATOR_MANAGER, ORG_ROLES.MENTOR, ORG_ROLES.STUDENT, ORG_ROLES.COMPLIANCE_OFFICER],
  [PERMISSIONS.WORKFLOW_INSTANCE_CREATE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.USER, ORG_ROLES.STUDENT, ORG_ROLES.MENTOR, ORG_ROLES.RESEARCHER, ORG_ROLES.ORG_ADMIN, ORG_ROLES.PROFESSOR],
  [PERMISSIONS.WORKFLOW_STAGE_REVIEW]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.PROFESSOR, ORG_ROLES.INCUBATOR_MANAGER, ORG_ROLES.MENTOR, ORG_ROLES.COMPLIANCE_OFFICER],

  // Verification & Compliance (Super Admin & Compliance Officers only)
  [PERMISSIONS.VERIFICATION_VIEW]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.COMPLIANCE_OFFICER],
  [PERMISSIONS.VERIFICATION_EVALUATE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.COMPLIANCE_OFFICER],
  [PERMISSIONS.FRAUD_CASE_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.COMPLIANCE_OFFICER],

  // Finance & Payments
  [PERMISSIONS.FINANCE_LEDGER_VIEW]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.FINANCE_OFFICER, ORG_ROLES.ORG_ADMIN, ORG_ROLES.CORPORATE_ADMIN, ORG_ROLES.DONOR, ORG_ROLES.SPONSOR],
  [PERMISSIONS.FINANCE_DISBURSE_CHECK]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.FINANCE_OFFICER],
  [PERMISSIONS.FINANCE_RECONCILE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.FINANCE_OFFICER],
  [PERMISSIONS.PAYMENT_REFUND]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.FINANCE_OFFICER],

  // Government Engagement
  [PERMISSIONS.GOV_PROBLEM_STATEMENT_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.GOV_OFFICER, ORG_ROLES.GOV_OFFICIAL],
  [PERMISSIONS.GOV_GRANT_SCHEME_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.GOV_OFFICER, ORG_ROLES.GOV_OFFICIAL],
  [PERMISSIONS.GOV_UC_EXPORT]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.GOV_OFFICER, ORG_ROLES.GOV_OFFICIAL, ORG_ROLES.FINANCE_OFFICER],

  // External Organisations & Services
  [PERMISSIONS.EXTERNAL_ORG_ONBOARD]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  [PERMISSIONS.EXTERNAL_SERVICE_MANAGE]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.EXTERNAL_ORG_MEMBER, ORG_ROLES.ORG_ADMIN],
  [PERMISSIONS.EXTERNAL_ORDER_VIEW]: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ORG_ROLES.EXTERNAL_ORG_MEMBER, ORG_ROLES.ORG_ADMIN],
});



/**
 * Computes effective permission strings for user login payload or active profile.
 * When activeProfile or explicit role is provided, permissions are strictly SEGREGATED
 * to that specific role, preventing privilege bleeding across profiles.
 */
const getEffectivePermissions = (user, orgRoles = [], activeProfile = null) => {
  if (!user) return [];

  // Determine if a specific scoped role or activeProfile is requested
  const targetRole =
    activeProfile?.role ||
    user?.scopedRole ||
    (orgRoles && orgRoles.length === 1 ? orgRoles[0].role : null);

  if (targetRole) {
    const roleUpper = String(targetRole).toUpperCase();
    const activeOrgSlug = activeProfile?.organization?.slug || activeProfile?.orgSlug || activeProfile?.slug;
    const isPlatformAdminProfile =
      (roleUpper === 'ORG_ADMIN' || roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') &&
      isPlatformOrgSlug(activeOrgSlug);

    // Super admin roles or DreamXec Platform Org Admin get full system permissions
    if (roleUpper === ROLES.ADMIN || roleUpper === ROLES.SUPER_ADMIN || roleUpper === 'DX_ADMIN' || isPlatformAdminProfile) {
      return Object.values(PERMISSIONS);
    }

    const permissions = new Set();
    for (const [permKey, allowedRoles] of Object.entries(PERMISSION_MATRIX)) {
      if (allowedRoles.includes(roleUpper)) {
        permissions.add(permKey);
      }
    }
    return Array.from(permissions);
  }

  // Global root administrator check (only when no isolated profile is selected)
  if (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN || user.role === 'DX_ADMIN') {
    return Object.values(PERMISSIONS);
  }

  // Fallback: Default to user's base role (USER)
  const baseRole = (user.role || ROLES.USER).toUpperCase();
  const permissions = new Set();
  for (const [permKey, allowedRoles] of Object.entries(PERMISSION_MATRIX)) {
    if (allowedRoles.includes(baseRole)) {
      permissions.add(permKey);
    }
  }

  return Array.from(permissions);
};

/**
 * Evaluates ABAC resource ownership & faculty access rules.
 */
const evaluateABACRules = (user, permissionKey, resourceContext) => {
  if (!resourceContext || user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) return true;

  if (permissionKey === PERMISSIONS.PROJECT_EDIT) {
    const isOwner =
      resourceContext.createdBy === user.id ||
      resourceContext.userId === user.id ||
      resourceContext.ownerId === user.id;

    const isLeadFaculty =
      user.role === ROLES.PROFESSOR || user.role === ROLES.ORG_ADMIN;

    return isOwner || isLeadFaculty;
  }

  if (permissionKey === PERMISSIONS.GRANT_ALLOCATE && resourceContext.donorId) {
    return resourceContext.donorId === user.id || user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
  }

  // ABAC logic for workflow instances
  if (
    permissionKey === PERMISSIONS.WORKFLOW_INSTANCE_VIEW ||
    permissionKey === PERMISSIONS.WORKFLOW_INSTANCE_CREATE
  ) {
    if (resourceContext.applicantId && resourceContext.applicantId === user.id) {
      return true;
    }
  }

  // ABAC logic for stage review
  if (permissionKey === PERMISSIONS.WORKFLOW_STAGE_REVIEW) {
    if (resourceContext.assignedTo && resourceContext.assignedTo === user.id) {
      return true;
    }
  }

  return true;
};

/**
 * Evaluates whether a user can perform an action based on RBAC, ReBAC, and ABAC.
 */
const canUserPerformAction = (user, permissionKey, orgRoles = [], resourceContext = null) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) return true;

  const allowedRoles = PERMISSION_MATRIX[permissionKey];
  if (!allowedRoles) return false;

  const hasGlobalRole = allowedRoles.includes(user.role);

  // DX Administrative Platform checks
  if (permissionKey.startsWith('dx:')) {
    const isDxAdmin = orgRoles.some((m) => {
      const slug = m.slug || m.orgSlug || m.organization?.slug;
      return isPlatformOrgSlug(slug) && allowedRoles.includes(m.role);
    });
    return hasGlobalRole || isDxAdmin;
  }

  const orgId = resourceContext?.organizationId || resourceContext?.orgId || null;
  let hasOrgRole = false;

  const isGlobalPermission = ['admin:access'].includes(permissionKey);

  if (orgId) {
    // Platform Governance Admin check: members of DreamXec with ORG_ADMIN have platform-wide access across all orgs
    const isDreamxecPlatformAdmin = orgRoles.some((m) => {
      const slug = m.slug || m.orgSlug || m.organization?.slug;
      return isPlatformOrgSlug(slug) && (m.role === 'ORG_ADMIN' || m.role === 'ADMIN' || m.role === 'SUPER_ADMIN');
    });

    if (isDreamxecPlatformAdmin) {
      hasOrgRole = true;
    } else {
      // Normal organizations: strictly enforced to their own orgId only
      hasOrgRole = orgRoles.some(
        (m) => (m.orgId === orgId || m.organizationId === orgId) && allowedRoles.includes(m.role)
      );
    }
  } else if (!isGlobalPermission) {
    // STRICT TENANT ENFORCEMENT: Fail secure if tenant context is missing for tenant-scoped operations
    hasOrgRole = false;
  } else {
    hasOrgRole = orgRoles.some((m) => allowedRoles.includes(m.role));
  }

  if (!hasGlobalRole && !hasOrgRole) {
    return false;
  }

  return evaluateABACRules(user, permissionKey, resourceContext);
};


module.exports = {
  ROLES,
  ORG_ROLES,
  PERMISSIONS,
  PERMISSION_MATRIX,
  getEffectivePermissions,
  evaluateABACRules,
  canUserPerformAction,
};
