const CampaignService = require('../src/modules/campaigns/services/campaign.service').CampaignService;
const MilestoneService = require('../src/modules/campaigns/services/milestone.service').MilestoneService;
const CampaignMapper = require('../src/modules/campaigns/campaign.mapper');

describe('SOLID Campaigns & Milestones Module Test Suite (PRD-Aligned)', () => {
  let mockPrisma;
  let mockCache;
  let mockCampaignRepo;
  let mockMilestoneRepo;
  let campaignService;
  let milestoneService;

  beforeEach(() => {
    mockPrisma = {
      campaign: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      membership: {
        findFirst: jest.fn().mockResolvedValue({
          organization: { id: 'org-tenant-123', parentId: null },
        }),
      },
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'org-default-123' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'club-123', name: 'Robotics Club', parentId: 'college-123' }),
      },
    };

    mockCache = {
      getPublicCampaigns: jest.fn().mockResolvedValue(null),
      setPublicCampaigns: jest.fn().mockResolvedValue(),
      getCampaignDetails: jest.fn().mockResolvedValue(null),
      setCampaignDetails: jest.fn().mockResolvedValue(),
      invalidateCampaign: jest.fn().mockResolvedValue(),
    };

    mockCampaignRepo = {
      createCampaign: jest.fn().mockImplementation((data, milestones) => ({
        id: 'camp-123',
        ...data,
        milestones: milestones.map((m, idx) => ({ id: `m-${idx + 1}`, ...m, status: 'PENDING' })),
      })),
      findByIdOrSlug: jest.fn(),
      findPublicCampaigns: jest.fn().mockResolvedValue({
        campaigns: [
          {
            id: 'camp-1',
            title: 'Solar Drone',
            slug: 'solar-drone',
            category: 'STARTUP_INNOVATION',
            stage: 'PROTOTYPE',
            trlLevel: 4,
            targetAmount: 100000,
            currentRaisedAmount: 40000,
            status: 'LIVE',
            student: { fullName: 'Aarav' },
            tenant: { name: 'NIT Kurukshetra' },
            milestones: [{ id: 'm-1', title: 'Phase 1', targetAmount: 100000, status: 'PENDING' }],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        hasNextPage: false,
      }),
      findUserCampaigns: jest.fn().mockResolvedValue([]),
      updateCampaign: jest.fn().mockImplementation((id, data) => ({ id, ...data })),
      verifyCampaign: jest.fn().mockImplementation((id, data) => ({ id, ...data })),
      createEndorsement: jest.fn().mockResolvedValue({ id: 'end-1', status: 'APPROVED' }),
    };

    mockMilestoneRepo = {
      findMilestoneById: jest.fn(),
      requestMilestoneRevision: jest.fn(),
      reviewMilestoneRevision: jest.fn(),
      getMilestoneRevisions: jest.fn(),
      createMilestoneSubmission: jest.fn(),
      reviewMilestoneSubmission: jest.fn(),
    };

    campaignService = new CampaignService({
      campaignRepo: mockCampaignRepo,
      cache: mockCache,
      prismaClient: mockPrisma,
    });

    milestoneService = new MilestoneService({
      milestoneRepo: mockMilestoneRepo,
      campaignRepo: mockCampaignRepo,
      cache: mockCache,
    });
  });

  describe('CampaignService (PRD LifeCycle, Stage-Gates & DIP)', () => {
    test('should reject campaign creation if milestone total does not match goal amount', async () => {
      const user = { id: 'user-1', role: 'USER' };
      const payload = {
        title: 'Quantum Lab',
        description: 'Building quantum simulator',
        goalAmount: 50000,
        category: 'RESEARCH_GRANT',
        milestones: [{ title: 'M1', budget: 20000 }],
      };

      await expect(campaignService.createCampaign(user, payload)).rejects.toThrow(
        /Total milestone budget .* must equal the campaign funding goal/
      );
    });

    test('should create campaign with stage, TRL level and default to DRAFT', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);
      const user = { id: 'user-1', role: 'USER' };
      const payload = {
        title: 'Autonomous Drone',
        description: 'Drone for agricultural mapping with high precision',
        goalAmount: 100000,
        category: 'STARTUP_INNOVATION',
        stage: 'PROTOTYPE',
        trlLevel: 4,
        milestones: [
          { title: 'Airframe', budget: 40000, durationDays: 30 },
          { title: 'Avionics', budget: 60000, durationDays: 45 },
        ],
      };

      const result = await campaignService.createCampaign(user, payload);
      expect(result).toBeDefined();
      expect(result.title).toBe('Autonomous Drone');
      expect(result.stage).toBe('PROTOTYPE');
      expect(result.trlLevel).toBe(4);
      expect(mockCampaignRepo.createCampaign).toHaveBeenCalledTimes(1);
    });

    test('should reject campaign creation under a club if creator is not an active member', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'club-123', name: 'Robotics Guild', parentId: 'col-1' });
      // Creator is NOT a member
      mockPrisma.membership.findFirst.mockResolvedValue(null);

      const user = { id: 'user-outsider', role: 'USER' };
      const payload = {
        title: 'Unauthorized Club Rover',
        description: 'Trying to create campaign for club without membership',
        clubId: 'club-123',
        goalAmount: 50000,
        category: 'STARTUP_INNOVATION',
        milestones: [{ title: 'M1', budget: 50000 }],
      };

      await expect(campaignService.createCampaign(user, payload)).rejects.toThrow(
        /You must be an active, verified member of "Robotics Guild"/
      );
    });

    test('should allow campaign creation under a club if creator is an active member', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({ id: 'club-123', name: 'Robotics Guild', parentId: 'col-1' });
      // Creator IS an active member
      mockPrisma.membership.findFirst.mockResolvedValue({
        id: 'mem-1',
        userId: 'user-member',
        organizationId: 'club-123',
        status: 'ACTIVE',
      });

      const user = { id: 'user-member', role: 'USER' };
      const payload = {
        title: 'Official Club Rover',
        description: 'Legitimate club campaign created by verified member',
        clubId: 'club-123',
        goalAmount: 50000,
        category: 'STARTUP_INNOVATION',
        milestones: [{ title: 'M1', budget: 50000 }],
      };

      const result = await campaignService.createCampaign(user, payload);
      expect(result).toBeDefined();
      expect(mockCampaignRepo.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'club-123',
          tenantId: 'col-1',
        }),
        expect.any(Array)
      );
    });

    test('should submit campaign for faculty endorsement if goal >= ₹40,000', async () => {
      const user = { id: 'user-1', role: 'USER' };
      mockCampaignRepo.findByIdOrSlug.mockResolvedValue({
        id: 'camp-1',
        studentUserId: 'user-1',
        targetAmount: 100000,
        category: 'STARTUP_INNOVATION',
        status: 'DRAFT',
      });

      const result = await campaignService.submitCampaignForReview(user, 'camp-1');
      expect(mockCampaignRepo.updateCampaign).toHaveBeenCalledWith('camp-1', {
        status: 'PENDING_ENDORSEMENT',
      });
      expect(result.status).toBe('PENDING_ENDORSEMENT');
    });

    test('should retrieve public campaigns with caching', async () => {
      const result = await campaignService.getPublicCampaigns({ page: 1, limit: 10 });
      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0].title).toBe('Solar Drone');
      expect(result.campaigns[0].stage).toBe('PROTOTYPE');
      expect(mockCache.setPublicCampaigns).toHaveBeenCalledTimes(1);
    });
  });

  describe('MilestoneService (Revisions Backtracking & Multi-Rejection Loop)', () => {
    test('should request milestone revision and record revision snapshot', async () => {
      const user = { id: 'user-1', role: 'USER' };
      const milestoneId = 'm-1';
      const campaignId = 'camp-1';

      mockMilestoneRepo.findMilestoneById.mockResolvedValue({
        id: milestoneId,
        campaignId,
        currentVersion: 1,
        title: 'Original Title',
        targetAmount: 50000,
        campaign: { studentUserId: 'user-1', tenantId: 'tenant-1', status: 'LIVE' },
      });

      mockMilestoneRepo.requestMilestoneRevision.mockResolvedValue({
        updatedMilestone: {
          id: milestoneId,
          currentVersion: 1,
          title: 'Original Title',
          targetAmount: 50000,
          status: 'PENDING',
        },
        revision: {
          id: 'rev-2',
          revisionNumber: 2,
          title: 'Revised Aerodynamics Phase',
          targetAmount: 55000,
          changeReason: 'Scope extended to include wind tunnel tests',
          status: 'PENDING_APPROVAL',
          requestedByUserId: 'user-1',
          createdAt: new Date(),
        },
      });

      const result = await milestoneService.requestMilestoneRevision(user, campaignId, milestoneId, {
        title: 'Revised Aerodynamics Phase',
        budget: 55000,
        changeReason: 'Scope extended to include wind tunnel tests',
      });

      expect(result.revision.revisionNumber).toBe(2);
      expect(result.revision.status).toBe('PENDING_APPROVAL');
      expect(result.revision.changeReason).toBe('Scope extended to include wind tunnel tests');
      expect(mockMilestoneRepo.requestMilestoneRevision).toHaveBeenCalledTimes(1);
    });

    test('should submit milestone proof with evidence document for verification', async () => {
      const user = { id: 'user-1', role: 'USER' };
      const milestoneId = 'm-1';
      const campaignId = 'camp-1';

      mockMilestoneRepo.findMilestoneById.mockResolvedValue({
        id: milestoneId,
        campaignId,
        campaign: { studentUserId: 'user-1', tenantId: 'tenant-1' },
      });

      mockMilestoneRepo.createMilestoneSubmission.mockResolvedValue({
        id: 'sub-1',
        milestoneId,
        submissionNumber: 1,
        evidenceDocId: 'doc-uuid-123',
        studentNotes: 'Wind tunnel tests completed with 98% lift efficiency.',
        status: 'PENDING_REVIEW',
      });

      const submission = await milestoneService.submitMilestoneProof(user, campaignId, milestoneId, {
        evidenceDocId: 'doc-uuid-123',
        studentNotes: 'Wind tunnel tests completed with 98% lift efficiency.',
      });

      expect(submission.status).toBe('PENDING_REVIEW');
      expect(submission.submissionNumber).toBe(1);
      expect(mockCache.invalidateCampaign).toHaveBeenCalledWith(campaignId);
    });
  });

  describe('CampaignMapper', () => {
    test('should serialize research ERP fields (stage, TRL, SDG) accurately', () => {
      const raw = {
        id: 'c-1',
        slug: 'drone-project',
        title: 'Solar Drone',
        category: 'STARTUP_INNOVATION',
        stage: 'PROTOTYPE',
        trlLevel: 5,
        sdgGoals: ['SDG-7', 'SDG-9'],
        disbursementType: 'MILESTONE_TRANCHE',
        fundingModel: 'FLEXIBLE',
        targetAmount: 100000,
        currentRaisedAmount: 75000,
        minDonationAmount: 10,
        donorCount: 42,
        currency: 'INR',
        status: 'LIVE',
        student: { id: 'u-1', fullName: 'Aarav Sharma' },
        milestones: [
          {
            id: 'm-1',
            sequenceOrder: 1,
            title: 'Design',
            targetAmount: 100000,
            status: 'APPROVED',
          },
        ],
      };

      const dto = CampaignMapper.toCampaignDTO(raw);
      expect(dto.progressPercentage).toBe(75);
      expect(dto.stage).toBe('PROTOTYPE');
      expect(dto.trlLevel).toBe(5);
      expect(dto.sdgGoals).toEqual(['SDG-7', 'SDG-9']);
      expect(dto.currentRaisedAmount).toBe(75000);
      expect(dto.student.name).toBe('Aarav Sharma');
    });
  });
});
