import express from "express";
import { listReminders, registerReminder } from "../controllers/reminderController.js";

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(authenticateToken);
// Register User
router.post("/add", registerReminder);
router.post("/list", listReminders);


export default router;