const redis = require("../../../config/redis");

const OTP_KEY_PATTERNS = [
  "dx:auth:otp:*",
  "dx:rl:otp:*",
  "otp:*",
  "attempts:*",
  "cooldown:*",
  "rate_limit:*",
  "otp_lock:*",
  "verified:*",
];

const cleanupOtpRedisKeys = async () => {
  console.log("🧹 Starting Redis OTP cleanup...");
  let totalDeleted = 0;

  if (!redis || (typeof redis.scan !== "function" && typeof redis.scanIterator !== "function")) {
    console.log("⚠️ Redis not connected or scan unavailable; skipping OTP cleanup.");
    return 0;
  }

  try {
    for (const pattern of OTP_KEY_PATTERNS) {
      if (typeof redis.scanIterator === "function") {
        const keysToDelete = [];
        for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
          keysToDelete.push(key);
        }
        if (keysToDelete.length > 0) {
          await redis.del(keysToDelete);
          totalDeleted += keysToDelete.length;
        }
      } else {
        let cursor = 0;
        do {
          const reply = await redis.scan(cursor, {
            MATCH: pattern,
            COUNT: 100,
          });
          cursor = Number(reply.cursor);
          if (reply.keys && reply.keys.length > 0) {
            await redis.del(reply.keys);
            totalDeleted += reply.keys.length;
          }
        } while (cursor !== 0);
      }
    }
  } catch (err) {
    console.warn("⚠️ Redis OTP cleanup encountered an error:", err.message);
  }

  return totalDeleted;
};

module.exports = cleanupOtpRedisKeys;
