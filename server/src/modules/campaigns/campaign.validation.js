const { z } = require('zod');

const campaignCategories = [
  'TUITION_FEE',
  'RESEARCH_GRANT',
  'STARTUP_INNOVATION',
  'EMERGENCY_AID',
  'COMPETITION_TRAVEL',
  'EXTRACURRICULAR',
  'CLUB_PROJECT',
];

const milestoneInputSchema = z.object({
  id: z.string().optional().nullable(),
  title: z.string().min(2, 'Milestone title is required (min 2 chars)').max(255),
  description: z.string().optional().nullable(),
  durationDays: z.coerce.number().int().min(1).default(30),
  deadline: z.string().optional().nullable().or(z.literal('')).transform(v => v || null),
  budget: z.coerce.number().positive('Milestone budget must be a positive amount'),
  sequenceOrder: z.coerce.number().int().min(1).optional(),
  acceptanceCriteria: z.array(z.any()).optional().default([]),
  requiredEvidenceTypes: z.array(z.string()).optional().default([]),
});

const beneficiaryDetailsSchema = z.object({
  recipientType: z.enum(['INDIVIDUAL', 'ORGANIZATION']).default('INDIVIDUAL'),
  accountHolderName: z.string().optional().nullable().or(z.literal('')),
  bankAccountNumber: z.string().optional().nullable().or(z.literal('')),
  ifscCode: z.string().optional().nullable().or(z.literal('')),
  upiId: z.string().optional().nullable(),
  kycDocumentUrl: z.string().optional().nullable(),
  orgRegistrationDocUrl: z.string().optional().nullable(),
}).optional().nullable();

const createCampaignSchema = z.object({
  title: z.string().min(3, 'Campaign title must be at least 3 characters').max(255),
  description: z.string().min(3, 'Campaign description must be at least 3 characters').or(z.string().optional()),
  shortDescription: z.string().max(500).optional().nullable(),
  category: z.enum(campaignCategories, {
    errorMap: () => ({ message: `Category must be one of: ${campaignCategories.join(', ')}` }),
  }).default('STARTUP_INNOVATION'),
  campaignType: z.enum(['INDIVIDUAL', 'TEAM']).default('INDIVIDUAL'),
  stage: z.enum(['DISCOVERY', 'FEASIBILITY', 'PROTOTYPE', 'PILOT', 'COMMERCIALIZATION']).default('DISCOVERY'),
  goalAmount: z.coerce.number().positive('Fundraising goal must be a positive number'),
  minDonationAmount: z.coerce.number().positive().default(1.00),
  coverImageUrl: z.string().optional().nullable(),
  galleryImageUrls: z.array(z.string()).optional().default([]),
  videoUrl: z.string().optional().nullable(),
  presentationDeckUrl: z.string().optional().nullable(),
  tenantId: z.string().uuid('Valid tenant institution UUID is required').optional().nullable().or(z.literal('')).transform(v => v || null),
  clubId: z.string().uuid('Valid club UUID is required').optional().nullable().or(z.literal('')).transform(v => v || null),
  organizationId: z.string().uuid().optional().nullable().or(z.literal('')).transform(v => v || null),
  beneficiaryUserId: z.string().uuid().optional().nullable().or(z.literal('')).transform(v => v || null),
  beneficiaryDetails: beneficiaryDetailsSchema,
  faqs: z.array(
    z.object({
      question: z.string().min(1, 'Question cannot be empty'),
      answer: z.string().min(1, 'Answer cannot be empty'),
    })
  ).optional().default([]),
  teamMembers: z.array(
    z.object({
      name: z.string().min(1, 'Member name is required'),
      role: z.string().min(1, 'Member role is required'),
      email: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      avatarUrl: z.string().optional().nullable(),
    })
  ).optional().default([]),
  milestones: z.array(milestoneInputSchema).min(1, 'Campaign must include at least one milestone tranche'),
});

const updateCampaignSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(255).optional(),
  description: z.string().optional().nullable().or(z.literal('')),
  shortDescription: z.string().max(500).optional().nullable().or(z.literal('')),
  category: z.string().optional(),
  campaignType: z.enum(['INDIVIDUAL', 'TEAM']).optional(),
  stage: z.enum(['DISCOVERY', 'FEASIBILITY', 'PROTOTYPE', 'PILOT', 'COMMERCIALIZATION']).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PENDING_VERIFICATION', 'APPROVED', 'LIVE', 'PAUSED', 'COMPLETED', 'REJECTED']).optional(),
  goalAmount: z.coerce.number().positive().optional(),
  minDonationAmount: z.coerce.number().positive().optional(),
  coverImageUrl: z.string().optional().nullable().or(z.literal('')),
  galleryImageUrls: z.array(z.string()).optional(),
  videoUrl: z.string().optional().nullable().or(z.literal('')),
  presentationDeckUrl: z.string().optional().nullable().or(z.literal('')),
  beneficiaryDetails: beneficiaryDetailsSchema,
  faqs: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    })
  ).optional(),
  teamMembers: z.array(
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      email: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      avatarUrl: z.string().optional().nullable(),
    })
  ).optional(),
  milestones: z.array(milestoneInputSchema).optional(),
});

const requestMilestoneRevisionSchema = z.object({
  title: z.string().min(2, 'Milestone title is required').max(255).optional(),
  description: z.string().optional().nullable(),
  durationDays: z.coerce.number().int().min(1).optional(),
  deadline: z.string().optional().nullable().or(z.literal('')).transform(v => v || null),
  budget: z.coerce.number().positive('Budget must be positive').optional(),
  acceptanceCriteria: z.array(z.any()).optional(),
  requiredEvidenceTypes: z.array(z.string()).optional(),
  changeReason: z.string().min(3, 'A change reason is required to maintain milestone history').max(500),
});

const reviewMilestoneRevisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Revision review status must be APPROVED or REJECTED' }),
  }),
  rejectionReason: z.string().optional().nullable(),
}).refine(
  (data) => data.status !== 'REJECTED' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: 'Rejection reason is required when rejecting a milestone revision', path: ['rejectionReason'] }
);

const submitMilestoneProofSchema = z.object({
  evidenceDocId: z.string().uuid('Valid evidence document UUID is required').optional().nullable(),
  studentNotes: z.string().max(3000).optional().nullable(),
  narrative: z.string().max(3000).optional().nullable(),
  evidenceMediaUrls: z.array(z.string()).optional(),
  evidenceDocumentUrls: z.array(z.string()).optional(),
  criteriaChecklist: z.array(z.any()).optional(),
  demoUrl: z.string().optional().nullable().or(z.literal('')),
  evidenceFiles: z.array(z.string()).optional(),
  checklistAnswers: z.array(z.any()).optional(),
}).refine(
  (data) =>
    (data.studentNotes && data.studentNotes.trim().length >= 3) ||
    (data.narrative && data.narrative.trim().length >= 3),
  {
    message: 'Completion notes or narrative of at least 3 characters are required',
    path: ['studentNotes'],
  }
);

const reviewMilestoneSubmissionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Review status must be either APPROVED or REJECTED' }),
  }),
  rejectionReason: z.string().optional().nullable(),
}).refine(
  (data) => data.status !== 'REJECTED' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: 'Rejection reason is required when rejecting a milestone submission', path: ['rejectionReason'] }
);

const verifyCampaignSchema = z.object({
  status: z.enum(['LIVE', 'APPROVED', 'REJECTED', 'PAUSED', 'COMPLETED']),
  rejectionReason: z.string().optional().nullable(),
}).refine(
  (data) => data.status !== 'REJECTED' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: 'Rejection reason is required when rejecting a campaign', path: ['rejectionReason'] }
);

const endorseCampaignSchema = z.object({
  designation: z.string().min(2, 'Designation is required (e.g. Head of Robotics Lab)'),
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']).default('APPROVED'),
  comments: z.string().optional().nullable(),
});

const addCampaignMemberSchema = z.object({
  email: z.string().email('Valid email address is required to invite member'),
  role: z.enum(['OWNER', 'MEMBER']).default('MEMBER'),
  title: z.string().max(100).optional().nullable(),
});

const updateCampaignMemberSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER']).optional(),
  title: z.string().max(100).optional().nullable(),
});

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  requestMilestoneRevisionSchema,
  reviewMilestoneRevisionSchema,
  submitMilestoneProofSchema,
  reviewMilestoneSubmissionSchema,
  verifyCampaignSchema,
  endorseCampaignSchema,
  addCampaignMemberSchema,
  updateCampaignMemberSchema,
};
