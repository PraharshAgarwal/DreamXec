const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

function createRedisStore(prefix) {
  if (!process.env.REDIS_URL || process.env.NODE_ENV === 'test') {
    return undefined; // MemoryStore fallback
  }
  return new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
    prefix: `dx:rl:${prefix}:`,
  });
}

/**
 * Authentication rate limiter: Protects login, registration, and password recovery against brute force attacks.
 * Configurable via RATE_LIMIT_AUTH_MAX and RATE_LIMIT_AUTH_WINDOW_MS.
 */
const authLimiter = rateLimit({
  store: createRedisStore('auth'),
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || String(15 * 60 * 1000), 10),
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login or registration attempts. Please try again after 15 minutes.',
  },
});

/**
 * OTP rate limiter: Prevents SMS/email bombing and OTP brute forcing.
 * Configurable via RATE_LIMIT_OTP_MAX and RATE_LIMIT_OTP_WINDOW_MS.
 */
const otpLimiter = rateLimit({
  store: createRedisStore('otp'),
  windowMs: parseInt(process.env.RATE_LIMIT_OTP_WINDOW_MS || String(15 * 60 * 1000), 10),
  max: parseInt(process.env.RATE_LIMIT_OTP_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many OTP requests. Please wait 15 minutes before requesting again.',
  },
});

/**
 * Payment operations limiter: Mitigates payment gateway API abuse and card testing attacks.
 * Configurable via RATE_LIMIT_PAYMENT_MAX and RATE_LIMIT_PAYMENT_WINDOW_MS.
 */
const paymentLimiter = rateLimit({
  store: createRedisStore('payment'),
  windowMs: parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW_MS || String(60 * 1000), 10),
  max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many payment requests. Please wait a moment before trying again.',
  },
});

module.exports = {
  authLimiter,
  otpLimiter,
  paymentLimiter,
};
