const prismaRepositoryAdapter = require('./adapters/prisma-platform-repository.adapter');
const s3StorageAdapter = require('./adapters/s3-storage-provider.adapter');
const mapper = require('./platform.mapper');
const redis = require('../../config/redis');
const { InvalidOtpError } = require('./platform.errors');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function normalizeRecipient(recipient, type) {
  if (type === 'phone') return normalizePhone(recipient);
  return String(recipient || '').trim().toLowerCase();
}

class PlatformService {
  constructor({
    repositoryPort = prismaRepositoryAdapter,
    storagePort = s3StorageAdapter,
  } = {}) {
    this.repositoryPort = repositoryPort;
    this.storagePort = storagePort;
  }

  async getAllColleges(searchQuery) {
    const rawColleges = await this.repositoryPort.findAllColleges(searchQuery);
    return rawColleges.map((c) => mapper.toCollegeDto(c));
  }

  async subscribeNewsletter(email) {
    return this.repositoryPort.subscribeNewsletter(email);
  }

  async sendOtp({ recipient, type }) {
    const normalizedRecipient = normalizeRecipient(recipient, type);
    const otp = generateOtp();
    const redisKey = `otp:${type}:${normalizedRecipient}`;
    await redis.set(redisKey, otp, { EX: 300 }); // 5 minutes TTL

    console.log(`[PlatformService] Dispatched OTP ${otp} to ${type}: ${normalizedRecipient}`);

    return { message: `OTP sent successfully to ${type}` };
  }

  async verifyOtp({ recipient, otp, type }) {
    const normalizedRecipient = normalizeRecipient(recipient, type);
    const redisKey = `otp:${type}:${normalizedRecipient}`;
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new InvalidOtpError();
    }

    await redis.del(redisKey);
    await redis.set(`verified:${type}:${normalizedRecipient}`, 'true', { EX: 3600 }); // 1 hour verified session

    return { message: 'OTP verified successfully' };
  }

  async generateSitemapXml() {
    const entries = await this.repositoryPort.findSitemapEntries();
    return mapper.buildSitemapXml(entries);
  }

  generateRobotsTxt() {
    return mapper.buildRobotsTxt();
  }

  async uploadFile(file, folder = 'uploads') {
    const result = await this.storagePort.uploadFile(file, folder);
    const url =
      typeof result === 'string'
        ? result
        : result?.url?.url || result?.url || result?.secureUrl || null;
    return { url };
  }

  async generatePresignedUploadUrl(params) {
    return this.storagePort.generatePresignedUploadUrl(params);
  }
}

module.exports = new PlatformService();
module.exports.PlatformService = PlatformService;
module.exports.normalizePhone = normalizePhone;
module.exports.normalizeRecipient = normalizeRecipient;

