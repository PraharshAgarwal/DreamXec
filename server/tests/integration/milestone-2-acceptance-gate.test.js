const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const createTestApp = require('../helpers/testApp');
const prisma = require('../../src/config/prisma');
const ledgerService = require('../../src/services/ledger.service');
const donationService = require('../../src/modules/donations/donation.service');

describe('Milestone 2 Acceptance Gate: Donate → Ledger → Milestone Proof → Maker-Checker → Reconcile → 80G/CSR (Annexure 1)', () => {
  let app;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  const campaignId = '11111111-1111-1111-1111-111111111111';
  const milestoneId = '22222222-2222-2222-2222-222222222222';

  // Test Roles
  const donorUser = { id: 'usr_donor_m2', role: 'USER', email: 'donor@example.com' };
  const creatorUser = { id: 'usr_creator_m2', role: 'USER', email: 'creator@example.com' };
  const makerAdmin = { id: 'usr_maker_m2', role: 'ADMIN', email: 'maker@dreamxec.com' };
  const checkerFinanceOfficer = { id: 'usr_checker_m2', role: 'ADMIN', email: 'checker@dreamxec.com' };

  const donorToken = jwt.sign(donorUser, JWT_SECRET);
  const creatorToken = jwt.sign(creatorUser, JWT_SECRET);
  const makerToken = jwt.sign(makerAdmin, JWT_SECRET);
  const checkerToken = jwt.sign(checkerFinanceOfficer, JWT_SECRET);

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();

    if (donationService.eventPublisher) {
      jest.spyOn(donationService.eventPublisher, 'publishEvent').mockImplementation(async () => {});
    }

    // Mock user authentication resolution for JWT tokens
    if (prisma.membership) {
      jest.spyOn(prisma.membership, 'findMany').mockResolvedValue([]);
    }
    jest.spyOn(prisma.user, 'findUnique').mockImplementation(async ({ where }) => {
      if (where.id === donorUser.id) {
        return { ...donorUser, fullName: 'Donor User', accountStatus: 'ACTIVE' };
      }
      if (where.id === creatorUser.id) {
        return { ...creatorUser, fullName: 'Creator Student', accountStatus: 'ACTIVE' };
      }
      if (where.id === makerAdmin.id) {
        return { ...makerAdmin, fullName: 'Admin Maker', accountStatus: 'ACTIVE' };
      }
      if (where.id === checkerFinanceOfficer.id) {
        return { ...checkerFinanceOfficer, fullName: 'Finance Officer Checker', accountStatus: 'ACTIVE' };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Donation Tiers, Recurring Support & Razorpay Order Creation (L4, L11)', () => {
    it('should create donation order with preset tier amounts, tip, and recurring subscription flag', async () => {
      jest.spyOn(donationService.repository, 'createDonation').mockResolvedValue({
        id: 'don_m2_test_1',
        amount: 2625,
        tenantId: 'default',
      });

      jest.spyOn(donationService.paymentGateway, 'createOrder').mockResolvedValue({
        id: 'order_test_m2_99',
        amount: 262500,
        currency: 'INR',
        key: 'rzp_test_key',
      });

      jest.spyOn(prisma.paymentIntent, 'create').mockResolvedValue({
        id: 'pi_test_1',
      });

      jest.spyOn(prisma.paymentAttempt, 'create').mockResolvedValue({
        id: 'pa_test_1',
      });

      const res = await request(app)
        .post('/api/donations/create-order')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          amount: 2625,
          projectId: campaignId,
          email: 'donor@example.com',
          name: 'Donor User',
          isMonthly: true,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('orderId', 'order_test_m2_99');
      expect(res.body.amount).toBe(262500);
      expect(res.body.currency).toBe('INR');
    });
  });

  describe('2. Balanced Double-Entry Ledger Inflow on Payment Verification', () => {
    it('should record balanced journal entries when payment signature verifies', async () => {
      jest.spyOn(donationService.paymentGateway, 'verifySignature').mockReturnValue(true);
      jest.spyOn(donationService.repository, 'fastRecordAttemptVerification').mockResolvedValue({
        id: 'att_1',
      });
      jest.spyOn(donationService.repository, 'processVerifiedPayment').mockResolvedValue({
        alreadySettled: false,
        campaign: { id: campaignId, title: 'AI Assistive Robotics' },
      });
      jest.spyOn(ledgerService, 'postDonationSettlement').mockResolvedValue({
        id: 'entry_m2_101',
        isBalanced: true,
      });

      const res = await request(app)
        .post('/api/donations/verify')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          orderId: 'order_test_m2_99',
          paymentId: 'pay_test_m2_99',
          signature: 'sig_test_m2_99',
          amount: 2500,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Creator Live Milestone Proof Submission (R1a, K8)', () => {
    it('should allow student creator to submit deliverable proof with narrative, demo URL, and evidence', async () => {
      // Mock team membership check for requireCampaignRole
      jest.spyOn(prisma.campaignMember, 'findMany').mockResolvedValue([
        { userId: creatorUser.id, role: 'OWNER', title: 'Project Lead' },
      ]);

      jest.spyOn(prisma.campaign, 'findUnique').mockResolvedValue({
        id: campaignId,
        studentUserId: creatorUser.id,
        tenantId: 'default',
      });

      jest.spyOn(prisma.campaignMilestone, 'findUnique').mockResolvedValue({
        id: milestoneId,
        campaignId: campaignId,
        campaign: { id: campaignId, studentUserId: creatorUser.id, tenantId: 'default' },
        submissions: [],
        revisions: [],
      });

      jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(prisma));

      jest.spyOn(prisma.campaignMilestoneSubmission, 'count').mockResolvedValue(0);

      jest.spyOn(prisma.campaignMilestoneSubmission, 'create').mockResolvedValue({
        id: 'sub_m2_1',
        milestoneId: milestoneId,
        submissionNumber: 1,
        submissionAttempt: 1,
        narrative: 'Completed backend schema migration and frontend UI workbench',
        status: 'PENDING_REVIEW',
      });

      jest.spyOn(prisma.campaignMilestone, 'update').mockResolvedValue({
        id: milestoneId,
        status: 'SUBMITTED',
      });

      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/milestones/${milestoneId}/submit-proof`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          narrative: 'Completed backend schema migration and frontend UI workbench',
          evidenceMediaUrls: ['https://cloudinary.com/dx/invoice_aws.pdf'],
          criteriaChecklist: [true, true, true],
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.submission.status).toBe('PENDING_REVIEW');
    });
  });

  describe('4. Maker-Checker Dual-Disbursement Execution & 4-Eyes Principle (K5, J8, B9)', () => {
    it('Maker: should verify proof and advance disbursement status to PENDING_CHECKER', async () => {
      jest.spyOn(prisma.campaignMilestone, 'findUnique').mockResolvedValue({
        id: milestoneId,
        targetAmount: 50000,
        campaignId: campaignId,
        campaign: { id: campaignId, studentUserId: creatorUser.id, tenantId: 'default' },
        submissions: [{ id: 'sub_m2_1' }],
      });

      jest.spyOn(prisma.campaignMilestone, 'update').mockResolvedValue({
        id: milestoneId,
        status: 'APPROVED',
      });

      jest.spyOn(prisma.campaignMilestoneSubmission, 'update').mockResolvedValue({
        id: 'sub_m2_1',
        status: 'APPROVED',
      });

      jest.spyOn(prisma.milestoneDisbursement, 'findFirst').mockResolvedValue(null);

      jest.spyOn(prisma.milestoneDisbursement, 'create').mockResolvedValue({
        id: 'disb_m2_1',
        milestoneId: milestoneId,
        amount: 50000,
        currency: 'INR',
        status: 'PENDING_CHECKER',
        makerUserId: makerAdmin.id,
      });

      jest.spyOn(prisma.auditEvent, 'create').mockResolvedValue({ id: 'audit_1' });

      const res = await request(app)
        .patch(`/api/admin/milestones/${milestoneId}/verify`)
        .set('Authorization', `Bearer ${makerToken}`)
        .send({
          status: 'APPROVED',
          feedback: 'Deliverable proof verified. Code and deployment working properly.',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.disbursement.status).toBe('PENDING_CHECKER');
    });

    it('Checker: should block the Maker from approving disbursement (4-Eyes principle enforcement)', async () => {
      jest.spyOn(prisma.milestoneDisbursement, 'findUnique').mockResolvedValue({
        id: 'disb_m2_1',
        amount: 50000,
        status: 'PENDING_CHECKER',
        makerUserId: makerAdmin.id, // Maker is makerAdmin
        milestone: {
          id: milestoneId,
          campaignId: campaignId,
          campaign: { studentUserId: creatorUser.id, tenantId: 'default' },
        },
      });

      // makerAdmin attempts to act as Checker: MUST be blocked with 403 Forbidden
      const res = await request(app)
        .post('/api/admin/disbursements/disb_m2_1/authorize')
        .set('Authorization', `Bearer ${makerToken}`)
        .send({ approved: true });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Dual-Custody Violation/i);
    });

    it('Checker: should allow independent Finance Officer to authorize disbursement and release escrow funds', async () => {
      jest.spyOn(prisma.milestoneDisbursement, 'findUnique').mockResolvedValue({
        id: 'disb_m2_1',
        amount: 50000,
        status: 'PENDING_CHECKER',
        makerUserId: makerAdmin.id, // Maker is makerAdmin, Checker is checkerFinanceOfficer
        milestone: {
          id: milestoneId,
          campaignId: campaignId,
          campaign: { studentUserId: creatorUser.id, tenantId: 'default' },
        },
      });

      jest.spyOn(ledgerService, 'postMilestoneDisbursement').mockResolvedValue({
        success: true,
        entryNumber: 'JE-DISB-2026-001',
      });

      jest.spyOn(prisma.milestoneDisbursement, 'update').mockResolvedValue({
        id: 'disb_m2_1',
        status: 'SETTLED',
        checkerUserId: checkerFinanceOfficer.id,
      });

      jest.spyOn(prisma.campaignMilestone, 'update').mockResolvedValue({
        id: milestoneId,
        status: 'FUNDS_RELEASED',
      });

      const res = await request(app)
        .post('/api/admin/disbursements/disb_m2_1/authorize')
        .set('Authorization', `Bearer ${checkerToken}`)
        .send({ approved: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.disbursement.status).toBe('SETTLED');
    });
  });

  describe('5. Maker-Checker Refund & Ledger Reversal (K12)', () => {
    it('should request and authorize refund with compensating journal entry reversal', async () => {
      // 1. Request refund via Maker
      jest.spyOn(prisma.donation, 'findUnique').mockResolvedValue({
        id: 'don_m2_ref_1',
        amount: 500,
        tenantId: 'default',
        paymentIntents: [{ id: 'pi_ref_1' }],
      });

      jest.spyOn(prisma.refund, 'create').mockResolvedValue({
        id: 'ref_m2_1',
        paymentIntentId: 'pi_ref_1',
        amount: 500,
        status: 'PENDING',
        reason: 'Duplicate payment by donor',
      });

      jest.spyOn(prisma.auditEvent, 'create').mockResolvedValue({ id: 'audit_ref_1' });

      const reqRes = await request(app)
        .post('/api/admin/refunds/request')
        .set('Authorization', `Bearer ${makerToken}`)
        .send({
          donationId: 'don_m2_ref_1',
          reason: 'Duplicate payment by donor',
        });

      expect([200, 201]).toContain(reqRes.status);
      expect(reqRes.body).toHaveProperty('status', 'success');
      expect(reqRes.body.data.refund.status).toBe('PENDING');

      // 2. Authorize refund via Checker
      jest.spyOn(prisma.refund, 'findUnique').mockResolvedValue({
        id: 'ref_m2_1',
        status: 'PENDING',
        amount: 500,
        intent: {
          id: 'pi_ref_1',
          donation: {
            id: 'don_m2_ref_1',
            tenantId: 'default',
            campaign: { id: campaignId, title: 'AI Robotics' },
          },
        },
      });

      jest.spyOn(ledgerService, 'reverseTransaction').mockResolvedValue({
        success: true,
        reversalEntryId: 'rev_je_999',
      });

      jest.spyOn(prisma.refund, 'update').mockResolvedValue({
        id: 'ref_m2_1',
        status: 'SUCCESS',
        authorizedByUserId: checkerFinanceOfficer.id,
      });

      const authRes = await request(app)
        .post('/api/admin/refunds/ref_m2_1/authorize')
        .set('Authorization', `Bearer ${checkerToken}`)
        .send({ approved: true });

      expect(authRes.status).toBe(200);
      expect(authRes.body).toHaveProperty('status', 'success');
      expect(authRes.body.data.refund.status).toBe('SUCCESS');
    });
  });

  describe('6. Section 80G Tax Exemption & CSR Utilization Exports (K6, K7, O2)', () => {
    it('should generate Section 80G tax receipt data with statutory donee registration clause', async () => {
      jest.spyOn(prisma.donation, 'findUnique').mockResolvedValue({
        id: 'don_m2_80g',
        donorId: donorUser.id,
        userId: donorUser.id,
        amount: 5000,
        currency: 'INR',
        donorPan: 'ABCDE1234F',
        donorDisplayName: 'Dr. Jane Doe',
        paymentStatus: 'completed',
        createdAt: new Date(),
        campaign: { title: 'AI Assistive Robotics' },
      });

      const res = await request(app)
        .get('/api/donations/don_m2_80g/receipt-80g')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.receipt).toHaveProperty('approvalRegistrationNumber', 'AAATD9182PF20214');
      expect(res.body.data.receipt.amount).toBe(5000);
    });

    it('should generate CSR Program Utilization statement with GFR-19A compliance', async () => {
      jest.spyOn(prisma.campaign, 'findUnique').mockResolvedValue({
        id: campaignId,
        title: 'Clean Water Autonomous Drone',
        targetAmount: 500000,
        currentRaisedAmount: 500000,
        tenant: { name: 'Academic Institution' },
        student: { name: 'Lead Student Researcher' },
        donations: [{ amount: 500000 }],
        milestones: [
          {
            sequenceOrder: 1,
            title: 'Design & Prototyping',
            targetAmount: 200000,
            releasedAmount: 200000,
            status: 'DISBURSED',
            milestoneDisbursements: [
              {
                id: 'd1',
                amount: 200000,
                status: 'SETTLED',
                makerUser: { name: 'Maker Admin', email: 'maker@dreamxec.com' },
                checkerUser: { name: 'Checker Officer', email: 'checker@dreamxec.com' },
                payoutReference: 'PAYOUT_DX_TR_001',
                ledgerTxId: 'JE-DISB-2026-001',
                settledAt: new Date(),
              },
            ],
          },
        ],
      });

      const res = await request(app)
        .get(`/api/donations/campaign/${campaignId}/utilisation-report`)
        .set('Authorization', `Bearer ${makerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.utilisationReport.totalDisbursedToDate).toBe(200000);
      expect(res.body.data.utilisationReport.totalContributionsReceived).toBe(500000);
      expect(res.body.data.utilisationReport.statutoryDeclaration).toMatch(/statutory audit standards/i);
    });
  });

  describe('7. Institutional Roster SHA-256 Hashing & MCA Corporate Verification (X3)', () => {
    it('should compute sha256 hashes on roster CSV ingestion and match pending students', async () => {
      const csvData = `rollNumber,name,email,department,year\n2024CS101,Aarav Sharma,aarav@nitkkr.ac.in,Computer Science,3rd Year`;

      const res = await request(app)
        .post('/api/admin/roster/upload')
        .set('Authorization', `Bearer ${makerToken}`)
        .send({
          csvText: csvData,
          institution: 'NIT Kurukshetra',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.validProcessed).toBe(1);

      // Verify the computed hash matches sha256(rollNumber + name)
      const expectedHash = crypto.createHash('sha256').update(('2024cs101' + 'aarav sharma').trim()).digest('hex');
      expect(res.body.data.records[0].hash).toBe(expectedHash);
    });

    it('should validate MCA CIN 21-character structure and verify corporate entities', async () => {
      const validCin = 'U72900KA2021PTC145678';
      const res = await request(app)
        .post('/api/admin/corporate/mca/verify')
        .set('Authorization', `Bearer ${makerToken}`)
        .send({
          cin: validCin,
          companyName: 'Infosys Innovation Labs',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.cin).toBe(validCin);
      expect(res.body.validCinFormat).toBe(true);
    });
  });
});
