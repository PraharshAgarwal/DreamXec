const { createLogger, format, transports } = require("winston");
const Sentry = require("@sentry/node");

// Helper to extract active request trace context from AsyncLocalStorage
let getTraceContext = null;
try {
  ({ getTraceContext } = require("../middleware/performance-tracer"));
} catch (_) {}

/**
 * Custom Winston Format injecting X-Request-Id and Request metadata from AsyncLocalStorage
 */
const injectTraceContext = format((info) => {
  if (getTraceContext) {
    const ctx = getTraceContext();
    if (ctx) {
      info.requestId = info.requestId || ctx.requestId;
      info.method = info.method || ctx.method;
      info.path = info.path || ctx.url;
    }
  }
  return info;
});

const isProd = process.env.NODE_ENV === "production";

// Configure transports
const loggerTransports = [
  new transports.Console({
    format: isProd
      ? format.combine(
          format.timestamp(),
          injectTraceContext(),
          format.errors({ stack: true }),
          format.json()
        )
      : format.combine(
          format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          injectTraceContext(),
          format.colorize(),
          format.printf(({ timestamp, level, message, requestId, stack, ...meta }) => {
            const reqIdStr = requestId ? ` [${requestId}]` : "";
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
            return `${timestamp} ${level}${reqIdStr}: ${message}${metaStr}${stack ? `\n${stack}` : ""}`;
          })
        ),
  }),
];

// Optional Cloud HTTP Log Aggregator Transport (e.g. Axiom, BetterStack/Logtail, Datadog)
if (process.env.LOG_HTTP_ENDPOINT) {
  const httpOptions = {
    host: process.env.LOG_HTTP_HOST || new URL(process.env.LOG_HTTP_ENDPOINT).hostname,
    path: process.env.LOG_HTTP_PATH || new URL(process.env.LOG_HTTP_ENDPOINT).pathname,
    ssl: !process.env.LOG_HTTP_ENDPOINT.startsWith("http://"),
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LOG_HTTP_AUTH_HEADER
        ? { Authorization: process.env.LOG_HTTP_AUTH_HEADER }
        : {}),
    },
  };
  loggerTransports.push(new transports.Http(httpOptions));
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  defaultMeta: {
    service: "dreamxec-api",
    environment: process.env.NODE_ENV || "development",
  },
  format: format.combine(
    format.timestamp(),
    injectTraceContext(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: loggerTransports,
});

// Stream interface for Morgan HTTP request logging
logger.httpStream = {
  write: (message) => {
    try {
      const parsed = JSON.parse(message);
      logger.info("HTTP Access", parsed);
    } catch (_) {
      logger.info(message.trim());
    }
  },
};

// Forward error-level logs to Sentry while capturing structured payload
const originalError = logger.error.bind(logger);

logger.error = (message, meta = {}) => {
  if (meta instanceof Error) {
    Sentry.captureException(meta, {
      extra: typeof message === "string" ? { customMessage: message } : meta,
    });
  } else if (typeof message === "string") {
    Sentry.captureMessage(message, {
      level: "error",
      extra: meta,
    });
  }

  return originalError(message, meta);
};

module.exports = logger;