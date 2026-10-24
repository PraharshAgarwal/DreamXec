const defaultService = require('../project.service');
const catchAsync = require('../../../utils/catchAsync');

class ProjectController {
  constructor(service = defaultService) {
    this.service = service;
  }

  createUserProject = catchAsync(async (req, res) => {
    const project = await this.service.createUserProject({
      title: req.body.title,
      description: req.body.description,
      user: req.user,
    });

    res.status(201).json({
      status: 'success',
      data: { userProject: project },
    });
  });

  updateUserProject = catchAsync(async (req, res) => {
    const updatedProject = await this.service.updateUserProject({
      id: req.params.id,
      title: req.body.title,
      description: req.body.description,
      stage: req.body.stage,
      user: req.user,
    });

    res.status(200).json({
      status: 'success',
      data: { userProject: updatedProject },
    });
  });

  deleteUserProject = catchAsync(async (req, res) => {
    await this.service.deleteUserProject({
      id: req.params.id,
      user: req.user,
    });

    res.status(204).json({ status: 'success' });
  });

  getUserProject = catchAsync(async (req, res) => {
    const userProject = await this.service.getUserProject(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { userProject },
    });
  });

  getPublicUserProjects = catchAsync(async (req, res) => {
    const payload = await this.service.getPublicUserProjects({
      limit: req.query.limit,
      cursor: req.query.cursor,
    });

    res.status(200).json(payload);
  });

  getMyUserProjects = catchAsync(async (req, res) => {
    const userProjects = await this.service.getMyUserProjects(req.user.id);

    res.status(200).json({
      status: 'success',
      results: userProjects.length,
      data: { userProjects },
    });
  });

  getStudentAnalytics = catchAsync(async (req, res) => {
    const analytics = await this.service.getStudentAnalytics(req.user.id);

    res.status(200).json({
      status: 'success',
      data: { analytics },
    });
  });

  submitMilestone = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Action submitted successfully',
    });
  });

  getDonorProjects = catchAsync(async (req, res) => {
    const donorProjects = await this.service.getDonorProjects();

    res.status(200).json({
      status: 'success',
      results: donorProjects.length,
      data: { donorProjects },
    });
  });
}

module.exports = new ProjectController();
module.exports.ProjectController = ProjectController;
