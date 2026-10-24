/**
 * Interface/Contract for Domain Event Publishing.
 */
class EventPublisherPort {
  /**
   * Publish a domain event with associated payload.
   * @param {string} eventName - Name of the domain event (e.g. DONATION_SUCCESS)
   * @param {Object} payload - Event context and details
   * @returns {Promise<void>}
   */
  async publishEvent(eventName, payload) {
    throw new Error('Method eventPublisherPort.publishEvent() must be implemented.');
  }
}

module.exports = EventPublisherPort;
