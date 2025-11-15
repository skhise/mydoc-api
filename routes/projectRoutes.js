import express from 'express';
import {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  validateCreateProject,
} from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', validateCreateProject, createProject);
router.get('/', listProjects);
router.get('/:id', getProjectById);
router.put('/:id', validateCreateProject, updateProject);
router.delete('/:id', deleteProject);

export default router;

