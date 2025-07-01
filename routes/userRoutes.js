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
    updateUserToken
} from '../controllers/userController.js';

router.use(authenticateToken);


router.post("/registerUser", registerUser);

router.get("/users", listUsers);

router.get("/getUser/:id", getUser);

router.put("/user/:id", updateUser);

router.delete("/deleteUser/:id", deleteUser);
router.delete("/update-token/:id", updateUserToken);


export default router;
