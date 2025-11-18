import { User } from "../models/index.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";

dotenv.config();
const saltRounds = 10;

export const validateRegisterUser = [
  check("name").notEmpty().withMessage("Name is required"),
  check("mobile").notEmpty().withMessage("Mobile is required"),
];

export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, mobile, role, permission } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({
        message: "All fields are required: name, email, mobile.",
      });
    }
    const permissionValue =
      permission && permission.trim() !== ''
        ? permission.trim().toLowerCase()
        : 'all';
    const existingUser = await User.findOne({ 
      where: { 
        mobile,
        deletedAt: null,
      },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Mobile already in use by another user." });
    }
    // const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.create({
      name,
      mobile,
      password: "",
      permissions: permissionValue,
      role: role ? parseInt(role) : 2, // Default to user role (2) if not provided
      lastLogin: new Date(),
    });
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, details: error.errors });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({ 
      where: { 
        role: 2,
        deletedAt: null,
      } 
    });
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getPartners = async (req, res) => {
  try {
    // NOTE: Adjust the role value based on your database schema
    // If "partner" role is stored differently, update the role value here
    // Common role values: 1=admin, 2=user, 3=partner (adjust as needed)
    const users = await User.findAll({ 
      where: { 
        role: 3,
        deletedAt: null,
      },
      attributes: ['id', 'name', 'mobile', 'role']
    });
    res.status(200).json({
      success: true,
      message: "Partners fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({
      success: true,
      message: "User fetch successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, details: error.errors });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, password, permission, role, lastLogin } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        message: "Name and mobile are required.",
      });
    }

    const user = await User.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check for mobile conflict ONLY if mobile has changed
    if (mobile !== user.mobile) {
      const existingUser = await User.findOne({ 
        where: { 
          mobile,
          deletedAt: null,
        },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Mobile already in use by another user." });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      mobile,
    };

    // Update permission (handle both singular and plural field names)
    if (permission !== undefined) {
      updateData.permissions = permission;
    }

    // Update lastLogin if provided, otherwise keep existing
    if (lastLogin) {
      updateData.lastLogin = new Date(lastLogin);
    } else if (!user.lastLogin) {
      updateData.lastLogin = new Date();
    }

    // Update role if provided
    if (role !== undefined) {
      updateData.role = role;
    }

    // Update password only if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);
    
    // Reload user to get updated data
    await user.reload();

    res.json({
      success: true,
      message: "User updated successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.errors });
  }
};
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Soft delete: set deletedAt timestamp
    await user.update({
      deletedAt: new Date(),
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { mobile, pin } = req.body;

    if (!mobile || !pin) {
      return res.status(400).json({
        message: "Both mobile and pin are required.",
      });
    }

    const user = await User.findOne({ 
      where: { 
        mobile,
        deletedAt: null,
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(pin, user.pin);

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET, // Your JWT secret key stored in environment variables
      { expiresIn: "1h" } // Token expiration time
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// Get current user profile based on token
export const getProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware after token verification
    const userId = req.user.id;
    
    const user = await User.findOne({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found." 
      });
    }

    res.json({
      success: true,
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const resetPin = async (req, res) => {
  try {
    const { mobile, pin } = req.body;

    if (!mobile || !pin) {
      return res.status(400).json({
        message: "Both mobile and pin are required.",
      });
    }

    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.hash(pin, 10);

    user.pin = validPassword;
    await user.save();

    res.status(200).json({
      message: "Login pin set successful",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
export const updateUserToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Failed to update token, try again.",
      });
    }

    // Verify that the authenticated user can only update their own token
    // req.user is set by authMiddleware after token verification
    const authenticatedUserId = req.user?.id || req.user?.userId;
    
    // Convert both to strings for comparison (in case one is a number)
    const requestedUserId = String(id);
    const authUserId = String(authenticatedUserId);

    if (authUserId !== requestedUserId) {
      return res.status(403).json({ 
        error: "Forbidden: You can only update your own FCM token." 
      });
    }

    const user = await User.findOne({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await user.update({
      fcmToken: token,
    });

    res.json({
      success: true,
      message: "User token updated successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.errors });
  }
};
