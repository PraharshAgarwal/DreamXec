const { z } = require('zod');

const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Project title must be at least 3 characters'),
    description: z.string().min(10, 'Project description must be at least 10 characters'),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Project title must be at least 3 characters').optional(),
    description: z.string().min(10, 'Project description must be at least 10 characters').optional(),
    stage: z.enum(['DISCOVERY', 'FEASIBILITY', 'PROTOTYPE', 'PILOT', 'COMMERCIALIZATION']).optional(),
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
