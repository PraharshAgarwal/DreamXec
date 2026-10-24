const { z } = require('zod');

const PHONE_REGEX = /^[0-9]{10}$/;

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().refine((val) => !val || PHONE_REGEX.test(val.trim()), {
      message: 'Phone number must be exactly 10 digits.',
    }).optional(),
    countryCode: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    college: z.string().optional(),
    institutionName: z.string().optional(),
    yearOfStudy: z.union([z.string(), z.number()]).optional(),
    skills: z.array(z.string()).optional(),
    organizationName: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitterX: z.string().optional(),
    reddit: z.string().optional(),
    portfolioUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    linkedinUrl: z.string().optional(),
    apaarId: z.string().optional(),
    orcidId: z.string().optional(),
    apaarData: z.any().optional(),
    orcidData: z.any().optional(),
  }),
});

module.exports = {
  updateProfileSchema,
};
