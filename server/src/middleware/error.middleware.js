const AppError = require("../utils/AppError");
const { publishEvent } = require("../config/eventPublisher");
const EVENTS = require("../config/events");
const logger = require("../utils/logger");
const Sentry = require("@sentry/node");

const handlePrismaError = (err) => {
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return new AppError(`A record with this ${field} already exists.`, 400);
  }

  if (err.code === "P2025") {
    return new AppError("The requested record was not found.", 404);
  }

  return new AppError("A database error occurred.", 500);
};

module.exports = (err, req, res, next) => {
  let error = err;

  // ===============================
  // HANDLE JOI VALIDATION ERRORS
  // ===============================
  if (err.isJoi || err.name === "ValidationError") {
    logger.warn("Joi Validation Error", {
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.id || null,
      requestId: req.requestId,
      message: err.message,
    });

    return res.status(400).json({
      status: "fail",
      message: err.message || "Validation failed",
    });
  }

  // ===============================
  // HANDLE ZOD VALIDATION ERRORS
  // ===============================
  if (err.name === "ZodError") {
    logger.warn("Validation Error", {
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.id || null,
      requestId: req.requestId,
      errors: err.errors,
    });

    return res.status(400).json({
      status: "fail",
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // ===============================
  // HANDLE PRISMA ERRORS
  // ===============================
  if (err.code && err.code.startsWith("P")) {
    error = handlePrismaError(err);
  }

  // ===============================
  // NORMALIZE ERROR
  // ===============================
  if (!(error instanceof AppError)) {
    error = new AppError(error.message || "Something went wrong", 500);
  }

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  // ===============================
  // LOG BASED ON STATUS
  // ===============================
  const logPayload = {
    message: error.message,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || null,
    requestId: req.requestId,
    ip: req.ip,
  };

  if (error.statusCode >= 500) {
    logger.error("Server Error", logPayload);

    // Capture only real server errors in Sentry
    Sentry.captureException(error);

    publishEvent(EVENTS.SYSTEM_ERROR, {
      ...logPayload,
      stack: error.stack,
    }).catch((e) => logger.error("Failed to publish system error", e));
  } else {
    logger.warn("Client Error", logPayload);
  }

  // ===============================
  // DEVELOPMENT RESPONSE
  // ===============================
  if (process.env.NODE_ENV === "development") {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
    });
  }

  // ===============================
  // PRODUCTION RESPONSE
  // ===============================
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};
