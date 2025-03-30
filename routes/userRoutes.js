const express = require("express");
import User from '../models/User.model'

const router = express.Router();

router.post("/add-user", async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.create({ name, email });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
