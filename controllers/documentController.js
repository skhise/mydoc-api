import { Document, Folder } from '../models/index.js';
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";
import sequelize from "../config/db.config.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { check, validationResult } from 'express-validator';

export const validateUploadFile = [
  check('name').notEmpty().withMessage('Name is required'),
  check('folder_name').notEmpty().withMessage('Folder name is required'),
  check('uploaded_by').notEmpty().withMessage('Uploader is required'),
];

export const uploadFile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // File type and size validation
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return res.status(400).json({ error: 'File size exceeds 5MB' });
  }
  try {
    const { name, folder_name, uploaded_by, password } = req.body;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const originalName = name;
    const sanitizedFileName = originalName.replace(/\s+/g, "_");
    const uniquePrefix = Date.now();
    const fileExtension = file.originalname.split(".").pop().toLowerCase();
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
          aws_file_key: fileName,
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
           transaction.rollback();
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

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    res.json({ signedUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
};
const addFolder = async (folder_name,transaction) => {
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
    },{transaction});

    return newFolder.id;
  } catch (error) {
    return 0;
  }
};

export const listDocuments = async (req, res) => {
  try {
    const { id } = req.query;
    let documents;

    if (id) {
      documents = await Document.findAll({
        where: { folderId: id },
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
export const getFevList = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: {
        is_fev: 1,
      },
      include: [
        {
          model: Folder,
          as: 'folder', // use alias if defined in association
          attributes: ['id', 'name'], // select fields you need
        },
      ],
    });

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
export const markFavById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing document ID in URL path" });
    }

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    const is_fav = document.is_fev  == 1 ? 0 : 1;
    document.is_fev = is_fav;
    await document.save();
    const documents = await Document.findAll({
      where: {
        is_fev: 1,
      },
    });

    res.status(200).json({
      success: true,
      message: `Document with ID ${id} updated successfully.`,
      documents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const deleteFolderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Folder details missing" });
    }

    const document = await Folder.findByPk(id);

    if (!document) {
      return res.status(404).json({ error: "Folder not found" });
    }

    await document.destroy(); // Deletes the record

    res.status(200).json({
      success: true,
      message: `Folder deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
