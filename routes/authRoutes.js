import express from 'express';

const router = express.Router();

import {
    loginUser
} from '../controllers/userController.js';

router.post("/login", loginUser);

export default router;