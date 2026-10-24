const express = require('express');
const projectController = require('../controllers/project.controller');
const { protect } = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { createProjectSchema, updateProjectSchema } = require('../project.validation');

const router = express.Router();

router.get('/public', projectController.getPublicUserProjects);
router.get('/my', protect, projectController.getMyUserProjects);
router.get('/analytics', protect, projectController.getStudentAnalytics);
router.post('/action', protect, projectController.submitMilestone);

router.get('/:id', projectController.getUserProject);
router.post('/', protect, validate(createProjectSchema), projectController.createUserProject);
router.patch('/:id', protect, validate(updateProjectSchema), projectController.updateUserProject);
router.delete('/:id', protect, projectController.deleteUserProject);

module.exports = router;
