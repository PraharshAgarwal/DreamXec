#!/usr/bin/env node

/**
 * ==============================================================================
 * DreamXec Audit Log & Event Outbox Retention Pruner
 * Protects Supabase Free Tier (500MB storage ceiling) from unbounded table growth.
 * Deletes audit logs and processed outbox events older than RETENTION_DAYS in batches.
 * ==============================================================================
 */

require('dotenv').config();
const prisma = require('../config/prisma');

const RETENTION_DAYS = parseInt(process.env.AUDIT_RETENTION_DAYS || '90', 10);
const BATCH_SIZE = 1000;

async function pruneAuditEvents() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  console.log(`\n🧹 Starting DB Pruner (Retention: ${RETENTION_DAYS} days, Cutoff: ${cutoffDate.toISOString()})...`);

  // 1. Prune Audit Events
  try {
    const deletedAudit = await prisma.auditEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    console.log(`   ✅ Pruned ${deletedAudit.count} historical audit events (> ${RETENTION_DAYS} days old).`);
  } catch (err) {
    console.warn(`   ⚠️ Audit event pruning warning:`, err.message);
  }

  // 2. Prune Processed Outbox Events
  try {
    const deletedOutbox = await prisma.outboxEvent.deleteMany({
      where: {
        status: { in: ['PROCESSED', 'COMPLETED', 'PUBLISHED'] },
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    console.log(`   ✅ Pruned ${deletedOutbox.count} processed outbox events (> ${RETENTION_DAYS} days old).`);
  } catch (err) {
    console.warn(`   ⚠️ Outbox pruning warning:`, err.message);
  }

  console.log('🎉 Database maintenance and pruning complete.\n');
}

if (require.main === module) {
  pruneAuditEvents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Pruning failed:', err);
      process.exit(1);
    });
}

module.exports = pruneAuditEvents;
