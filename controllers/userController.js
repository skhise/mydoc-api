import User from "../models/User.model.js";
import bcrypt from 'bcryptjs';
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();
const saltRounds = 10;

export const registerUser = async (req, res) => {
    try {
        const { name, email, mobile} = req.body;
        if (!name || !mobile) {
            return res.status(400).json({
                message: "All fields are required: name, email, mobile."
            });
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (email !="" && !emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format."
            });
        }
        // const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await User.create({
            name, email,mobile,
            password: '',
            permissions:'',
            lastLogin: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message, details: error.errors });
    }
};

export const listUsers = async(req,res) =>{
    try {
        const users = await User.findAll({where:{role:2}});
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
            return res.status(404).json({ message: "User not found." });
        }
        res.json({
            success: true,
            message: "User fetch successfully",
            user: user
        });
    } catch (error) {
        res.status(500).json({ message: error.message, details: error.errors });
    }
}

export const updateUser = async(req,res) =>{
    try {
        const { id } = req.params;
        const { name, email, password, permission, lastLogin } = req.body;

        if (!name || !email || !password || !permission || !lastLogin) {
            return res.status(400).json({
                message: "All fields are required: name, email, password, permission, lastLogin."
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

         // Check for email conflict ONLY if email has changed
        if (email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
             return res.status(400).json({ message: "Email already in use by another user." });
            }
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;

        await user.update({
            name,
            email,
            password: hashedPassword,
            permission,
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
            return res.status(404).json({ success: false, message: "User not found." });
        }

        await user.destroy();

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { mobile, pin } = req.body;

        if (!mobile || !pin) {
            return res.status(400).json({
                message: "Both mobile and pin are required."
            });
        }

        const user = await User.findOne({ where: { mobile } });
        console.log(pin);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validPassword = await bcrypt.compare(pin, user.pin);

        if (!validPassword) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user.id, name: user.name, mobile: user.mobile, permissions: user.permissions },
            process.env.JWT_SECRET, // Your JWT secret key stored in environment variables
            { expiresIn: '1h' } // Token expiration time
          );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                permissions: user.permissions 
            }
        });
    } catch (error) {;
        res.status(500).json({
            error: error.message
        });
    }
};

export const resetPin = async (req, res) => {
    try {
        const { mobile, pin } = req.body;

        if (!mobile || !pin) {
            return res.status(400).json({
                message: "Both mobile and pin are required."
            });
        }

        const user = await User.findOne({ where: { mobile } });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validPassword = await bcrypt.hash(pin,10);

        user.pin = validPassword;
        await user.save();

        res.status(200).json({
            message: "Login pin set successful",
        });
    } catch (error) {
        console.log("error--->",error);
        res.status(500).json({
            error: error.message
        });
    }
};
export const updateUserToken = async(req,res) =>{
    try {
        const { id } = req.params;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Failed to update token, try again."
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        await user.update({
            fcmToken:token
        });

        res.json({
            success: true,
            message: "User token updated successfully",
            user: user
        });

    } catch (error) {
        res.status(500).json({ error: error.message, details: error.errors });
    }
}