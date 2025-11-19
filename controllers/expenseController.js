import { Expense, Project, User, ExpenseNotificationSettings } from '../models/index.js';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';
import sequelize from '../config/db.config.js';
import { check, validationResult } from 'express-validator';
import admin from '../crons/firebase.js';

// Helper function to send expense notification
async function sendExpenseNotification(userId, title, body) {
  try {
    const user = await User.findOne({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
    if (!user || !user.fcmToken) {
      return;
    }

    const settings = await ExpenseNotificationSettings.findOne({
      where: { userId },
    });

    // Check if notifications are enabled for this user
    if (settings && !settings.enabled) {
      return;
    }

    const message = {
      token: user.fcmToken,
      data: {
        title,
        body,
        type: 'expense',
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    await admin.messaging().send(message);
  } catch (error) {
    console.error('Error sending expense notification:', error);
  }
}

export const validateCreateExpense = [
  check('projectId').notEmpty().withMessage('Project ID is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  check('date').notEmpty().withMessage('Date is required'),
  check('paidBy').notEmpty().withMessage('Paid By is required'),
];

export const createExpense = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { projectId, description, amount, date, paidBy } = req.body;
    const file = req.file;

    let fileUrl = null;
    let fileKey = null;

    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed' });
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return res.status(400).json({ error: 'File size exceeds 5MB' });
      }

      const uniquePrefix = Date.now();
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const sanitizedFileName = description.replace(/\s+/g, '_').substring(0, 50);
      const fileName = `expense_${projectId}_${uniquePrefix}_${sanitizedFileName}.${fileExtension}`;
      fileKey = `expenses/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);
      fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    }

    const expense = await Expense.create({
      projectId,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      paidBy: parseInt(paidBy),
      fileUrl,
      fileKey,
    });

    // Get project and user info for notification
    const project = await Project.findOne({
      where: {
        id: projectId,
        deletedAt: null,
      },
    });
    const paidByUser = await User.findOne({
      where: {
        id: paidBy,
        deletedAt: null,
      },
    });

    // Get all active users (excluding soft-deleted users)
    // Filter to only users with expense permissions (all, expense) or all users
    const allUsers = await User.findAll({
      where: {
        deletedAt: null,
      },
      attributes: ['id', 'name', 'fcmToken', 'permissions'],
    });

    // Filter users who should receive notifications
    // Include users with 'all' or 'expense' permissions, or if permissions field is empty/null (default to all)
    const usersToNotify = allUsers.filter(user => {
      // Exclude the user who paid for the expense
      if (user.id === parseInt(paidBy)) {
        return false;
      }
      
      // Include users with 'all' or 'expense' permissions (default empty -> all)
      const rawPermission = user.permissions ?? user.permission ?? 'all';
      const permission = rawPermission.toLowerCase();
      return permission === 'all' || permission === 'expense';
    });

    // Send notifications to all eligible users
    const notificationPromises = usersToNotify.map(async (user) => {
      const settings = await ExpenseNotificationSettings.findOne({
        where: { userId: user.id },
      });

      // Check if notifications are enabled for this user
      if (settings && !settings.enabled) {
        return; // Skip if notifications are disabled
      }

      // Check if notifyOnAdd is enabled (if settings exist)
      if (settings && settings.notifyOnAdd === false) {
        return; // Skip if notifyOnAdd is specifically disabled
      }

      // Send notification
      await sendExpenseNotification(
        user.id,
        'New Expense Added',
        `${paidByUser?.name || 'Someone'} added expense "${description}" of ₹${parseFloat(amount).toFixed(2)} to project "${project?.name || 'Unknown'}"`
      );
    });

    // Execute all notifications in parallel (don't wait for them to complete)
    Promise.all(notificationPromises).catch(error => {
      console.error('Error sending expense notifications to users:', error);
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listExpenses = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const expenses = await Expense.findAll({
      where: { 
        projectId,
        deletedAt: null,
      },
      include: [
        {
          model: User,
          as: 'paidByUser',
          attributes: ['id', 'name'],
        },
      ],
      order: [['date', 'DESC']],
      raw: false, // Ensure we get Sequelize model instances
    });

    // Convert DECIMAL amounts to numbers for JSON response
    const expensesData = expenses.map(expense => ({
      id: expense.id,
      projectId: expense.projectId,
      description: expense.description,
      amount: parseFloat(expense.amount) || 0, // Convert DECIMAL to number
      date: expense.date,
      paidBy: expense.paidBy,
      fileUrl: expense.fileUrl,
      fileKey: expense.fileKey,
      paidByUser: expense.paidByUser,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    }));

    res.status(200).json({
      success: true,
      expenses: expensesData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing expense ID' });
    }

    const expense = await Expense.findOne({
      where: {
        id,
        deletedAt: null,
      },
      include: [
        {
          model: User,
          as: 'paidByUser',
          attributes: ['id', 'name'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'location'],
          where: {
            deletedAt: null,
          },
          required: false,
        },
      ],
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSignedExpenseFileUrl = async (req, res) => {
  try {
    const { fileKey } = req.query;
    if (!fileKey) {
      return res.status(400).json({ error: 'fileKey is required' });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.json({ signedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
};

export const updateExpense = async (req, res) => {
  // Validate required fields (file is optional for updates)
  const { description, amount, date, paidBy } = req.body;
  if (!description || !amount || !date || !paidBy) {
    return res.status(400).json({ error: 'Description, amount, date, and paidBy are required' });
  }

  try {
    const { id } = req.params;
    const file = req.file;

    const expense = await Expense.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    let fileUrl = expense.fileUrl;
    let fileKey = expense.fileKey;

    // If a new file is uploaded, delete old file and upload new one
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed' });
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return res.status(400).json({ error: 'File size exceeds 5MB' });
      }

      // Delete old file from S3 if exists
      if (fileKey) {
        try {
          const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileKey,
          });
          await s3Client.send(deleteCommand);
        } catch (deleteError) {
          console.error('Error deleting old file:', deleteError);
        }
      }

      // Upload new file
      const uniquePrefix = Date.now();
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const sanitizedFileName = description.replace(/\s+/g, '_').substring(0, 50);
      const fileName = `expense_${expense.projectId}_${uniquePrefix}_${sanitizedFileName}.${fileExtension}`;
      fileKey = `expenses/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);
      fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    }

    await expense.update({
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      paidBy: parseInt(paidBy),
      fileUrl,
      fileKey,
    });

    // Get project info for notification
    const project = await Project.findByPk(expense.projectId);
    const paidByUser = await User.findByPk(paidBy);

    // Send notification to the user who paid (if enabled)
    const settings = await ExpenseNotificationSettings.findOne({
      where: { userId: paidBy },
    });

    if (!settings || (settings.enabled && settings.notifyOnUpdate)) {
      await sendExpenseNotification(
        paidBy,
        'Expense Updated',
        `Expense "${description}" updated to ₹${parseFloat(amount).toFixed(2)} in project "${project?.name || 'Unknown'}"`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      expense,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Get expense info before deleting for notification
    const project = await Project.findByPk(expense.projectId);

    // Soft delete: set deletedAt timestamp
    // Note: We keep the S3 file for potential recovery, but you can delete it if needed
    await expense.update({
      deletedAt: new Date(),
    });

    // Send notification to the user who paid (if enabled)
    const settings = await ExpenseNotificationSettings.findOne({
      where: { userId: expense.paidBy },
    });

    if (!settings || (settings.enabled && settings.notifyOnDelete)) {
      await sendExpenseNotification(
        expense.paidBy,
        'Expense Deleted',
        `Expense "${expense.description}" of ₹${parseFloat(expense.amount).toFixed(2)} deleted from project "${project?.name || 'Unknown'}"`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

