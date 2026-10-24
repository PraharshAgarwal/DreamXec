const prisma = require('../../../config/prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * List all organization onboarding registrations
 */
exports.getOrganizations = catchAsync(async (req, res, next) => {
  const { status, orgType, search } = req.query;

  const where = {};
  if (status) {
    where.lifecycleStatus = status;
  }
  if (orgType) {
    where.orgType = orgType;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const organizations = await prisma.organization.findMany({
    where,
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      memberships: {
        where: { role: 'ORG_ADMIN' },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
      workflowTemplates: {
        include: { stages: { orderBy: { executionOrder: 'asc' } } },
      },
      workflowInstances: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    results: organizations.length,
    data: { organizations },
  });
});

/**
 * Get organization details for onboarding inspection
 */
exports.getOrganizationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      parent: true,
      children: true,
      memberships: {
        include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
      },
      workflowTemplates: {
        include: {
          stages: { orderBy: { executionOrder: 'asc' } },
        },
      },
      workflowInstances: {
        include: {
          currentStage: true,
          submissions: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
      verifications: true,
    },
  });

  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { organization },
  });
});



/**
 * Create a new organization with parent hierarchy, duplication prevention, and role-based workflows
 */
exports.createOrganization = catchAsync(async (req, res, next) => {
  const { name, slug, orgType, allowedRoles = [], parentId = null, roleWorkflows = [] } = req.body;

  if (!name || !slug || !orgType) {
    return next(new AppError('Organization name, slug, and orgType are required.', 400));
  }

  // 1. Sanitize slug for ltree (alphanumeric and underscores only)
  const sanitizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
  const trimmedName = name.trim();

  // 2. Strict Duplication Prevention: Check existing slug OR matching name
  const existingOrg = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: { equals: slug.trim(), mode: 'insensitive' } },
        { slug: { equals: sanitizedSlug, mode: 'insensitive' } },
        { name: { equals: trimmedName, mode: 'insensitive' } }
      ]
    }
  });

  if (existingOrg) {
    const conflictField = existingOrg.name.toLowerCase() === trimmedName.toLowerCase() ? 'name' : 'slug';
    return next(
      new AppError(
        `Organization with this ${conflictField} ("${conflictField === 'name' ? trimmedName : slug}") is already registered.`,
        409
      )
    );
  }

  // 3. Resolve Hierarchy, Depth, Ancestor, and HierarchyPath
  let resolvedDepth = 0;
  let resolvedAncestorId = null;
  let resolvedHierarchyPath = sanitizedSlug;

  if (parentId) {
    const parent = await prisma.organization.findUnique({
      where: { id: parentId }
    });

    if (!parent) {
      return next(new AppError('Selected parent organization does not exist.', 404));
    }

    resolvedDepth = (parent.depth || 0) + 1;
    resolvedAncestorId = parent.ancestorId || parent.id;
    const parentPath = parent.hierarchyPath || parent.slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    resolvedHierarchyPath = `${parentPath}.${sanitizedSlug}`;
  }

  // 4. Create Organization Record (No Admin Email/Name dependency)
  const organization = await prisma.organization.create({
    data: {
      name: trimmedName,
      slug: slug.trim().toLowerCase(),
      orgType: orgType.toUpperCase(),
      parentId: parentId || null,
      ancestorId: resolvedAncestorId,
      depth: resolvedDepth,
      hierarchyPath: resolvedHierarchyPath,
      allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
      lifecycleStatus: 'ACTIVE',
    },
  });

  // 5. Seed Multi-Stage Role-based Workflow Templates & Stages
  if (Array.isArray(roleWorkflows) && roleWorkflows.length > 0) {
    for (const rw of roleWorkflows) {
      if (!rw.role || !Array.isArray(rw.stages)) continue;

      const templateSlug = `${slug.trim().toLowerCase()}-${rw.role.toLowerCase().replace(/_/g, '-')}-workflow`;
      await prisma.workflowTemplate.create({
        data: {
          tenantId: organization.id,
          name: `${organization.name} ${rw.role} Verification & Governance`,
          slug: templateSlug,
          description: `Role-based onboarding workflow for ${rw.role} at ${organization.name}`,
          status: 'PUBLISHED',
          stages: {
            create: rw.stages.map((st, idx) => ({
              name: st.name || `Stage ${idx + 1}`,
              description: st.description || '',
              stageType: st.stageType || 'FORM',
              executionOrder: st.executionOrder || idx + 1,
              config: st.config || {},
            })),
          },
        },
      });
    }
  }

  res.status(201).json({
    status: 'success',
    message: 'Organization registered and configured successfully',
    data: { organization },
  });
});



   

