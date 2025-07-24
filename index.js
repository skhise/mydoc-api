import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import sequelize from "./config/db.config.js";
import './crons/reminderCron.js';

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
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api", reminderRoutes);
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
