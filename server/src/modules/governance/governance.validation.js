const { z } = require('zod');

const submitApplicationSchema = z.object({
  body: z.object({
    projectTitle: z.string().min(3, 'Project title must be at least 3 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  }),
});

const onboardMentorSchema = z.object({
  body: z.object({
    bio: z.string().min(10, 'Bio must be at least 10 characters').optional(),
  }),
});

const createStudentVerificationOrderSchema = z.object({
  body: z.object({
    studentEmail: z.string().email('Valid student email required'),
    officialEmail: z.string().email('Valid official email required'),
    mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  }),
});

module.exports = {
  submitApplicationSchema,
  onboardMentorSchema,
  createStudentVerificationOrderSchema,
};
