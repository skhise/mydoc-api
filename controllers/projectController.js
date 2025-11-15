import { Project, Expense } from '../models/index.js';
import sequelize from '../config/db.config.js';
import { QueryTypes } from 'sequelize';
import { check, validationResult } from 'express-validator';

export const validateCreateProject = [
  check('name').notEmpty().withMessage('Project name is required'),
  check('location').notEmpty().withMessage('Location is required'),
];

export const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, location } = req.body;

    const project = await Project.create({
      name,
      location,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: {
        deletedAt: null,
      },
      include: [
        {
          model: Expense,
          as: 'expenses',
          attributes: ['amount'],
          required: false,
          where: {
            deletedAt: null,
          },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const projectsWithTotal = await Promise.all(
      projects.map(async (project) => {
        // Calculate total expenses for this project using raw query for better DECIMAL handling
        // Only include non-deleted expenses
        const [result] = await sequelize.query(
          `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE projectId = :projectId AND deletedAt IS NULL`,
          {
            replacements: { projectId: project.id },
            type: QueryTypes.SELECT,
          }
        );

        const totalExpenses = result?.total ? parseFloat(result.total) : 0;

        return {
          id: project.id,
          name: project.name,
          location: project.location,
          totalExpenses: totalExpenses,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      projects: projectsWithTotal,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing project ID' });
    }

    const project = await Project.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { name, location } = req.body;

    const project = await Project.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.update({
      name,
      location,
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project has non-deleted expenses
    const expenseCount = await Expense.count({ 
      where: { 
        projectId: id,
        deletedAt: null,
      } 
    });
    if (expenseCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete project with existing expenses. Please delete all expenses first.' 
      });
    }

    // Soft delete: set deletedAt timestamp
    await project.update({
      deletedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

