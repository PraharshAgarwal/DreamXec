const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const governanceService = require('../../src/modules/governance/governance.service');
const prisma = require('../../src/config/prisma');
const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');

describe('Governance Subsystem Integration & Parity Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/mentor', () => {
    it('should return 200 and list of mentors', async () => {
      jest.spyOn(governanceService.repositoryPort, 'findAllMentors').mockImplementation(async () => [
        { id: 'men_1', bio: 'Tech Lead at Acme Corp', expertise: ['AI', 'Robotics'] },
      ]);

      const response = await request(app).get('/api/mentor');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('mentors');
      expect(Array.isArray(response.body.data.mentors)).toBe(true);
    });
  });

  describe('Unauthenticated Access Control', () => {
    it('should reject unauthenticated application submission with 401 error', async () => {
      const response = await request(app)
        .post('/api/applications')
        .send({ projectTitle: 'AI Drone' });

      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated mentor onboarding with 401 error', async () => {
      const response = await request(app)
        .post('/api/mentor/onboard')
        .send({ bio: 'Expert mentor' });

      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated student verification order creation with 401 error', async () => {
      const response = await request(app)
        .post('/api/student-verification/create-order')
        .send({ studentEmail: 'student@college.edu' });

      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated workflow creation with 401 error', async () => {
      const response = await request(app)
        .post('/api/workflows')
        .send({ name: 'Approval Flow' });

      expect(response.status).toBe(401);
    });
  });

  describe('Resilient Verification Triggering & Decoupling', () => {
    it('should ignore FORM and DOCUMENT_UPLOAD stages and only trigger verification on MANUAL_REVIEW', async () => {
      const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');
      const prisma = require('../../src/config/prisma');

      const mockInstance = { id: 'inst_100', tenantId: 'org_100', applicantName: 'Jane Doe', applicantEmail: 'jane@iitb.ac.in' };
      const formStage = { id: 'stg_1', name: 'Role Details Form', stageType: 'FORM', executionOrder: 1 };
      const docStage = { id: 'stg_2', name: 'Document Verification', stageType: 'DOCUMENT_UPLOAD', executionOrder: 2 };
      const reviewStage = { id: 'stg_3', name: 'Manual Admin Review', stageType: 'MANUAL_REVIEW', executionOrder: 3 };

      jest.spyOn(prisma.verification, 'findFirst').mockImplementation(async () => null);
      jest.spyOn(prisma.organization, 'findUnique').mockImplementation(async () => null);
      jest.spyOn(prisma.user, 'findFirst').mockImplementation(async () => null);
      const createSpy = jest.spyOn(prisma.verification, 'create').mockImplementation(async (args) => ({
        id: 'ver_mock_1',
        ...args.data,
      }));

      jest.spyOn(adapter, 'compileVerificationPayload').mockImplementation(async () => ({
        applicant: { id: null, name: 'Jane Doe', email: 'jane@iitb.ac.in' },
        organizationId: 'org_100',
        formDetails: { fullName: 'Jane Doe', designation: 'Professor' },
        documents: [{ fieldName: 'primary_id', name: 'ID Card', url: 'https://example.com/id.pdf', stageName: 'Document Verification' }],
      }));

      // Stage 1 (FORM) -> ensureVerificationTask should not create verification
      await adapter.ensureVerificationTask(mockInstance, formStage, { fullName: 'Jane Doe' });
      expect(createSpy).not.toHaveBeenCalled();

      // Stage 2 (DOCUMENT_UPLOAD) -> ensureVerificationTask should not create verification
      await adapter.ensureVerificationTask(mockInstance, docStage, { primary_id: 'https://example.com/id.pdf' });
      expect(createSpy).not.toHaveBeenCalled();

      // Stage 3 (MANUAL_REVIEW) -> ensureVerificationTask SHOULD create verification
      await adapter.ensureVerificationTask(mockInstance, reviewStage, {});
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          instanceId: 'inst_100',
          tenantId: 'org_100',
          status: 'PENDING',
        }),
      }));
    });

    it('should preserve primary email and assign submitted institutional email to secondaryEmail', async () => {
      const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');
      const prisma = require('../../src/config/prisma');

      const mockUser = {
        id: 'usr_abc',
        email: 'primary.user@gmail.com',
        secondaryEmail: null,
        fullName: 'Test Scholar',
        profileMetadata: {},
      };

      const mockInstance = {
        id: 'inst_200',
        tenantId: 'org_100',
        applicantId: 'usr_abc',
        applicantEmail: 'primary.user@gmail.com',
        applicantName: 'Test Scholar',
        status: 'IN_PROGRESS',
        instanceData: {},
        template: {
          stages: [
            {
              id: 'stg_form_1',
              name: 'Institutional Form',
              stageType: 'FORM',
              executionOrder: 1,
              config: { fields: [] },
            },
          ],
        },
        currentStage: {
          id: 'stg_form_1',
          name: 'Institutional Form',
          executionOrder: 1,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockInstance);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      const userUpdateSpy = jest.spyOn(prisma.user, 'update').mockImplementation(async ({ data }) => {
        Object.assign(mockUser, data);
        return mockUser;
      });
      jest.spyOn(prisma.stageSubmission, 'create').mockResolvedValue({});
      jest.spyOn(prisma.workflowInstance, 'update').mockImplementation(async ({ data }) => ({
        ...mockInstance,
        ...data,
      }));
      jest.spyOn(prisma.membership, 'upsert').mockResolvedValue({});

      await adapter.submitStageData(
        'inst_200',
        'stg_form_1',
        {
          fullName: 'Test Scholar',
          officialEmail: 'scholar@stanford.edu',
        },
        'usr_abc'
      );

      // Primary email remains untouched
      expect(mockUser.email).toBe('primary.user@gmail.com');
      // Secondary email is updated to official institutional email
      expect(mockUser.secondaryEmail).toBe('scholar@stanford.edu');
      expect(userUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr_abc' },
          data: expect.objectContaining({
            secondaryEmail: 'scholar@stanford.edu',
          }),
        })
      );
    });

    it('should transition to next stage even when executionOrder has gaps (e.g. 1 and 3)', async () => {
      const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');
      const prisma = require('../../src/config/prisma');

      const mockInstanceWithGaps = {
        id: 'inst_gap_1',
        status: 'IN_PROGRESS',
        instanceData: {},
        template: {
          stages: [
            {
              id: 'stg_1',
              name: 'Step 1 Details',
              stageType: 'FORM',
              executionOrder: 1,
              config: { fields: [] },
            },
            {
              id: 'stg_3',
              name: 'Step 3 Document Upload',
              stageType: 'DOCUMENT_UPLOAD',
              executionOrder: 3, // Non-consecutive gap!
              config: { requiredDocuments: [] },
            },
          ],
        },
        currentStage: {
          id: 'stg_1',
          name: 'Step 1 Details',
          executionOrder: 1,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockInstanceWithGaps);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.stageSubmission, 'create').mockResolvedValue({});
      jest.spyOn(prisma.stageExecution, 'create').mockResolvedValue({});
      const updateSpy = jest.spyOn(prisma.workflowInstance, 'update').mockImplementation(async ({ data }) => ({
        ...mockInstanceWithGaps,
        ...data,
        currentStage: mockInstanceWithGaps.template.stages.find((s) => s.id === data.currentStageId),
      }));

      const result = await adapter.submitStageData('inst_gap_1', 'stg_1', {}, 'a0000000-0000-0000-0000-000000000001');

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inst_gap_1' },
          data: expect.objectContaining({
            currentStageId: 'stg_3',
          }),
        })
      );
      expect(result.currentStageId).toBe('stg_3');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should return instance idempotently without advancing when an already-completed stage is submitted again', async () => {
      const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');
      const prisma = require('../../src/config/prisma');

      const mockAdvancedInstance = {
        id: 'inst_adv_1',
        status: 'IN_PROGRESS',
        instanceData: {},
        currentStageId: 'stg_2',
        template: {
          stages: [
            {
              id: 'stg_1',
              name: 'Step 1',
              stageType: 'FORM',
              executionOrder: 1,
              config: { fields: [] },
            },
            {
              id: 'stg_2',
              name: 'Step 2',
              stageType: 'DOCUMENT_UPLOAD',
              executionOrder: 2,
              config: { requiredDocuments: [] },
            },
            {
              id: 'stg_3',
              name: 'Step 3',
              stageType: 'MANUAL_REVIEW',
              executionOrder: 3,
              config: {},
            },
          ],
        },
        currentStage: {
          id: 'stg_2',
          name: 'Step 2',
          executionOrder: 2,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockAdvancedInstance);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const updateSpy = jest.spyOn(prisma.workflowInstance, 'update');

      // Submitting stage 1 again when instance is already at stage 2
      const result = await adapter.submitStageData('inst_adv_1', 'stg_1', {}, 'a0000000-0000-0000-0000-000000000001');

      // Should return instance at stage 2 idempotently without calling update
      expect(result.id).toBe('inst_adv_1');
      expect(result.currentStageId).toBe('stg_2');
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should reject submission if required fields are missing, but auto-fill default values for selects', async () => {
      const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');
      const prisma = require('../../src/config/prisma');

      const mockFormInstance = {
        id: 'inst_form_val_1',
        status: 'IN_PROGRESS',
        instanceData: {},
        currentStageId: 'stg_form_val',
        template: {
          stages: [
            {
              id: 'stg_form_val',
              name: 'Details Form',
              stageType: 'FORM',
              executionOrder: 1,
              config: {
                fields: [
                  { id: 'rollNumber', label: 'Roll Number', type: 'text', required: true },
                  { id: 'degreeProgram', label: 'Program', type: 'select', options: ['B.Tech', 'M.Tech'], required: true },
                ],
              },
            },
          ],
        },
        currentStage: {
          id: 'stg_form_val',
          name: 'Details Form',
          executionOrder: 1,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockFormInstance);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // 1. Missing rollNumber should throw missing required field error
      await expect(
        adapter.submitStageData('inst_form_val_1', 'stg_form_val', {}, 'a0000000-0000-0000-0000-000000000001')
      ).rejects.toThrow('Missing required field: Roll Number');

      // 2. Supplying rollNumber while leaving degreeProgram empty should auto-take default value 'B.Tech'
      jest.spyOn(prisma.stageSubmission, 'create').mockResolvedValue({});
      jest.spyOn(prisma.workflowInstance, 'update').mockImplementation(async ({ data }) => ({
        ...mockFormInstance,
        ...data,
      }));

      const res = await adapter.submitStageData(
        'inst_form_val_1',
        'stg_form_val',
        { rollNumber: '123456' },
        'a0000000-0000-0000-0000-000000000001'
      );

      expect(res.instanceData['Details Form'].degreeProgram).toBe('B.Tech');
      expect(res.instanceData['Details Form'].rollNumber).toBe('123456');
    });

    it('should reject DOCUMENT_UPLOAD stage if required documents are missing', async () => {
      const adapter = require('../../src/modules/governance/adapters/prisma-governance-repository.adapter');
      const prisma = require('../../src/config/prisma');

      const mockDocInstance = {
        id: 'inst_doc_val_1',
        status: 'IN_PROGRESS',
        instanceData: {},
        currentStageId: 'stg_doc_val',
        template: {
          stages: [
            {
              id: 'stg_doc_val',
              name: 'Upload Documents',
              stageType: 'DOCUMENT_UPLOAD',
              executionOrder: 1,
              config: {
                requiredDocuments: [
                  { id: 'facultyIdCard', name: 'Faculty ID Card', required: true },
                ],
              },
            },
          ],
        },
        currentStage: {
          id: 'stg_doc_val',
          name: 'Upload Documents',
          executionOrder: 1,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockDocInstance);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Submitting without uploading required document should throw error
      await expect(
        adapter.submitStageData('inst_doc_val_1', 'stg_doc_val', {}, 'a0000000-0000-0000-0000-000000000001')
      ).rejects.toThrow('Missing required document: Faculty ID Card');
    });

    it('should step back to previous stage and reject stepping back on completed instance', async () => {
      const mockMultiStageInstance = {
        id: 'inst_step_back_1',
        status: 'IN_PROGRESS',
        currentStageId: 'stg_2',
        template: {
          stages: [
            { id: 'stg_1', name: 'Stage 1', executionOrder: 1 },
            { id: 'stg_2', name: 'Stage 2', executionOrder: 2 },
          ],
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockMultiStageInstance);
      const updateSpy = jest.spyOn(prisma.workflowInstance, 'update').mockResolvedValue({
        ...mockMultiStageInstance,
        currentStageId: 'stg_1',
      });

      const res = await adapter.goToPreviousStage('inst_step_back_1');
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inst_step_back_1' },
          data: expect.objectContaining({ currentStageId: 'stg_1', status: 'IN_PROGRESS' }),
        })
      );
      expect(res.currentStageId).toBe('stg_1');

      // Test stepping back on completed instance should reject
      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue({
        ...mockMultiStageInstance,
        status: 'COMPLETED',
      });

      await expect(adapter.goToPreviousStage('inst_step_back_1')).rejects.toThrow(
        'Completed workflows cannot be stepped back.'
      );
    });

    it('should NOT activate membership or mark instance COMPLETED when manual review is required', async () => {
      const mockReviewInstance = {
        id: 'inst_review_guard_1',
        status: 'IN_PROGRESS',
        tenantId: 'a0000000-0000-0000-0000-000000000099',
        applicantId: 'a0000000-0000-0000-0000-000000000001',
        applicantEmail: 'applicant@review.com',
        applicantName: 'Review Applicant',
        instanceData: { selectedRole: 'FACULTY' },
        currentStageId: 'stg_manual_rev',
        template: {
          stages: [
            { id: 'stg_1', name: 'Form Step', stageType: 'FORM', executionOrder: 1 },
            { id: 'stg_manual_rev', name: 'Admin Compliance Review', stageType: 'MANUAL_REVIEW', executionOrder: 2 },
          ],
        },
        currentStage: {
          id: 'stg_manual_rev',
          name: 'Admin Compliance Review',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 2,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockReviewInstance);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.stageSubmission, 'create').mockResolvedValue({ id: 'sub_1' });
      jest.spyOn(adapter, 'ensureVerificationTask').mockResolvedValue({});

      const updateSpy = jest.spyOn(prisma.workflowInstance, 'update').mockResolvedValue({
        ...mockReviewInstance,
        status: 'IN_PROGRESS',
      });
      const membershipSpy = jest.spyOn(prisma.membership, 'upsert').mockResolvedValue({ id: 'mem_1', status: 'PENDING' });

      const result = await adapter.submitStageData(
        'inst_review_guard_1',
        'stg_manual_rev',
        { comments: 'Ready for admin review' },
        'a0000000-0000-0000-0000-000000000001'
      );

      // Must remain IN_PROGRESS
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inst_review_guard_1' },
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
      expect(result.status).toBe('IN_PROGRESS');

      // Membership must be created with status PENDING, NEVER ACTIVE
      expect(membershipSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ status: 'PENDING' }),
        })
      );
    });

    it('should persist uploaded verification files into UserDocVault', async () => {
      const mockDocInstance = {
        id: 'inst_vault_1',
        status: 'IN_PROGRESS',
        tenantId: 'a0000000-0000-0000-0000-000000000099',
        applicantId: 'a0000000-0000-0000-0000-000000000001',
        applicantEmail: 'student@vault.com',
        instanceData: { selectedRole: 'STUDENT' },
        currentStageId: 'stg_upload',
        template: {
          stages: [
            { id: 'stg_upload', name: 'Document Upload', stageType: 'DOCUMENT_UPLOAD', executionOrder: 1 },
          ],
        },
        currentStage: {
          id: 'stg_upload',
          name: 'Document Upload',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 1,
        },
      };

      jest.spyOn(prisma.workflowInstance, 'findUnique').mockResolvedValue(mockDocInstance);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'a0000000-0000-0000-0000-000000000001', email: 'student@vault.com' });
      jest.spyOn(prisma.stageSubmission, 'create').mockResolvedValue({ id: 'sub_doc_1' });
      jest.spyOn(prisma.workflowInstance, 'update').mockResolvedValue({ ...mockDocInstance, status: 'COMPLETED' });
      jest.spyOn(prisma.membership, 'upsert').mockResolvedValue({ id: 'mem_1' });

      const vaultSpy = jest.spyOn(prisma.userDocVault, 'create').mockResolvedValue({ id: 'vault_item_1' });

      await adapter.submitStageData(
        'inst_vault_1',
        'stg_upload',
        {
          studentIdFile: {
            name: 'student_id_card.pdf',
            url: 'https://storage.dreamxec.com/docs/student_id.pdf',
            size: 1048576,
            type: 'application/pdf',
          },
        },
        'a0000000-0000-0000-0000-000000000001'
      );

      expect(vaultSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'a0000000-0000-0000-0000-000000000001',
            fileName: 'student_id_card.pdf',
            fileUrl: 'https://storage.dreamxec.com/docs/student_id.pdf',
            documentType: 'STUDENT_ID',
          }),
        })
      );
    });
  });
});

