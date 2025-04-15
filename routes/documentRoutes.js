import express from "express";
import { listDocuments, uploadFile } from "../controllers/documentController.js";
import multer from 'multer';

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();


const storage = multer.memoryStorage(); // use memory to prepare for S3 upload
const upload = multer({ storage });

router.use(authenticateToken);
// Register User
router.post('/upload', upload.single('file'), uploadFile);

router.get("/list", listDocuments);


export default router;
