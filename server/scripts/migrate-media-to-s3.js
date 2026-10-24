#!/usr/bin/env node
/**
 * DreamXec Media Migration Script: Cloudinary -> AWS S3 & CloudFront
 *
 * Usage:
 *   node scripts/migrate-media-to-s3.js           # Live migration
 *   node scripts/migrate-media-to-s3.js --dry-run # Preview mode
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const prisma = require('../src/config/prisma');

const IS_DRY_RUN = process.argv.includes('--dry-run');
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'dreamxec';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const CLOUDFRONT_URL = (process.env.CLOUDFRONT_URL || `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com`).replace(/\/$/, '');

function getS3() {
  const config = { region: REGION };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  return new S3Client(config);
}

const s3 = getS3();

async function uploadBuffer(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
  });
  await s3.send(command);
  return `${CLOUDFRONT_URL}/${key}`;
}

async function migrateUrl(originalUrl, targetFolder, entityId) {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  const filename = path.basename(originalUrl.split('?')[0]) || `${Date.now()}.jpg`;
  const s3Key = `dreamxec/migrated/${targetFolder}/${entityId}-${filename}`;

  try {
    const res = await axios.get(originalUrl, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    const buffer = Buffer.from(res.data);
    const contentType = res.headers['content-type'] || 'image/jpeg';

    if (!IS_DRY_RUN) {
      const newUrl = await uploadBuffer(buffer, s3Key, contentType);
      return { success: true, newUrl, isFallback: false };
    }
    return { success: true, newUrl: `${CLOUDFRONT_URL}/${s3Key}`, isFallback: false };
  } catch (err) {
    // Cloudinary returned 401 or failed — substitute with default CloudFront placeholder
    const fallbackUrl = `${CLOUDFRONT_URL}/dreamxec/assets/default_campaign_cover.webp`;
    return { success: false, newUrl: fallbackUrl, isFallback: true, error: err.message };
  }
}

async function run() {
  console.log('====================================================');
  console.log(`🚀 DreamXec Media Migration [${IS_DRY_RUN ? 'DRY-RUN' : 'LIVE'}]`);
  console.log(`Bucket:     ${BUCKET_NAME}`);
  console.log(`CloudFront: ${CLOUDFRONT_URL}`);
  console.log('====================================================\n');

  let totalMigrated = 0;
  let totalFallbacks = 0;

  // 1. Migrate Campaigns
  console.log('🔍 Checking Campaigns...');
  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { coverImageUrl: { contains: 'cloudinary.com' } },
        { presentationDeckUrl: { contains: 'cloudinary.com' } },
      ],
    },
    select: { id: true, title: true, coverImageUrl: true, presentationDeckUrl: true, galleryImageUrls: true },
  });

  console.log(`Found ${campaigns.length} campaigns with Cloudinary URLs.`);

  for (const c of campaigns) {
    console.log(`\n📦 Campaign: ${c.title} (${c.id})`);
    const updates = {};

    if (c.coverImageUrl && c.coverImageUrl.includes('cloudinary.com')) {
      const result = await migrateUrl(c.coverImageUrl, 'campaigns', c.id);
      console.log(`   Cover Image: ${c.coverImageUrl.slice(0, 45)}... -> ${result.newUrl} ${result.isFallback ? '[FALLBACK]' : '[MIGRATED]'}`);
      updates.coverImageUrl = result.newUrl;
      if (result.isFallback) totalFallbacks++; else totalMigrated++;
    }

    if (c.presentationDeckUrl && c.presentationDeckUrl.includes('cloudinary.com')) {
      const result = await migrateUrl(c.presentationDeckUrl, 'proposals', c.id);
      console.log(`   Deck: ${result.newUrl} ${result.isFallback ? '[FALLBACK]' : '[MIGRATED]'}`);
      updates.presentationDeckUrl = result.newUrl;
      if (result.isFallback) totalFallbacks++; else totalMigrated++;
    }

    if (!IS_DRY_RUN && Object.keys(updates).length > 0) {
      await prisma.campaign.update({
        where: { id: c.id },
        data: updates,
      });
    }
  }

  // 2. Migrate User Profiles
  console.log('\n🔍 Checking User Profiles...');
  const users = await prisma.user.findMany({
    where: {
      profileMetadata: {
        path: ['profilePicture'],
        string_contains: 'cloudinary.com',
      },
    },
    select: { id: true, email: true, profileMetadata: true },
  }).catch(() => []);

  console.log(`Found ${users.length} users with Cloudinary avatars in profileMetadata.`);

  for (const u of users) {
    const meta = u.profileMetadata || {};
    const oldPic = meta.profilePicture;
    if (oldPic && oldPic.includes('cloudinary.com')) {
      const result = await migrateUrl(oldPic, 'avatars', u.id);
      meta.profilePicture = result.newUrl;
      console.log(`   User (${u.email}): ${result.newUrl}`);
      if (!IS_DRY_RUN) {
        await prisma.user.update({
          where: { id: u.id },
          data: { profileMetadata: meta },
        });
      }
      if (result.isFallback) totalFallbacks++; else totalMigrated++;
    }
  }

  // 3. Migrate User Doc Vault
  console.log('\n🔍 Checking User Doc Vault...');
  const vaultItems = await prisma.userDocVault.findMany({
    where: {
      fileUrl: { contains: 'cloudinary.com' },
    },
    select: { id: true, title: true, fileUrl: true },
  }).catch(() => []);

  console.log(`Found ${vaultItems.length} doc vault records with Cloudinary URLs.`);

  for (const v of vaultItems) {
    const result = await migrateUrl(v.fileUrl, 'vault', v.id);
    console.log(`   Doc Vault (${v.title}): ${result.newUrl}`);
    if (!IS_DRY_RUN) {
      await prisma.userDocVault.update({
        where: { id: v.id },
        data: { fileUrl: result.newUrl },
      });
    }
    if (result.isFallback) totalFallbacks++; else totalMigrated++;
  }

  console.log('\n====================================================');
  console.log('🎉 Migration Completed!');
  console.log(`Total Uploaded/Migrated: ${totalMigrated}`);
  console.log(`Total Handled Fallback:  ${totalFallbacks}`);
  console.log('====================================================');
}

run()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
