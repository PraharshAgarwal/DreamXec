const express = require('express');
const adminStatsController = require('../controllers/admin-stats.controller');
const adminProjectsController = require('../controllers/admin-projects.controller');
const adminUsersController = require('../controllers/admin-users.controller');
const adminFinancialController = require('../controllers/admin-financial.controller');
const adminMilestoneController = require('../controllers/admin-milestone.controller');
const studentVerificationController = require('../../governance/controllers/student-verification.controller');
const { protect } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../permissions/permissions');
const upload = require('../../../middleware/upload.middleware');

const onboardingController = require('../../governance/controllers/dx-admin-onboarding.controller');

const router = express.Router();

router.use(protect);
router.use(requirePermission(PERMISSIONS.ADMIN_ACCESS));

// --- DASHBOARD STATS & ORG TREE ---
router.get('/stats', adminStatsController.getDashboardStats);
router.get('/org-tree', adminStatsController.getOrgTree);

// --- ORGANIZATION CONFIG & METADATA ---
router.put('/organization/:id/config', onboardingController.updateOrganizationConfig);
router.patch('/organization/:id/config', onboardingController.updateOrganizationConfig);

// --- CAMPAIGNS & PROJECTS ---
router.get('/projects', adminProjectsController.getAllProjects);
router.get('/campaigns', adminProjectsController.getAllProjects);
router.patch('/projects/user/:id/verify', adminProjectsController.verifyUserProject);
router.patch('/campaigns/:id/verify', adminProjectsController.verifyUserProject);
router.patch('/projects/donor/:id/verify', adminProjectsController.verifyDonorProject);
router.get('/projects/:type/:id/details', adminProjectsController.getProjectFullDetails);
router.get('/campaigns/:id/details', (req, res, next) => {
  req.params.type = 'user';
  adminProjectsController.getProjectFullDetails(req, res, next);
});

// --- USERS & GOVERNANCE ---
router.get('/users', adminUsersController.getAllUsers);
router.post('/members/invite', adminUsersController.inviteMember);
router.patch('/users/:id/status', adminUsersController.manageUserStatus);

router.get('/donors', adminUsersController.getAllDonors);

// --- CLUBS ---
router.get('/clubs', adminUsersController.getAllClubs);
router.patch('/clubs/:id/status', adminUsersController.manageClubStatus);
router.get('/clubs/members/:clubId', adminUsersController.getClubMembers);
router.post('/clubs/members/upload', upload.single('file'), adminUsersController.uploadClubMembers);

// --- FINANCIAL MANAGEMENT & MAKER-CHECKER REFUNDS (K12) ---
router.get('/donations', adminFinancialController.getAllDonations);
router.get('/withdrawals', adminFinancialController.getWithdrawals);
router.patch('/withdrawals/:id/status', adminFinancialController.manageWithdrawal);
router.get('/refunds', adminFinancialController.getAllRefunds);
router.post('/refunds/request', adminFinancialController.requestRefund);
router.post('/refunds/:id/authorize', adminFinancialController.authorizeRefund);
router.post('/refunds/:id/reject', adminFinancialController.rejectRefund);

// --- MILESTONES & MAKER-CHECKER DISBURSEMENTS ---
router.get('/milestones', adminMilestoneController.getAllMilestones);
router.get('/milestones/pending', adminMilestoneController.getPendingMilestones);
router.patch('/milestones/:id/verify', adminMilestoneController.verifyMilestone);
router.get('/disbursements', adminMilestoneController.getAllDisbursements);
router.get('/disbursements/pending', adminMilestoneController.getPendingDisbursements);
router.post('/disbursements/:id/authorize', adminMilestoneController.authorizeDisbursement);
router.post('/disbursements/:id/reject', adminMilestoneController.rejectDisbursement);

// --- STUDENT & USER VERIFICATION ---
router.get('/student-verifications', studentVerificationController.getAllStudentVerifications);
router.get('/user-verifications', studentVerificationController.getAllStudentVerifications);
router.post('/student-verifications/approve-all-matched', studentVerificationController.approveAllMatched);
router.patch('/student-verifications/:id/approve', studentVerificationController.approveStudentVerification);
router.patch('/user-verifications/:id/approve', studentVerificationController.approveStudentVerification);
router.patch('/student-verifications/:id/reject', studentVerificationController.rejectStudentVerification);
router.patch('/user-verifications/:id/reject', studentVerificationController.rejectStudentVerification);
router.patch('/student-verifications/:id/revoke', studentVerificationController.revokeStudentVerification);
router.patch('/user-verifications/:id/revoke', studentVerificationController.revokeStudentVerification);

// --- AUDIT LOGS ---
router.get('/audit-logs', adminStatsController.getAuditLogs);

// --- INSTITUTIONAL ROSTER & SHA256 MATCHING (X3) ---
router.post('/roster/upload', upload.single('file'), adminUsersController.uploadRosterCsv);
router.get('/roster', adminUsersController.getRosterRecords);

// --- CORPORATE MCA MASTER DIRECTORY & CIN VERIFICATION (X3) ---
router.post('/corporate/mca/upload', upload.single('file'), adminUsersController.uploadCorporateMcaCsv);
router.get('/corporate/mca', adminUsersController.getCorporateMcaRecords);
router.post('/corporate/mca/verify', adminUsersController.verifyCorporateCin);

// --- FACULTY ENDORSEMENT MODERATION QUEUE (L14) ---
router.get('/endorsements', adminProjectsController.getFacultyEndorsementQueue);
router.get('/endorsements/pending', adminProjectsController.getFacultyEndorsementQueue);
router.patch('/endorsements/:id/verify', adminProjectsController.moderateFacultyEndorsement);
router.patch('/endorsements/:id/moderate', adminProjectsController.moderateFacultyEndorsement);

// --- DONORS MANAGEMENT ---
router.patch('/donors/:id/verify', adminUsersController.verifyDonor);
router.patch('/donors/:id/status', adminUsersController.manageDonorStatus);

// --- DONOR APPLICATIONS ---
router.get('/applications', adminUsersController.getAllApplications);
router.patch('/applications/:id/override', adminUsersController.overrideApplicationStatus);

module.exports = router;
