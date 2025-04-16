import express from "express";
import { listDocuments, uploadFile, getDocumentsByUploader,getDocumentById,deleteDocumentById } from "../controllers/documentController.js";
import multer from 'multer';

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();


const storage = multer.memoryStorage(); // use memory to prepare for S3 upload
const upload = multer({ storage });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);
router.get("/getList", listDocuments);
router.get("/getListByUserId/:uploaderId", getDocumentsByUploader);
router.get("/getDocumentById/:id", getDocumentById);
router.delete('/deleteDoc/:id', deleteDocumentById);


export default router;
