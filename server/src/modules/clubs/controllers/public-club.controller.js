const defaultClubService = require('../club.service');
const catchAsync = require('../../../utils/catchAsync');

class PublicClubController {
  constructor(svc = defaultClubService) {
    this.service = svc;
  }

  getPublicClubs = catchAsync(async (req, res) => {
    const response = await this.service.getPublicClubs(req.query);
    res.status(200).json(response);
  });

  getClubById = catchAsync(async (req, res) => {
    const response = await this.service.getClubById(req.params.id);
    res.status(200).json(response);
  });

  referClub = catchAsync(async (req, res) => {
    const response = await this.service.referClub(req.body);
    res.status(201).json(response);
  });

  uploadMembers = catchAsync(async (req, res) => {
    let membersList = [];
    const { parseCsv } = require('../../../utils/csvParser');

    if (req.file) {
      const fs = require('fs');
      let csvContent = '';
      if (req.file.buffer) {
        csvContent = req.file.buffer.toString('utf-8');
      } else if (req.file.path) {
        csvContent = fs.readFileSync(req.file.path, 'utf-8');
        try { fs.unlinkSync(req.file.path); } catch (e) {} // clean up temp file
      }
      membersList = parseCsv(csvContent);
    } else if (typeof req.body.members === 'string') {
      membersList = parseCsv(req.body.members);
    } else if (Array.isArray(req.body.members)) {
      membersList = req.body.members;
    }

    const response = await this.service.uploadMembers(req.params.id, membersList);
    res.status(200).json({ status: 'success', data: response });
  });

  submitClubVerification = catchAsync(async (req, res) => {
    res.status(200).json({ success: true, message: 'Verification submitted successfully' });
  });

  updateClubProfile = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const updatedClub = await this.service.updateClubProfile(req.params.id, userId, req.body);
    res.status(200).json({ success: true, data: updatedClub, message: 'Club profile updated successfully' });
  });

  transferPresidency = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const result = await this.service.transferPresidency(req.params.id, userId, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Club presidency succession completed successfully',
      data: result,
    });
  });

  joinClub = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const response = await this.service.joinClub(req.params.id, userId, req.body.role || 'STUDENT');
    res.status(200).json(response);
  });
}

module.exports = new PublicClubController();
module.exports.PublicClubController = PublicClubController;
