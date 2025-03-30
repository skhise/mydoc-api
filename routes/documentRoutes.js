import express from "express";
import { listDocuments, uploadFile } from "../controllers/documentController.js";

const router = express.Router();

// Register User
router.post("/upload", uploadFile);
router.get("/list", listDocuments);


export default router;
