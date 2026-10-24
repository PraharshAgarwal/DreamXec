const redis = require("redis");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const redisUrl = process.env.REDIS_URL;
const isTestEnv = process.env.NODE_ENV === 'test';

let client;
if (redisUrl && !isTestEnv) {
  client = redis.createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      keepAlive: 10000,
      reconnectStrategy: (retries) => {
        // Exponential backoff capped at 5 seconds; resilient against transient network drops
        return Math.min(retries * 200, 5000);
      },
    },
  });

  client.on("connect", () => {
    console.log("🔄 Redis connected to Upstash instance");
  });

  client.on("error", (err) => {
    console.warn("⚠️ Redis Warning:", err.message);
  });

  client.connect().catch((err) => {
    console.warn("⚠️ Redis initial connect failed, caching fallback enabled:", err.message);
  });
} else {
  // In-memory dummy client when testing or if no redis URL configured
  client = {
    isReady: false,
    isOpen: false,
    get: async () => null,
    set: async () => "OK",
    setEx: async () => "OK",
    del: async () => 1,
    keys: async () => [],
    scan: async () => ({ cursor: "0", keys: [] }),
    scanIterator: async function* () {},
    hGetAll: async () => ({}),
    lRange: async () => [],
    sMembers: async () => [],
    zRangeWithScores: async () => [],
    xRange: async () => [],
    type: async () => "none",
    ttl: async () => -2,
    eval: async () => 1,
    publish: async () => 1,
    ping: async () => "PONG",
    sendCommand: async () => "OK",
    on: () => {},
    connect: async () => {},
    quit: async () => {},
    disconnect: async () => {},
  };
}

module.exports = client;
