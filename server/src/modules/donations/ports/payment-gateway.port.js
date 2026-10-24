/**
 * @typedef {Object} CreateOrderInput
 * @property {number} amount - Amount in smallest currency unit (e.g. paise for INR)
 * @property {string} currency - Currency code (e.g. 'INR')
 * @property {string} receipt - Unique receipt reference string
 * @property {Object} [notes] - Optional key-value metadata pairs
 */

/**
 * @typedef {Object} PaymentOrderResponse
 * @property {string} id - Gateway generated order ID
 * @property {number} amount - Order amount in smallest currency unit
 * @property {string} currency - Currency code
 * @property {string} receipt - Receipt reference string
 * @property {string} [key] - Gateway public client key
 */

/**
 * @typedef {Object} NormalizedWebhookEvent
 * @property {string} eventType - Standardized event type (e.g. 'PAYMENT_CAPTURED')
 * @property {string} orderId - Payment order ID
 * @property {string} paymentId - Payment ID
 * @property {number} amount - Amount in base currency unit (e.g. INR rupees)
 * @property {string} [projectId] - Associated project ID
 * @property {string} [donorEmail] - Email address of donor if available
 */

/**
 * Provider-Agnostic Interface/Contract for Payment Gateway integrations.
 * Allows seamless switching between Razorpay, Stripe, PayPal, LemonSqueezy, etc.
 */
class PaymentGatewayPort {
  /**
   * Create an order with the payment provider.
   * @param {CreateOrderInput} options
   * @returns {Promise<PaymentOrderResponse>}
   */
  async createOrder(options) {
    throw new Error('Method paymentGatewayPort.createOrder() must be implemented.');
  }

  /**
   * Verify digital signature returned after payment execution.
   * @param {Object} params
   * @param {string} params.orderId - Payment gateway order ID
   * @param {string} params.paymentId - Payment gateway payment ID
   * @param {string} params.signature - HMAC/digital signature to verify
   * @returns {boolean}
   */
  verifySignature({ orderId, paymentId, signature }) {
    throw new Error('Method paymentGatewayPort.verifySignature() must be implemented.');
  }

  /**
   * Validate webhook signature and normalize vendor-specific webhook payload.
   * @param {Object} params
   * @param {Object} params.headers - HTTP request headers
   * @param {Object|Buffer} params.body - Raw/parsed webhook body
   * @returns {Promise<NormalizedWebhookEvent|null>}
   */
  async parseWebhookEvent({ headers, body }) {
    throw new Error('Method paymentGatewayPort.parseWebhookEvent() must be implemented.');
  }
}

module.exports = PaymentGatewayPort;
