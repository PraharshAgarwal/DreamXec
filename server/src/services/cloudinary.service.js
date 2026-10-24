const path = require('path');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dreamxec',
  api_key: process.env.CLOUDINARY_API_KEY || 'test_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'test_api_secret',
  secure: true,
});

/**
 * Upload file buffer directly to Cloudinary with auto/raw type resolution for multi-format support (.pdf, .doc, .docx, .ppt, .pptx, images)
 */
async function uploadBufferToCloudinary(fileBuffer, { folder = 'verifications', originalname = 'document' } = {}) {
  return new Promise((resolve, reject) => {
    const ext = originalname ? path.extname(originalname).toLowerCase() : '';
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(ext);
    // For PDFs, Word docs, PPTX, use raw or auto
    const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${path.parse(originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        use_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url || result.url,
          publicId: result.public_id,
          format: result.format || ext.replace('.', ''),
          bytes: result.bytes,
          resourceType,
        });
      }
    );

    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
}

/**
 * Generate ephemeral HMAC-SHA256 signature for client-side direct uploads.
 * Bypasses backend node server file streaming.
 */
function generateUploadSignature({
  folder = 'campaigns',
  tags = 'dreamxec',
  resourceType = 'auto',
  transformation = undefined,
} = {}) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dreamxec';
  const apiKey = process.env.CLOUDINARY_API_KEY || 'test_api_key';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'test_api_secret';

  const paramsToSign = {
    folder,
    timestamp,
  };

  if (tags) {
    paramsToSign.tags = tags;
  }

  if (transformation) {
    paramsToSign.transformation = transformation;
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
    tags,
    resourceType,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
  };
}

/**
 * Generate authenticated signed URL for downloading private documents (PDFs, KYB, Invoices)
 */
function generateSignedDocumentUrl(publicId, { version, format = 'pdf', expiresInSeconds = 3600 } = {}) {
  const expiresAt = Math.round(new Date().getTime() / 1000) + expiresInSeconds;
  return cloudinary.utils.private_download_url(publicId, format, {
    expires_at: expiresAt,
  });
}

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  generateUploadSignature,
  generateSignedDocumentUrl,
};
