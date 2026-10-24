const crypto = require('crypto');
const RazorpayPaymentAdapter = require('../src/modules/donations/adapters/razorpay-payment.adapter');
const {
  resolveRazorpayCredentials,
  getAllKeySecrets,
  getAllWebhookSecrets,
} = require('../src/config/razorpay.config');

describe('Multi-Domain Razorpay Gateway Routing Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DOMAIN_1 = 'dreamxec.com';
    process.env.RAZORPAY_KEY_ID_1 = 'rzp_live_domain1_key';
    process.env.RAZORPAY_KEY_SECRET_1 = 'secret_domain1';
    process.env.RAZORPAY_WEBHOOK_SECRET_1 = 'webhook_sec_1';

    process.env.DOMAIN_2 = 'partnerportal.org';
    process.env.RAZORPAY_KEY_ID_2 = 'rzp_live_domain2_key';
    process.env.RAZORPAY_KEY_SECRET_2 = 'secret_domain2';
    process.env.RAZORPAY_WEBHOOK_SECRET_2 = 'webhook_sec_2';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('resolveRazorpayCredentials', () => {
    it('should resolve Domain 1 credentials for primary domain requests', () => {
      const creds = resolveRazorpayCredentials({
        headers: { origin: 'https://dreamxec.com' },
      });
      expect(creds.keyId).toBe('rzp_live_domain1_key');
      expect(creds.keySecret).toBe('secret_domain1');
      expect(creds.webhookSecret).toBe('webhook_sec_1');
    });

    it('should resolve Domain 2 credentials for secondary domain requests', () => {
      const creds = resolveRazorpayCredentials({
        headers: { origin: 'https://partnerportal.org' },
      });
      expect(creds.keyId).toBe('rzp_live_domain2_key');
      expect(creds.keySecret).toBe('secret_domain2');
      expect(creds.webhookSecret).toBe('webhook_sec_2');
    });

    it('should resolve Domain 2 credentials for subdomains of Domain 2', () => {
      const creds = resolveRazorpayCredentials({
        headers: { origin: 'https://app.partnerportal.org:3000' },
      });
      expect(creds.keyId).toBe('rzp_live_domain2_key');
    });

    it('should fallback to Domain 1 / default credentials if no origin is provided', () => {
      const creds = resolveRazorpayCredentials(null);
      expect(creds.keyId).toBe('rzp_live_domain1_key');
    });

    it('should support x-client-domain custom header', () => {
      const creds = resolveRazorpayCredentials({
        headers: { 'x-client-domain': 'partnerportal.org' },
      });
      expect(creds.keyId).toBe('rzp_live_domain2_key');
    });
  });

  describe('RazorpayPaymentAdapter order creation per domain', () => {
    it('should return Domain 1 public key when creating order from Domain 1', async () => {
      const adapter = new RazorpayPaymentAdapter();
      const order = await adapter.createOrder({
        amount: 50000,
        currency: 'INR',
        origin: 'https://dreamxec.com',
      });

      expect(order.key).toBe('rzp_live_domain1_key');
      expect(order.amount).toBe(50000);
    });

    it('should return Domain 2 public key when creating order from Domain 2', async () => {
      const adapter = new RazorpayPaymentAdapter();
      const order = await adapter.createOrder({
        amount: 50000,
        currency: 'INR',
        origin: 'https://partnerportal.org',
      });

      expect(order.key).toBe('rzp_live_domain2_key');
      expect(order.amount).toBe(50000);
    });

    it('should strictly return Account 2 (Domain 2) key when forcedEntity: DAF is passed, even from Domain 1 origin', async () => {
      const adapter = new RazorpayPaymentAdapter();
      const order = await adapter.createOrder({
        amount: 50000,
        currency: 'INR',
        origin: 'https://dreamxec.com',
        forcedEntity: 'DAF',
        purpose: 'CAMPAIGN_DONATION',
      });

      expect(order.key).toBe('rzp_live_domain2_key');
      expect(order.amount).toBe(50000);
    });
  });

  describe('RazorpayPaymentAdapter signature verification across domains', () => {
    it('should verify signature created with Domain 1 secret', () => {
      const adapter = new RazorpayPaymentAdapter();
      const orderId = 'order_dom1_123';
      const paymentId = 'pay_dom1_456';
      const signature = crypto
        .createHmac('sha256', 'secret_domain1')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = adapter.verifySignature({
        orderId,
        paymentId,
        signature,
        origin: 'https://dreamxec.com',
      });

      expect(isValid).toBe(true);
    });

    it('should verify signature created with Domain 2 secret', () => {
      const adapter = new RazorpayPaymentAdapter();
      const orderId = 'order_dom2_123';
      const paymentId = 'pay_dom2_456';
      const signature = crypto
        .createHmac('sha256', 'secret_domain2')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = adapter.verifySignature({
        orderId,
        paymentId,
        signature,
        origin: 'https://partnerportal.org',
      });

      expect(isValid).toBe(true);
    });

    it('should verify signature with fallback when origin is omitted in verification call', () => {
      const adapter = new RazorpayPaymentAdapter();
      const orderId = 'order_fallback_123';
      const paymentId = 'pay_fallback_456';
      const signature = crypto
        .createHmac('sha256', 'secret_domain2')
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // No origin provided, tests against all configured keys
      const isValid = adapter.verifySignature({
        orderId,
        paymentId,
        signature,
      });

      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', () => {
      const adapter = new RazorpayPaymentAdapter();
      const isValid = adapter.verifySignature({
        orderId: 'order_fake',
        paymentId: 'pay_fake',
        signature: 'invalid_sha256_hex_digest',
      });

      expect(isValid).toBe(false);
    });
  });

  describe('RazorpayPaymentAdapter webhook verification across domains', () => {
    it('should parse webhook signed with Domain 1 webhook secret', async () => {
      const adapter = new RazorpayPaymentAdapter();
      const body = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_123',
              order_id: 'order_123',
              amount: 100000,
            },
          },
        },
      };
      const rawBody = JSON.stringify(body);
      const signature = crypto
        .createHmac('sha256', 'webhook_sec_1')
        .update(rawBody)
        .digest('hex');

      const event = await adapter.parseWebhookEvent({
        headers: { 'x-razorpay-signature': signature },
        body,
        rawBody,
      });

      expect(event).not.toBeNull();
      expect(event.eventType).toBe('PAYMENT_CAPTURED');
      expect(event.paymentId).toBe('pay_123');
      expect(event.amount).toBe(1000);
    });

    it('should parse webhook signed with Domain 2 webhook secret', async () => {
      const adapter = new RazorpayPaymentAdapter();
      const body = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_999',
              order_id: 'order_999',
              amount: 250000,
            },
          },
        },
      };
      const rawBody = JSON.stringify(body);
      const signature = crypto
        .createHmac('sha256', 'webhook_sec_2')
        .update(rawBody)
        .digest('hex');

      const event = await adapter.parseWebhookEvent({
        headers: { 'x-razorpay-signature': signature },
        body,
        rawBody,
      });

      expect(event).not.toBeNull();
      expect(event.eventType).toBe('PAYMENT_CAPTURED');
      expect(event.paymentId).toBe('pay_999');
      expect(event.amount).toBe(2500);
    });
  });

  describe('resolveRazorpayXPayoutCredentials', () => {
    const { resolveRazorpayXPayoutCredentials } = require('../src/config/razorpay.config');

    beforeEach(() => {
      process.env.RAZORPAYX_ACCOUNT_NUMBER_1 = 'acc_ficpl_123';
      process.env.RAZORPAYX_KEY_ID_1 = 'rzpx_key_1';
      process.env.RAZORPAYX_KEY_SECRET_1 = 'rzpx_sec_1';

      process.env.RAZORPAYX_ACCOUNT_NUMBER_2 = 'acc_daf_456';
      process.env.RAZORPAYX_KEY_ID_2 = 'rzpx_key_2';
      process.env.RAZORPAYX_KEY_SECRET_2 = 'rzpx_sec_2';
    });

    it('should resolve FICPL payout account for Domain 1 requests', () => {
      const creds = resolveRazorpayXPayoutCredentials({
        headers: { origin: 'https://dreamxec.com' },
      });
      expect(creds.entity).toBe('FICPL');
      expect(creds.accountNumber).toBe('acc_ficpl_123');
      expect(creds.keyId).toBe('rzpx_key_1');
    });

    it('should resolve DAF payout account for Domain 2 requests', () => {
      const creds = resolveRazorpayXPayoutCredentials({
        headers: { origin: 'https://partnerportal.org' },
      });
      expect(creds.entity).toBe('DAF');
      expect(creds.accountNumber).toBe('acc_daf_456');
      expect(creds.keyId).toBe('rzpx_key_2');
    });
  });
});
