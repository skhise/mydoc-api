import Document from "../models/Document.model.js";
import s3 from '../config/s3.js';


export const uploadFile = async (req, res) => {
    try {
        const file = req.file;

        const { name, folderName,uploadedBy,password } = req.body;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `documents/${Date.now()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // make it public or adjust permissions
        };

        const uploadResult = await s3.upload(s3Params).promise();

        const document = await Document.create({
            name,
            folderName,
            uploadedBy,
            aws_file_name: uploadResult.Location,
            password,
          });
          

          res.status(201).json({
            success: true,
            message: "File uploaded and saved",
            document,
          });    
        
        } catch (error) {
            res.status(500).json({ error: error.message });
    }
};

export const listDocuments = async(req,res) =>{
    try{
        const documents = Document.findAll();
        res.status(200).json(documents);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

