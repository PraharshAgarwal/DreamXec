/**
 * Allowed Organization Roles Mapping per OrgType
 */
const ORG_TYPE_ALLOWED_ROLES = {
  COLLEGE: [
    'STUDENT',
    'ORG_ADMIN',
    'PROFESSOR',
    'STUDENT_PRESIDENT',
    'COMPLIANCE_OFFICER',
    'FINANCE_OFFICER',
    'GRANT_OFFICER',
    'RESEARCHER',
    'ALUMNI',
    'MENTOR'
  ],
  CLUB: [
    'STUDENT',
    'ORG_ADMIN',
    'STUDENT_PRESIDENT',
    'MENTOR',
    'ALUMNI',
    'VOLUNTEER'
  ],
  RESEARCH_INSTITUTION: [
    'ORG_ADMIN',
    'PROFESSOR',
    'RESEARCHER',
    'COMPLIANCE_OFFICER',
    'FINANCE_OFFICER',
    'GRANT_OFFICER',
    'PROGRAM_MANAGER',
    'EXTERNAL_ORG_MEMBER'
  ],
  EXTERNAL_ORG: [
    'EXTERNAL_ORG_MEMBER',
    'ORG_ADMIN'
  ],
  CORPORATE: [
    'CORPORATE_ADMIN',
    'DONOR',
    'SPONSOR',
    'COMPLIANCE_OFFICER',
    'FINANCE_OFFICER',
    'CSR_MANAGER',
    'CORPORATE_RECRUITER',
    'GRANT_OFFICER',
    'MENTOR',
    'ORG_ADMIN'
  ],
  INCUBATOR: [
    'INCUBATOR_MANAGER',
    'ORG_ADMIN',
    'MENTOR',
    'FINANCE_OFFICER',
    'GRANT_OFFICER',
    'PROGRAM_MANAGER'
  ],
  NGO: [
    'ORG_ADMIN',
    'DONOR',
    'COMPLIANCE_OFFICER',
    'FINANCE_OFFICER',
    'GRANT_OFFICER',
    'VOLUNTEER',
    'PROGRAM_MANAGER'
  ],
  GOVERNMENT_BODY: [
    'GOV_OFFICER',
    'GOV_OFFICIAL',
    'ORG_ADMIN',
    'COMPLIANCE_OFFICER',
    'FINANCE_OFFICER',
    'GRANT_OFFICER',
    'PROGRAM_MANAGER'
  ]
};

/**
 * Get allowed roles array for an organization type
 * @param {string} orgType 
 * @returns {Array<string>}
 */
function getAllowedRolesForOrgType(orgType) {
  return ORG_TYPE_ALLOWED_ROLES[orgType] || ['ORG_ADMIN'];
}

/**
 * Check if a specific role is allowed for an organization type
 * @param {string} orgType 
 * @param {string} role 
 * @returns {boolean}
 */
function isRoleAllowedForOrgType(orgType, role) {
  const allowed = getAllowedRolesForOrgType(orgType);
  return allowed.includes(role);
}

const DX_SYSTEM_ORG_SLUGS = ['dreamxec', 'dx-platform-org'];
const DX_SYSTEM_ORG_SLUG = 'dreamxec';

/**
 * Checks if a given slug belongs to the internal DreamXec platform management organization.
 * @param {string} slug
 * @returns {boolean}
 */
function isPlatformOrgSlug(slug) {
  if (!slug) return false;
  return DX_SYSTEM_ORG_SLUGS.includes(String(slug).toLowerCase().trim());
}

module.exports = {
  DX_SYSTEM_ORG_SLUG,
  DX_SYSTEM_ORG_SLUGS,
  isPlatformOrgSlug,
  ORG_TYPE_ALLOWED_ROLES,
  getAllowedRolesForOrgType,
  isRoleAllowedForOrgType,
};

