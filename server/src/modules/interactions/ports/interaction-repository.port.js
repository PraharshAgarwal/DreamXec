/**
 * Abstract Port defining database persistence contract for Interactions (Comments & Wishlist).
 * @abstract
 */
class InteractionRepositoryPort {
  async createComment({ campaignId, content, parentId, userId }) {
    throw new Error('Method InteractionRepositoryPort.createComment() must be implemented.');
  }

  async findCommentsByCampaignId(campaignId) {
    throw new Error('Method InteractionRepositoryPort.findCommentsByCampaignId() must be implemented.');
  }

  async findCommentById(commentId) {
    throw new Error('Method InteractionRepositoryPort.findCommentById() must be implemented.');
  }

  async softDeleteComment(commentId) {
    throw new Error('Method InteractionRepositoryPort.softDeleteComment() must be implemented.');
  }

  async reportComment(commentId) {
    throw new Error('Method InteractionRepositoryPort.reportComment() must be implemented.');
  }

  async findWishlistItem({ donorId, campaignId }) {
    throw new Error('Method InteractionRepositoryPort.findWishlistItem() must be implemented.');
  }

  async addWishlist({ donorId, campaignId }) {
    throw new Error('Method InteractionRepositoryPort.addWishlist() must be implemented.');
  }

  async removeWishlist(wishlistId) {
    throw new Error('Method InteractionRepositoryPort.removeWishlist() must be implemented.');
  }

  async findDonorWishlist(donorId) {
    throw new Error('Method InteractionRepositoryPort.findDonorWishlist() must be implemented.');
  }
}

module.exports = InteractionRepositoryPort;
