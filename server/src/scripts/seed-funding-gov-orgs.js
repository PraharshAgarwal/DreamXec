const prisma = require('../config/prisma');

async function seedFundingAndGovOrgs() {
  console.log('🌱 Starting Seed: Funding Org (4 roles) & Government Org (GOV_OFFICIAL)...');

  // 1. Seed Funding Organization (4 roles: DONOR, CORPORATE_ADMIN, MENTOR, ORG_ADMIN)
  const fundingOrgSlug = 'dreamx-funding-trust';
  let fundingOrg = await prisma.organization.findUnique({
    where: { slug: fundingOrgSlug },
  });

  if (!fundingOrg) {
    fundingOrg = await prisma.organization.create({
      data: {
        name: 'DreamX Funding & Capital Trust',
        slug: fundingOrgSlug,
        orgType: 'CORPORATE',
        allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR', 'ORG_ADMIN'],
        lifecycleStatus: 'ACTIVE',
        hierarchyPath: fundingOrgSlug,
      },
    });
    console.log(`✅ Created Funding Org: "${fundingOrg.name}" (${fundingOrg.id})`);
  } else {
    fundingOrg = await prisma.organization.update({
      where: { id: fundingOrg.id },
      data: {
        allowedRoles: ['DONOR', 'CORPORATE_ADMIN', 'MENTOR', 'ORG_ADMIN'],
        lifecycleStatus: 'ACTIVE',
      },
    });
    console.log(`🔄 Updated Funding Org: "${fundingOrg.name}" (${fundingOrg.id})`);
  }

  // 2. Seed Government Organization (Roles: GOV_OFFICIAL, COMPLIANCE_OFFICER, RESEARCHER, ORG_ADMIN)
  const govOrgSlug = 'national-gov-authority';
  let govOrg = await prisma.organization.findUnique({
    where: { slug: govOrgSlug },
  });

  if (!govOrg) {
    govOrg = await prisma.organization.create({
      data: {
        name: 'National Innovation & Research Authority',
        slug: govOrgSlug,
        orgType: 'RESEARCH_INSTITUTION',
        allowedRoles: ['GOV_OFFICIAL', 'COMPLIANCE_OFFICER', 'RESEARCHER', 'ORG_ADMIN'],
        lifecycleStatus: 'ACTIVE',
        hierarchyPath: govOrgSlug,
      },
    });
    console.log(`✅ Created Government Org: "${govOrg.name}" (${govOrg.id})`);
  } else {
    govOrg = await prisma.organization.update({
      where: { id: govOrg.id },
      data: {
        allowedRoles: ['GOV_OFFICIAL', 'COMPLIANCE_OFFICER', 'RESEARCHER', 'ORG_ADMIN'],
        lifecycleStatus: 'ACTIVE',
      },
    });
    console.log(`🔄 Updated Government Org: "${govOrg.name}" (${govOrg.id})`);
  }

  // 3. Seed Workflow Templates for Funding Org Roles
  const fundingWorkflows = [
    {
      role: 'DONOR',
      title: 'Donor Grant & Contribution Verification',
      stages: [
        {
          name: 'Donor Profile & Intent',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'donorType', label: 'Donor Entity Type', required: true, options: ['Individual', 'Corporate Foundation', 'Institutional Grantor'] },
              { id: 'taxId', label: 'Tax Identification / PAN Number', required: true },
              { id: 'annualBudget', label: 'Estimated Annual Grant Budget ($)', required: false },
            ],
          },
        },
        {
          name: 'Grant Authorization Documents',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'taxExemptionProof', name: 'Tax Exemption & Entity Registration Proof', required: true },
            ],
          },
        },
        {
          name: 'Platform Compliance & Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
    {
      role: 'CORPORATE_ADMIN',
      title: 'Corporate Executive Onboarding',
      stages: [
        {
          name: 'Corporate Executive Details',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'designation', label: 'Executive Title / Designation', required: true },
              { id: 'corporateEmail', label: 'Official Corporate Work Email', required: true },
              { id: 'department', label: 'Department / CSR Division', required: true },
            ],
          },
        },
        {
          name: 'Corporate Authorization Letter',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'authLetter', name: 'Board Authorization Letter or Corporate ID Card', required: true },
            ],
          },
        },
        {
          name: 'Executive Review & Activation',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
    {
      role: 'MENTOR',
      title: 'Funding Mentor & Advisory Onboarding',
      stages: [
        {
          name: 'Advisory Expertise & Bio',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'expertiseDomain', label: 'Primary Domain of Expertise', required: true },
              { id: 'linkedinUrl', label: 'LinkedIn Profile URL', required: true },
            ],
          },
        },
        {
          name: 'Credential Upload',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'mentorCv', name: 'Professional CV / Advisory Profile', required: true },
            ],
          },
        },
        {
          name: 'Advisory Approval',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
    {
      role: 'ORG_ADMIN',
      title: 'Funding Organization Administrator Onboarding',
      stages: [
        {
          name: 'Admin Credentials',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'adminRole', label: 'Administrative Function', required: true },
              { id: 'contactPhone', label: 'Official Phone Number', required: true },
            ],
          },
        },
        {
          name: 'Organization Registration Proof',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'incorporationDoc', name: 'Certificate of Incorporation / KYB Proof', required: true },
            ],
          },
        },
        {
          name: 'Platform Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
  ];

  for (const wf of fundingWorkflows) {
    const templateSlug = `${fundingOrgSlug}-${wf.role.toLowerCase().replace(/_/g, '-')}-workflow`;
    const existingTpl = await prisma.workflowTemplate.findFirst({
      where: { tenantId: fundingOrg.id, slug: templateSlug },
    });

    if (!existingTpl) {
      await prisma.workflowTemplate.create({
        data: {
          tenantId: fundingOrg.id,
          name: `${fundingOrg.name} - ${wf.title}`,
          slug: templateSlug,
          description: `Role-based workflow for ${wf.role} at ${fundingOrg.name}`,
          status: 'PUBLISHED',
          stages: {
            create: wf.stages.map((st) => ({
              name: st.name,
              stageType: st.stageType,
              executionOrder: st.executionOrder,
              config: st.config,
            })),
          },
        },
      });
      console.log(`  └─ Created Workflow Template for role: ${wf.role}`);
    }
  }

  // 4. Seed Workflow Templates for Government Org Roles
  const govWorkflows = [
    {
      role: 'GOV_OFFICIAL',
      title: 'Government Official Credential Verification',
      stages: [
        {
          name: 'Official Designation & Ministry Information',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'ministryName', label: 'Ministry / Department Name', required: true },
              { id: 'officialTitle', label: 'Official Designation / Gazette Rank', required: true },
              { id: 'govEmail', label: 'Official Govt Domain Email (.gov / .nic.in)', required: true },
              { id: 'officeAddress', label: 'Government Office Address', required: true },
            ],
          },
        },
        {
          name: 'Government Badge & Identity Proof',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'govIdCard', name: 'Official Government Service ID Card / Gazette Order', required: true },
            ],
          },
        },
        {
          name: 'Official Clearance & Governance Review',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
    {
      role: 'COMPLIANCE_OFFICER',
      title: 'Regulatory & Compliance Audit Verification',
      stages: [
        {
          name: 'Compliance Credentials',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'regulatoryBody', label: 'Regulatory Commission / Body', required: true },
              { id: 'officerCode', label: 'Compliance Audit Officer Code', required: true },
            ],
          },
        },
        {
          name: 'Accreditation Document Upload',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'accreditationProof', name: 'Auditor Authorization Certificate', required: true },
            ],
          },
        },
        {
          name: 'Compliance Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
    {
      role: 'RESEARCHER',
      title: 'Government Research Grant Scholar Verification',
      stages: [
        {
          name: 'Research Grant Details',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'grantId', label: 'National Research Grant Sanction ID', required: true },
              { id: 'orcidId', label: 'ORCID iD Number', required: true },
              { id: 'fieldOfStudy', label: 'Primary Field of Research', required: true },
            ],
          },
        },
        {
          name: 'Sanction Order Upload',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'grantSanctionLetter', name: 'Official Grant Sanction Letter', required: true },
            ],
          },
        },
        {
          name: 'Research Approval',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
    {
      role: 'ORG_ADMIN',
      title: 'Authority Administrator Onboarding',
      stages: [
        {
          name: 'Authority Admin Profile',
          stageType: 'FORM',
          executionOrder: 1,
          config: {
            fields: [
              { id: 'adminTitle', label: 'Administrative Officer Title', required: true },
              { id: 'workEmail', label: 'Official Work Email', required: true },
            ],
          },
        },
        {
          name: 'Gazette Authorization',
          stageType: 'DOCUMENT_UPLOAD',
          executionOrder: 2,
          config: {
            requiredDocuments: [
              { id: 'gazetteAuth', name: 'Gazette Notification / Appointment Order', required: true },
            ],
          },
        },
        {
          name: 'Platform Verification',
          stageType: 'MANUAL_REVIEW',
          executionOrder: 3,
          config: { reviewRequired: true },
        },
      ],
    },
  ];

  for (const wf of govWorkflows) {
    const templateSlug = `${govOrgSlug}-${wf.role.toLowerCase().replace(/_/g, '-')}-workflow`;
    const existingTpl = await prisma.workflowTemplate.findFirst({
      where: { tenantId: govOrg.id, slug: templateSlug },
    });

    if (!existingTpl) {
      await prisma.workflowTemplate.create({
        data: {
          tenantId: govOrg.id,
          name: `${govOrg.name} - ${wf.title}`,
          slug: templateSlug,
          description: `Role-based workflow for ${wf.role} at ${govOrg.name}`,
          status: 'PUBLISHED',
          stages: {
            create: wf.stages.map((st) => ({
              name: st.name,
              stageType: st.stageType,
              executionOrder: st.executionOrder,
              config: st.config,
            })),
          },
        },
      });
      console.log(`  └─ Created Workflow Template for role: ${wf.role}`);
    }
  }

  console.log('✨ Seed Completed Successfully!');
}

seedFundingAndGovOrgs()
  .catch((e) => {
    console.error('❌ Error seeding funding and gov orgs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
