const { PrismaClient } = require('@prisma/client');
const { loadEnv } = require('../config/env');

async function test() {
  await loadEnv();
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log("DIRECT_URL:", process.env.DIRECT_URL);
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("✅ SUCCESS: Connected to Prisma!");
  } catch (err) {
    console.error("❌ CONNECTION FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
