const { InvalidOTPError, AppError } = require('./auth.errors');
const emailService = require('../email/email.service');
const { userRepository } = require('./auth.repository');
const redis = require('../../config/redis');

/**
 * Dedicated service for numeric OTP generation, temporary storage, and verification.
 * Backed by Redis with in-memory Map fallback for clustered production safety.
 */
class OtpService {
  constructor(store = new Map(), ttlMs = 10 * 60 * 1000, userRepo = userRepository) {
    this.otpStore = store;
    this.ttlMs = ttlMs;
    this.userRepository = userRepo;
  }

  /**
   * Generates a 6-digit OTP and stores expiration timestamp.
   * @param {string} email
   */
  async sendOTP(email) {
    if (!email) {
      throw new AppError('Please provide an email address.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + this.ttlMs;
    const redisKey = `dx:auth:otp:${normalizedEmail}`;

    this.otpStore.set(normalizedEmail, { otp, expiresAt });

    try {
      if (redis && redis.set) {
        await redis.set(
          redisKey,
          JSON.stringify({ otp, expiresAt }),
          { EX: Math.floor(this.ttlMs / 1000) }
        );
      }
    } catch (err) {
      console.warn('[OtpService] Redis store fallback to memory:', err.message);
    }

    // Only log OTP in development — never in production (log aggregators store plaintext)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📩 [DEV OTP]: ${otp} for ${normalizedEmail}`);
    }

    // Dispatch email via emailService
    try {
      await emailService.sendEmail({
        to: normalizedEmail,
        subject: 'Your DreamXec Email Verification Code',
        text: `Your 6-digit email verification code is: ${otp}. This code expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 3px solid #003366; background-color: #FDFBF7;">
            <h2 style="color: #003366; text-transform: uppercase; margin-top: 0;">DreamXec Verification Code</h2>
            <p style="font-size: 14px; color: #333; font-weight: bold;">Use the following 6-digit OTP code to verify your email address:</p>
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #FF7F00; padding: 16px; background-color: #ffffff; border: 2px solid #003366; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #666;">This code is valid for 10 minutes. If did not request this verification, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[OtpService] Email dispatch notification:', err.message);
    }
    return { message: `OTP sent successfully to ${normalizedEmail}.` };
  }

  /**
   * Verifies OTP code and invalidates entry upon success or expiration.
   * Automatically updates user's emailVerified status in DB if user already exists.
   * @param {string} email
   * @param {string} otp
   */
  async verifyOTP(email, otp) {
    if (!email || !otp) {
      throw new AppError('Please provide email and OTP code.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const redisKey = `dx:auth:otp:${normalizedEmail}`;
    let record = this.otpStore.get(normalizedEmail);

    try {
      if (redis && redis.get) {
        const cached = await redis.get(redisKey);
        if (cached) {
          record = JSON.parse(cached);
        }
      }
    } catch (err) {
      console.warn('[OtpService] Redis read fallback to memory:', err.message);
    }

    if (!record) {
      // Idempotency check: if OTP was just verified in the last 60 seconds, return success
      try {
        if (redis && redis.get) {
          const recent = await redis.get(`dx:auth:otp:recent_verified:${normalizedEmail}`);
          if (recent) {
            return { message: 'Email already verified successfully via OTP!' };
          }
        }
      } catch (_) {}
      throw new AppError('No OTP requested for this email. Please request a new OTP.', 400);
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(normalizedEmail);
      try {
        if (redis && redis.del) await redis.del(redisKey);
      } catch (_) {}
      throw new AppError('OTP code has expired. Please request a new one.', 400);
    }

    if (record.otp !== otp) {
      throw new AppError('Incorrect OTP code. Please try again.', 400);
    }

    this.otpStore.delete(normalizedEmail);
    try {
      if (redis && redis.del) await redis.del(redisKey);
      if (redis && redis.set) {
        await redis.set(`dx:auth:otp:recent_verified:${normalizedEmail}`, 'true', { EX: 60 });
        await redis.set(`verified:email:${normalizedEmail}`, 'true', { EX: 3600 });
      }
    } catch (_) {}

    // Auto-mark user email as verified in database if account exists
    if (this.userRepository) {
      try {
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (user) {
          await this.userRepository.update(user.id, {
            profileMetadata: {
              ...(user.profileMetadata || {}),
              emailVerified: true,
            },
          });
        }
      } catch (err) {
        console.error('[OtpService] Failed to auto-update emailVerified in DB:', err.message);
      }
    }

    return { message: 'Email verified successfully via OTP!' };
  }
}

module.exports = new OtpService();
module.exports.OtpService = OtpService;

