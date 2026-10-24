const express = require("express");
const { checkRedisHealth } = require("../utils/redisHealth");
const prisma = require("../../../config/prisma");

const router = express.Router();

/**
 * 1. Fast Liveness Probe (for AWS ALB / Kubernetes / Docker)
 * Returns 200 if Node.js process is alive and accepting connections
 */
router.get("/health/live", (req, res) => {
  res.status(200).json({ status: "alive", timestamp: new Date().toISOString() });
});

/**
 * 2. Deep Readiness Probe (for AWS ALB / Deployments)
 * Probes database connectivity to ensure container is ready to accept user traffic
 */
router.get("/health/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", database: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "not_ready", database: "disconnected", error: err.message });
  }
});

/**
 * 3. Comprehensive Health Status Endpoint
 */
router.get(["/health", "/health/status"], async (req, res) => {
  const start = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = "unhealthy";
  }

  const redisHealth = await checkRedisHealth().catch(() => ({ status: "unhealthy" }));
  const isHealthy = dbStatus === "healthy";

  const memoryUsage = process.memoryUsage();

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    service: "DreamXec API",
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - start,
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      redis: redisHealth,
    },
    system: {
      nodeVersion: process.version,
      memoryRssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

