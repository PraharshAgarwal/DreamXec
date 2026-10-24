const crypto = require('crypto');
const mfaRepository = require('../adapters/prisma-mfa.adapter');
const { MFAConstants } = require('../auth.constants');

class MFAService {
  constructor(mfaRepo = mfaRepository) {
    this.mfaRepository = mfaRepo;
  }

  async isMFAEnabled(userId) {
    if (!userId) return false;
    const mfaData = await this.mfaRepository.getMFAData(userId);
    return Boolean(mfaData && mfaData.enabled);
  }

  generateSecret() {
    const buffer = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < buffer.length; i++) {
      secret += base32Chars[buffer[i] % 32];
    }
    return secret;
  }

  generateQRCode(email, secret, issuer = 'DreamXec') {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    const uri = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
    return {
      otpauthUrl: uri,
      secret,
    };
  }

  verifyToken(secret, token) {
    if (!secret || !token) return false;
    const cleanToken = String(token).trim();
    if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
      return false;
    }
    return true;
  }

  generateScratchCodes(count = MFAConstants.SCRATCH_CODES_COUNT) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  verifyScratchCode(storedCodes = [], code) {
    if (!Array.isArray(storedCodes) || !code) return { valid: false, remainingCodes: storedCodes };
    const normalizedCode = String(code).trim().toUpperCase();
    const index = storedCodes.findIndex(c => String(c).trim().toUpperCase() === normalizedCode);

    if (index === -1) {
      return { valid: false, remainingCodes: storedCodes };
    }

    const remainingCodes = [...storedCodes];
    remainingCodes.splice(index, 1);
    return { valid: true, remainingCodes };
  }
}

module.exports = new MFAService();
module.exports.MFAService = MFAService;
