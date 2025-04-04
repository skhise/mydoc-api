import express from 'express';

import User from '../models/User.model.js'

const router = express.Router();

import {
    registerUser,
    listUsers,
    getUser,
    updateUser,
    deleteUser,
    loginUser
} from '../controllers/userController.js';


router.post("/registerUser", registerUser);

router.get("/users", listUsers);

router.get("/getUser/:id", getUser);

router.put("/user/:id", updateUser);

router.delete("/deleteUser/:id", deleteUser);

router.post("/login", loginUser);

export default router;
