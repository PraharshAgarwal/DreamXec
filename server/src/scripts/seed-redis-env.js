/**
 * Script to seed environment variables from local .env file into Redis Hash "dreamxec:env"
 */
const dotenv = require("dotenv");
const path = require("path");
const redis = require("redis");

// Load local .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function seedRedisEnv() {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const hashKey = process.env.REDIS_ENV_KEY || "dreamxec:env";

  console.log(`🔌 Connecting to Redis at ${redisUrl} to seed environment variables...`);

  const client = redis.createClient({ url: redisUrl });

  client.on("error", (err) => {
    console.error("❌ Redis Error:", err.message);
  });

  try {
    await client.connect();

    const envMap = {};
    for (const [key, val] of Object.entries(process.env)) {
      if (val !== undefined && val !== null) {
        envMap[key] = String(val);
      }
    }

    const count = Object.keys(envMap).length;
    if (count > 0) {
      await client.hSet(hashKey, envMap);
      console.log(`✅ Successfully seeded ${count} environment variables into Redis Hash "${hashKey}"!`);
    } else {
      console.warn("⚠️ No environment variables found in process.env to seed.");
    }
  } catch (err) {
    console.error("❌ Failed to seed environment variables into Redis:", err.message);
  } finally {
    try {
      await client.disconnect();
    } catch (e) {
      // ignore
    }
  }
}

seedRedisEnv();
