const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const { PrismaClient } = require("@prisma/client");

const prismaLogs = ["error", "warn"];

// Keep verbose SQL logs opt-in for local debugging only.
if (process.env.PRISMA_QUERY_LOGS === "true") {
  prismaLogs.unshift("query");
}

// Dynamically configure connection pool parameters from environment
function configureDatabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const connectionLimit = process.env.DB_CONNECTION_LIMIT || "25";
    const poolTimeout = process.env.DB_POOL_TIMEOUT || "20";
    const connectTimeout = process.env.DB_CONNECT_TIMEOUT || "10";

    // Set or override connection pool parameters if provided in env
    if (process.env.DB_CONNECTION_LIMIT || !parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", connectionLimit);
    }
    if (process.env.DB_POOL_TIMEOUT || !parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", poolTimeout);
    }
    if (process.env.DB_CONNECT_TIMEOUT || !parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", connectTimeout);
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const configuredDbUrl = configureDatabaseUrl(process.env.DATABASE_URL);

const basePrisma = new PrismaClient({
  log: prismaLogs,
  ...(configuredDbUrl ? { datasources: { db: { url: configuredDbUrl } } } : {}),
});

let recordQueryMetric = null;
try {
  ({ recordQueryMetric } = require("../middleware/performance-tracer"));
} catch (_) {}

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        let lastError;
        for (let attempt = 0; attempt < 3; attempt++) {
          const startHr = process.hrtime.bigint();
          try {
            const result = await query(args);
            const endHr = process.hrtime.bigint();
            if (recordQueryMetric) {
              recordQueryMetric({ model, operation, startHr, endHr });
            }
            return result;
          } catch (error) {
            const endHr = process.hrtime.bigint();
            if (recordQueryMetric) {
              recordQueryMetric({ model, operation, startHr, endHr, error });
            }
            lastError = error;
            const isTransient =
              error &&
              (error.code === 'P1001' || // Can't reach database server
                error.code === 'P1002' || // Database server timed out
                error.code === 'P1008' || // Operations timed out
                error.code === 'P1017' || // Server closed the connection
                error.code === 'P2024' || // Timed out fetching connection from pool
                (typeof error.message === 'string' &&
                  (error.message.includes("Can't reach database server") ||
                    error.message.includes("Connection reset") ||
                    error.message.includes("terminating connection") ||
                    error.message.includes("Connection terminated") ||
                    error.message.includes("ETIMEDOUT") ||
                    error.message.includes("ECONNRESET") ||
                    error.message.includes("ECONNREFUSED") ||
                    error.message.includes("socket hang up"))));

            if (isTransient && attempt < 2) {
              const delay = (attempt + 1) * 250 + Math.floor(Math.random() * 250);
              console.warn(
                `[Prisma] Retrying transient connection drop on ${model}.${operation} (attempt ${attempt + 1}/2, waiting ${delay}ms)...`
              );
              if (error.code !== 'P2024') {
                basePrisma.$connect().catch(() => {});
              }
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            throw error;
          }
        }
        throw lastError;
      },
    },
  },
});

module.exports = prisma;