/**
 * Update organization configuration (roles, lifecycle status, role workflows)
 */
exports.updateOrganizationConfig = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, orgType, allowedRoles, lifecycleStatus, roleWorkflows } = req.body;

  const existingOrg = await prisma.organization.findUnique({ where: { id } });
  if (!existingOrg) {
    return next(new AppError('Organization not found', 404));
  }

  const updateData = { updatedAt: new Date() };
  if (name) updateData.name = name;
  if (orgType) updateData.orgType = orgType.toUpperCase();
  if (Array.isArray(allowedRoles)) updateData.allowedRoles = allowedRoles;
  if (lifecycleStatus) updateData.lifecycleStatus = lifecycleStatus.toUpperCase();

  const updatedOrg = await prisma.organization.update({
    where: { id },
    data: updateData,
  });

  if (Array.isArray(roleWorkflows)) {
    for (const rw of roleWorkflows) {
      if (!rw.role || !Array.isArray(rw.stages)) continue;

      const templateSlug = `${existingOrg.slug}-${rw.role.toLowerCase()}-workflow`;
      let template = await prisma.workflowTemplate.findFirst({
        where: { tenantId: id, slug: templateSlug },
      });

      if (template) {
        // Validate configs first
        for (const st of rw.stages) {
          if (st.stageType === 'FORM' && st.config && st.config.fields && !Array.isArray(st.config.fields)) {
            return next(new AppError(`Validation Error: FORM stage config.fields must be an array in role ${rw.role}`, 400));
          }
        }

        const existingStages = await prisma.workflowStage.findMany({ where: { templateId: template.id } });
        
        // Upsert existing stages to avoid foreign key violations for stages that have submissions
        for (let i = 0; i < rw.stages.length; i++) {
          const st = rw.stages[i];
          const executionOrder = st.executionOrder || (i + 1);
          const existing = existingStages.find(e => e.executionOrder === executionOrder);
          
          if (existing) {
            await prisma.workflowStage.update({
              where: { id: existing.id },
              data: {
                name: st.name || `Stage ${executionOrder}`,
                description: st.description || '',
                stageType: st.stageType || 'FORM',
                config: st.config || {},
                deletedAt: null // Restore if it was soft-deleted
              }
            });
          } else {
            await prisma.workflowStage.create({
              data: {
                templateId: template.id,
                name: st.name || `Stage ${executionOrder}`,
                description: st.description || '',
                stageType: st.stageType || 'FORM',
                executionOrder: executionOrder,
                config: st.config || {}
              }
            });
          }
        }

        // Handle removed stages
        const stagesToDelete = existingStages.filter(e => !rw.stages.some(st => (st.executionOrder || 0) === e.executionOrder || (rw.stages.indexOf(st) + 1) === e.executionOrder));
        for (const st of stagesToDelete) {
          try {
            await prisma.workflowStage.delete({ where: { id: st.id } });
          } catch (err) {
            // If foreign key constraint fails, soft delete instead
            await prisma.workflowStage.update({ where: { id: st.id }, data: { deletedAt: new Date() } });
          }
        }
      } else {
        await prisma.workflowTemplate.create({
          data: {
            tenantId: id,
            name: `${existingOrg.name} ${rw.role} Verification & Governance`,
            slug: templateSlug,
            description: `Role-based workflow for ${rw.role} at ${existingOrg.name}`,
            status: 'PUBLISHED',
            stages: {
              create: rw.stages.map((st, idx) => ({
                name: st.name || `Stage ${idx + 1}`,
                description: st.description || '',
                stageType: st.stageType || 'FORM',
                executionOrder: st.executionOrder || idx + 1,
                config: st.config || {},
              })),
            },
          },
        });
      }
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Organization configuration updated successfully',
    data: { organization: updatedOrg },
  });
});

