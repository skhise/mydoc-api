import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js'

const router = express.Router();
const saltRounds = 10;

router.post("/add-user", async (req, res) => {
    try {
        const { name, email, password, permissions, lastLogin } = req.body;
        if (!name || !email || !password || !permissions) {
            return res.status(400).json({
                error: "All fields are required: name, email, password, permissions, lastLogin."
            });
        }
        const validPermissions = ['admin', 'user', 'guest'];
        if (!validPermissions.includes(permissions)) {
            return res.status(400).json({
                error: "Invalid permission value. Valid values are 'admin', 'user', and 'guest'."
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
            name, email,
            password: hashedPassword,
            permissions,
            lastLogin: new Date(),
        });
        res.json({
            success: true,
            message: "User created successfully",
            user: user
        });
    } catch (error) {
        res.status(500).json({ error: error.message, details: error.errors });
    }
});

router.get("/user-list", async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({
            success: true,
            message: "User list fetch successfully",
            user: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message, details: error.errors });
    }
});

router.get("/user/:id", async (req, res) => {
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
});

router.put("/user/:id", async (req, res) => {
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
});

router.delete("/delete/:id", async (req, res) => {
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
});

export default router;
