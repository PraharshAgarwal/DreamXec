const { z } = require('zod');

const referClubSchema = z.object({
  body: z.object({
    clubName: z.string().min(2, 'Club name must be at least 2 characters'),
    collegeName: z.string().min(2, 'College name must be at least 2 characters'),
    referrerName: z.string().min(2, 'Referrer name must be at least 2 characters'),
    referrerEmail: z.string().email('Invalid referrer email address'),
    presidentName: z.string().min(2, 'President name must be at least 2 characters'),
    presidentEmail: z.string().email('Invalid president email address'),
    notes: z.string().optional(),
  }),
});

module.exports = {
  referClubSchema,
};
