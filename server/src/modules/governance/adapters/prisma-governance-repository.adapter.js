const prisma = require('../../../config/prisma');
const redis = require('../../../config/redis');
const GovernanceRepositoryPort = require('../ports/governance-repository.port');

const { DX_SYSTEM_ORG_SLUG, DX_SYSTEM_ORG_SLUGS } = require('../../../constants/orgRoles.constants');

const pendingInstanceCreations = new Map();

// High-Performance Two-Tier L1 Memory Cache for Governance Orgs & Templates
const l1GovCache = new Map();
const L1_GOV_TTL_MS = 60 * 1000;
const MAX_L1_GOV_ENTRIES = 2000;

function getFromL1Gov(key) {
  const item = l1GovCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    l1GovCache.delete(key);
    return null;
  }
  return item.value;
}

function setToL1Gov(key, value, ttlMs = L1_GOV_TTL_MS) {
  if (l1GovCache.size >= MAX_L1_GOV_ENTRIES) {
    const oldestKey = l1GovCache.keys().next().value;
    if (oldestKey) l1GovCache.delete(oldestKey);
  }
  l1GovCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function invalidateL1Gov(prefixOrSnippet) {
  for (const k of l1GovCache.keys()) {
    if (k.includes(prefixOrSnippet)) {
      l1GovCache.delete(k);
    }
  }
}

class PrismaGovernanceRepositoryAdapter extends GovernanceRepositoryPort {
  async createApplication(userId, data) {
    return await prisma.donorApplication.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findApplications(userId) {
    try {
      return await prisma.donorApplication.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findApplications error:', err.message);
      return [];
    }
  }

  async findAllMentors() {
    try {
      const mentors = await prisma.user.findMany({
        where: {
          accountStatus: { not: 'DELETED' },
          memberships: {
            some: {
              orgRole: 'MENTOR',
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          role: true,
          profileMetadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return mentors.map((m) => ({
        id: m.id,
        user: {
          id: m.id,
          name: m.fullName,
          fullName: m.fullName,
          username: m.username,
          email: m.email,
        },
        profileMetadata: m.profileMetadata,
        createdAt: m.createdAt,
      }));
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findAllMentors error:', err.message);
      return [];
    }
  }

  async createStudentVerification(data) {
    return prisma.studentVerification.create({
      data,
    });
  }

  async findStudentVerifications(where = {}) {
    try {
      return await prisma.studentVerification.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findStudentVerifications error:', err.message);
      return [];
    }
  }

  async findAllOrganizations({ includeWorkflows = false } = {}) {
    const cacheKey = `dx:gov:orgs:all:${Boolean(includeWorkflows)}`;
    const l1Cached = getFromL1Gov(cacheKey);
    if (l1Cached) return l1Cached;

    try {
      if (redis && redis.get) {
        const cachedL2 = await redis.get(cacheKey);
        if (cachedL2) {
          const parsed = JSON.parse(cachedL2);
          setToL1Gov(cacheKey, parsed, 60000);
          return parsed;
        }
      }
    } catch (_) {}

    try {
      const orgs = await prisma.organization.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: { name: 'asc' },
        ...(includeWorkflows
          ? {
              include: {
                workflowTemplates: {
                  include: {
                    stages: {
                      orderBy: { executionOrder: 'asc' },
                    },
                  },
                },
              },
            }
          : {
              select: {
                id: true,
                name: true,
                slug: true,
                orgType: true,
                allowedRoles: true,
                hierarchyPath: true,
                lifecycleStatus: true,
              },
            }),
      });

      const formatted = orgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        orgType: org.orgType,
        allowedRoles: org.allowedRoles || [],
        hierarchyPath: org.hierarchyPath,
        lifecycleStatus: org.lifecycleStatus,
        ...(includeWorkflows ? { workflowTemplates: org.workflowTemplates || [] } : {}),
      }));

      setToL1Gov(cacheKey, formatted, 60000);
      try {
        if (redis && redis.set) {
          await redis.set(cacheKey, JSON.stringify(formatted), { EX: 300 });
        }
      } catch (_) {}

      return formatted;
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findAllOrganizations error:', err.message);
      return [];
    }
  }

  async findOrganizationBySlugOrId(identifier) {
    if (!identifier) return null;
    const cacheKey = `dx:gov:org:${identifier}`;
    const l1Cached = getFromL1Gov(cacheKey);
    if (l1Cached) return l1Cached;

    try {
      if (redis && redis.get) {
        const cachedL2 = await redis.get(cacheKey);
        if (cachedL2) {
          const parsed = JSON.parse(cachedL2);
          setToL1Gov(cacheKey, parsed, 60000);
          return parsed;
        }
      }
    } catch (_) {}

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const where = isUuid
        ? { OR: [{ id: identifier }, { slug: identifier }] }
        : { OR: [{ slug: identifier }, { name: { contains: identifier, mode: 'insensitive' } }] };

      let org = await prisma.organization.findFirst({
        where,
        include: {
          workflowTemplates: {
            include: {
              stages: {
                orderBy: { executionOrder: 'asc' }
              }
            }
          }
        }
      });

      if (org) {
        setToL1Gov(`dx:gov:org:${identifier}`, org, 60000);
        if (org.id) setToL1Gov(`dx:gov:org:${org.id}`, org, 60000);
        if (org.slug) setToL1Gov(`dx:gov:org:${org.slug}`, org, 60000);

        try {
          if (redis && redis.set) {
            await redis.set(`dx:gov:org:${identifier}`, JSON.stringify(org), { EX: 300 });
            if (org.id) await redis.set(`dx:gov:org:${org.id}`, JSON.stringify(org), { EX: 300 });
            if (org.slug) await redis.set(`dx:gov:org:${org.slug}`, JSON.stringify(org), { EX: 300 });
          }
        } catch (_) {}
      }

      return org;
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findOrganizationBySlugOrId error:', err.message);
      return null;
    }
  }

  async invalidateTemplateCache(organizationId) {
    try {
      invalidateL1Gov(`dx:wf:template:${organizationId}`);
      invalidateL1Gov(`dx:gov:org:${organizationId}`);
      invalidateL1Gov('dx:gov:orgs:all:');
      if (!organizationId) return;
      if (redis && redis.del) {
        const standardRoles = ['STUDENT', 'MENTOR', 'ORG_ADMIN', 'PROFESSOR', 'STUDENT_PRESIDENT', 'MEMBER', 'DX_SUPER_ADMIN', 'USER'];
        const keysToDelete = [
          `dx:wf:template:${organizationId}`,
          `dx:gov:org:${organizationId}`,
          ...standardRoles.map((r) => `dx:wf:template:${organizationId}:${r}`),
        ];
        await Promise.allSettled(keysToDelete.map((k) => redis.del(k)));
      }
    } catch (_) {}
  }

  async findMatchingWorkflowTemplate(organizationId, role) {
    if (!organizationId) return null;
    const roleUpper = (role || 'ORG_ADMIN').toUpperCase();
    const cacheKey = `dx:wf:template:${organizationId}:${roleUpper}`;

    // 1. Check L1 memory cache first (<0.05ms)
    const l1Cached = getFromL1Gov(cacheKey);
    if (l1Cached) return l1Cached;

    // 2. Check L2 Redis cache (~30ms)
    try {
      if (redis && redis.get) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setToL1Gov(cacheKey, parsed, 60000);
          return parsed;
        }
      }
    } catch (_) {}

    try {
      let currentOrgId = organizationId;
      let resolvedTemplate = null;

      while (currentOrgId) {
        const templates = await prisma.workflowTemplate.findMany({
          where: { tenantId: currentOrgId },
          include: {
            stages: {
              orderBy: { executionOrder: 'asc' }
            }
          }
        });

        if (templates.length > 0) {
          const roleNormalized = role.toLowerCase().replace(/_/g, '-');
          const roleClean = role.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
          const rUpper = roleUpper;
          const roleTokens = roleClean.split(' ').filter(Boolean);

          // Exact role template match
          const roleMatch = templates.find((t) => {
            const slug = t.slug.toLowerCase();
            const name = t.name.toLowerCase();

            if (rUpper === 'STUDENT' || rUpper === 'USER') {
              return (
                (slug.includes('student') || name.includes('student')) &&
                !slug.includes('president') &&
                !name.includes('president')
              );
            }
            if (rUpper === 'STUDENT_PRESIDENT') {
              return slug.includes('president') || name.includes('president');
            }
            return (
              slug.includes(roleNormalized) ||
              name.includes(roleNormalized) ||
              roleTokens.some((tok) => tok.length > 3 && (slug.includes(tok) || name.includes(tok)))
            );
          });
          if (roleMatch) {
            resolvedTemplate = roleMatch;
            break;
          }

          // If looking for specific roles, filter out onboarding setup templates
          if (rUpper !== 'STUDENT' && rUpper !== 'USER') {
            const roleOnlyTemplates = templates.filter(
              (t) =>
                t.stages && t.stages.length > 0 &&
                !t.slug.toLowerCase().includes('college-onboarding') &&
                !t.slug.toLowerCase().includes('club-onboarding') &&
                !t.slug.toLowerCase().includes('org-onboarding')
            );
            if (roleOnlyTemplates.length > 0) {
              resolvedTemplate = roleOnlyTemplates[0];
              break;
            }
          }
        }

        // Check parent organization hierarchy if sub-org has no template
        const currentOrg = await prisma.organization.findUnique({
          where: { id: currentOrgId },
          select: { parentId: true }
        }).catch(() => null);
        currentOrgId = currentOrg?.parentId || null;
      }

      if (!resolvedTemplate) {
        resolvedTemplate = await this.createDefaultDynamicTemplate(organizationId, role);
      }

      if (resolvedTemplate) {
        setToL1Gov(cacheKey, resolvedTemplate, 60000);
        try {
          if (redis && redis.set) {
            await redis.set(cacheKey, JSON.stringify(resolvedTemplate), { EX: 600 });
          }
        } catch (_) {}
      }

      return resolvedTemplate;
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findMatchingWorkflowTemplate error:', err.message);
      return null;
    }
  }

  async createDefaultDynamicTemplate(organizationId, role) {
    try {
      const stableSlug = `${role.toLowerCase().replace(/_/g, '-')}-dynamic-onboarding`;

      const existingDynamic = await prisma.workflowTemplate.findFirst({
        where: {
          tenantId: organizationId,
          slug: { in: [stableSlug, `${role.toLowerCase().replace(/_/g, '-')}-onboarding`] },
          status: 'PUBLISHED'
        },
        include: {
          stages: {
            orderBy: { executionOrder: 'asc' }
          }
        }
      });

      if (existingDynamic && existingDynamic.stages?.length > 0) {
        return existingDynamic;
      }

      return await prisma.workflowTemplate.create({
        data: {
          tenantId: organizationId,
          name: `Dynamic ${role.replace(/_/g, ' ')} Onboarding Workflow`,
          slug: stableSlug,
          description: `Role onboarding workflow for ${role}`,
          version: 1,
          status: 'PUBLISHED',
          stages: {
            create: (() => {
              const rUpper = role.toUpperCase();
              const isStudent = rUpper === 'STUDENT' || rUpper === 'STUDENT_PRESIDENT';
              const isResearcher = rUpper === 'RESEARCHER';

              const stagesList = [
                {
                  executionOrder: 1,
                  name: 'Role Details Form',
                  stageType: 'FORM',
                  description: `Collect basic details for ${role}`,
                  config: {
                    fields: [
                      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
                      { id: 'department', label: 'Department / Major', type: 'text', required: true },
                      { id: 'institutionalEmail', label: 'Institutional Email', type: 'email', required: true },
                    ]
                  }
                }
              ];

              if (isStudent) {
                stagesList.push({
                  executionOrder: 2,
                  name: 'Student APAAR ID Verification',
                  stageType: 'APAAR_VERIFICATION',
                  description: 'Real-time automated verification of 12-digit student One Nation One Student ID with Government API Setu & DigiLocker',
                  config: { required: true }
                });
              } else if (isResearcher) {
                stagesList.push({
                  executionOrder: 2,
                  name: 'ORCID Academic Identity Verification',
                  stageType: 'ORCID_VERIFICATION',
                  description: 'Real-time identity verification of researcher ORCID record and publications against the public ORCID Registry',
                  config: { required: true }
                });
              }

              stagesList.push({
                executionOrder: stagesList.length + 1,
                name: 'Document Verification',
                stageType: 'DOCUMENT_UPLOAD',
                description: 'Upload verification badge or institutional ID card',
                config: {
                  requiredDocuments: [{ id: 'primary_id', name: 'Institutional ID Card', required: true }]
                }
              });

              return stagesList;
            })()
          }
        },
        include: {
          stages: {
            orderBy: { executionOrder: 'asc' }
          }
        }
      });
      await this.invalidateTemplateCache(organizationId);
      return template;
    } catch (err) {
      console.error('[PrismaGovernanceRepositoryAdapter] createDefaultDynamicTemplate error:', err.message);
      return null;
    }
  }

  async findExistingInProgressInstance(orgId, role, applicantId, applicantEmail, templateId) {
    if (!applicantId && !applicantEmail) return null;
    try {
      let canonicalTenantId = orgId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId);
      if (!isUuid && orgId) {
        const org = await this.findOrganizationBySlugOrId(orgId);
        if (org?.id) canonicalTenantId = org.id;
      }

      const candidateInstances = await prisma.workflowInstance.findMany({
        where: {
          tenantId: canonicalTenantId,
          status: 'IN_PROGRESS',
          currentStageId: { not: null },
          OR: [
            ...(applicantId ? [{ applicantId }] : []),
            ...(applicantEmail ? [{ applicantEmail: applicantEmail.toLowerCase() }] : []),
          ],
        },
        include: {
          template: {
            include: {
              stages: {
                orderBy: { executionOrder: 'asc' }
              }
            }
          },
          currentStage: true,
          organization: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      const targetRoleUpper = (role || '').toUpperCase();
      return candidateInstances.find((inst) => {
        if (inst.status !== 'IN_PROGRESS' || !inst.currentStageId) return false;
        const instRole = (inst.instanceData?.selectedRole || inst.instanceData?.role || '').toUpperCase();
        const isSameRole = instRole === targetRoleUpper;
        const isSameTemplate = templateId ? inst.templateId === templateId : false;
        const templateSlugMatches = (inst.template?.slug || '').toUpperCase().includes(targetRoleUpper);

        return isSameRole || isSameTemplate || templateSlugMatches;
      }) || null;
    } catch (_) {
      return null;
    }
  }

  async createWorkflowInstance({ organizationId, role, applicantId, applicantEmail, applicantName, instanceData = {} }) {
    // 1. Resolve Organization first to get canonical UUID tenantId
    const org = await this.findOrganizationBySlugOrId(organizationId);
    if (!org) throw new Error('Organization not found');

    const canonicalOrgId = org.id;
    const roleUpper = (role || '').toUpperCase();
    const effectiveApplicantId = applicantId || instanceData?.userId || instanceData?.applicantId || null;
    const applicantIdentifier = effectiveApplicantId || (applicantEmail ? applicantEmail.toLowerCase() : null) || 'anonymous';
    const lockKey = `${canonicalOrgId}:${applicantIdentifier}:${roleUpper}`;

    if (pendingInstanceCreations.has(lockKey)) {
      return await pendingInstanceCreations.get(lockKey);
    }

    const redisLockKey = `dx:lock:wf_inst:${lockKey}`;
    const lockToken = `${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let redisLockAcquired = false;

    try {
      if (redis && redis.set) {
        const acquired = await redis.set(redisLockKey, lockToken, { NX: true, EX: 20 });
        if (acquired === 'OK' || acquired === true) {
          redisLockAcquired = true;
        } else {
          // Poll up to 2.25s (15 attempts * 150ms) while the existing lock owner finishes instance creation
          for (let waitAttempt = 0; waitAttempt < 15; waitAttempt++) {
            await new Promise((r) => setTimeout(r, 150));
            const existing = await this.findExistingInProgressInstance(canonicalOrgId, role, effectiveApplicantId, applicantEmail);
            if (existing) return existing;
          }

          // Final check before trying lock one more time
          const finalCheck = await this.findExistingInProgressInstance(canonicalOrgId, role, effectiveApplicantId, applicantEmail);
          if (finalCheck) return finalCheck;

          const recheckAcquired = await redis.set(redisLockKey, lockToken, { NX: true, EX: 20 });
          if (recheckAcquired === 'OK' || recheckAcquired === true) {
            redisLockAcquired = true;
          }
        }
      }
    } catch (_) {}

    const creationTask = (async () => {

      if (org.allowedRoles && Array.isArray(org.allowedRoles) && org.allowedRoles.length > 0) {
        const allowedUpper = org.allowedRoles.map((r) => r.toUpperCase());
        if (!allowedUpper.includes((role || '').toUpperCase())) {
          const AppError = require('../../../utils/AppError');
          throw new AppError(
            `Role '${role}' is not permitted for organization '${org.name}'. Permitted roles: ${org.allowedRoles.join(', ')}`,
            400
          );
        }
      }

      // 2. Parallelize: User + Membership (single query via include), Template resolution, and Existing In-Progress Instance
      const userWhere = applicantId
        ? { id: applicantId }
        : applicantEmail
        ? { email: applicantEmail.toLowerCase() }
        : null;

      const userPromise = userWhere
        ? prisma.user.findUnique({
            where: userWhere,
            select: {
              id: true,
              email: true,
              fullName: true,
              accountStatus: true,
              memberships: {
                where: {
                  organizationId: org.id,
                  role: role,
                },
                select: { id: true, status: true },
                take: 1,
              },
            },
          }).catch(() => null)
        : Promise.resolve(null);

      const rawApplicantId = applicantId || null;
      const rawApplicantEmail = applicantEmail ? applicantEmail.toLowerCase() : null;

      const templatePromise = this.findMatchingWorkflowTemplate(org.id, role);
      const existingInstancePromise = (!instanceData?.restart && !instanceData?.forceNew && (rawApplicantId || rawApplicantEmail))
        ? this.findExistingInProgressInstance(org.id, role, rawApplicantId, rawApplicantEmail)
        : Promise.resolve(null);

      const [user, rawTemplate, matchingInstance] = await Promise.all([
        userPromise,
        templatePromise,
        existingInstancePromise,
      ]);

      const resolvedApplicantId = user?.id || applicantId || null;
      const resolvedApplicantEmail = user?.email || applicantEmail || 'onboarding@user.com';
      const resolvedApplicantName = user?.fullName || applicantName || 'Onboarding User';

      const existingMembership = user?.memberships?.[0] || null;
      if (existingMembership && existingMembership.status === 'ACTIVE') {
        throw new Error(`User is already an active verified ${role} in this organization.`);
      }

      if (matchingInstance) {
        console.log(`ℹ️ [GovernanceAdapter]: Reusing existing WorkflowInstance (${matchingInstance.id}) for tenant=${org.id}, role=${role}`);
        return matchingInstance;
      }

      let template = rawTemplate;
      if (!template || !template.stages || template.stages.length === 0) {
        template = await this.createDefaultDynamicTemplate(org.id, role);
      }

      if (!template || !template.stages || template.stages.length === 0) {
        throw new Error(`Could not resolve workflow template for org ${org.name} and role ${role}`);
      }

      const sortedTemplateStages = [...template.stages].sort(
        (a, b) => (a.executionOrder ?? 0) - (b.executionOrder ?? 0)
      );
      const firstStage = sortedTemplateStages[0];

      const instance = await prisma.workflowInstance.create({
        data: {
          templateId: template.id,
          tenantId: org.id,
          applicantId: resolvedApplicantId,
          applicantEmail: resolvedApplicantEmail,
          applicantName: resolvedApplicantName,
          orgType: org.orgType,
          status: 'IN_PROGRESS',
          currentStageId: firstStage.id,
          instanceData: { ...instanceData, selectedRole: role },
        },
        include: {
          template: {
            include: {
              stages: {
                orderBy: { executionOrder: 'asc' }
              }
            }
          },
          currentStage: true,
          organization: true
        }
      });

      // Record initial stage execution log
      prisma.stageExecution.create({
        data: {
          workflowInstanceId: instance.id,
          workflowStageId: firstStage.id,
          stageName: firstStage.name,
          stageType: firstStage.stageType,
          executionOrder: firstStage.executionOrder,
          executionStatus: 'IN_PROGRESS',
        }
      }).catch((e) => console.warn('[createWorkflowInstance] stageExecution log error:', e.message));

      // Provision initial membership status as PENDING in DB during onboarding
      if (resolvedApplicantId && role && org.id) {
        try {
          const roleEnum = role.toUpperCase();
          await prisma.membership.upsert({
            where: {
              userId_organizationId_role: {
                userId: resolvedApplicantId,
                organizationId: org.id,
                role: roleEnum,
              },
            },
            update: { status: 'PENDING' },
            create: {
              userId: resolvedApplicantId,
              organizationId: org.id,
              role: roleEnum,
              status: 'PENDING',
              joinedAt: new Date(),
            },
          });
        } catch (mErr) {
          console.warn('[GovernanceAdapter] Membership pending provision warning:', mErr.message);
        }
      }

      // Ensure verification task is created if stage requires manual review
      await this.ensureVerificationTask(instance, firstStage, instanceData);

      return instance;
    })();

    pendingInstanceCreations.set(lockKey, creationTask);
    try {
      return await creationTask;
    } catch (err) {
      console.error('[PrismaGovernanceRepositoryAdapter] createWorkflowInstance error:', err);
      throw err;
    } finally {
      pendingInstanceCreations.delete(lockKey);
      if (redisLockAcquired) {
        try {
          const unlockScript = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
              return redis.call("del", KEYS[1])
            else
              return 0
            end
          `;
          if (typeof redis.eval === 'function') {
            await redis.eval(unlockScript, {
              keys: [redisLockKey],
              arguments: [lockToken],
            });
          } else if (typeof redis.sendCommand === 'function') {
            await redis.sendCommand(['EVAL', unlockScript, '1', redisLockKey, lockToken]);
          } else if (typeof redis.get === 'function' && typeof redis.del === 'function') {
            const currentToken = await redis.get(redisLockKey);
            if (currentToken === lockToken) {
              await redis.del(redisLockKey);
            }
          }
        } catch (_) {}
      }
    }
  }

  async compileVerificationPayload(instance, currentFormData = {}) {
    const submissions = await prisma.stageSubmission.findMany({
      where: { workflowInstanceId: instance.id },
      include: { workflowStage: true },
      orderBy: { createdAt: 'asc' }
    }).catch(() => []);

    const combinedFormDetails = {};
    const combinedDocuments = [];
    const seenUrls = new Set();

    const addDoc = (fieldName, docName, url, stageName) => {
      if (!url || typeof url !== 'string' || seenUrls.has(url)) return;
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
        seenUrls.add(url);
        combinedDocuments.push({
          fieldName,
          name: docName || fieldName,
          url,
          stageName: stageName || 'Form Submission'
        });
      }
    };

    // 1. Process stageSubmissions
    for (const sub of submissions) {
      const stageName = sub.workflowStage?.name || `Stage ${sub.workflowStage?.executionOrder || ''}`;
      const fd = sub.formData || {};
      for (const [k, v] of Object.entries(fd)) {
        if (!v) continue;
        if (typeof v === 'string') {
          if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/')) {
            addDoc(k, k, v, stageName);
          } else {
            combinedFormDetails[k] = v;
          }
        } else if (typeof v === 'object') {
          if (v.url && typeof v.url === 'string') {
            addDoc(k, v.name || k, v.url, stageName);
          } else {
            combinedFormDetails[k] = v;
          }
        }
      }
    }

    // 2. Process instanceData
    const instanceData = instance.instanceData || {};
    for (const [stageKey, stageData] of Object.entries(instanceData)) {
      if (stageData && typeof stageData === 'object') {
        for (const [k, v] of Object.entries(stageData)) {
          if (!v) continue;
          if (typeof v === 'string') {
            if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/')) {
              addDoc(k, k, v, stageKey);
            } else {
              combinedFormDetails[k] = v;
            }
          } else if (typeof v === 'object' && v.url) {
            addDoc(k, v.name || k, v.url, stageKey);
          }
        }
      }
    }

    // 3. Process current stage formData
    for (const [k, v] of Object.entries(currentFormData || {})) {
      if (!v) continue;
      if (typeof v === 'string') {
        if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/')) {
          addDoc(k, k, v, 'Current Submission');
        } else {
          combinedFormDetails[k] = v;
        }
      } else if (typeof v === 'object' && v.url) {
        addDoc(k, v.name || k, v.url, 'Current Submission');
      }
    }

    let applicantSecondaryEmail = null;
    if (instance.applicantId) {
      const applicantUser = await prisma.user.findUnique({ where: { id: instance.applicantId } }).catch(() => null);
      if (applicantUser) {
        applicantSecondaryEmail = applicantUser.secondaryEmail || null;
      }
    }

    return {
      applicant: {
        id: instance.applicantId || null,
        name: instance.applicantName || 'Onboarding Applicant',
        email: instance.applicantEmail || 'onboarding@user.com',
        secondaryEmail: applicantSecondaryEmail,
      },
      organizationId: instance.tenantId,
      compiledAt: new Date().toISOString(),
      formDetails: combinedFormDetails,
      documents: combinedDocuments,
      stageHistory: submissions.map((s) => ({
        stageName: s.workflowStage?.name || 'Stage',
        stageType: s.workflowStage?.stageType,
        submittedAt: s.createdAt,
      })),
    };
  }

  async ensureVerificationTask(instance, stage, formData = {}) {
    if (!instance || !stage) return;

    // Strict Manual Review stage types ONLY (excluding DOCUMENT_UPLOAD and FORM stages)
    const manualStageTypes = [
      'MANUAL_REVIEW',
      'MANUAL_APPROVAL',
      'COMPLIANCE_REVIEW',
      'APPROVAL'
    ];

    const stageNameLower = (stage.name || '').toLowerCase();
    const isManualReviewStage =
      manualStageTypes.includes(stage.stageType) ||
      stageNameLower.includes('manual review') ||
      stageNameLower.includes('compliance review') ||
      stageNameLower.includes('admin review') ||
      stageNameLower.includes('manual approval');

    if (!isManualReviewStage) {
      return;
    }

    try {
      const existing = await prisma.verification.findFirst({
        where: { instanceId: instance.id }
      }).catch(() => null);

      const verificationData = await this.compileVerificationPayload(instance, formData);
      const evidenceUrl =
        verificationData.documents.length > 0
          ? verificationData.documents[0].url
          : this.extractEvidenceUrl(formData, instance.instanceData) || existing?.evidenceUrl || null;

      // ── ROUTE DIRECTLY TO DX OVERSEEING PLATFORM ADMIN ──
      let assignedDxAdminId = null;
      let dxAdminUser = null;

      try {
        // 1. Find the DX Platform Overseeing Org
        const dxPlatformOrg = await prisma.organization.findFirst({
          where: { slug: { in: DX_SYSTEM_ORG_SLUGS } },
          include: {
            memberships: {
              where: { role: 'ORG_ADMIN', status: 'ACTIVE' },
              include: { user: true }
            }
          }
        });

        if (dxPlatformOrg?.memberships && dxPlatformOrg.memberships.length > 0) {
          assignedDxAdminId = dxPlatformOrg.memberships[0].userId;
          dxAdminUser = dxPlatformOrg.memberships[0].user;
        }

        // 2. Fallback to any Super Admin user in DB
        if (!assignedDxAdminId) {
          const platformAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN', accountStatus: 'ACTIVE' }
          });
          assignedDxAdminId = platformAdmin?.id || null;
          dxAdminUser = platformAdmin || null;
        }
      } catch (adminErr) {
        console.warn('[ensureVerificationTask] DX Admin assignment lookup fallback:', adminErr.message);
      }

      let verificationRecord;
      if (!existing) {
        try {
          verificationRecord = await prisma.verification.create({
            data: {
              instanceId: instance.id,
              tenantId: instance.tenantId,
              verificationType: `${stage.name} (${stage.stageType})`,
              status: 'PENDING',
              evidenceUrl: evidenceUrl || undefined,
              verificationData,
              assignedOrgAdminId: assignedDxAdminId, // Assigned to DX Overseeing Admin
            }
          });
        } catch (createErr) {
          const concurrentExisting = await prisma.verification.findFirst({
            where: { instanceId: instance.id }
          }).catch(() => null);
          if (concurrentExisting) {
            verificationRecord = await prisma.verification.update({
              where: { id: concurrentExisting.id },
              data: {
                evidenceUrl: evidenceUrl || concurrentExisting.evidenceUrl,
                verificationData,
                assignedOrgAdminId: assignedDxAdminId || concurrentExisting.assignedOrgAdminId,
              }
            });
          }
        }
      } else {
        verificationRecord = await prisma.verification.update({
          where: { id: existing.id },
          data: {
            evidenceUrl: evidenceUrl || existing.evidenceUrl,
            verificationData,
            assignedOrgAdminId: assignedDxAdminId || existing.assignedOrgAdminId,
          }
        });
      }

      // Dispatch email notification to DX Platform Admin
      if (dxAdminUser?.email && verificationRecord && !verificationRecord.notificationSentAt) {
        try {
          const emailService = require('../../email/email.service');
          const applicantOrg = await prisma.organization.findUnique({ where: { id: instance.tenantId } }).catch(() => null);

          await emailService.sendOrgAdminVerificationRequest({
            orgAdminEmail: dxAdminUser.email,
            orgAdminName: dxAdminUser.fullName || dxAdminUser.name || 'DX Platform Admin',
            orgName: applicantOrg?.name || 'Applicant Organization',
            applicantName: instance.applicantName || 'Applicant',
            verificationType: `${stage.name} (${stage.stageType})`,
            verificationId: verificationRecord.id,
          });

          await prisma.verification.update({
            where: { id: verificationRecord.id },
            data: { notificationSentAt: new Date() }
          });
        } catch (notifErr) {
          console.warn('[ensureVerificationTask] DX Admin notification error:', notifErr.message);
        }
      }
    } catch (err) {
      console.error('[ensureVerificationTask] Error routing verification task:', err.message);
    }
  }

  extractEvidenceUrl(formData = {}, instanceData = {}) {
    const checkVal = (v) => {
      if (!v) return null;
      if (typeof v === 'string') {
        if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/')) {
          return v;
        }
      }
      if (typeof v === 'object' && v !== null && typeof v.url === 'string') {
        return v.url;
      }
      return null;
    };

    // 1. Check known keys
    const knownKeys = [
      'evidenceUrl', 'documentUrl', 'fileUrl', 'primary_id', 'facultyId',
      'accreditationCert', 'deanLetter', 'adminAuth', 'appointmentLetter',
      'clubCharter', 'facultySignOff', 'cert', 'authLetter', 'primary_id_doc',
      'live_selfie_proof', 'tax_cin_cert'
    ];

    for (const key of knownKeys) {
      const found = checkVal(formData[key]);
      if (found) return found;
    }

    // 2. Check all values in formData
    for (const val of Object.values(formData || {})) {
      const found = checkVal(val);
      if (found) return found;
    }

    // 3. Check values in instanceData
    for (const stageData of Object.values(instanceData || {})) {
      if (stageData && typeof stageData === 'object') {
        for (const val of Object.values(stageData)) {
          const found = checkVal(val);
          if (found) return found;
        }
      }
    }

    return null;
  }

  async submitStageData(instanceId, stageId, formData = {}, submittedById = null) {
    const lockKey = `dx:lock:wf_submit:${instanceId}`;
    const lockToken = `${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let lockAcquired = false;

    try {
      if (redis && redis.set) {
        const acquired = await redis.set(lockKey, lockToken, { NX: true, EX: 15 });
        if (acquired === 'OK' || acquired === true) {
          lockAcquired = true;
        } else {
          // Poll briefly up to 2.25s (15 attempts * 150ms) for concurrent submission to settle
          for (let attempt = 0; attempt < 15; attempt++) {
            await new Promise((r) => setTimeout(r, 150));
            const updated = await prisma.workflowInstance.findUnique({
              where: { id: instanceId },
              include: {
                template: { include: { stages: { orderBy: { executionOrder: 'asc' } } } },
                currentStage: true,
                organization: true,
              },
            });
            if (updated && (updated.currentStageId !== stageId || updated.status === 'COMPLETED')) {
              return updated;
            }
          }
        }
      }
    } catch (_) {}

    try {
      const instance = await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
        include: {
          template: {
            include: {
              stages: {
                orderBy: { executionOrder: 'asc' }
              }
            }
          },
          currentStage: true
        }
      });

      if (!instance) throw new Error('Workflow instance not found');

      // If workflow is already completed, return instance idempotently
      if (instance.status === 'COMPLETED' && !instance.currentStageId) {
        return instance;
      }

      const allStages = [...(instance.template?.stages || [])].sort(
        (a, b) => (a.executionOrder ?? 0) - (b.executionOrder ?? 0)
      );

      const currentStageObj = allStages.find((s) => s.id === stageId);
      if (!currentStageObj) {
        throw new Error(`Workflow stage with id '${stageId}' not found in template.`);
      }

      // Idempotency check: if workflow has already advanced past this stage (e.g. from rapid double clicks)
      const dbCurrentStage = instance.currentStage || allStages.find((s) => s.id === instance.currentStageId);
      if (
        dbCurrentStage &&
        currentStageObj &&
        (dbCurrentStage.executionOrder ?? 0) > (currentStageObj.executionOrder ?? 0)
      ) {
        console.warn(
          `[submitStageData] Idempotent duplicate: instance ${instanceId} is already at stage '${dbCurrentStage.name}' (order ${dbCurrentStage.executionOrder}), returning current instance without advancing past '${currentStageObj.name}' again.`
        );
        return instance;
      }

      let stageStatus = 'APPROVED';

      // --- APPLY DEFAULT VALUES FROM STAGE CONFIG ---
      if (currentStageObj.config?.fields && Array.isArray(currentStageObj.config.fields)) {
        for (const field of currentStageObj.config.fields) {
          if (formData[field.id] === undefined || formData[field.id] === null || formData[field.id] === '') {
            if (field.defaultValue !== undefined && field.defaultValue !== '') {
              formData[field.id] = field.defaultValue;
            } else if (field.type === 'select' && Array.isArray(field.options) && field.options.length > 0) {
              formData[field.id] = field.options[0];
            }
          }
        }
      }

      // --- BACKEND VALIDATION FOR REQUIRED FIELDS ---
      if (currentStageObj.config?.fields && Array.isArray(currentStageObj.config.fields)) {
        for (const field of currentStageObj.config.fields) {
          if (field.required) {
            const val = formData[field.id];
            if (val === undefined || val === null || val === '') {
              throw new Error(`Missing required field: ${field.label || field.id}`);
            }
          }
        }
      }

      // --- BACKEND VALIDATION FOR REQUIRED DOCUMENTS ---
      if (
        currentStageObj.stageType === 'DOCUMENT_UPLOAD' ||
        (currentStageObj.config?.requiredDocuments && Array.isArray(currentStageObj.config.requiredDocuments))
      ) {
        const reqDocs = currentStageObj.config?.requiredDocuments || [];
        for (const doc of reqDocs) {
          if (doc.required !== false) {
            const docVal = formData[doc.id] || formData[doc.name];
            const hasDoc = docVal && (typeof docVal === 'string' ? docVal.trim().length > 0 : Boolean(docVal.url || docVal.name));
            if (!hasDoc) {
              throw new Error(`Missing required document: ${doc.name || doc.label || doc.id}`);
            }
          }
        }
      }

      // Extract applicant identity early
      let user = null;
      if (submittedById) {
        user = await prisma.user.findUnique({ where: { id: submittedById } }).catch(() => null);
      }
      if (!user && instance.applicantId) {
        user = await prisma.user.findUnique({ where: { id: instance.applicantId } }).catch(() => null);
      }
      if (!user && instance.applicantEmail && !instance.applicantEmail.includes('onboarding@user.com')) {
        user = await prisma.user.findUnique({ where: { email: instance.applicantEmail.toLowerCase() } }).catch(() => null);
      }

      let submittedEmail =
        formData.academicEmail ||
        formData.universityEmail ||
        formData.workEmail ||
        formData.officialEmail ||
        formData.institutionalEmail ||
        formData.email ||
        formData.applicantEmail ||
        formData.registrarEmail;

      if (!submittedEmail) {
        for (const val of Object.values(formData)) {
          if (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
            submittedEmail = val.trim();
            break;
          } else if (
            val &&
            typeof val === 'object' &&
            typeof val.email === 'string' &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.email.trim())
          ) {
            submittedEmail = val.email.trim();
            break;
          }
        }
      }

      // Secondary Email Assignment (Preserve Primary Email)
      const currentEmail =
        typeof user?.email === "string" ? user.email.trim() : "";

      const newEmail =
        typeof submittedEmail === "string" ? submittedEmail.trim() : "";

      const isEmailOtpVerified = Boolean(
        formData._emailVerified ||
        Object.values(formData).some(
          (v) => v && typeof v === 'object' && v._emailVerified === true
        )
      );

      if (
        user?.id &&
        currentEmail &&
        newEmail &&
        currentEmail.toLowerCase() !== newEmail.toLowerCase()
      ) {
        try {
          const normalizedNewEmail = newEmail.toLowerCase();

          if (user.secondaryEmail?.toLowerCase() !== normalizedNewEmail) {
            const currentMeta =
              typeof user.profileMetadata === "object" && user.profileMetadata !== null
                ? user.profileMetadata
                : {};

            await prisma.user.update({
              where: { id: user.id },
              data: {
                secondaryEmail: normalizedNewEmail,
                profileMetadata: {
                  ...currentMeta,
                  secondaryEmail: normalizedNewEmail,
                  institutionalEmail: normalizedNewEmail,
                  ...(isEmailOtpVerified ? { institutionalEmailVerified: true, emailVerified: true } : {}),
                },
              },
            });

            // Keep local user object in sync (preserving user.email as primary)
            user.secondaryEmail = normalizedNewEmail;
          }
        } catch (e) {
          console.warn("Failed to update secondary email:", e);
        }
      }

      if (currentStageObj?.stageType === 'EMAIL_VERIFICATION') {
        const isVerified = Object.values(formData).some(val => val && typeof val === 'object' && val._emailVerified === true);
        const matchesPrimary = Boolean(currentEmail && newEmail && currentEmail.toLowerCase() === newEmail.toLowerCase());
        const matchesSecondary = Boolean(user?.secondaryEmail && newEmail && user.secondaryEmail.toLowerCase() === newEmail.toLowerCase() && (user.profileMetadata?.institutionalEmailVerified || user.profileMetadata?.emailVerified));

        if (!isVerified && !formData._emailVerified && !matchesPrimary && !matchesSecondary) {
          throw new Error('Please verify your email address via OTP before submitting this stage.');
        }
      }

      // --- APAAR ID VERIFICATION STAGE ---
      if (currentStageObj?.stageType === 'APAAR_VERIFICATION') {
        const isVerified = Object.values(formData).some(
          val => val && typeof val === 'object' && val._apaarVerified === true
        );
        const verifiedObj = Object.values(formData).find(
          val => val && typeof val === 'object' && val._apaarVerified === true
        );

        if (!isVerified && !formData._apaarVerified) {
          throw new Error('Please verify your 12-digit APAAR ID with Government API Setu / DigiLocker before proceeding.');
        }

        if (user?.id) {
          const currentMeta =
            typeof user.profileMetadata === 'object' && user.profileMetadata !== null
              ? user.profileMetadata
              : {};

          const apaarIdToSave = verifiedObj?.apaarId || formData.apaarId;
          const abcIdToSave = verifiedObj?.abcId || currentMeta.abcId;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              ...(verifiedObj?.photoUrl && !user.profilePhotoUrl ? { profilePhotoUrl: verifiedObj.photoUrl } : {}),
              ...(apaarIdToSave ? { apaarId: apaarIdToSave } : {}),
              isKycVerified: true,
              kycVerifiedAt: new Date(),
              profileMetadata: {
                ...currentMeta,
                ...(apaarIdToSave ? { apaarId: apaarIdToSave } : {}),
                ...(abcIdToSave ? { abcId: abcIdToSave } : {}),
                apaarVerified: true,
                apaarVerifiedAt: new Date().toISOString(),
                digilockerVerified: true,
                ...(verifiedObj?.studentName ? { verifiedStudentName: verifiedObj.studentName } : {}),
                ...(verifiedObj?.dob ? { dob: verifiedObj.dob } : {}),
                ...(verifiedObj?.gender ? { gender: verifiedObj.gender } : {}),
                ...(verifiedObj ? { apaarData: verifiedObj } : {}),
              }
            }
          }).catch(err => console.warn('[submitStageData] Failed to save APAAR to profile:', err));

          // Persist consented documents to UserDocVault
          if (verifiedObj && Array.isArray(verifiedObj.documents) && verifiedObj.documents.length > 0) {
            const selectedSet = new Set(verifiedObj.selectedDocs || verifiedObj.documents.map(d => d.id));
            for (const doc of verifiedObj.documents) {
              if (selectedSet.has(doc.id)) {
                const docTypeMap = {
                  ADHAR: 'GOVT_ID',
                  ABCER: 'STUDENT_ID',
                  PANCR: 'GOVT_ID',
                };
                const vaultType = docTypeMap[doc.type] || 'GOVT_ID';

                await prisma.userDocVault.create({
                  data: {
                    userId: user.id,
                    title: doc.name,
                    documentType: vaultType,
                    fileName: `${(doc.type || 'doc').toLowerCase()}_digilocker.pdf`,
                    fileUrl: doc.uri || `https://digilocker.meripehchaan.gov.in/issued/${doc.id}`,
                    isVerified: true,
                    metadata: {
                      issuer: doc.issuer,
                      digilockerType: doc.type,
                      source: 'MeriPehchaan_DigiLocker',
                      verifiedAt: new Date().toISOString(),
                    },
                  }
                }).catch(e => console.warn('[submitStageData] Could not save doc to vault:', e.message));
              }
            }
          }
        }
      }

      // --- ORCID ID VERIFICATION STAGE ---
      if (currentStageObj?.stageType === 'ORCID_VERIFICATION') {
        const isVerified = Object.values(formData).some(
          val => val && typeof val === 'object' && val._orcidVerified === true
        );
        const verifiedObj = Object.values(formData).find(
          val => val && typeof val === 'object' && val._orcidVerified === true
        );

        if (!isVerified && !formData._orcidVerified) {
          throw new Error('Please verify your researcher ORCID iD with the official ORCID registry before proceeding.');
        }

        if (user?.id) {
          const currentMeta =
            typeof user.profileMetadata === 'object' && user.profileMetadata !== null
              ? user.profileMetadata
              : {};

          const orcidIdToSave = verifiedObj?.orcidId || formData.orcidId;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              profileMetadata: {
                ...currentMeta,
                ...(orcidIdToSave ? { orcidId: orcidIdToSave } : {}),
                orcidVerified: true,
                orcidVerifiedAt: new Date().toISOString(),
                ...(verifiedObj ? { orcidData: verifiedObj } : {}),
              }
            }
          }).catch(err => console.warn('[submitStageData] Failed to save ORCID to profile:', err));
        }
      }

      // Persist uploaded documents from DOCUMENT_UPLOAD stages or file inputs into UserDocVault
      if (user?.id) {
        for (const [key, val] of Object.entries(formData)) {
          if (!val || typeof val !== 'object' || key.startsWith('_')) continue;
          if (val.url && (val.name || val.url)) {
            let docType = 'OTHER';
            const keyLower = key.toLowerCase();
            const labelLower = (val.name || '').toLowerCase();
            if (keyLower.includes('student') || labelLower.includes('student')) {
              docType = 'STUDENT_ID';
            } else if (keyLower.includes('gov') || keyLower.includes('aadhar') || keyLower.includes('pan') || keyLower.includes('id')) {
              docType = 'GOVT_ID';
            } else if (keyLower.includes('endorse') || keyLower.includes('noc') || keyLower.includes('letter')) {
              docType = 'UNIVERSITY_ENDORSEMENT';
            } else if (keyLower.includes('reg') || keyLower.includes('incorporation') || keyLower.includes('org')) {
              docType = 'ORGANIZATION_REGISTRATION';
            }

            await prisma.userDocVault.create({
              data: {
                userId: user.id,
                title: val.label || val.name || key,
                documentType: docType,
                fileName: val.name || `${key}.pdf`,
                fileUrl: val.url,
                fileSizeBytes: BigInt(val.size || 0),
                mimeType: val.type || 'application/pdf',
                isVerified: false,
                metadata: {
                  fieldId: key,
                  workflowInstanceId: instanceId,
                  stageId: stageId,
                  uploadedAt: new Date().toISOString()
                }
              }
            }).catch(e => console.warn('[submitStageData] Could not save uploaded doc to vault:', e.message));
          }
        }
      }

      // --- COMPACT & STRICT STAGE DATA EXTRACTION (NO INHERITED / SYNTHETIC LEAKS) ---
      const stageSpecificData = {};
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== null && !k.startsWith('_')) {
          stageSpecificData[k] = v;
        } else if (k === '_emailVerified' || k === '_apaarVerified' || k === '_orcidVerified') {
          stageSpecificData[k] = Boolean(v);
        }
      });

      const submittedName =
        formData.fullName ||
        formData.applicantName ||
        formData.name;

      const updatedInstanceData = {
        ...(instance.instanceData || {}),
        [instance.currentStage?.name || `stage_${instance.currentStage?.executionOrder || 1}`]: stageSpecificData
      };

      const instanceUpdatePayload = {
        instanceData: updatedInstanceData
      };

      // --- FIX APPLICANT DETAILS ---
      if (user?.email) {
        instanceUpdatePayload.applicantEmail = user.email;
        if (user.id) instanceUpdatePayload.applicantId = user.id;
      } else if (submittedEmail && (!instance.applicantEmail || instance.applicantEmail.includes('onboarding@user.com'))) {
        instanceUpdatePayload.applicantEmail = submittedEmail;
      }

      if (user?.fullName || user?.name) {
        instanceUpdatePayload.applicantName = user.fullName || user.name;
      } else if (submittedName && (!instance.applicantName || instance.applicantName.includes('Onboarding User'))) {
        instanceUpdatePayload.applicantName = submittedName;
      }

      // Ensure verification record for the stage being submitted (async, non-blocking)
      if (currentStageObj || instance.currentStage) {
        this.ensureVerificationTask(instance, currentStageObj || instance.currentStage, formData).catch(() => {});
      }

      // Find next stage dynamically based on the submitted stage's position in sorted stages
      const sortedStages = [...(instance.template?.stages || [])].sort(
        (a, b) => (a.executionOrder ?? 0) - (b.executionOrder ?? 0)
      );
      const currentIdx = sortedStages.findIndex((s) => s.id === stageId);

      let nextStage = null;
      if (currentIdx !== -1 && currentIdx + 1 < sortedStages.length) {
        nextStage = sortedStages[currentIdx + 1];
      } else if (currentIdx === -1) {
        // Fallback: find first stage whose executionOrder is greater than the submitted stage
        const currentOrder = currentStageObj?.executionOrder ?? dbCurrentStage?.executionOrder ?? 0;
        nextStage = sortedStages.find((s) => (s.executionOrder ?? 0) > currentOrder) || null;
      }

      // Create submission record with ONLY what was submitted in this stage
      await prisma.stageSubmission.create({
        data: {
          workflowInstanceId: instanceId,
          workflowStageId: stageId,
          submittedById: submittedById || undefined,
          status: stageStatus,
          formData: stageSpecificData
        }
      });

      if (nextStage && nextStage.stageType !== 'COMPLETE') {
        const updated = await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            ...instanceUpdatePayload,
            currentStageId: nextStage.id,
          },
          include: {
            template: {
              include: {
                stages: {
                  orderBy: { executionOrder: 'asc' }
                }
              }
            },
            currentStage: true,
            organization: true
          }
        });

        // Parallelize stage execution log and verification task
        await Promise.all([
          prisma.stageExecution.create({
            data: {
              workflowInstanceId: instanceId,
              workflowStageId: nextStage.id,
              stageName: nextStage.name,
              stageType: nextStage.stageType,
              executionOrder: nextStage.executionOrder,
              executionStatus: 'IN_PROGRESS',
            }
          }).catch((e) => console.warn('[submitStageData] stageExecution log error:', e.message)),
          this.ensureVerificationTask(updated, nextStage, formData)
        ]);

        return updated;
      } else {
        // Final stage reached
        const manualStageTypes = [
          'MANUAL_REVIEW',
          'MANUAL_APPROVAL',
          'COMPLIANCE_REVIEW',
          'APPROVAL',
          'BACKGROUND_CHECK',
          'FRAUD_CHECK'
        ];
        const isReviewStage = (s) => {
          if (!s) return false;
          const sType = s.stageType || '';
          const sName = (s.name || '').toLowerCase();
          return (
            manualStageTypes.includes(sType) ||
            sName.includes('manual review') ||
            sName.includes('compliance review') ||
            sName.includes('admin review') ||
            sName.includes('manual approval')
          );
        };

        const requiresManualReview =
          isReviewStage(currentStageObj) ||
          isReviewStage(dbCurrentStage) ||
          (instance.template?.stages || []).some(isReviewStage);

        if (requiresManualReview) {
          // Manual review required: DO NOT mark COMPLETED or activate role yet.
          const underReview = await prisma.workflowInstance.update({
            where: { id: instanceId },
            data: {
              ...instanceUpdatePayload,
              status: 'IN_PROGRESS',
              currentStageId: currentStageObj?.id || stageId,
            },
            include: {
              template: {
                include: {
                  stages: {
                    orderBy: { executionOrder: 'asc' }
                  }
                }
              },
              currentStage: true,
              organization: true
            }
          });

          // Ensure verification task is routed to DX platform admins
          await this.ensureVerificationTask(underReview, currentStageObj || dbCurrentStage, formData);

          // Record membership as PENDING (not ACTIVE)
          const finalApplicantId = underReview.applicantId || user?.id;
          const selectedRole = underReview.instanceData?.selectedRole;
          if (finalApplicantId && selectedRole && underReview.tenantId) {
            const roleEnum = selectedRole.toUpperCase();
            await prisma.membership.upsert({
              where: {
                userId_organizationId_role: {
                  userId: finalApplicantId,
                  organizationId: underReview.tenantId,
                  role: roleEnum
                }
              },
              update: {
                role: roleEnum,
              },
              create: {
                userId: finalApplicantId,
                organizationId: underReview.tenantId,
                role: roleEnum,
                status: 'PENDING',
                joinedAt: new Date()
              }
            });
          }

          return underReview;
        }

        const completed = await prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            ...instanceUpdatePayload,
            status: 'COMPLETED',
            completedAt: new Date(),
            currentStageId: null,
          },
          include: {
            template: {
              include: {
                stages: {
                  orderBy: { executionOrder: 'asc' }
                }
              }
            },
            organization: true
          }
        });

        // --- ROLE ASSIGNMENT ON COMPLETION (NO REVIEW NEEDED) ---
        const finalApplicantId = completed.applicantId || user?.id;
        const selectedRole = completed.instanceData?.selectedRole;
        if (finalApplicantId && selectedRole && completed.tenantId) {
          const roleEnum = selectedRole.toUpperCase();

          await prisma.membership.upsert({
            where: {
              userId_organizationId_role: {
                userId: finalApplicantId,
                organizationId: completed.tenantId,
                role: roleEnum
              }
            },
            update: {
              role: roleEnum,
              status: 'ACTIVE'
            },
            create: {
              userId: finalApplicantId,
              organizationId: completed.tenantId,
              role: roleEnum,
              status: 'ACTIVE',
              joinedAt: new Date()
            }
          });
        }

        return completed;
      }
    } catch (err) {
      console.error('[PrismaGovernanceRepositoryAdapter] submitStageData error:', err);
      throw err;
    } finally {
      if (lockAcquired) {
        try {
          const currentToken = await redis.get(lockKey);
          if (currentToken === lockToken) {
            await redis.del(lockKey);
          }
        } catch (_) {}
      }
    }
  }
  async findWorkflowInstance(instanceId) {
    try {
      return await prisma.workflowInstance.findUnique({
        where: { id: instanceId },
        include: {
          template: {
            include: {
              stages: {
                orderBy: { executionOrder: 'asc' }
              }
            }
          },
          currentStage: true,
          organization: true,
          submissions: { orderBy: { createdAt: 'desc' } },
          executions: { orderBy: { startedAt: 'desc' } }
        }
      });
    } catch (err) {
      console.warn('[PrismaGovernanceRepositoryAdapter] findWorkflowInstance error:', err.message);
      return null;
    }
  }

  async goToPreviousStage(instanceId) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        template: {
          include: {
            stages: {
              orderBy: { executionOrder: 'asc' }
            }
          }
        },
        currentStage: true,
        organization: true
      }
    });

    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    if (instance.status === 'COMPLETED') {
      throw new Error('Completed workflows cannot be stepped back.');
    }

    const stages = [...(instance.template?.stages || [])].sort(
      (a, b) => (a.executionOrder ?? 0) - (b.executionOrder ?? 0)
    );

    if (stages.length === 0) {
      return instance;
    }

    const currentIdx = instance.currentStageId
      ? stages.findIndex((s) => s.id === instance.currentStageId)
      : stages.length - 1;

    if (currentIdx <= 0) {
      return instance;
    }

    const prevStage = stages[currentIdx - 1];

    const updated = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        currentStageId: prevStage.id,
        status: 'IN_PROGRESS'
      },
      include: {
        template: {
          include: {
            stages: {
              orderBy: { executionOrder: 'asc' }
            }
          }
        },
        currentStage: true,
        organization: true
      }
    });

    return updated;
  }
}

module.exports = new PrismaGovernanceRepositoryAdapter();
module.exports.PrismaGovernanceRepositoryAdapter = PrismaGovernanceRepositoryAdapter;

