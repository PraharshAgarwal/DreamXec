const { z } = require('zod');

// 1. Clean default registration schema (basic details only)
const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must not exceed 64 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),

    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
  }),
});

// 2. New schema for claiming a role after workflow completion
// Replace lines 30-36 in auth.validator.js with:

const claimRoleSchema = z.object({
  body: z.object({
    organizationId: z
      .string({ required_error: 'Organization ID or slug is required' })
      .min(1, 'Organization ID cannot be empty')
      .trim(),
    role: z
      .string({ required_error: 'Role is required' })
      .min(1, 'Role cannot be empty')
      .trim()
      .toUpperCase(),
    workflowInstanceId: z.string().uuid('Invalid workflow instance ID format').optional().or(z.literal('')),
  }),
});


const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must not exceed 64 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    token: z.string().optional(),
  }),
  query: z
    .object({
      token: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  registerSchema,
  claimRoleSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
