const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture logs automatically
  enableLogs: true,

  // Capture user IP, headers, etc.
  sendDefaultPii: true,

  // Performance monitoring (VERY useful)
  tracesSampleRate: 1.0,
});