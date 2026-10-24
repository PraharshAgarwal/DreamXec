const path = require('path');
const defaultService = require('../platform.service');
const catchAsync = require('../../../utils/catchAsync');

class FileUploadController {
  constructor(service = defaultService) {
    this.service = service;
  }

  uploadFile = catchAsync(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided in request',
      });
    }

    const folder = req.body?.folder || 'campaigns';
    const rawResult = await this.service.uploadFile(req.file, folder);
    const fileUrl =
      typeof rawResult === 'string'
        ? rawResult
        : rawResult?.url?.url || rawResult?.url || rawResult?.secureUrl;

    if (!fileUrl) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process and store file upload',
      });
    }

    const ext = req.file.originalname ? path.extname(req.file.originalname).replace('.', '') : '';
    const isImg = req.file.mimetype ? req.file.mimetype.startsWith('image/') : false;
    const isVid = req.file.mimetype ? req.file.mimetype.startsWith('video/') : false;

    res.status(200).json({
      status: 'success',
      data: {
        url: fileUrl,
        secureUrl: fileUrl,
        publicId: `${folder}/${Date.now()}-${req.file.originalname}`,
        originalFilename: req.file.originalname,
        bytes: req.file.size,
        format: ext,
        resourceType: isImg ? 'image' : isVid ? 'video' : 'raw',
      },
    });
  });

  getPresignedUrl = catchAsync(async (req, res) => {
    const { filename, contentType, folder = 'campaigns' } = req.body;
    if (!filename) {
      return res.status(400).json({
        status: 'error',
        message: 'Filename is required to generate presigned upload URL',
      });
    }

    const presignedData = await this.service.generatePresignedUploadUrl({
      filename,
      contentType: contentType || 'application/octet-stream',
      folder,
    });

    if (!presignedData) {
      return res.status(200).json({
        status: 'disabled',
        enabled: false,
        message: 'AWS S3 storage is not configured on this server instance',
        data: null,
      });
    }

    res.status(200).json({
      status: 'success',
      data: presignedData,
    });
  });

  getUploadSignature = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'disabled',
      enabled: false,
      message: 'Cloudinary direct signature is disabled or not configured',
      data: null,
    });
  });
}


module.exports = new FileUploadController();
module.exports.FileUploadController = FileUploadController;
