import Document from "../models/Document.model.js";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';

export const uploadFile = async (req, res) => {
    try {
      const file = req.file;
      const { name, folder_name, uploaded_by, password } = req.body;
  
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const originalName = file.originalname; 
      const sanitizedFileName = originalName.replace(/\s+/g, '_');
      const uniquePrefix = Date.now();
  
      const fileKey = `documents/${uploaded_by}_${uniquePrefix}_${sanitizedFileName}`;
  
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
  
      const result = await s3Client.send(command);  
  
      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
  
      const document = await Document.create({
        name,
        folder_name,
        uploaded_by,
        aws_file_name: fileUrl,
        password,
      });
  
      res.status(201).json({
        success: true,
        message: "File uploaded to S3 and document saved",
        document,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  export const listDocuments = async (req, res) => {
    try {
      const documents = await Document.findAll(); 
      res.status(200).json({
        success: true,
        documents,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  export const getDocumentsByUploader = async (req, res) => {
    try {
      const { uploaderId } = req.params;
      if (!uploaderId) {
        return res.status(400).json({ error: "Missing uploaderId in URL path" });
      }
  
      const documents = await Document.findAll({
        where: { uploaded_by: uploaderId },
      });
  
      res.status(200).json({
        success: true,
        documents,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  export const getDocumentById = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ error: "Missing document ID in URL path" });
      }
  
      const document = await Document.findByPk(id);
  
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
  
      res.status(200).json({
        success: true,
        document,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  export const deleteDocumentById = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ error: "Missing document ID in URL path" });
      }
  
      const document = await Document.findByPk(id);
  
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
  
      await document.destroy(); // Deletes the record
  
      res.status(200).json({
        success: true,
        message: `Document with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };