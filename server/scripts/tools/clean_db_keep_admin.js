const prisma = require('./src/config/prisma');
const redis = require('./src/config/redis');

async function main() {
  console.log('🚀 Starting Database Purge (Preserving Admin Credentials & Engine Configs)...');

  // 1. Verify Admin User
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'dx.admin@dreamxec.com' },
        { role: 'ADMIN' },
      ],
    },
  });

  if (!admin) {
    throw new Error('❌ Critical: Admin user not found! Aborting purge to prevent data loss.');
  }

  console.log(`✅ Found Admin: ${admin.fullName} (${admin.email}) | ID: ${admin.id}`);

  // 2. Verify Platform Governance Organization
  const govOrg = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: 'dx-platform-org' },
        { name: { contains: 'Governance', mode: 'insensitive' } },
      ],
    },
  });

  const govOrgId = govOrg ? govOrg.id : null;
  if (govOrgId) {
    console.log(`✅ Preserving Platform Org: ${govOrg.name} (${govOrg.slug}) | ID: ${govOrgId}`);
  }

  // 3. Perform Deletions in Topological Order
  console.log('\n--- Purging Dependent Tables ---');

  // Vault Items
  const deletedDocVault = await prisma.userDocVault.deleteMany({});
  console.log(`Deleted UserDocVault: ${deletedDocVault.count}`);

  const deletedAccountVault = await prisma.userAccountVault.deleteMany({});
  console.log(`Deleted UserAccountVault: ${deletedAccountVault.count}`);

  // Campaign Interactions
  const deletedComments = await prisma.campaignComment.deleteMany({});
  console.log(`Deleted CampaignComments: ${deletedComments.count}`);

  const deletedMembers = await prisma.campaignMember.deleteMany({});
  console.log(`Deleted CampaignMembers: ${deletedMembers.count}`);

  const deletedRevisions = await prisma.campaignMilestoneRevision.deleteMany({});
  console.log(`Deleted MilestoneRevisions: ${deletedRevisions.count}`);

  const deletedSubmissions = await prisma.campaignMilestoneSubmission.deleteMany({});
  console.log(`Deleted MilestoneSubmissions: ${deletedSubmissions.count}`);

  const deletedProofs = await prisma.utilizationProof.deleteMany({});
  console.log(`Deleted UtilizationProofs: ${deletedProofs.count}`);

  const deletedDisbursements = await prisma.milestoneDisbursement.deleteMany({});
  console.log(`Deleted MilestoneDisbursements: ${deletedDisbursements.count}`);

  const deletedEndorsements = await prisma.campaignEndorsement.deleteMany({});
  console.log(`Deleted CampaignEndorsements: ${deletedEndorsements.count}`);

  // Milestones
  const deletedMilestones = await prisma.campaignMilestone.deleteMany({});
  console.log(`Deleted CampaignMilestones: ${deletedMilestones.count}`);

  // Payments & Donations
  const deletedAttempts = await prisma.paymentAttempt.deleteMany({});
  console.log(`Deleted PaymentAttempts: ${deletedAttempts.count}`);

  const deletedIntents = await prisma.paymentIntent.deleteMany({});
  console.log(`Deleted PaymentIntents: ${deletedIntents.count}`);

  const deletedDonations = await prisma.donation.deleteMany({});
  console.log(`Deleted Donations: ${deletedDonations.count}`);

  // Ledger Entries & Transactions
  const deletedLedgerEntries = await prisma.ledgerEntry.deleteMany({});
  console.log(`Deleted LedgerEntries: ${deletedLedgerEntries.count}`);

  const deletedLedgerTransactions = await prisma.ledgerTransaction.deleteMany({});
  console.log(`Deleted LedgerTransactions: ${deletedLedgerTransactions.count}`);

  const deletedLedgerAccounts = await prisma.ledgerAccount.deleteMany({});
  console.log(`Deleted LedgerAccounts: ${deletedLedgerAccounts.count}`);

  // Campaigns
  const deletedCampaigns = await prisma.campaign.deleteMany({});
  console.log(`Deleted Campaigns: ${deletedCampaigns.count}`);

  // Verifications & Workflow Executions
  const deletedVerifications = await prisma.verification.deleteMany({});
  console.log(`Deleted Verifications: ${deletedVerifications.count}`);

  const deletedStageSubmissions = await prisma.stageSubmission.deleteMany({});
  console.log(`Deleted StageSubmissions: ${deletedStageSubmissions.count}`);

  const deletedStageExecutions = await prisma.stageExecution.deleteMany({});
  console.log(`Deleted StageExecutions: ${deletedStageExecutions.count}`);

  const deletedWorkflowInstances = await prisma.workflowInstance.deleteMany({});
  console.log(`Deleted WorkflowInstances: ${deletedWorkflowInstances.count}`);

  // Sessions
  const deletedSessions = await prisma.session.deleteMany({});
  console.log(`Deleted Sessions: ${deletedSessions.count}`);

  // Memberships (keep admin's membership in DX Platform Governance)
  const deletedMemberships = await prisma.membership.deleteMany({
    where: {
      NOT: {
        AND: [
          { userId: admin.id },
          ...(govOrgId ? [{ organizationId: govOrgId }] : []),
        ],
      },
    },
  });
  console.log(`Deleted Memberships: ${deletedMemberships.count}`);

  // Organizations (keep DX Platform Governance)
  const deletedOrgs = await prisma.organization.deleteMany({
    where: govOrgId ? { id: { not: govOrgId } } : {},
  });
  console.log(`Deleted Organizations: ${deletedOrgs.count}`);

  // Users (delete all non-admin users)
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: admin.id },
    },
  });
  console.log(`Deleted Non-Admin Users: ${deletedUsers.count}`);

  // 4. Clear Redis Cache
  console.log('\n--- Flushing Redis Cache ---');
  try {
    if (redis && typeof redis.flushAll === 'function') {
      await redis.flushAll();
      console.log('✅ Redis cache flushed completely.');
    } else if (redis && typeof redis.flushDb === 'function') {
      await redis.flushDb();
      console.log('✅ Redis db flushed.');
    }
  } catch (err) {
    console.warn('⚠️ Warning while flushing Redis:', err.message);
  }

  // 5. Verification Counts
  console.log('\n--- Post-Purge Verification Summary ---');
  const remainingUsers = await prisma.user.count();
  const remainingOrgs = await prisma.organization.count();
  const remainingMemberships = await prisma.membership.count();
  const remainingCampaigns = await prisma.campaign.count();
  const remainingDonations = await prisma.donation.count();
  const remainingInstances = await prisma.workflowInstance.count();
  const remainingSpecies = await prisma.endangeredSpecies.count();
  const remainingTemplates = await prisma.workflowTemplate.count();
  const remainingPermissions = await prisma.permission.count();

  console.log(`Remaining Users: ${remainingUsers} (Expected: 1)`);
  console.log(`Remaining Organizations: ${remainingOrgs} (Expected: 1 Governance Org)`);
  console.log(`Remaining Memberships: ${remainingMemberships} (Expected: 1 Admin Membership)`);
  console.log(`Remaining Campaigns: ${remainingCampaigns} (Expected: 0)`);
  console.log(`Remaining Donations: ${remainingDonations} (Expected: 0)`);
  console.log(`Remaining WorkflowInstances: ${remainingInstances} (Expected: 0)`);
  console.log(`Preserved EndangeredSpecies: ${remainingSpecies} (Taxonomy Intact)`);
  console.log(`Preserved WorkflowTemplates: ${remainingTemplates} (Workflows Intact)`);
  console.log(`Preserved Permissions: ${remainingPermissions} (RBAC Intact)`);

  console.log('\n🎉 Purge Completed Successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Error during purge:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (redis && typeof redis.disconnect === 'function') {
      await redis.disconnect().catch(() => {});
    }
  });
