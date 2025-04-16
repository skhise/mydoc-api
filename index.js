import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import sequelize from "./config/db.config.js";
import bcrypt from 'bcryptjs';

const app = express();

app.use(express.json({
  strict: true
}));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request' });
  }
  next();
});
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/docs/", documentRoutes);
app.use("/api", reminderRoutes);

(async () => {
    try {
      await sequelize.sync({ alter: true }); // Sync changes
      console.log("Database synchronized.");
    } catch (error) {
      console.error("Database sync error:", error);
    }
  })();

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
