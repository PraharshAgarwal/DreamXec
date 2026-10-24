const axios = require('axios');
const crypto = require('crypto');
const { resolveRazorpayXPayoutCredentials } = require('../../../config/razorpay.config');

class RazorpayPayoutAdapter {
  constructor(options = {}) {
    this.options = options;
    this.keyId = options.keyId || process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID;
    this.keySecret = options.keySecret || process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = options.webhookSecret || process.env.RAZORPAYX_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
    this.accountNumber = options.accountNumber || process.env.RAZORPAYX_ACCOUNT_NUMBER || null;
    this.baseUrl = options.baseUrl || 'https://api.razorpay.com/v1';
    this.defaultPayoutMode = options.defaultPayoutMode || process.env.RAZORPAYX_PAYOUT_MODE || 'IMPS';

    this.hasExplicitOptions = Boolean(options.keyId || options.accountNumber);

    // Force simulation if explicitly configured or credentials are dummy/missing
    const simEnv = (process.env.RAZORPAYX_SIMULATION || process.env.RAZORPAY_SIMULATION || '').trim().toLowerCase();
    this.isSimulation =
      typeof options.isSimulation === 'boolean'
        ? options.isSimulation
        : simEnv === 'true' ||
          !this.keyId ||
          !this.keySecret ||
          this.keyId.includes('dummy') ||
          this.keySecret.includes('dummy');

    // Only apply the sandbox fallback account number in explicit simulation mode
    if (this.isSimulation && !this.accountNumber) {
      this.accountNumber = '2323230041324123';
    }
  }

  getCredentials(reqOrOrigin) {
    if (this.hasExplicitOptions) {
      return {
        keyId: this.keyId,
        keySecret: this.keySecret,
        accountNumber: this.accountNumber,
        webhookSecret: this.webhookSecret,
      };
    }
    return resolveRazorpayXPayoutCredentials(reqOrOrigin);
  }

