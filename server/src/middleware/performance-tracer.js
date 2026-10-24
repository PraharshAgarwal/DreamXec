const { AsyncLocalStorage } = require('async_hooks');

const traceStorage = new AsyncLocalStorage();
const traceRingBuffer = new Map();
const MAX_RING_BUFFER = 5000;

function hrtimeToMs(startHr, endHr) {
  if (!startHr || !endHr) return 0;
  return Number(endHr - startHr) / 1e6;
}

/**
 * Performance Tracer Middleware
 * Intercepts requests, initializes high-resolution request context,
 * and attaches Server-Timing & X-Trace-Summary headers via writeHead.
 */
function performanceTracer(req, res, next) {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const requestReceivedHr = process.hrtime.bigint();

  const context = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    timestamps: {
      request_received: requestReceivedHr,
      auth_start: null,
      auth_end: null,
      validation_start: null,
      validation_end: null,
      controller_start: requestReceivedHr,
      business_logic_start: null,
      business_logic_end: null,
      response_serialization_start: null,
      response_sent: null,
    },
    queries: [],       // { model, operation, durationMs, waitMs, txId }
    transactions: [],  // { waitMs, durationMs }
    cache: [],         // { op, key, hit, durationMs }
    external: [],      // { provider, endpoint, durationMs, status }
  };

  req.requestId = requestId;
  req.traceContext = context;
  res.setHeader('X-Request-Id', requestId);

  let finalized = false;

  function finalizeMetrics() {
    if (finalized) return;
    finalized = true;

    const responseSentHr = process.hrtime.bigint();
    context.timestamps.response_sent = responseSentHr;

    const totalMs = hrtimeToMs(context.timestamps.request_received, responseSentHr);
    const authMs = hrtimeToMs(context.timestamps.auth_start, context.timestamps.auth_end);
    const valMs = hrtimeToMs(context.timestamps.validation_start, context.timestamps.validation_end);
    const serialMs = context.timestamps.response_serialization_start
      ? hrtimeToMs(context.timestamps.response_serialization_start, responseSentHr)
      : 0;

    let dbQueriesMs = 0;
    let dbPoolWaitMs = 0;
    for (const q of context.queries) {
      dbQueriesMs += (q.durationMs || 0);
      dbPoolWaitMs += (q.waitMs || 0);
    }

    let txMs = 0;
    for (const t of context.transactions) {
      txMs += (t.durationMs || 0);
    }

    let cacheMs = 0;
    for (const c of context.cache) {
      cacheMs += (c.durationMs || 0);
    }

    let externalMs = 0;
    for (const e of context.external) {
      externalMs += (e.durationMs || 0);
    }

    const businessLogicMs = Math.max(
      0,
      totalMs - (authMs + valMs + dbQueriesMs + dbPoolWaitMs + txMs + cacheMs + externalMs + serialMs)
    );

    const summary = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      totalMs: Number(totalMs.toFixed(3)),
      authMs: Number(authMs.toFixed(3)),
      validationMs: Number(valMs.toFixed(3)),
      businessLogicMs: Number(businessLogicMs.toFixed(3)),
      dbPoolWaitMs: Number(dbPoolWaitMs.toFixed(3)),
      dbQueriesMs: Number(dbQueriesMs.toFixed(3)),
      dbQueryCount: context.queries.length,
      txMs: Number(txMs.toFixed(3)),
      txCount: context.transactions.length,
      cacheMs: Number(cacheMs.toFixed(3)),
      cacheOps: context.cache.length,
      externalMs: Number(externalMs.toFixed(3)),
      externalCount: context.external.length,
      serializationMs: Number(serialMs.toFixed(3)),
      queries: context.queries,
    };

    // Format standard W3C Server-Timing header
    const isDevOrTracing = process.env.NODE_ENV !== 'production' || process.env.ENABLE_PERF_TRACING === 'true';

    try {
      if (!res.headersSent) {
        const serverTiming = `total;dur=${summary.totalMs}, db;dur=${summary.dbQueriesMs}, auth;dur=${summary.authMs}`;
        res.setHeader('Server-Timing', serverTiming);
        if (isDevOrTracing) {
          res.setHeader('X-Trace-Summary', Buffer.from(JSON.stringify(summary)).toString('base64'));
        }
      }
    } catch (_) {}

    // Only populate memory ring buffer in development or when explicit profiling is enabled
    if (isDevOrTracing) {
      if (traceRingBuffer.size > MAX_RING_BUFFER) {
        const oldestKey = traceRingBuffer.keys().next().value;
        traceRingBuffer.delete(oldestKey);
      }
      traceRingBuffer.set(requestId, summary);
    }
  }


  // Intercept writeHead (standard Node HTTP header point)
  const originalWriteHead = res.writeHead;
  res.writeHead = function (statusCode, ...args) {
    finalizeMetrics();
    return originalWriteHead.call(this, statusCode, ...args);
  };

  // Intercept res.end as fallback
  const originalEnd = res.end;
  res.end = function (...args) {
    finalizeMetrics();
    return originalEnd.apply(this, args);
  };

  traceStorage.run(context, () => {
    next();
  });
}

function getTraceContext() {
  return traceStorage.getStore();
}

function getTraceSummary(requestId) {
  return traceRingBuffer.get(requestId) || null;
}

function recordQueryMetric({ model, operation, startHr, endHr, waitMs = 0, txId = null, error = null }) {
  const ctx = getTraceContext();
  if (!ctx) return;
  const durationMs = hrtimeToMs(startHr, endHr);
  ctx.queries.push({
    model: model || 'raw',
    operation: operation || 'query',
    durationMs: Number(durationMs.toFixed(3)),
    waitMs: Number(waitMs.toFixed(3)),
    txId,
    error: error ? error.message : null,
  });
}

function recordTxMetric({ waitMs = 0, startHr, endHr, txId = null }) {
  const ctx = getTraceContext();
  if (!ctx) return;
  const durationMs = hrtimeToMs(startHr, endHr);
  ctx.transactions.push({
    txId,
    waitMs: Number(waitMs.toFixed(3)),
    durationMs: Number(durationMs.toFixed(3)),
  });
}

function recordCacheMetric({ op, key, hit, durationMs }) {
  const ctx = getTraceContext();
  if (!ctx) return;
  ctx.cache.push({
    op,
    key: key ? String(key).slice(0, 50) : null,
    hit: Boolean(hit),
    durationMs: Number(durationMs.toFixed(3)),
  });
}

function recordExternalMetric({ provider, endpoint, startHr, endHr, status = null }) {
  const ctx = getTraceContext();
  if (!ctx) return;
  const durationMs = hrtimeToMs(startHr, endHr);
  ctx.external.push({
    provider,
    endpoint: endpoint ? String(endpoint).slice(0, 80) : null,
    durationMs: Number(durationMs.toFixed(3)),
    status,
  });
}

module.exports = {
  performanceTracer,
  getTraceContext,
  getTraceSummary,
  recordQueryMetric,
  recordTxMetric,
  recordCacheMetric,
  recordExternalMetric,
};
