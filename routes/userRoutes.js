import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

import {
    registerUser,
    listUsers,
    getUser,
    updateUser,
    deleteUser,
    loginUser,
    updateUserToken,
    validateRegisterUser,
    getPartners,
    getProfile
} from '../controllers/userController.js';

router.use(authenticateToken);

/**
 * @swagger
 * /api/users/registerUser:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post("/registerUser", validateRegisterUser, registerUser);

router.get("/users", listUsers);

router.get("/profile", getProfile);

router.get("/partners", getPartners);

router.get("/getUser/:id", getUser);

router.put("/user/:id", updateUser);

router.delete("/deleteUser/:id", deleteUser);
router.post("/update-token/:id", updateUserToken);


export default router;
