const { z } = require('zod');

const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
    parentId: z.string().optional(),
  }),
});

const toggleWishlistSchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, 'Campaign ID is required'),
  }),
});

module.exports = {
  createCommentSchema,
  toggleWishlistSchema,
};