  getAuthHeader(reqOrOrigin) {
    const creds = this.getCredentials(reqOrOrigin);
    const keyId = creds.keyId || this.keyId;
    const keySecret = creds.keySecret || this.keySecret;
    const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Helper to verify RazorpayX API connectivity and key validity
   */
  async validateCredentials() {
    if (this.isSimulation) {
      return {
        valid: true,
        mode: 'simulation',
        keyId: this.keyId ? `${this.keyId.substring(0, 8)}...` : 'none',
        accountNumber: this.accountNumber,
        note: 'Adapter running in simulation mode',
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/contacts?count=1`, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
        timeout: 10000,
      });

      return {
        valid: true,
        mode: 'live',
        keyId: `${this.keyId.substring(0, 10)}...`,
        accountNumber: this.accountNumber,
        status: response.status,
      };
    } catch (err) {
      const errData = err.response?.data?.error;
      const description = errData?.description || errData?.message || err.message;

      return {
        valid: false,
        mode: 'live',
        keyId: this.keyId ? `${this.keyId.substring(0, 10)}...` : 'none',
        accountNumber: this.accountNumber,
        error: description,
        statusCode: err.response?.status || 500,
      };
    }
  }

  /**
   * 1. Create or retrieve Contact in RazorpayX
   * Razorpay default allowed contact types: 'customer', 'vendor', 'employee', 'self'.
   */
  async createContact({ name, email, contact = '9999999999', type = 'customer', referenceId = null }) {
    if (this.isSimulation) {
      return {
        id: `cont_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        contact,
        type,
        reference_id: referenceId,
        active: true,
      };
    }

    // Default to 'customer' if 'student' or invalid type passed, to adhere to standard Razorpay classifications
    const normalizedType = ['customer', 'vendor', 'employee', 'self'].includes(type) ? type : 'customer';

    try {
      const response = await axios.post(
        `${this.baseUrl}/contacts`,
        {
          name,
          email: email || undefined,
          contact: contact || undefined,
          type: normalizedType,
          reference_id: referenceId ? String(referenceId) : undefined,
        },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return response.data;
    } catch (err) {
      const errData = err.response?.data?.error;
      const errorMsg = errData?.description || errData?.message || err.message;
      console.warn(`[RazorpayPayoutAdapter] Contact creation error on gateway: ${errorMsg}`, err.response?.data || err.message);

      // If contact already exists for this reference_id, attempt to look it up
      if (referenceId) {
        try {
          const lookupRes = await axios.get(
            `${this.baseUrl}/contacts?reference_id=${encodeURIComponent(String(referenceId))}`,
            {
              headers: { Authorization: this.getAuthHeader() },
              timeout: 10000,
            }
          );
          if (lookupRes.data?.items?.length > 0) {
            return lookupRes.data.items[0];
          }
        } catch (lookupErr) {
          console.warn('[RazorpayPayoutAdapter] Contact lookup by reference_id failed:', lookupErr.message);
        }
      }

      throw new Error(`RazorpayX Contact Creation Failed: ${errorMsg}`);
    }
  }

  /**
   * 2. Create Fund Account (Bank Account or VPA/UPI) linked to Contact
   */
  async createFundAccount({ contactId, accountType = 'bank_account', bankAccount = null, vpa = null }) {
    if (this.isSimulation || contactId.startsWith('cont_sim_')) {
      return {
        id: `fa_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        contact_id: contactId,
        account_type: accountType,
        active: true,
        bank_account: bankAccount,
        vpa,
      };
    }

    try {
      const payload = {
        contact_id: contactId,
        account_type: accountType,
      };

      if (accountType === 'bank_account' && bankAccount) {
        payload.bank_account = {
          name: bankAccount.name,
          ifsc: bankAccount.ifsc ? bankAccount.ifsc.trim().toUpperCase() : '',
          account_number: bankAccount.accountNumber ? String(bankAccount.accountNumber).trim() : '',
        };
      } else if (accountType === 'vpa' && vpa) {
        payload.vpa = {
          address: typeof vpa === 'string' ? vpa.trim() : vpa.address?.trim(),
        };
      }

      const response = await axios.post(`${this.baseUrl}/fund_accounts`, payload, {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      return response.data;
    } catch (err) {
      const errData = err.response?.data?.error;
      const errorMsg = errData?.description || errData?.message || err.message;
      console.warn(`[RazorpayPayoutAdapter] Fund account creation error on gateway: ${errorMsg}`, err.response?.data || err.message);

      // Attempt to retrieve existing active fund account for this contact
      try {
        const lookupRes = await axios.get(
          `${this.baseUrl}/fund_accounts?contact_id=${encodeURIComponent(contactId)}`,
          {
            headers: { Authorization: this.getAuthHeader() },
            timeout: 10000,
          }
        );

        if (lookupRes.data?.items?.length > 0) {
          const match = lookupRes.data.items.find((fa) => {
            if (accountType === 'bank_account' && bankAccount) {
              return (
                fa.account_type === 'bank_account' &&
                fa.bank_account?.account_number === String(bankAccount.accountNumber).trim()
              );
            }
            if (accountType === 'vpa' && vpa) {
              const targetVpa = typeof vpa === 'string' ? vpa.trim() : vpa.address?.trim();
              return fa.account_type === 'vpa' && fa.vpa?.address === targetVpa;
            }
            return false;
          });

          if (match) {
            return match;
          }
          // Return the first active account if exact match not found
          const activeFirst = lookupRes.data.items.find((fa) => fa.active);
          if (activeFirst) return activeFirst;
        }
      } catch (lookupErr) {
        console.warn('[RazorpayPayoutAdapter] Fund account lookup failed:', lookupErr.message);
      }

      throw new Error(`RazorpayX Fund Account Creation Failed: ${errorMsg}`);
    }
  }

  /**
   * 3. Initiate Payout from DreamXec virtual/business account to fund account
   */
  async createPayout({
    fundAccountId,
    amount, // In INR units (e.g. 500.00)
    currency = 'INR',
    mode = null, // IMPS, UPI, NEFT, RTGS
    purpose = 'payout',
    referenceId = null,
    narration = 'DreamXec Withdrawal',
    idempotencyKey = null,
    origin = null,
    req = null,
  }) {
    const amountInPaise = Math.round(Number(amount) * 100);
    const payoutMode = (mode || this.defaultPayoutMode || 'IMPS').toUpperCase();
    const creds = this.getCredentials(req || origin);
    const sourceAccount = creds.accountNumber || this.accountNumber;

    if (this.isSimulation || fundAccountId.startsWith('fa_sim_')) {
      const simPayoutId = `pout_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: simPayoutId,
        entity: 'payout',
        fund_account_id: fundAccountId,
        amount: amountInPaise,
        currency,
        status: 'processing',
        purpose,
        mode: payoutMode,
        reference_id: referenceId,
        narration,
        simulated: true,
      };
    }

    if (!this.isSimulation && !sourceAccount) {
      throw new Error(`RazorpayX Payout Initiation Failed: RAZORPAYX_ACCOUNT_NUMBER is not configured for ${creds.entity || 'disbursements'}.`);
    }

    try {
      const headers = {
        Authorization: this.getAuthHeader(req || origin),
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['X-Payout-Idempotency'] = String(idempotencyKey);
      }

      const response = await axios.post(
        `${this.baseUrl}/payouts`,
        {
          account_number: sourceAccount,
          fund_account_id: fundAccountId,
          amount: amountInPaise,
          currency,
          mode: payoutMode,
          purpose,
          reference_id: referenceId ? String(referenceId) : undefined,
          narration: narration ? narration.substring(0, 30) : undefined,
        },
        { headers, timeout: 20000 }
      );
      return response.data;
    } catch (err) {
      const errData = err.response?.data?.error;
      const errorMsg = errData?.description || errData?.message || err.message;
      console.error(`[RazorpayPayoutAdapter] Payout creation failed on gateway: ${errorMsg}`, err.response?.data || err.message);

      throw new Error(`RazorpayX Payout Initiation Failed: ${errorMsg}`);
    }
  }

  /**
   * 4. Retrieve status of a payout by ID
   */
  async getPayoutStatus(payoutId) {
    if (this.isSimulation || payoutId.startsWith('pout_sim_')) {
      return {
        id: payoutId,
        status: 'processed',
        simulated: true,
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/payouts/${payoutId}`, {
        headers: {
          Authorization: this.getAuthHeader(),
        },
        timeout: 10000,
      });
      return response.data;
    } catch (err) {
      console.warn(`[RazorpayPayoutAdapter] Failed to fetch payout ${payoutId}:`, err.message);
      throw err;
    }
  }

  /**
   * 5. Parse and verify webhook payload for payout events
   * Events: payout.processed, payout.failed, payout.reversed, payout.rejected, payout.queued, payout.initiated
   */
  parsePayoutWebhookEvent({ headers, body, rawBody = null }) {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const signature = headers ? headers['x-razorpay-signature'] : null;
    if (signature && this.webhookSecret && !this.webhookSecret.includes('dummy')) {
      const dataToVerify = rawBody || (typeof body === 'string' ? body : JSON.stringify(body));
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(dataToVerify)
        .digest('hex');

      if (signature !== expected) {
        throw new Error('Invalid RazorpayX payout webhook signature.');
      }
    }

    const rawEvent = body;
    const eventName = rawEvent.event;

    if (rawEvent.payload?.payout?.entity) {
      const entity = rawEvent.payload.payout.entity;
      return {
        eventType: eventName, // e.g. 'payout.processed', 'payout.failed', 'payout.reversed', 'payout.rejected'
        payoutId: entity.id,
        amount: entity.amount ? entity.amount / 100 : 0,
        currency: entity.currency || 'INR',
        status: entity.status, // queued, processing, processed, reversed, cancelled, rejected, failed
        referenceId: entity.reference_id || null,
        utr: entity.utr || null,
        mode: entity.mode || null,
        failureReason: entity.failure_reason || entity.status_details?.description || entity.status_details?.reason || null,
        rawEvent,
      };
    }

    return {
      eventType: eventName || 'UNKNOWN',
      rawEvent,
    };
  }
}

module.exports = RazorpayPayoutAdapter;
