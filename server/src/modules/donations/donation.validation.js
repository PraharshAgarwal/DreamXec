const { z } = require('zod');

// ─── Create Order ────────────────────────────────────────────────────────────
const createOrderSchema = z.object({
  body: z.object({
    amount: z
      .number({ required_error: 'Amount is required' })
      .min(10, 'Minimum donation amount is ₹10'),
    projectId: z.string().min(1, 'Project ID is required'),
    email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
    name: z.string().optional().nullable().or(z.literal('')),
    message: z.string().optional().nullable().or(z.literal('')),
    anonymous: z.boolean().optional(),
    isMonthly: z.boolean().optional(),
  }),
});

// ─── Verify Payment (Supports both provider-agnostic & legacy vendor fields) ─
const verifyPaymentSchema = z.object({
  body: z
    .object({
      // Generic provider-agnostic fields
      orderId: z.string().optional(),
      paymentId: z.string().optional(),
      signature: z.string().optional(),
      amount: z.union([z.number(), z.string()]).optional(),

      // Legacy Razorpay fields
      razorpay_order_id: z.string().optional(),
      razorpay_payment_id: z.string().optional(),
      razorpay_signature: z.string().optional(),
    })
    .refine(
      (data) =>
        (data.orderId || data.razorpay_order_id) &&
        (data.paymentId || data.razorpay_payment_id) &&
        (data.signature || data.razorpay_signature),
      {
        message: 'Order ID, Payment ID, and Signature are required',
      }
    ),
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
};
