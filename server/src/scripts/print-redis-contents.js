/**
 * Script to print all contents stored in Redis across all data types
 */
const { printAllRedisContents } = require("../utils/cache");
const redis = require("../config/redis");

async function main() {
  console.log("🔍 Scanning Redis for all stored keys and values...\n");
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    await printAllRedisContents({ logToConsole: true });
  } catch (error) {
    console.error("❌ Failed to read from Redis:", error.message);
  } finally {
    try {
      await redis.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

main();
