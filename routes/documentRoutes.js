import express from "express";
import { listDocuments, uploadFile } from "../controllers/documentController.js";

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(authenticateToken);
// Register User
router.post("/upload", uploadFile);
router.get("/list", listDocuments);


export default router;
