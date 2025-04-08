import express from "express";
import { 
    getAllReminder, 
    createReminder,
    getReminderByUserID,
    getReminderByReminderID,
    deleteReminderByID,
    updateReminderByID
} from "../controllers/reminderController.js";

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(authenticateToken);

router.post("/createReminder", createReminder);
router.get("/getAllReminder", getAllReminder);
router.get("/getReminderByUserID/:created_by", getReminderByUserID);
router.get("/getReminderByReminderID/:id", getReminderByReminderID);
router.get("/updateReminderByID/:id", updateReminderByID);
router.get("/deleteReminderByID/:id", deleteReminderByID);


export default router;