/**
 * Update organization lifecycle status (APPROVED, ACTIVE, REJECTED, SUSPENDED, UNDER_REVIEW)
 */
exports.updateOrganizationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const validStatuses = [
    'DRAFT',
    'SUBMITTED',
    'PENDING_VERIFICATION',
    'VERIFICATION_REQUESTED',
    'UNDER_REVIEW',
    'APPROVED',
    'ACTIVE',
    'SUSPENDED',
    'ARCHIVED',
    'REJECTED',
    'DELETED',
  ];

  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return next(new AppError(`Invalid lifecycle status. Allowed: ${validStatuses.join(', ')}`, 400));
  }

  const existingOrg = await prisma.organization.findUnique({ where: { id } });
  if (!existingOrg) {
    return next(new AppError('Organization not found', 404));
  }

  const updatedOrg = await prisma.organization.update({
    where: { id },
    data: {
      lifecycleStatus: status.toUpperCase(),
      updatedAt: new Date(),
    },
  });

  res.status(200).json({
    status: 'success',
    message: `Organization lifecycle status updated to ${status.toUpperCase()}`,
    data: { organization: updatedOrg, remarks },
  });
});

/**
 * Onboard a new External Organisation (asking Name, POC Name, POC Email, Description)
 */
exports.onboardExternalOrg = catchAsync(async (req, res, next) => {
  const { name, contactName, contactEmail, description } = req.body;

  if (!name || !name.trim()) {
    return next(new AppError('Organisation name is required.', 400));
  }
  if (!contactName || !contactName.trim()) {
    return next(new AppError('Point of contact name is required.', 400));
  }
  if (!contactEmail || !contactEmail.trim()) {
    return next(new AppError('Point of contact email is required.', 400));
  }

  const trimmedName = name.trim();
  const trimmedContactName = contactName.trim();
  const trimmedContactEmail = contactEmail.trim().toLowerCase();
  const trimmedDescription = (description || '').trim();

  // Generate unique URL/ltree safe slug
  const baseSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 45);
  let finalSlug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findFirst({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}_${counter++}`;
  }

  // Create organisation record with metadata
  const organization = await prisma.organization.create({
    data: {
      name: trimmedName,
      slug: finalSlug,
      orgType: 'RESEARCH_INSTITUTION',
      allowedRoles: ['EXTERNAL_ORG_MEMBER', 'ORG_ADMIN'],
      depth: 0,
      hierarchyPath: finalSlug,
      lifecycleStatus: 'ACTIVE',
      metadata: {
        isExternalOrg: true,
        externalCategory: 'LAB_FACILITY',
        contactName: trimmedContactName,
        contactEmail: trimmedContactEmail,
        description: trimmedDescription,
        onboardedAt: new Date().toISOString(),
        onboardedBy: req.user ? { id: req.user.id, name: req.user.fullName, email: req.user.email } : null,
      },
    },
  });

  // If user with contactEmail already exists, link membership
  let linkedUser = await prisma.user.findUnique({
    where: { email: trimmedContactEmail },
  });

  if (linkedUser) {
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: linkedUser.id,
        organizationId: organization.id,
      },
    });

    if (!existingMembership) {
      await prisma.membership.create({
        data: {
          userId: linkedUser.id,
          organizationId: organization.id,
          role: 'EXTERNAL_ORG_MEMBER',
          membershipStatus: 'ACTIVE',
        },
      });
    }
  }

  res.status(201).json({
    status: 'success',
    message: 'External organization onboarded successfully',
    data: {
      organization,
      linkedUser: linkedUser ? { id: linkedUser.id, email: linkedUser.email, fullName: linkedUser.fullName } : null,
    },
  });
});

/**
 * List all onboarded external organisations
 */
exports.getExternalOrganizations = catchAsync(async (req, res, next) => {
  const orgs = await prisma.organization.findMany({
    where: {
      metadata: {
        path: ['isExternalOrg'],
        equals: true,
      },
    },
    include: {
      memberships: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    results: orgs.length,
    data: { organizations: orgs },
  });
});

