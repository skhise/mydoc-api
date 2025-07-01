import express from 'express';

const router = express.Router();

import {
    loginUser,
    resetPin
} from '../controllers/userController.js';

router.post("/login", loginUser);
router.post("/reset-pin", resetPin);

export default router;