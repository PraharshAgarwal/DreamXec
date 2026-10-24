const { z } = require('zod');

const newsletterSubscribeSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
  }),
});

const sendOtpSchema = z.object({
  body: z.object({
    recipient: z.string().min(3, 'Recipient is required'),
    type: z.enum(['email', 'phone']),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    recipient: z.string().min(3, 'Recipient is required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    type: z.enum(['email', 'phone']),
  }),
});

module.exports = {
  newsletterSubscribeSchema,
  sendOtpSchema,
  verifyOtpSchema,
};
