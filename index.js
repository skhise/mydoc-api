import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import expenseNotificationSettingsRoutes from "./routes/expenseNotificationSettingsRoutes.js";
import cronRoutes from "./routes/cronRoutes.js";
import fcmRoutes from "./routes/fcmRoutes.js";
import sequelize from "./config/db.config.js";

// For shared hosting: Comment out these imports to disable automatic cron schedules
// Cron jobs will be triggered via HTTP endpoints instead
// Uncomment these if you're running on a VPS/dedicated server with continuous Node.js process
// import './crons/reminderCron.js';
// import './crons/expenseNotificationCron.js';

import bcrypt from 'bcryptjs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyDoc API',
      version: '1.0.0',
      description: 'API documentation for MyDoc',
    },
    servers: [
      { url: 'http://localhost:5000' }
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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

// Register cron routes FIRST (before other routes) to avoid authentication middleware conflicts
// Cron routes don't require authentication - they use secret key validation instead
app.use("/api/cron", cronRoutes);

// FCM token management routes (for debugging and maintenance)
app.use("/api/fcm", fcmRoutes);

// Other authenticated routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api", reminderRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/expense-notification-settings", expenseNotificationSettingsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

(async () => {
    try {
      await sequelize.sync({ alter: true }); // Sync changes
    } catch (error) {
      // console.error("Database sync error:", error);
    }
  })();

app.listen(5000, () => {
    // console.log("Server is running on port 5000");
});
