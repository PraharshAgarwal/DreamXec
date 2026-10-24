const dotenv = require("dotenv");
const redis = require("redis");

const path = require("path");

// Load local .env explicitly with absolute path
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function loadEnv() {
  if (process.env.SKIP_REDIS_ENV === "true" || (process.env.JWT_SECRET && process.env.DATABASE_URL)) {
    console.log("⚡ Relying on local .env configuration.");
    return;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("⚠️ No REDIS_URL found in environment. Relying solely on local environment variables.");
    return;
  }

  const hashKey = process.env.REDIS_ENV_KEY || "dreamxec:env";
  console.log(`🔌 Connecting to Redis at ${redisUrl.replace(/:([^:@]+)@/, ":****@")} to fetch configuration...`);

  const client = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.error("❌ Redis reconnection limit exceeded for loading env. Proceeding with existing env.");
          return new Error("Redis reconnection limit reached");
        }
        return Math.min(retries * 100, 1000);
      },
    },
  });

  client.on("error", (err) => {
    console.error("❌ Redis Env Loader Client Error:", err.message);
  });

  try {
    await client.connect();
    console.log(`📥 Fetching configuration from Redis Hash: "${hashKey}"`);
    const envConfig = await client.hGetAll(hashKey);

    if (envConfig && Object.keys(envConfig).length > 0) {
      console.log(`✅ Loaded ${Object.keys(envConfig).length} variables from Redis.`);
      for (const [key, value] of Object.entries(envConfig)) {
        // Only override process.env if Redis value is non-empty
        if (value && typeof value === 'string' && value.trim() !== '') {
          if (key === 'DATABASE_URL') {
            if (!value.startsWith('postgres')) {
              console.warn('⚠️ Ignoring invalid DATABASE_URL from Redis Hash');
              continue;
            }
            if (process.env.DATABASE_URL) {
              console.log('ℹ️ Preserving local .env DATABASE_URL');
              continue;
            }
          }
          process.env[key] = value;
        }
      }
    } else {
      console.warn(`⚠️ Redis Hash "${hashKey}" is empty or does not exist.`);
    }
  } catch (error) {
    console.error("❌ Failed to pull environment configuration from Redis:", error.message);
  } finally {
    try {
      await client.disconnect();
    } catch (e) {
      // ignore
    }
  }
}

module.exports = { loadEnv };
