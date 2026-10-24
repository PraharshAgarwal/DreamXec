const dotenv = require("dotenv");
require("./instrument");
const Sentry = require("@sentry/node");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const AppError = require("./src/utils/AppError");
const globalErrorHandler = require("./src/middleware/error.middleware");
const RedisStore = require("connect-redis").default;
const redis = require("./src/config/redis");
const cleanupOtpRedisKeys = require("./src/modules/platform/utils/redisOTPCleanup");
const morgan = require("morgan");
const requestId = require("./src/middleware/requestId.middleware");
const compression = require("compression");

const prisma = require("./src/config/prisma");

const path = require("path");
const fs = require("fs");

const clientDistPath = fs.existsSync(path.join(__dirname, "public"))
  ? path.join(__dirname, "public")
  : path.join(__dirname, "../client/dist");
const hasClientBuild = fs.existsSync(clientDistPath) && fs.existsSync(path.join(clientDistPath, "index.html"));

// Load env
dotenv.config();

const { getClientUrl } = require("./src/utils/urlConfig");

const CLIENT_URL = getClientUrl();
console.log("CLIENT_URL =", CLIENT_URL);

// --------------------------------------------
// IMPORT ROUTES
// --------------------------------------------
const authRoutes = require("./src/modules/auth/routes/auth.routes");
const userProjectRoutes = require("./src/modules/projects/routes/user-project.routes");
const donorProjectRoutes = require("./src/modules/projects/routes/donor-project.routes");
const userRoutes = require("./src/modules/users/routes/user.routes");
const donationRoutes = require("./src/modules/donations/routes/donation.routes");
const adminRoutes = require("./src/modules/admin/routes/admin.routes");
const applicationRoutes = require("./src/modules/governance/routes/application.routes");
const {
  verificationRouter: clubVerificationRoutes,
  referralRouter: clubReferralRoutes,
  adminReferralRouter: adminClubReferralRoutes,
  adminVerificationRouter: adminClubVerificationRoutes,
} = require("./src/modules/clubs/routes/club.routes");
const newsletterRoutes = require("./src/modules/platform/routes/newsletter.routes");
const wishlistRoutes = require("./src/modules/interactions/routes/wishlist.routes");
const uploadRoutes = require("./src/modules/platform/routes/upload.routes");
const otpRoutes = require("./src/modules/platform/routes/otp.routes");
const studentVerificationRoutes = require("./src/modules/governance/routes/student-verification.routes");
const healthRoutes = require("./src/modules/platform/routes/health.routes");
const adminRedisRoutes = require("./src/modules/admin/routes/admin-redis.routes");
const clubRoutes = require("./src/modules/clubs/routes/club.routes");
const campaignCommentRoutes = require("./src/modules/interactions/routes/comment.routes");
const seoRoutes = require("./src/modules/platform/routes/seo.routes");
const profileRoutes = require("./src/modules/users/routes/profile.routes");
const mentorRoutes = require("./src/modules/governance/routes/mentor.routes");
const collegesRoutes = require("./src/modules/platform/routes/colleges.routes");
const workflowRoutes = require("./src/modules/governance/routes/workflow.routes");
const dxAdminRoutes = require("./src/modules/governance/routes/dx-admin.routes");
const campaignRoutes = require("./src/modules/campaigns/routes/campaign.routes");
const vaultRoutes = require("./src/modules/vault/routes/vault.routes");
const speciesRoutes = require("./src/modules/species/routes/species.routes");
const withdrawalRoutes = require("./src/modules/donations/routes/withdrawal.routes");

// Passport replaced with standalone pluggable OAuth Provider Registry
const { performanceTracer, getTraceSummary } = require("./src/middleware/performance-tracer");

const helmet = require("helmet");

const app = express();

// Enable reverse proxy trust (Render, AWS ALB, Cloudflare) for accurate client IPs and rate limiting
app.set("trust proxy", 1);

// --------------------------------------------
// 1️⃣ CORS CONFIGURATION (Placed first to handle OPTIONS preflights immediately)
// --------------------------------------------
const formatOrigin = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `https://${url}`;
};

// Support comma-separated CLIENT_URL or CORS_ALLOWED_ORIGINS
const extraOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const { getConfiguredDomains } = require("./src/config/razorpay.config");
const configuredDomains = getConfiguredDomains();
const configuredDomainOrigins = configuredDomains.flatMap((d) => [`https://${d}`, `https://www.${d}`, `http://${d}`]);

