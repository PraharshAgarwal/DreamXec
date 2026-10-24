const express = require('express');
const projectController = require('../controllers/project.controller');

const router = express.Router();

router.get('/public', projectController.getDonorProjects);
router.get('/my', projectController.getDonorProjects);
router.get('/:id', projectController.getDonorProjects);
router.get('/', projectController.getDonorProjects);

module.exports = router;
