import express from "express";
import userRoutes from "./routes/userRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js"
import sequelize from "./config/db.config.js";
const app = express();
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reminders", reminderRoutes);

(async () => {
    try {
      await sequelize.sync({ alter: true }); // Sync changes
      console.log("Database synchronized.");
    } catch (error) {
      console.error("Database sync error:", error);
    }
  })();

app.listen(5000, () => {
    console.log("Server is running on port 3000");
});
