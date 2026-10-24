const axios = require('axios');

class IfscService {
  constructor() {
    this.cache = new Map();
    this.cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Validates IFSC format: 4 uppercase letters, 1 zero, 6 alphanumeric chars
   */
  isValidFormat(ifsc) {
    if (!ifsc || typeof ifsc !== 'string') return false;
    const clean = ifsc.trim().toUpperCase();
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean);
  }

  /**
   * Looks up an Indian Financial System Code via Razorpay public IFSC registry
   */
  async lookup(ifscCode) {
    if (!ifscCode || typeof ifscCode !== 'string') {
      return {
        valid: false,
        message: 'IFSC code is required',
      };
    }

    const clean = ifscCode.trim().toUpperCase();
    if (!this.isValidFormat(clean)) {
      return {
        valid: false,
        message: 'Invalid IFSC format. Expected 4 letters, 0, then 6 alphanumeric characters (e.g. SBIN0001234).',
      };
    }

    // Check Cache
    const cached = this.cache.get(clean);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    try {
      const response = await axios.get(`https://ifsc.razorpay.com/${clean}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'DreamXec-Platform/2.0',
        },
      });

      const raw = response.data;
      if (!raw || typeof raw !== 'object') {
        return {
          valid: false,
          message: 'Invalid IFSC response from registry',
        };
      }

      const result = {
        valid: true,
        ifsc: clean,
        bank: raw.BANK || raw.BANKCODE || 'Unknown Bank',
        bankCode: raw.BANKCODE || clean.slice(0, 4),
        branch: raw.BRANCH || '',
        address: raw.ADDRESS || '',
        city: raw.CITY || '',
        district: raw.DISTRICT || '',
        state: raw.STATE || '',
        micr: raw.MICR || null,
        contact: raw.CONTACT || null,
        rails: {
          upi: Boolean(raw.UPI),
          neft: Boolean(raw.NEFT),
          imps: Boolean(raw.IMPS),
          rtgs: Boolean(raw.RTGS),
        },
        verifiedAt: new Date().toISOString(),
      };

      // Cache successful response
      this.cache.set(clean, { timestamp: Date.now(), data: result });
      return result;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return {
          valid: false,
          ifsc: clean,
          message: `IFSC code ${clean} not found in the national banking directory.`,
        };
      }

      console.warn(`[IfscService] Lookup failed for ${clean}:`, err.message);
      return {
        valid: false,
        ifsc: clean,
        message: 'Banking directory lookup temporarily unavailable.',
      };
    }
  }
}

module.exports = new IfscService();
