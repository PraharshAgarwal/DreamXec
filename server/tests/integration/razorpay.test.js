const request = require('supertest');
const crypto = require('crypto');
const createTestApp = require('../helpers/testApp');
const donationService = require('../../src/modules/donations/donation.service');

describe('Razorpay Webhook & Payment Verification Characterization Tests', () => {
  let app;
  const webhookSecret = 'test_webhook_secret_key_123';

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reject invalid create-order request missing projectId with 400 error status', async () => {
    const response = await request(app)
      .post('/api/donations/create-order')
      .send({ amount: 500 });

    expect(response.status).toBe(400);
  });

  it('should reject invalid webhook signature with 400 error status', async () => {
    const payload = { event: 'payment.captured', payload: {} };

    const response = await request(app)
      .post('/api/donations/webhook')
      .set('x-razorpay-signature', 'invalid_signature_hash')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'fail');
  });

  it('should process webhook when donation is found and return status ok', async () => {
    jest.spyOn(donationService.repository, 'processWebhookPaymentCaptured').mockImplementation(async () => ({
      donationsCount: 1,
      project: { id: 'proj_123' },
      donationRecord: { id: 'don_123' },
    }));

    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_12345',
            order_id: 'order_test_99999',
            amount: 50000,
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const response = await request(app)
      .post('/api/donations/webhook')
      .set('x-razorpay-signature', validSignature)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should return message Donation not found when donation does not exist', async () => {
    jest.spyOn(donationService.repository, 'processWebhookPaymentCaptured').mockImplementation(async () => ({
      donationsCount: 0,
      project: null,
      donationRecord: null,
    }));

    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_000',
            order_id: 'order_missing_000',
            amount: 1000,
          },
        },
      },
    };

    const rawBody = JSON.stringify(payload);
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const response = await request(app)
      .post('/api/donations/webhook')
      .set('x-razorpay-signature', validSignature)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Donation not found' });
  });
});
