/**
 * Add Manual Organizations and Workflows Script
 * 
 * Reads organizations and workflows from ./data/manual-orgs.js
 * and idempotently inserts or updates them in the PostgreSQL database via Prisma.
 */

const prisma = require('../config/prisma');
const manualOrgsData = require('./data/manual-orgs');

async function addManualOrgs() {
  console.log('\n======================================================');
  console.log('🚀 SEEDING MANUAL ORGANIZATIONS & WORKFLOWS');
  console.log('======================================================\n');

  // Step 1: Create or update root/parent organizations first
  const orgMap = new Map(); // slug -> orgRecord

  for (const orgData of manualOrgsData) {
    const { name, slug, orgType, lifecycleStatus = 'ACTIVE', allowedRoles = [], metadata = {}, parentSlug } = orgData;

    let parentId = null;
    let depth = 0;
    let hierarchyPath = slug;

    if (parentSlug) {
      const parent = orgMap.get(parentSlug) || (await prisma.organization.findUnique({ where: { slug: parentSlug } }));
      if (parent) {
        parentId = parent.id;
        depth = (parent.depth || 0) + 1;
        hierarchyPath = `${parent.slug}.${slug}`;
      }
    }

    let orgRecord = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!orgRecord) {
      orgRecord = await prisma.organization.create({
        data: {
          name,
          slug,
          orgType,
          lifecycleStatus,
          allowedRoles,
          metadata,
          depth,
          hierarchyPath,
          parentId,
        },
      });
      console.log(`✅ [CREATED ORG] "${orgRecord.name}" (${orgRecord.slug}) [${orgRecord.orgType}]`);
    } else {
      orgRecord = await prisma.organization.update({
        where: { id: orgRecord.id },
        data: {
          name,
          orgType,
          lifecycleStatus,
          allowedRoles,
          metadata,
          depth,
          hierarchyPath,
          parentId,
        },
      });
      console.log(`🔄 [UPDATED ORG] "${orgRecord.name}" (${orgRecord.slug}) [${orgRecord.orgType}]`);
    }

    orgMap.set(slug, orgRecord);

    // Step 2: Seed or update Workflow Templates for this organization
    const workflows = orgData.workflows || [];
    for (const wf of workflows) {
      const role = wf.role;
      const templateSlug = `${slug}-${role.toLowerCase().replace(/_/g, '-')}-workflow`;

      let tpl = await prisma.workflowTemplate.findFirst({
        where: {
          tenantId: orgRecord.id,
          slug: templateSlug,
        },
        include: { stages: true },
      });

      const templateName = `${orgRecord.name} - ${wf.title || `${role} Onboarding Workflow`}`;
      const description = wf.description || `Role-based onboarding and verification workflow for ${role}`;

      if (!tpl) {
        tpl = await prisma.workflowTemplate.create({
          data: {
            tenantId: orgRecord.id,
            name: templateName,
            slug: templateSlug,
            description,
            status: 'PUBLISHED',
            stages: {
              create: (wf.stages || []).map((st) => ({
                name: st.name,
                stageType: st.stageType,
                executionOrder: st.executionOrder,
                config: st.config || {},
              })),
            },
          },
          include: { stages: true },
        });
        console.log(`   └─ 🌟 [CREATED WORKFLOW] "${tpl.name}" (${tpl.stages.length} stages)`);
      } else {
        // Sync stages in place
        for (const st of (wf.stages || [])) {
          const existingStage = tpl.stages.find((s) => s.executionOrder === st.executionOrder);
          if (existingStage) {
            await prisma.workflowStage.update({
              where: { id: existingStage.id },
              data: {
                name: st.name,
                stageType: st.stageType,
                config: st.config || {},
              },
            });
          } else {
            await prisma.workflowStage.create({
              data: {
                templateId: tpl.id,
                name: st.name,
                stageType: st.stageType,
                executionOrder: st.executionOrder,
                config: st.config || {},
              },
            });
          }
        }

        tpl = await prisma.workflowTemplate.update({
          where: { id: tpl.id },
          data: {
            name: templateName,
            description,
            status: 'PUBLISHED',
          },
          include: { stages: { orderBy: { executionOrder: 'asc' } } },
        });
        console.log(`   └─ 🔄 [SYNCED WORKFLOW] "${tpl.name}" (${tpl.stages.length} stages)`);
      }
    }
  }

  console.log('\n======================================================');
  console.log('🎉 ALL MANUAL ORGANIZATIONS & WORKFLOWS SEEDED SUCCESSFULLY!');
  console.log('======================================================\n');
}

if (require.main === module) {
  addManualOrgs()
    .catch((err) => {
      console.error('❌ Error executing addManualOrgs:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = addManualOrgs;
