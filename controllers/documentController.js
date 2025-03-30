import Document from "../models/Document.model.js";

export const uploadFile = async (req, res) => {
    try {
        const { name, folderName,uploadedBy,aws_file_name,password } = req.body;
        const document = await Document.create({ name, folderName,uploadedBy,aws_file_name,password });
        res.status(201).json(document);
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

