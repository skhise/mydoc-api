import express from "express";
import { getFolders,listDocuments, uploadFile, getDocumentsByUploader,getDocumentById,deleteDocumentById, getSignedFileUrl, getFevList, deleteFolderById } from "../controllers/documentController.js";
import multer from 'multer';

import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();


const storage = multer.memoryStorage(); // use memory to prepare for S3 upload
const upload = multer({ storage });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);
router.get("/getList", listDocuments);
router.get("/get-fev-list", getFevList);
router.get("/getFolders", getFolders);
router.get("/getListByUserId/:uploaderId", getDocumentsByUploader);
router.get("/getDocumentById/:id", getDocumentById);
router.delete('/delete/:id', deleteDocumentById);
router.delete('/folder/:id', deleteFolderById);
router.get('/get-signed-url', getSignedFileUrl);


export default router;
