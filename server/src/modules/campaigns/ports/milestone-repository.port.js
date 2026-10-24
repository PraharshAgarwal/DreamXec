/**
 * Port (Interface) for Milestone, Proof Submission & Change History operations.
 * Adheres to Interface Segregation Principle (ISP) & DIP.
 */
class MilestoneRepositoryPort {
  /**
   * Finds all milestones for a campaign with active revisions and submissions.
   * @param {string} campaignId 
   * @returns {Promise<Array<Object>>}
   */
  async findMilestonesByCampaignId(campaignId) {
    throw new Error('Method findMilestonesByCampaignId() must be implemented.');
  }

  /**
   * Finds a specific milestone by its ID.
   * @param {string} milestoneId 
   * @returns {Promise<Object|null>}
   */
  async findMilestoneById(milestoneId) {
    throw new Error('Method findMilestoneById() must be implemented.');
  }

  /**
   * Atomically edits a milestone and creates an immutable change history snapshot.
   * @param {string} milestoneId 
   * @param {Object} updateData 
   * @param {Object} revisionSnapshot 
   * @returns {Promise<{ updatedMilestone: Object, revision: Object }>}
   */
  async editMilestoneWithRevision(milestoneId, updateData, revisionSnapshot) {
    throw new Error('Method editMilestoneWithRevision() must be implemented.');
  }

  /**
   * Fetches the complete immutable revision history for a milestone.
   * @param {string} milestoneId 
   * @returns {Promise<Array<Object>>}
   */
  async getMilestoneRevisions(milestoneId) {
    throw new Error('Method getMilestoneRevisions() must be implemented.');
  }

  /**
   * Creates an end-of-milestone evidence document verification submission.
   * @param {string} milestoneId 
   * @param {Object} submissionData 
   * @returns {Promise<Object>}
   */
  async createMilestoneSubmission(milestoneId, submissionData) {
    throw new Error('Method createMilestoneSubmission() must be implemented.');
  }

  /**
   * Reviews (approves or rejects) an end-of-milestone proof submission.
   * @param {string} submissionId 
   * @param {Object} reviewData 
   * @returns {Promise<Object>}
   */
  async reviewMilestoneSubmission(submissionId, { reviewedByUserId, status, rejectionReason }) {
    throw new Error('Method reviewMilestoneSubmission() must be implemented.');
  }
}

module.exports = MilestoneRepositoryPort;
