import apiRequest from './api';

export interface WishlistResponse {
  message?: string;
  isWishlisted: boolean;
}

export const wishlistService = {
  /**
   * Toggles bookmark / wishlist status for a campaign
   */
  async toggleWishlist(campaignId: string): Promise<WishlistResponse> {
    const res = await apiRequest<WishlistResponse>(
      '/wishlist/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ campaignId }),
      }
    );
    const data = res.data;
    return {
      message: data?.message || res.message || 'Updated wishlist',
      isWishlisted: Boolean(data?.isWishlisted),
    };
  },

  /**
   * Checks if a campaign is bookmarked by the current user
   */
  async checkWishlistStatus(campaignId: string): Promise<boolean> {
    try {
      const res = await apiRequest<{ isWishlisted: boolean }>(
        `/wishlist/check/${campaignId}`
      );
      return Boolean(res.data?.isWishlisted);
    } catch {
      return false;
    }
  },

  /**
   * Gets list of bookmarked campaigns
   */
  async getMyWishlist(): Promise<any[]> {
    try {
      const res = await apiRequest<any[]>('/wishlist/my');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};
