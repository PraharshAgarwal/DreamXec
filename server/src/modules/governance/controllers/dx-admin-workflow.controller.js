const prisma = require('../../../config/prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * List all workflow templates across organizations
 */
exports.getWorkflowTemplates = catchAsync(async (req, res, next) => {
  const { tenantId, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const where = {};
  if (tenantId) {
    where.tenantId = tenantId;
  }
  if (status) {
    where.status = status.toUpperCase();
  }

  const [templates, total] = await Promise.all([
    prisma.workflowTemplate.findMany({
      where,
      skip,
      take: limit,
      include: {
        organization: { select: { id: true, name: true, slug: true, orgType: true } },
        stages: { orderBy: { executionOrder: 'asc' } },
        _count: { select: { instances: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workflowTemplate.count({ where }),
  ]);

  res.status(200).json({
    status: 'success',
    results: templates.length,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: { templates },
  });
});

/**
 * Create a new dynamic workflow template
 */
exports.createWorkflowTemplate = catchAsync(async (req, res, next) => {
  const { tenantId, name, slug, description, version, status, stages } = req.body;

  if (!tenantId || !name || !slug) {
    return next(new AppError('tenantId, name, and slug are required fields', 400));
  }

  const org = await prisma.organization.findUnique({ where: { id: tenantId } });
  if (!org) {
    return next(new AppError('Target organization not found', 404));
  }

  const template = await prisma.workflowTemplate.create({
    data: {
      tenantId,
      name,
      slug,
      description: description || '',
      version: version || 1,
      status: status ? status.toUpperCase() : 'DRAFT',
      stages: stages && stages.length > 0 ? {
        create: stages.map((stage, idx) => ({
          name: stage.name,
          description: stage.description || '',
          stageType: stage.stageType || 'FORM',
          executionOrder: stage.executionOrder || idx + 1,
          config: stage.config || {},
        })),
      } : undefined,
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      stages: { orderBy: { executionOrder: 'asc' } },
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Workflow template created successfully',
    data: { template },
  });
});

/**
 * Update workflow template details
 */
exports.updateWorkflowTemplate = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, status, version } = req.body;

  const existing = await prisma.workflowTemplate.findUnique({ where: { id } });
  if (!existing) {
    return next(new AppError('Workflow template not found', 404));
  }

  const updated = await prisma.workflowTemplate.update({
    where: { id },
    data: {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      status: status ? status.toUpperCase() : existing.status,
      version: version || existing.version,
      updatedAt: new Date(),
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      stages: { orderBy: { executionOrder: 'asc' } },
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Workflow template updated',
    data: { template: updated },
  });
});

/**
 * Add or update stage in a workflow template
 */
exports.addWorkflowStage = catchAsync(async (req, res, next) => {
  const { id } = req.params; // templateId
  const { name, description, stageType, executionOrder, config } = req.body;

  if (!name || !stageType) {
    return next(new AppError('Stage name and stageType are required', 400));
  }

  const template = await prisma.workflowTemplate.findUnique({
    where: { id },
    include: { stages: true },
  });
  if (!template) {
    return next(new AppError('Workflow template not found', 404));
  }

  const order = executionOrder || template.stages.length + 1;

  // Validate basic FORM config structure
  if (stageType.toUpperCase() === 'FORM' && config && config.fields && !Array.isArray(config.fields)) {
    return next(new AppError('FORM stage config.fields must be an array', 400));
  }

  const stage = await prisma.workflowStage.create({
    data: {
      templateId: id,
      name,
      description: description || '',
      stageType: stageType.toUpperCase(),
      executionOrder: order,
      config: config || {},
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Stage added to workflow template',
    data: { stage },
  });
});

/**
 * Update an existing stage in a workflow template
 */
exports.updateWorkflowStage = catchAsync(async (req, res, next) => {
  const { stageId } = req.params;
  const { name, description, stageType, executionOrder, config } = req.body;

  const existing = await prisma.workflowStage.findUnique({ where: { id: stageId } });
  if (!existing) {
    return next(new AppError('Workflow stage not found', 404));
  }

  // Validate basic FORM config structure if it's being updated to FORM
  const type = stageType ? stageType.toUpperCase() : existing.stageType;
  if (type === 'FORM' && config && config.fields && !Array.isArray(config.fields)) {
    return next(new AppError('FORM stage config.fields must be an array', 400));
  }

  const stage = await prisma.workflowStage.update({
    where: { id: stageId },
    data: {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      stageType: type,
      executionOrder: executionOrder || existing.executionOrder,
      config: config || existing.config,
      updatedAt: new Date(),
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Workflow stage updated successfully',
    data: { stage },
  });
});

/**
 * Delete a stage from workflow template
 */
exports.deleteWorkflowStage = catchAsync(async (req, res, next) => {
  const { stageId } = req.params;

  const existing = await prisma.workflowStage.findUnique({ where: { id: stageId } });
  if (!existing) {
    return next(new AppError('Workflow stage not found', 404));
  }

  await prisma.workflowStage.delete({ where: { id: stageId } });

  res.status(200).json({
    status: 'success',
    message: 'Workflow stage deleted successfully',
  });
});
