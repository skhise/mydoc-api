import express from "express";
import { listReminders, registerReminder } from "../controllers/reminderController.js";

const router = express.Router();

// Register User
router.post("/add", registerReminder);
router.post("/list", listReminders);


export default router;