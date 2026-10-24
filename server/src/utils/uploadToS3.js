const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs/promises");
const path = require("path");

function getS3Client() {
  const region = process.env.AWS_REGION || "ap-south-1";
  const config = { region };

  // If explicit credentials exist, use them; otherwise AWS SDK automatically picks up IAM role/instance metadata
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return new S3Client(config);
}

function getCloudFrontOrS3Url(key) {
  const cdnUrl = process.env.CLOUDFRONT_URL || process.env.CLOUDFROUNTURL;
  if (cdnUrl) {
    const baseUrl = cdnUrl.replace(/\/$/, "");
    return `${baseUrl}/${key}`;
  }
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || "ap-south-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function uploadToS3(file, folder = "uploads") {
  if (!file) return null;

  try {
    let fileContent;
    if (file.buffer) {
      fileContent = file.buffer;
    } else if (file.path) {
      fileContent = await fs.readFile(file.path);
    } else {
      throw new Error("No file content or buffer found in upload request");
    }

    const bucketName = process.env.AWS_BUCKET_NAME;

    // 1. Primary: AWS S3 Storage
    if (bucketName) {
      try {
        const s3 = getS3Client();
        const ext = file.originalname ? path.extname(file.originalname) : "";
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const key = `${folder}/${filename}`;

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: file.mimetype || "application/octet-stream",
        });

        await s3.send(command);

        if (file.path) {
          await fs.unlink(file.path).catch(() => {});
        }

        return getCloudFrontOrS3Url(key);
      } catch (awsErr) {
        console.warn("[Storage] AWS S3 upload failed, checking fallbacks:", awsErr.message);
      }
    }

    // 2. Secondary Fallback: Local Disk Storage (offline / dev only)
    const ext = file.originalname ? path.extname(file.originalname) : "";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetDir = path.join(process.cwd(), "uploads", folder);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, filename), fileContent);

    if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    return `/uploads/${folder}/${filename}`;
  } catch (err) {
    console.error("Storage Upload Error:", err);
    return null;
  }
}

/**
 * Generate an AWS S3 Presigned PUT URL for direct client-to-S3 uploads
 */
async function generatePresignedUploadUrl({ filename, contentType, folder = "uploads", expiresIn = 300 }) {
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    return null;
  }

  const s3 = getS3Client();
  const ext = filename ? path.extname(filename) : "";
  const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
  const fileUrl = getCloudFrontOrS3Url(key);

  return {
    uploadUrl,
    fileUrl,
    key,
    bucket: bucketName,
    expiresIn,
  };
}

module.exports = {
  uploadToS3,
  generatePresignedUploadUrl,
  getCloudFrontOrS3Url,
};