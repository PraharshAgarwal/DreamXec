const express = require('express');
const { optionalAuth } = require('../../middleware/auth.middleware');
const { PERMISSIONS, PERMISSION_MATRIX, ROLES, ORG_ROLES, getEffectivePermissions } = require('../../permissions/matrix');
const PermissionService = require('../../permissions/permission.service');

const router = express.Router();

// Canonical permission metadata with friendly descriptions & categories
const PERMISSION_METADATA = {
  // Research & Ethics
  'irb:approve': {
    name: 'Approve IRB Ethics Reviews',
    category: 'Research & Ethics',
    description: 'Adjudicate and authorize Institutional Review Board human trial & bio-safety protocols.',
  },
  'milestone:verify': {
    name: 'Verify Project Milestones',
    category: 'Research & Ethics',
    description: 'Authenticate academic, clinical, and technical deliverables before funds release.',
  },
  'stagegate:approve': {
    name: 'Approve Stage-Gate Reviews',
    category: 'Research & Ethics',
    description: 'Authorize technology readiness progression from lab concept (TRL 1-3) to pilot (TRL 4-7+).',
  },
  'lab:book': {
    name: 'Book Lab Resources',
    category: 'Research & Ethics',
    description: 'Reserve institutional research benches, high-precision equipment, and cleanrooms.',
  },

  // Grants & Capital
  'grant:post': {
    name: 'Post Grant Opportunities',
    category: 'Grants',
    description: 'Create and publish competitive research grant calls and student innovation bounties.',
  },
  'grant:allocate': {
    name: 'Allocate Grant Funds',
    category: 'Grants',
    description: 'Assign capital tranches to approved student ventures and academic research projects.',
  },

  // Innovation & Projects
  'project:create': {
    name: 'Create Innovation Projects',
    category: 'Projects',
    description: 'Draft and launch campus innovation campaigns, student thesis prototypes, and startups.',
  },
  'project:edit': {
    name: 'Edit Supervised Projects',
    category: 'Projects',
    description: 'Update project descriptions, milestone timelines, deliverable proofs, and team rosters.',
  },
  'project:delete': {
    name: 'Archive / Delete Projects',
    category: 'Projects',
    description: 'Decommission abandoned projects or purge non-compliant institutional initiatives.',
  },

  // Workflows & Governance
  'workflow:template:manage': {
    name: 'Manage Workflow Templates',
    category: 'Workflows',
    description: 'Design multi-stage institutional approval pipelines and automated governance steps.',
  },
  'workflow:instance:view': {
    name: 'View Workflow Instances',
    category: 'Workflows',
    description: 'Inspect active governance instances, cohort applications, and approval bottlenecks.',
  },
  'workflow:instance:create': {
    name: 'Initiate Workflow Instances',
    category: 'Workflows',
    description: 'Submit new applications into institutional approval and stage-gate pipelines.',
  },
  'workflow:stage:review': {
    name: 'Review Workflow Stages',
    category: 'Workflows',
    description: 'Sign off, reject, or request revisions on pending stages in active governance pipelines.',
  },

  // Verification & Compliance
  'verification:view': {
    name: 'View Verification Cases',
    category: 'Verification',
    description: 'Access student, researcher, and club identity credentials and DigiLocker certificates.',
  },
  'verification:evaluate': {
    name: 'Evaluate Verification Cases',
    category: 'Verification',
    description: 'Approve or reject bonafide student IDs, institutional affiliations, and faculty credentials.',
  },
  'fraud:case:manage': {
    name: 'Manage Fraud Telemetry',
    category: 'Verification',
    description: 'Investigate duplicate quotations, anomalous donation velocity, and enforce escrow freezes.',
  },

  // Financial & Treasury
  'finance:ledger:view': {
    name: 'View Financial Ledger',
    category: 'Finance',
    description: 'Audit real-time double-entry ledgers, donation escrows, and disbursement records.',
  },
  'finance:disburse:check': {
    name: 'Approve Milestone Disbursements',
    category: 'Finance',
    description: 'Execute dual-custody authorization to wire milestone tranches to student beneficiaries.',
  },
  'finance:reconcile': {
    name: 'Reconcile Financial Accounts',
    category: 'Finance',
    description: 'Match bank transaction records against payment gateway webhooks and smart escrow pools.',
  },
  'payment:refund': {
    name: 'Process Donor Refunds',
    category: 'Finance',
    description: 'Execute contribution returns and adjust Section 80G tax certificates accordingly.',
  },

  // Government & Public Sector
  'gov:problem_statement:manage': {
    name: 'Manage Problem Statements',
    category: 'Government',
    description: 'Publish national grand challenges and state problem statements with dedicated bounties.',
  },
  'gov:grant_scheme:manage': {
    name: 'Manage Public Grant Schemes',
    category: 'Government',
    description: 'Administer central schemes (SERB, BIRAC, DST, MeitY) and monitor campus utilization.',
  },
  'gov:uc:export': {
    name: 'Export Utilization Certificates',
    category: 'Government',
    description: 'Generate and certify statutory GFR-19A audit dossiers for government fund accounting.',
  },

  // Administration & Root Access
  'admin:access': {
    name: 'Access Admin Console',
    category: 'Administration',
    description: 'Log in to institutional administrator console and govern child clubs and departments.',
  },
  'org:update': {
    name: 'Update Organization Settings',
    category: 'Administration',
    description: 'Modify campus profile, branding, allowed roles, and institutional hierarchy.',
  },
  'org:member:invite': {
    name: 'Invite Campus Members',
    category: 'Administration',
    description: 'Send onboarding invitations to faculty, department heads, and student leaders.',
  },
  'org:member:manage': {
    name: 'Manage Member Roles',
    category: 'Administration',
    description: 'Assign, modify, or revoke institutional roles across campus clubs and departments.',
  },
  'org:billing:manage': {
    name: 'Manage Institutional Billing',
    category: 'Administration',
    description: 'Configure bank payout accounts, platform tier subscriptions, and tax credentials.',
  },
  'dx:onboarding:manage': {
    name: 'Manage Platform Onboarding',
    category: 'Administration',
    description: 'Super-admin authority to vet and approve incoming university campuses into DreamXec.',
  },
  'dx:verification:task_manage': {
    name: 'Platform Verification Oversight',
    category: 'Administration',
    description: 'Manage cross-institutional verification pipelines and audit compliance officers.',
  },
  'dx:workflow:design': {
    name: 'Design Global Workflows',
    category: 'Administration',
    description: 'Engineer and deploy standardized governance workflow templates across all universities.',
  },
};