const allowedOrigins = [
  CLIENT_URL,
  formatOrigin(CLIENT_URL),
  process.env.CLOUDFRONT_URL,
  ...extraOrigins,
  ...configuredDomainOrigins,
  "https://dreamxec-frontend.onrender.com",
  "https://dreamxec.com",
  "https://www.dreamxec.com",
  "https://dreamxec.org",
  "https://www.dreamxec.org",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser requests
    if (!origin) return callback(null, true);

    try {
      const normalizedOrigin = origin.replace(/\/$/, "");
      const hostname = new URL(origin).hostname;
      const isAllowed =
        allowedOrigins.some((a) => a && a.replace(/\/$/, "") === normalizedOrigin) ||
        configuredDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`)) ||
        /^https?:\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /\.onrender\.com$/.test(hostname) ||
        /\.vercel\.app$/.test(hostname) ||
        /\.cloudfront\.net$/.test(hostname) ||
        /\.amazonaws\.com$/.test(hostname) ||
        /(^|\.)dreamxec\.(com|org)$/.test(hostname);

      if (isAllowed) {
        return callback(null, true);
      }
    } catch {
      // Fallback on malformed URL
    }

    // Reject unverified cross-origin requests
    return callback(new AppError(`CORS policy: Origin ${origin} not allowed`, 403));
  },
  credentials: true,
  maxAge: 86400, // Cache preflight response for 24 hours
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-organization-id",
    "x-client-domain",
    "x-tenant-domain",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(requestId);
app.use(performanceTracer);
// --------------------------------------------
// GZIP COMPRESSION
// --------------------------------------------
app.use(compression());
// --------------------------------------------
// REQUEST LOGGING (Structured JSON via Winston)
// --------------------------------------------
const logger = require("./src/utils/logger");

const morganJsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    contentLength: tokens.res(req, res, "content-length") || 0,
    responseTimeMs: Number(tokens["response-time"](req, res)),
    ip: req.ip || tokens["remote-addr"](req, res),
    userAgent: tokens["user-agent"](req, res),
    requestId: req.requestId || null,
  });
};

if (process.env.NODE_ENV === "production") {
  app.use(morgan(morganJsonFormat, { stream: logger.httpStream }));
} else {
  app.use(
    morgan("dev", {
      skip: (req, res) => req.method === "OPTIONS" || res.statusCode === 304,
    }),
  );
}

// --------------------------------------------
// 2️⃣ SESSION (Memory Store by default to avoid Redis socket hangs)
// --------------------------------------------
const sessionStore = process.env.USE_REDIS_SESSION === "true"
  ? new RedisStore({ client: redis, prefix: "dreamxec:sess:" })
  : undefined; // Defaults to MemoryStore (fast, non-blocking)

const isProd = process.env.NODE_ENV === "production";

const sessionName = process.env.SESSION_NAME || "dreamxec.sid";
// SESSION_SECRET must be explicitly set in production — a missing/default secret allows session forgery.
const sessionSecret = process.env.SESSION_SECRET || "dreamxec-secret-key-2026";
if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "dreamxec-secret-key-2026")) {
  console.error("[FATAL] SESSION_SECRET environment variable is not set or uses the default placeholder value. Set a strong, random secret before deploying to production.");
  process.exit(1);
}
const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE_MS || String(24 * 60 * 60 * 1000), 10);

app.use(
  session({
    store: sessionStore,
    name: sessionName,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      httpOnly: true,
      maxAge: sessionMaxAge,
    },
  }),
);

// Static uploads serving
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


// --------------------------------------------
// 5️⃣ JSON BODY PARSER (EVERYTHING ELSE)
// --------------------------------------------
const bodyParserLimit = process.env.BODY_PARSER_LIMIT || "15mb";

app.use(
  express.json({
    limit: bodyParserLimit,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);


// Passport middleware removed in favor of stateless session & JWT flow

app.use((req, res, next) => {
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
    });
  }
  next();
});
// --------------------------------------------
// 4️⃣ RAZORPAY WEBHOOK (RAW BODY ONLY)
// MUST come BEFORE express.json()
// --------------------------------------------
// app.use(
//   '/api/donations/webhook',
//   express.raw({ type: 'application/json' })
// );

// --------------------------------------------
// HEALTH / LOAD BALANCER PROBES (Root & /api)
// --------------------------------------------
app.use("/", healthRoutes);
app.use("/api", healthRoutes);

// --------------------------------------------
// DEV TOKEN (Development only - disabled in production)
// --------------------------------------------
if (process.env.NODE_ENV !== "production") {
  app.get("/dev/gen-token", async (req, res) => {
    const generateDevToken = require("./src/utils/devToken");
    const requestedRole = req.query.role ? req.query.role.toUpperCase() : null;
    const fallbackAdminId = process.env.DEV_ADMIN_ID || "a5032bfc-3ff1-4817-b27d-66c1028be653";
    const fallbackAdminEmail = process.env.DEV_ADMIN_EMAIL || "dx.admin@dreamxec.com";
    const user = (requestedRole ? await prisma.user.findFirst({ where: { role: requestedRole } }) : null) ||
                 await prisma.user.findFirst() ||
                 { id: fallbackAdminId, role: "ADMIN", email: fallbackAdminEmail };

    const token = generateDevToken(user.id, user.role);

    res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
      note: "Use this token in Authorization header",
      token,
    });
  });

  app.get("/dev/trace/:id", (req, res) => {
    const summary = getTraceSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: "Trace not found or evicted" });
    res.json(summary);
  });
}

// --------------------------------------------
// STATIC CLIENT ASSETS / ROOT ROUTE
// --------------------------------------------
if (hasClientBuild) {
  app.use(
    express.static(clientDistPath, {
      maxAge: "1d",
      index: false,
    })
  );

  app.get("/", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(getClientUrl());
    }
    res.json({ service: "dreamxec backend", status: "running" });
  });
}

// --------------------------------------------
// API ROUTES
// --------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/user-projects", userProjectRoutes);
app.use("/api/donor-projects", donorProjectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes); // includes webhook
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminRedisRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/club-verification", clubVerificationRoutes);
app.use("/api/club-referral", clubReferralRoutes);
app.use("/api/admin/referrals", adminClubReferralRoutes);
app.use("/api/admin/club-verifications", adminClubVerificationRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/student-verification", studentVerificationRoutes);
app.use("/api", campaignCommentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/colleges", collegesRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/dx-admin", dxAdminRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/species", speciesRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/services", require("./src/modules/services/services.routes"));
app.use("/api/permissions", require("./src/modules/permissions/permission.routes"));

app.use("/", seoRoutes);

if (process.env.NODE_ENV !== "production") {
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
}

// --------------------------------------------
// CLIENT SPA FALLBACK ROUTE (HTML5 History API)
// --------------------------------------------
if (hasClientBuild) {
  app.get("*", (req, res, next) => {
    // Pass API, health, dev, and upload routes through to their handlers or 404
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/dev")
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// --------------------------------------------
// 404 HANDLER
// --------------------------------------------
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --------------------------------------------
// 🔴 SENTRY ERROR HANDLER (MUST BE BEFORE GLOBAL ERROR HANDLER)
// --------------------------------------------

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Keep the Sentry handler in chain, but let the global error middleware
// decide final status/message for operational errors (e.g. validation 400).
app.use(function onError(err, req, res, next) {
  next(err);
});

// --------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------
app.use(globalErrorHandler);

const PermissionService = require("./src/permissions/permission.service");

// --------------------------------------------
// REDIS CLEANUP ON BOOT
// --------------------------------------------
redis.on("ready", async () => {
  console.log("✅ Redis connected");

  // Sync permissions matrix to Upstash Redis
  await PermissionService.syncMatrixToRedis(redis).catch((err) => {
    console.warn("⚠️ Failed to sync permissions to Upstash Redis:", err.message);
  });

  if (process.env.CLEAN_REDIS_ON_BOOT === "true" || process.env.CLEAN_REDIS_ON_BOOT === "TRUE") {
    try {
      const deleted = await cleanupOtpRedisKeys();
      console.log(`🧹 Redis OTP cleanup done. Deleted ${deleted} keys.`);
    } catch (err) {
      console.error("❌ Redis OTP cleanup failed:", err);
    }
  }
});

const donationService = require("./src/modules/donations/donation.service");

// Export app instance for serverless / testing / Vercel
module.exports = app;

// Only start standalone HTTP listener when not running in Vercel Serverless environment
if (process.env.VERCEL !== "1" && !process.env.NOW_REGION) {
  const PORT = parseInt(String(process.env.PORT || 5000).replace(/[^0-9]/g, ""), 10) || 5000;
  const server = app.listen(PORT, "0.0.0.0", () => {
    prisma
      .$connect()
      .then(async () => {
        console.log("Database connected successfully");
        await PermissionService.seedPermissions();
        
        // Auto-expire stale pending transactions on startup and schedule periodic sweeper (every 5 mins, 30m timeout)
        const paymentTimeoutMinutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '30', 10);
        try {
          await donationService.autoExpireStaleTransactions(paymentTimeoutMinutes);
        } catch (err) {
          console.warn("⚠️ Failed initial stale transaction sweep:", err.message);
        }
        setInterval(async () => {
          try {
            await donationService.autoExpireStaleTransactions(paymentTimeoutMinutes);
          } catch (err) {
            console.warn("⚠️ Error running periodic stale transaction sweep:", err.message);
          }
        }, 5 * 60 * 1000).unref();

        console.log(`🚀 Server running on port ${PORT}`);
        if (typeof process.send === 'function') {
          process.send('ready');
        }
      })
      .catch((err) => console.error("Database connection failed:", err));
  });

  // ALB & Reverse Proxy TCP Keep-Alive Configuration (Avoids 502 Bad Gateway under load)
  const keepAliveTimeout = parseInt(process.env.SERVER_KEEP_ALIVE_TIMEOUT || "65000", 10);
  const headersTimeout = parseInt(process.env.SERVER_HEADERS_TIMEOUT || "66000", 10);
  server.keepAliveTimeout = keepAliveTimeout; // 65s default (must exceed ALB default 60s idle timeout)
  server.headersTimeout = headersTimeout;     // 66s default

  function gracefulShutdown(signal) {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        if (redis && redis.quit) {
          await redis.quit();
        }
      } catch (_) {}
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

