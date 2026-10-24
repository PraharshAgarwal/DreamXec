const express = require('express');
const uploadController = require('../controllers/file-upload.controller');
const upload = require('../../../middleware/upload.middleware');
const { protect } = require('../../../middleware/auth.middleware');

const router = express.Router();

// Backend multipart streaming upload to S3 / local disk
router.post('/', protect, upload.single('file'), uploadController.uploadFile);

// AWS S3 Direct Upload Presigned URL endpoints
router.post('/presign', protect, uploadController.getPresignedUrl);
router.post('/presigned-url', protect, uploadController.getPresignedUrl);
router.post('/signature', protect, uploadController.getUploadSignature);

module.exports = router;


