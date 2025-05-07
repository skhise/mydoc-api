import express from "express";
import { getFolders,listDocuments, uploadFile, getDocumentsByUploader,getDocumentById,deleteDocumentById, getSignedFileUrl } from "../controllers/documentController.js";
import multer from 'multer';

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();


const storage = multer.memoryStorage(); // use memory to prepare for S3 upload
const upload = multer({ storage });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);
router.get("/getList", listDocuments);
router.get("/getFolders", getFolders);
router.get("/getListByUserId/:uploaderId", getDocumentsByUploader);
router.get("/getDocumentById/:id", getDocumentById);
router.delete('/deleteDoc/:id', deleteDocumentById);
router.get('/get-signed-url', getSignedFileUrl);


export default router;
