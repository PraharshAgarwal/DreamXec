const logger = require("./logger");

const catchAsync = (fn) => {
  return async (req, res, next) => {
    const start = Date.now();
    const controllerName = fn.name || "AnonymousController";

    try {
      await fn(req, res, next);

      const duration = Date.now() - start;

      // Optional: skip 304 logs (cache responses)
      if (res.statusCode === 304) return;

      const logPayload = {
        controller: controllerName,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
        requestId: req.requestId,
        userId: req.user?.id || null,
      };

      if (res.statusCode >= 400) {
        logger.warn("Controller Completed With Client Error", logPayload);
      } else {
        logger.info("Controller Success", logPayload);
      }

    } catch (err) {
      const duration = Date.now() - start;

      // Do NOT log 500 here (error middleware will handle it)
      logger.error("Controller Error", {
        controller: controllerName,
        method: req.method,
        path: req.originalUrl,
        duration,
        requestId: req.requestId,
        userId: req.user?.id || null,
        error: err.message,
      });

      next(err);
    }
  };
};

module.exports = catchAsync;