/**
 * GET /api/permissions/matrix
 * Returns dynamic permission catalog, role-permission matrix, and current user's effective permissions.
 */
router.get('/matrix', optionalAuth, async (req, res) => {
  try {
    // 1. Build list of all permissions with metadata
    const permissionsList = Object.entries(PERMISSIONS).map(([code, key]) => {
      const meta = PERMISSION_METADATA[key] || {
        name: code.replace(/_/g, ' '),
        category: 'General',
        description: `Authorizes capability ${key}`,
      };
      return {
        key,
        code,
        name: meta.name,
        category: meta.category,
        description: meta.description,
        rolesWithPermission: PERMISSION_MATRIX[key] || [],
      };
    });

    // 2. Build role matrix mapping: Role -> Permission Keys
    const roleMatrix = {};
    const allRoles = [...Object.values(ROLES), ...Object.values(ORG_ROLES)];

    for (const r of allRoles) {
      // Use dynamic DB lookup via PermissionService (with static fallback)
      const perms = await PermissionService.getPermissionsForRole(r);
      roleMatrix[r] = perms;
    }

    // 3. Resolve for current active user/profile or explicitly requested role
    let userContext = null;
    const requestedRole = req.query.role ? String(req.query.role).toUpperCase() : null;

    if (req.user || requestedRole) {
      const user = req.user || {};
      const activeRole = requestedRole || (user.scopedRole || user.activeProfile?.role || user.role || 'USER').toUpperCase();
      
      // Strict role segregation: effective keys are strictly those granted to activeRole
      const effectiveKeys = roleMatrix[activeRole] || [];

      const granted = permissionsList.filter((p) => effectiveKeys.includes(p.key));
      const restricted = permissionsList.filter((p) => !effectiveKeys.includes(p.key));

      userContext = {
        userId: user.id || null,
        fullName: user.fullName || user.name || null,
        email: user.email || null,
        activeRole,
        activeOrgId: user.activeTenantId || user.activeProfile?.organizationId || null,
        activeOrgName: user.activeProfile?.orgName || user.activeProfile?.organization?.name || null,
        totalPermissionsCount: permissionsList.length,
        grantedCount: granted.length,
        restrictedCount: restricted.length,
        effectiveKeys,
      };
    }

    return res.status(200).json({
      status: 'success',
      syncedAt: new Date().toISOString(),
      permissions: permissionsList,
      roleMatrix,
      userContext,
    });
  } catch (error) {
    console.error('[PermissionsRoute] Failed to load permissions matrix:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve permissions matrix',
      error: error.message,
    });
  }
});

module.exports = router;
