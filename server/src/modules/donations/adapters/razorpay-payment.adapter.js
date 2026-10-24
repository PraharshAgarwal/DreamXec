const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentGatewayPort = require('../ports/payment-gateway.port');
const {
  resolveRazorpayCredentials,
  getFoundationRazorpayCredentials,
  getAllKeySecrets,
  getAllWebhookSecrets,
} = require('../../../config/razorpay.config');

class RazorpayPaymentAdapter extends PaymentGatewayPort {
  constructor(options = {}) {
    super();
    this.options = options;
    this.keyId = options.keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id';
    this.keySecret = options.keySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    this.webhookSecret = options.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    this.clients = new Map();
    this.razorpay = this.getClient(this.keyId, this.keySecret);
  }

  /**
   * Retrieves or creates a memoized Razorpay client instance for given credentials
   */
  getClient(keyId, keySecret) {
    const cacheKey = `${keyId}:${keySecret}`;
    if (!this.clients.has(cacheKey)) {
      this.clients.set(
        cacheKey,
        new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        })
      );
    }
    return this.clients.get(cacheKey);
  }

  /**
   * Resolves effective credentials for an operation given optional request/origin context
   */
  getCredentials(context, options = {}) {
    if (this.options.keyId && this.options.keySecret) {
      return {
        keyId: this.options.keyId,
        keySecret: this.options.keySecret,
        webhookSecret: this.options.webhookSecret || this.options.keySecret,
      };
    }
    if (options?.forceFoundation || options?.forcedEntity === 'DAF' || options?.purpose === 'CAMPAIGN_DONATION') {
      return typeof getFoundationRazorpayCredentials === 'function'
        ? getFoundationRazorpayCredentials()
        : resolveRazorpayCredentials('dreamxec.org', options);
    }
    return resolveRazorpayCredentials(context, options);
  }

  /**
   * Creates an order with Razorpay (with resilient multi-domain credential routing)
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {}, origin, req, forcedEntity, purpose }) {
    const creds = this.getCredentials(req || origin, { forcedEntity, purpose });
    const client = this.getClient(creds.keyId, creds.keySecret);

    const hasRealCredentials =
      creds.keyId &&
      creds.keySecret &&
      (creds.keyId.startsWith('rzp_test_') || creds.keyId.startsWith('rzp_live_')) &&
      !creds.keyId.includes('dummy') &&
      !creds.keySecret.includes('dummy') &&
      creds.keySecret !== 'dummy_key_secret';

    const isTestRunner = process.env.NODE_ENV === 'test';

    // When valid API keys are configured, create a genuine order on Razorpay API
    if (hasRealCredentials && !isTestRunner && process.env.RAZORPAY_SIMULATION !== 'force_mock') {
      try {
        const order = await client.orders.create({
          amount,
          currency,
          receipt,
          notes,
        });

        return {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          key: creds.keyId,
        };
      } catch (err) {
        console.error('[RazorpayPaymentAdapter] Gateway order creation failed:', err.message);

        // If primary key failed (e.g. 401 authentication failed / expired key), attempt secondary active key
        if (process.env.RAZORPAY_KEY_ID_2 && process.env.RAZORPAY_KEY_SECRET_2 && creds.keyId !== process.env.RAZORPAY_KEY_ID_2) {
          try {
            console.log('[RazorpayPaymentAdapter] Retrying order creation with secondary active credentials...');
            const fallbackClient = this.getClient(process.env.RAZORPAY_KEY_ID_2, process.env.RAZORPAY_KEY_SECRET_2);
            const fbOrder = await fallbackClient.orders.create({
              amount,
              currency,
              receipt,
              notes,
            });

            return {
              id: fbOrder.id,
              amount: fbOrder.amount,
              currency: fbOrder.currency,
              receipt: fbOrder.receipt,
              key: process.env.RAZORPAY_KEY_ID_2,
            };
          } catch (fbErr) {
            console.error('[RazorpayPaymentAdapter] Secondary key order creation failed:', fbErr.message);
          }
        }

        if (process.env.NODE_ENV === 'production' && process.env.RAZORPAY_SIMULATION !== 'true') {
          throw new Error(`Razorpay order creation failed: ${err.message}`);
        }
      }
    }

    // Test Mode Simulation Order
    const simulatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: simulatedOrderId,
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      key: creds.keyId || 'rzp_test_dreamxec_dummy',
    };
  }

  /**
   * Verifies Razorpay HMAC SHA256 payment signature with multi-domain fallback
   */
  verifySignature({ orderId, paymentId, signature, origin, req }) {
    if (!orderId || !paymentId) {
      return false;
    }

    const creds = this.getCredentials(req || origin);

    // 1. Allow test mode simulation orders or signatures to verify when in test mode or test keys are present
    const isDevOrTest = process.env.NODE_ENV !== 'production';
    const isSimulationEnv =
      (process.env.RAZORPAY_SIMULATION || '').trim().toLowerCase() === 'true' ||
      (process.env.RAZORPAYX_SIMULATION || '').trim().toLowerCase() === 'true';
    const isTestKey =
      !creds.keySecret ||
      creds.keySecret === 'dummy_key_secret' ||
      creds.keySecret.includes('dummy') ||
      (creds.keyId && creds.keyId.startsWith('rzp_test_'));
    const isSandboxSimulation =
      (isDevOrTest || isSimulationEnv || isTestKey) &&
      (orderId.startsWith('order_sim_') ||
        orderId.startsWith('order_sandbox_') ||
        paymentId.startsWith('pay_sim_') ||
        paymentId.startsWith('pay_sandbox_') ||
        (signature && (
          signature.startsWith('sig_sim_') ||
          signature.startsWith('sig_dx_sim_') ||
          signature === 'dummy_signature'
        )));

    if (isSandboxSimulation) {
      return true;
    }

    if (!signature) return false;

    // 2. Production HMAC SHA256 verification (check primary secret for domain, fallback to all configured secrets)
    try {
      const body = `${orderId}|${paymentId}`;
      const secretsToTest = Array.from(new Set([creds.keySecret, ...getAllKeySecrets()].filter(Boolean)));

      for (const secret of secretsToTest) {
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');

        if (expectedSignature === signature) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Parses vendor-specific Razorpay webhook payload into normalized domain event,
   * testing against all configured multi-domain webhook secrets.
   */
  async parseWebhookEvent({ headers, body, rawBody, origin, req }) {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const signature = headers ? headers['x-razorpay-signature'] : null;
    const { InvalidPaymentSignatureError } = require('../donation.errors');

    // In production, signature header is strictly required
    if (process.env.NODE_ENV === 'production' && !signature) {
      throw new InvalidPaymentSignatureError('Missing x-razorpay-signature header on webhook');
    }

    if (signature) {
      const payloadToVerify = rawBody || (typeof body === 'string' ? body : JSON.stringify(body));
      const creds = this.getCredentials(req || origin);
      const candidateSecrets = Array.from(
        new Set([creds.webhookSecret, ...getAllWebhookSecrets()].filter(Boolean))
      );

      let verified = false;
      for (const candidateSecret of candidateSecrets) {
        const expected = crypto
          .createHmac('sha256', candidateSecret)
          .update(payloadToVerify)
          .digest('hex');

        if (signature === expected) {
          verified = true;
          break;
        }
      }

      if (!verified) {
        throw new InvalidPaymentSignatureError('Invalid webhook signature');
      }
    }

    const rawEvent = body;
    const eventName = rawEvent.event;

    if (eventName === 'payment.captured' && rawEvent.payload?.payment?.entity) {
      const payment = rawEvent.payload.payment.entity;

      return {
        eventType: 'PAYMENT_CAPTURED',
        orderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount ? payment.amount / 100 : 0, // Convert paise to INR units
        projectId: payment.notes?.projectId,
        donorEmail: payment.email || null,
        rawEvent,
      };
    }

    if (eventName === 'payment.failed' && rawEvent.payload?.payment?.entity) {
      const payment = rawEvent.payload.payment.entity;

      return {
        eventType: 'PAYMENT_FAILED',
        orderId: payment.order_id,
        paymentId: payment.id,
        errorMessage: payment.error_description || payment.error_reason || 'Payment failed at gateway',
        rawEvent,
      };
    }

    return {
      eventType: eventName || 'UNKNOWN',
      rawEvent,
    };
  }
}

module.exports = RazorpayPaymentAdapter;
