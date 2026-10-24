const { z } = require('zod');

const updateStatusSchema = z.object({
  body: z.object({
    status: z.string().min(1, 'Status is required'),
    reason: z.string().optional(),
  }),
});

const verifyProjectSchema = z.object({
  body: z.object({
    verified: z.boolean(),
  }),
});

module.exports = {
  updateStatusSchema,
  verifyProjectSchema,
};
