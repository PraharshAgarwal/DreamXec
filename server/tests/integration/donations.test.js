const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const donationService = require('../../src/modules/donations/donation.service');

describe('Donations Module Characterization & Idempotency Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    if (donationService.eventPublisher) {
      jest.spyOn(donationService.eventPublisher, 'publishEvent').mockImplementation(async () => {});
    }
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reject unauthenticated request to /api/donations/my with 401 status', async () => {
    const response = await request(app).get('/api/donations/my');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('status', 'error');
  });

  it('should reject donation order creation without required amount with 400 status', async () => {
    const response = await request(app)
      .post('/api/donations/create-order')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
  });

  // ─── Idempotency Tests ───────────────────────────────────────────────────

  it('should handle repeat verification requests idempotently', async () => {
    jest.spyOn(donationService.paymentGateway, 'verifySignature').mockImplementation(() => true);
    jest.spyOn(donationService.repository, 'fastRecordAttemptVerification').mockImplementation(async () => ({
      id: 'attempt_idem_123',
    }));
    jest.spyOn(donationService.repository, 'processVerifiedPayment').mockImplementation(async () => ({
      id: 'donation_idem_123',
      paymentStatus: 'completed',
    }));

    const verifyPayload = {
      razorpay_order_id: 'order_idem_123',
      razorpay_payment_id: 'pay_idem_123',
      razorpay_signature: 'signature_idem_123',
    };

    // First call
    const res1 = await request(app)
      .post('/api/donations/verify')
      .send(verifyPayload);

    expect(res1.status).toBe(200);
    expect(res1.body).toMatchObject({
      success: true,
      message: 'Payment verified, settled, and recorded.',
      status: 'SUCCEEDED',
      orderId: 'order_idem_123',
    });

    // Second (duplicate) call
    const res2 = await request(app)
      .post('/api/donations/verify')
      .send(verifyPayload);

    expect(res2.status).toBe(200);
    expect(res2.body).toMatchObject({
      success: true,
      message: 'Payment verified, settled, and recorded.',
      status: 'SUCCEEDED',
      orderId: 'order_idem_123',
    });
  });

  it('should return donation settlement status via GET /api/donations/status/:orderId', async () => {
    jest.spyOn(donationService.repository, 'findDonationStatusByOrderId').mockImplementation(async (orderId) => ({
      found: true,
      orderId,
      status: 'SUCCEEDED',
      isSettled: true,
      amount: 1500,
      currency: 'INR',
      campaignTitle: 'AI Research Grant',
    }));

    const response = await request(app).get('/api/donations/status/order_test_999');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        found: true,
        orderId: 'order_test_999',
        status: 'SUCCEEDED',
        isSettled: true,
        amount: 1500,
      },
    });
  });

  it('should handle repeat webhook hits idempotently', async () => {
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_webhook_idem_123',
            order_id: 'order_webhook_idem_123',
            amount: 100000,
            notes: { projectId: 'proj_idem_123' },
            email: 'donor@example.com',
          },
        },
      },
    };

    let callCount = 0;
    jest.spyOn(donationService.repository, 'processWebhookPaymentCaptured').mockImplementation(async () => {
      callCount++;
      return {
        donationsCount: callCount === 1 ? 1 : 0,
        project: { id: 'proj_idem_123', title: 'Test Campaign', goalAmount: 5000, amountRaised: 1000 },
        donationRecord: { id: 'don_1', anonymous: false },
      };
    });

    // First hit
    const res1 = await request(app)
      .post('/api/donations/webhook')
      .send(webhookPayload);

    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({ status: 'ok' });

    // Second (duplicate) hit
    const res2 = await request(app)
      .post('/api/donations/webhook')
      .send(webhookPayload);

    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ status: 'ok' });
  });

  it('should quarantine and return error when payment verification mismatch occurs', async () => {
    jest.spyOn(donationService.paymentGateway, 'verifySignature').mockImplementation(() => true);
    jest.spyOn(donationService.repository, 'fastRecordAttemptVerification').mockImplementation(async () => ({
      id: 'attempt_mismatch_1',
    }));
    jest.spyOn(donationService.repository, 'markPaymentFailed').mockImplementation(async () => ({}));
    jest.spyOn(donationService.repository, 'processVerifiedPayment').mockImplementation(async () => {
      throw new Error('Security verification mismatch detected for order order_mismatch_123. Transaction has been quarantined for administrative review.');
    });

    const verifyPayload = {
      razorpay_order_id: 'order_mismatch_123',
      razorpay_payment_id: 'pay_tampered_999',
      razorpay_signature: 'signature_test',
    };

    const res = await request(app)
      .post('/api/donations/verify')
      .send(verifyPayload);

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('Security verification mismatch detected');
  });
});
