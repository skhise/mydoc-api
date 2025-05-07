import Document from "../models/Document.model.js";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";
import Folder from "../models/Folder.model.js";
import sequelize from "../config/db.config.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const uploadFile = async (req, res) => {
  try {
    
    const file = req.file;
    const { name, folder_name, uploaded_by, password } = req.body;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = name;
    const sanitizedFileName = originalName.replace(/\s+/g, "_");
    const uniquePrefix = Date.now();
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    console.log("Uploaded file extension is:", fileExtension);
    const fileName = `${uploaded_by}_${uniquePrefix}_${sanitizedFileName}.${fileExtension}`;
    const fileKey = `${folder_name}/${uploaded_by}_${uniquePrefix}_${sanitizedFileName}.${fileExtension}`;
    const transaction = await sequelize.transaction();

    const folderId = await addFolder(folder_name, transaction);
    if (folderId > 0) {
      const document = await Document.create(
        {
          name,
          folderId,
          uploaded_by,
          aws_file_name: "",
          password,
          aws_file_key:fileName
        },
        { transaction }
      );
      if (document) {
        transaction.commit();
        const command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        const result = await s3Client.send(command);
        if (result && result.ETag) {
          const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
          await document.update({ aws_file_name: fileUrl });
          
          res.status(201).json({
            success: true,
            message: "File uploaded to S3 and document saved",
            document,
          });
        } else {
          res.status(500).json({
            success: false,
            message: "Failed to upload file",
            document,
          });
        }
      } else {
        transaction.rollback();
        res.status(500).json({
          success: false,
          message: "Failed to upload file",
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getSignedFileUrl = async (req, res) => {
  try {
    const { fileKey } = req.query; // from frontend
    if (!fileKey) {
      return res.status(400).json({ error: "fileKey is required" });
    }
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ signedUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
};
const addFolder = async (folder_name) => {
  try {
    const is_found = await Folder.findOne({
      where: { name: folder_name },
    });

    if (is_found) {
      return is_found.id; // Folder already exists
    }

    // Create new folder
    const newFolder = await Folder.create({
      name: folder_name,
    });

    return newFolder.id;
  } catch (error) {
    console.error("Error while adding folder:", error);
    return 0;
  }
};

export const listDocuments = async (req, res) => {
  try {
    const { id } = req.query;
    let documents;
  
    if (id) {
      documents = await Document.findAll({
        where: { folderId: id }
      });
    } else {
      documents = await Document.findAll();
    }
  
    res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
  
  
};
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.findAll();
    res.status(200).json({
      success: true,
      folders,
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
