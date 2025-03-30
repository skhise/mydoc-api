import User from "../models/User.model.js";

export const registerUser = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.create({ name, email,password });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const listUsers = async(req,res) =>{
    try{
        const users = User.findAll();
        res.status(200).json(users);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // For simplicity, we're not checking a password here.
        // In a real app, use hashed passwords and validate them.
        res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
