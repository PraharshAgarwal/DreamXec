const { PrismaClient } = require('@prisma/client');
const { loadEnv } = require('../config/env');

async function main() {
  await loadEnv();
  const prisma = new PrismaClient();
  const donationRepo = require('../modules/donations/donation.repository');

  // Find all payment attempts that have a gatewayPaymentId but whose intent is still PROCESSING or PENDING
  const stuckAttempts = await prisma.paymentAttempt.findMany({
    where: {
      gatewayPaymentId: { not: null },
      intent: {
        status: { in: ['PROCESSING', 'PENDING'] }
      }
    },
    include: {
      intent: {
        include: {
          donation: true
        }
      }
    }
  });

  console.log(`Found ${stuckAttempts.length} previously stuck verified payments to recover.`);

  for (const attempt of stuckAttempts) {
    console.log(`Re-processing order: ${attempt.gatewayTransactionId} (${attempt.intent?.donation?.amount} INR)...`);
    try {
      const res = await donationRepo.processVerifiedPayment({
        orderId: attempt.gatewayTransactionId,
        paymentId: attempt.gatewayPaymentId,
      });
      console.log(`✅ Successfully settled ${attempt.gatewayTransactionId}:`, res?.alreadySettled ? 'already settled' : 'settled now');
    } catch (err) {
      console.error(`❌ Failed to settle ${attempt.gatewayTransactionId}:`, err.message);
    }
  }

  // Check campaign final raised amount
  const campaigns = await prisma.campaign.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      currentRaisedAmount: true,
      donorCount: true,
      targetAmount: true,
    }
  });
  console.log('--- UPDATED CAMPAIGNS ---');
  console.log(JSON.stringify(campaigns, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
