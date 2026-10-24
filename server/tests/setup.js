const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
process.env.JWT_VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET || 'test_verification_secret_key_1234567890';
process.env.JWT_PASSWORD_RESET_SECRET = process.env.JWT_PASSWORD_RESET_SECRET || 'test_reset_secret_key_1234567890';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_razorpay_secret_123456';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';

// Global Injected Boundary Fakes (Event Publisher & External Email)
const mockPublishedEvents = [];
const mockSentEmails = [];

// In-Memory Database Store for User Repository Fake (mock prefix required by Jest)
const mockUsersDb = new Map();

jest.mock('../src/config/redis', () => ({
  isReady: true,
  isOpen: true,
  get: jest.fn(async () => null),
  set: jest.fn(async () => 'OK'),
  setEx: jest.fn(async () => 'OK'),
  del: jest.fn(async () => 1),
  scan: jest.fn(async () => ({ cursor: '0', keys: [] })),
  scanIterator: jest.fn(async function* () {}),
  publish: jest.fn(async () => 1),
  ping: jest.fn(async () => 'PONG'),
  sendCommand: jest.fn(async () => 'OK'),
  eval: jest.fn(async () => 1),
  on: jest.fn(),
  connect: jest.fn(async () => true),
  quit: jest.fn(async () => true),
}));

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(async () => [{ statusCode: 202 }]),
}));

jest.mock('../src/config/eventPublisher', () => ({
  publishEvent: jest.fn(async (eventName, data) => {
    mockPublishedEvents.push({ eventName, data, timestamp: Date.now() });
    return true;
  }),
}));

jest.mock('../src/modules/email/email.service', () => ({
  sendVerificationEmail: jest.fn(async (payload) => {
    mockSentEmails.push({ type: 'verification', payload });
    return true;
  }),
  sendWelcomeEmail: jest.fn(async (payload) => {
    mockSentEmails.push({ type: 'welcome', payload });
    return true;
  }),
  sendResetPasswordEmail: jest.fn(async (payload) => {
    mockSentEmails.push({ type: 'reset', payload });
    return true;
  }),
}));

// Injected Prisma Client Mock
jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn(async ({ where }) => {
      if (where?.id) return mockUsersDb.get(where.id) || null;
      if (where?.email) {
        for (const u of mockUsersDb.values()) {
          if (u.email?.toLowerCase() === where.email.toLowerCase()) return u;
        }
      }
      return null;
    }),
    create: jest.fn(async ({ data }) => {
      const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser = { id, ...data };
      mockUsersDb.set(id, newUser);
      return newUser;
    }),
    update: jest.fn(async ({ where, data }) => {
      const existing = mockUsersDb.get(where.id) || {};
      const updated = { ...existing, ...data };
      mockUsersDb.set(where.id, updated);
      return updated;
    }),
  },
  project: {
    findMany: jest.fn(async () => []),
    findUnique: jest.fn(async () => null),
    create: jest.fn(async ({ data }) => ({ id: 'project_123', ...data })),
    update: jest.fn(async ({ data }) => ({ id: 'project_123', ...data })),
  },
  userProject: {
    findMany: jest.fn(async () => []),
    findUnique: jest.fn(async () => null),
    create: jest.fn(async ({ data }) => ({ id: 'project_123', ...data })),
    update: jest.fn(async ({ data }) => ({ id: 'project_123', ...data })),
  },
  donation: {
    findFirst: jest.fn(async () => null),
    create: jest.fn(async ({ data }) => ({ id: 'donation_123', ...data })),
    update: jest.fn(async ({ data }) => ({ id: 'donation_123', ...data })),
  },
  organization: {
    findMany: jest.fn(async () => []),
    count: jest.fn(async () => 0),
  },
  $connect: jest.fn(async () => true),
  $disconnect: jest.fn(async () => true),
}));

// Injected Fake for Auth Repository (SRP / Boundary Injected Fake)
jest.mock('../src/modules/auth/auth.repository', () => {
  const userRepository = {
    findByEmail: jest.fn(async (email) => {
      const normalized = String(email || '').toLowerCase();
      for (const user of mockUsersDb.values()) {
        if (user.email?.toLowerCase() === normalized) {
          return user;
        }
      }
      return null;
    }),
    findById: jest.fn(async (id) => {
      return mockUsersDb.get(id) || null;
    }),
    create: jest.fn(async (data) => {
      const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser = { id, ...data };
      mockUsersDb.set(id, newUser);
      return newUser;
    }),
    update: jest.fn(async (id, data) => {
      const existing = mockUsersDb.get(id) || {};
      const updated = { ...existing, ...data };
      mockUsersDb.set(id, updated);
      return updated;
    }),
  };

  const membershipRepository = {
    findUserOrganizations: jest.fn(async () => []),
  };

  return {
    userRepository,
    membershipRepository,
  };
});

module.exports = {
  mockPublishedEvents,
  mockSentEmails,
  mockUsersDb,
};
