import User from "../models/User.model.js";
import bcrypt from 'bcrypt';
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();
const saltRounds = 10;

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, permission,mobile} = req.body;
        if (!name || !email || !password || !permission) {
            return res.status(400).json({
                error: "All fields are required: name, email, password, permissions."
            });
        }
        const validPermissions = ['all', 'add', 'view', 'download', 'share'];
        console.log("validPermissions--->",permission);
        if (!Array.isArray(permission) || !permission.every(p => validPermissions.includes(p))) {
            return res.status(400).json({
              error: "Invalid permission value. Valid values are: all, add, view, download, share."
            });
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: "Invalid email format."
            });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await User.create({
            name, email,mobile,
            password: hashedPassword,
            permissions:permission.join(","),
            lastLogin: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message, details: error.errors });
    }
};

export const listUsers = async(req,res) =>{
    try {
        const users = await User.findAll();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

export const getUser = async(req,res) =>{
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json({
            success: true,
            message: "User fetch successfully",
            user: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message, details: error.errors });
    }
}

export const updateUser = async(req,res) =>{
    try {
        const { id } = req.params;
        const { name, email, password, permissions, lastLogin } = req.body;

        if (!name || !email || !password || !permissions || !lastLogin) {
            return res.status(400).json({
                error: "All fields are required: name, email, password, permissions, lastLogin."
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;

        await user.update({
            name,
            email,
            password: hashedPassword,
            permissions,
            lastLogin,
        });

        res.json({
            success: true,
            message: "User updated successfully",
            user: user
        });

    } catch (error) {
        res.status(500).json({ error: error.message, details: error.errors });
    }
}
export const deleteUser = async(req,res) =>{
    try {
        const { id } = req.params; 

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found." });
        }

        await user.destroy();

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Both email and password are required."
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({
                error: "Invalid password"
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, permissions: user.permissions },
            process.env.JWT_SECRET, // Your JWT secret key stored in environment variables
            { expiresIn: '1h' } // Token expiration time
          );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                permissions: user.permissions 
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};